import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = data.claims.sub;

  let setupIntentId: string;
  try {
    const body = await req.json();
    if (!body.setupIntentId) throw new Error('missing');
    setupIntentId = body.setupIntentId;
  } catch {
    return NextResponse.json({ error: 'setupIntentId required' }, { status: 400 });
  }

  const admin = createAdminClient();
  const [setupIntent, { data: billing }] = await Promise.all([
    stripe.setupIntents.retrieve(setupIntentId),
    admin.from('user_billing').select('stripe_customer_id').eq('user_id', userId).single(),
  ]);

  if (setupIntent.status !== 'succeeded') {
    return NextResponse.json({ error: 'SetupIntent not succeeded' }, { status: 400 });
  }

  const customerId = billing?.stripe_customer_id as string | undefined;
  if (!customerId) return NextResponse.json({ error: 'No billing record found' }, { status: 400 });

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: setupIntent.payment_method as string },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: process.env.STRIPE_PRICE_ID }],
  });

  const subscriptionItemId = subscription.items.data[0].id;

  await admin.from('user_billing').upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_subscription_item_id: subscriptionItemId,
    billing_active: true,
  });

  return NextResponse.json({ success: true });
}
