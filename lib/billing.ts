import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, isStripeBillingConfigured } from "@/lib/stripe";

export type BillingStatus =
  | "not_started"
  | "checkout_started"
  | "incomplete"
  | "trialing"
  | "active"
  | "paused"
  | "past_due"
  | "unpaid"
  | "canceled"
  | "incomplete_expired";

export interface BillingRecord {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_checkout_session_id: string | null;
  billing_status: BillingStatus;
  billing_setup_completed_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  last_checkout_at: string | null;
}

export function billingStatusHasAccess(status: BillingStatus | null | undefined) {
  return status === "active" || status === "trialing" || status === "past_due" || status === "unpaid";
}

export async function getBillingRecord(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("account_billing")
    .select("user_id, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, billing_status, billing_setup_completed_at, current_period_start, current_period_end, last_checkout_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as BillingRecord | null) ?? null;
}

async function findStripeCustomerForUser(params: {
  userId: string;
  email?: string | null;
  existingRecord?: BillingRecord | null;
}) {
  const stripe = getStripe();

  if (params.existingRecord?.stripe_customer_id) {
    return params.existingRecord.stripe_customer_id;
  }

  if (params.email) {
    const customers = await stripe.customers.list({
      email: params.email,
      limit: 10,
    });

    const exactMetadataMatch = customers.data.find((customer) => customer.metadata?.user_id === params.userId);
    if (exactMetadataMatch) {
      return exactMetadataMatch.id;
    }

    if (customers.data.length === 1) {
      return customers.data[0].id;
    }
  }

  return null;
}

export async function requireBillingAccess(userId: string) {
  let record = await getBillingRecord(userId);
  if (record && !billingStatusHasAccess(record.billing_status)) {
    try {
      record = await syncBillingRecordFromStripe(userId, record);
    } catch {
      // Fall back to the last persisted state when Stripe sync fails.
    }
  }

  if (!record || !billingStatusHasAccess(record.billing_status)) {
    return {
      ok: false as const,
      record,
      response: Response.json(
        {
          error: "Billing setup required",
          code: "billing_setup_required",
        },
        { status: 402 },
      ),
    };
  }

  return { ok: true as const, record };
}

export function toIsoOrNull(unixSeconds: number | null | undefined) {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function syncBillingRecordFromStripe(userId: string, existingRecord?: BillingRecord | null) {
  if (!isStripeBillingConfigured()) {
    return existingRecord ?? getBillingRecord(userId);
  }

  const record = existingRecord ?? await getBillingRecord(userId);
  if (!record) return null;

  const stripe = getStripe();
  let subscriptionId = record.stripe_subscription_id;
  let customerId = record.stripe_customer_id;

  if (!subscriptionId && record.stripe_checkout_session_id) {
    const session = await stripe.checkout.sessions.retrieve(record.stripe_checkout_session_id, {
      expand: ["subscription"],
    });

    customerId = typeof session.customer === "string" ? session.customer : session.customer?.id ?? customerId;
    subscriptionId = typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? subscriptionId;
  }

  if (!subscriptionId && customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    subscriptionId = subscriptions.data[0]?.id ?? null;
  }

  if (!subscriptionId) {
    return record;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const primaryItem = subscription.items.data[0];
  const now = new Date().toISOString();
  const nextRecord = {
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: record.stripe_checkout_session_id,
    billing_status: subscription.status as BillingStatus,
    current_period_start: toIsoOrNull(primaryItem?.current_period_start),
    current_period_end: toIsoOrNull(primaryItem?.current_period_end),
    billing_setup_completed_at: billingStatusHasAccess(subscription.status as BillingStatus)
      ? record.billing_setup_completed_at ?? now
      : null,
    last_checkout_at: record.last_checkout_at,
  } satisfies BillingRecord;

  const admin = createAdminClient();
  const { error } = await admin.from("account_billing").upsert({
    ...nextRecord,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }

  return nextRecord;
}

export async function syncBillingRecordFromStripeForUser(params: {
  userId: string;
  email?: string | null;
}) {
  if (!isStripeBillingConfigured()) {
    return getBillingRecord(params.userId);
  }

  const existingRecord = await getBillingRecord(params.userId);
  const customerId = await findStripeCustomerForUser({
    userId: params.userId,
    email: params.email,
    existingRecord,
  });

  if (!customerId) {
    return existingRecord;
  }

  const stripe = getStripe();
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
  });
  const subscription = subscriptions.data
    .slice()
    .sort((a, b) => b.created - a.created)[0];

  const now = new Date().toISOString();
  const admin = createAdminClient();

  if (!subscription) {
    const fallbackRecord = {
      user_id: params.userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: existingRecord?.stripe_subscription_id ?? null,
      stripe_checkout_session_id: existingRecord?.stripe_checkout_session_id ?? null,
      billing_status: existingRecord?.billing_status ?? "not_started",
      billing_setup_completed_at: existingRecord?.billing_setup_completed_at ?? null,
      current_period_start: existingRecord?.current_period_start ?? null,
      current_period_end: existingRecord?.current_period_end ?? null,
      last_checkout_at: existingRecord?.last_checkout_at ?? null,
    } satisfies BillingRecord;

    const { error } = await admin.from("account_billing").upsert({
      ...fallbackRecord,
      updated_at: now,
    });

    if (error) {
      throw new Error(error.message);
    }

    return fallbackRecord;
  }

  const primaryItem = subscription.items.data[0];
  const nextRecord = {
    user_id: params.userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_checkout_session_id: existingRecord?.stripe_checkout_session_id ?? null,
    billing_status: subscription.status as BillingStatus,
    billing_setup_completed_at: billingStatusHasAccess(subscription.status as BillingStatus)
      ? existingRecord?.billing_setup_completed_at ?? now
      : null,
    current_period_start: toIsoOrNull(primaryItem?.current_period_start),
    current_period_end: toIsoOrNull(primaryItem?.current_period_end),
    last_checkout_at: existingRecord?.last_checkout_at ?? null,
  } satisfies BillingRecord;

  const { error } = await admin.from("account_billing").upsert({
    ...nextRecord,
    updated_at: now,
  });

  if (error) {
    throw new Error(error.message);
  }

  return nextRecord;
}

export async function recordVerifiedUsage(params: {
  challengeId: string;
  userId: string;
  verifiedAt: string;
}) {
  const meterEventName = process.env.STRIPE_BILLING_METER_EVENT_NAME;
  if (!meterEventName) return;

  const record = await getBillingRecord(params.userId);
  if (!record?.stripe_customer_id || !billingStatusHasAccess(record.billing_status)) {
    return;
  }

  const admin = createAdminClient();
  const identifier = `vouch_verify_${params.challengeId}`;

  const { data: existing, error: existingError } = await admin
    .from("billing_usage_events")
    .select("challenge_id")
    .eq("challenge_id", params.challengeId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }
  if (existing) return;

  await getStripe().billing.meterEvents.create({
    event_name: meterEventName,
    identifier,
    payload: {
      value: "1",
      stripe_customer_id: record.stripe_customer_id,
    },
    timestamp: Math.floor(new Date(params.verifiedAt).getTime() / 1000),
  });

  const { error: insertError } = await admin.from("billing_usage_events").insert({
    challenge_id: params.challengeId,
    user_id: params.userId,
    stripe_customer_id: record.stripe_customer_id,
    meter_event_name: meterEventName,
    stripe_event_identifier: identifier,
    reported_at: params.verifiedAt,
  });

  if (insertError && insertError.code !== "23505") {
    throw new Error(insertError.message);
  }
}
