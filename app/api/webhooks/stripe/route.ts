import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { toIsoOrNull } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";

function getUserIdFromObject(object: { metadata?: Record<string, string> | null } | null | undefined) {
  const userId = object?.metadata?.user_id;
  return typeof userId === "string" && userId ? userId : null;
}

async function upsertBillingFromSubscription(subscription: Stripe.Subscription, fallbackUserId?: string | null) {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const userId = getUserIdFromObject(subscription) ?? fallbackUserId;
  if (!userId) return;

  const primaryItem = subscription.items.data[0];

  await admin.from("account_billing").upsert({
    user_id: userId,
    stripe_customer_id: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
    stripe_subscription_id: subscription.id,
    billing_status: subscription.status,
    current_period_start: toIsoOrNull(primaryItem?.current_period_start),
    current_period_end: toIsoOrNull(primaryItem?.current_period_end),
    billing_setup_completed_at: subscription.status === "active" || subscription.status === "trialing" ? now : null,
    updated_at: now,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: "Missing STRIPE_WEBHOOK_SECRET" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return Response.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    return Response.json({ error: message }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = getUserIdFromObject(session);
      if (userId) {
        const now = new Date().toISOString();
        await admin.from("account_billing").upsert({
          user_id: userId,
          stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id ?? null,
          stripe_checkout_session_id: session.id,
          stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
          billing_status: "checkout_started",
          billing_setup_completed_at: null,
          updated_at: now,
        });
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      let fallbackUserId: string | null = getUserIdFromObject(subscription);

      if (!fallbackUserId) {
        const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        const { data } = await admin
          .from("account_billing")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        fallbackUserId = (data as { user_id: string } | null)?.user_id ?? null;
      }

      await upsertBillingFromSubscription(subscription, fallbackUserId);
      break;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id ?? null;
      if (customerId) {
        const { data } = await admin
          .from("account_billing")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();
        const userId = (data as { user_id: string } | null)?.user_id;
        if (userId) {
          const now = new Date().toISOString();
          await admin.from("account_billing").upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            billing_status: event.type === "invoice.paid" ? "active" : "past_due",
            updated_at: now,
          });
        }
      }
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
