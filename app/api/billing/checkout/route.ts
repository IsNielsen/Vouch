import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { billingStatusHasAccess, getBillingRecord } from "@/lib/billing";
import { getNextUtcMonthAnchor, getStripe, isStripeBillingConfigured } from "@/lib/stripe";
import Stripe from "stripe";

function getErrorMessage(error: unknown) {
  if (error instanceof Stripe.errors.StripeError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to start billing setup";
}

export async function POST() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = data.claims.sub;
    const userEmail = typeof data.claims.email === "string" ? data.claims.email : null;
    const record = await getBillingRecord(userId);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const priceId = process.env.STRIPE_METERED_PRICE_ID;

    if (!isStripeBillingConfigured() || !baseUrl || !priceId) {
      return Response.json({ error: "Stripe billing is not configured" }, { status: 500 });
    }

    const stripe = getStripe();

    if (record?.stripe_customer_id && billingStatusHasAccess(record.billing_status)) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: record.stripe_customer_id,
        return_url: `${baseUrl}/protected/dashboard`,
      });
      return Response.json({ url: portal.url, kind: "portal" });
    }

    let customerId = record?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail ?? undefined,
        metadata: { user_id: userId },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      // Stripe rejects quantity for metered recurring prices.
      line_items: [{ price: priceId }],
      success_url: `${baseUrl}/protected/dashboard?billing=success`,
      cancel_url: `${baseUrl}/protected/dashboard?billing=cancelled`,
      payment_method_collection: "always",
      subscription_data: {
        billing_cycle_anchor: getNextUtcMonthAnchor(),
        metadata: { user_id: userId },
      },
      metadata: { user_id: userId },
    });

    if (!session.url) {
      throw new Error("Stripe checkout session did not return a redirect URL");
    }

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { error: upsertError } = await admin.from("account_billing").upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_checkout_session_id: session.id,
      billing_status: "checkout_started",
      last_checkout_at: now,
      updated_at: now,
    });

    if (upsertError) {
      return Response.json({ error: upsertError.message }, { status: 500 });
    }

    return Response.json({ url: session.url, kind: "checkout" });
  } catch (error) {
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
