import { createClient } from "@/lib/supabase/server";
import { billingStatusHasAccess, getBillingRecord, syncBillingRecordFromStripe, syncBillingRecordFromStripeForUser } from "@/lib/billing";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let record = await getBillingRecord(data.claims.sub);
  try {
    if (!record) {
      record = await syncBillingRecordFromStripeForUser({
        userId: data.claims.sub,
        email: typeof data.claims.email === "string" ? data.claims.email : null,
      });
    } else if (!billingStatusHasAccess(record.billing_status)) {
      record = await syncBillingRecordFromStripe(data.claims.sub, record);
      if (!billingStatusHasAccess(record?.billing_status)) {
        record = await syncBillingRecordFromStripeForUser({
          userId: data.claims.sub,
          email: typeof data.claims.email === "string" ? data.claims.email : null,
        });
      }
    }
  } catch {
    // Keep the last persisted state when Stripe sync fails.
  }

  return Response.json({
    requires_billing_setup: !record || !billingStatusHasAccess(record.billing_status),
    billing_status: record?.billing_status ?? "not_started",
    has_active_subscription: billingStatusHasAccess(record?.billing_status),
    customer_portal_available: Boolean(record?.stripe_customer_id),
    current_period_start: record?.current_period_start ?? null,
    current_period_end: record?.current_period_end ?? null,
  });
}
