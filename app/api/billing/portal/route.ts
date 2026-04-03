import { createClient } from "@/lib/supabase/server";
import { getBillingRecord } from "@/lib/billing";
import { getStripe, isStripeBillingConfigured } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await getBillingRecord(data.claims.sub);
  if (!record?.stripe_customer_id) {
    return Response.json({ error: "Billing account not found" }, { status: 404 });
  }

  if (!isStripeBillingConfigured() || !process.env.NEXT_PUBLIC_APP_URL) {
    return Response.json({ error: "Stripe billing is not configured" }, { status: 500 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: record.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/protected/dashboard`,
  });

  return Response.json({ url: session.url });
}
