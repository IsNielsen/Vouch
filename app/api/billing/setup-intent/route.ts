import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = data.claims.sub;
  const userEmail = data.claims.email as string | undefined;

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from('user_billing')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single();

  let customerId = billing?.stripe_customer_id as string | undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: { user_id: userId },
    });
    customerId = customer.id;
    await admin.from('user_billing').upsert({ user_id: userId, stripe_customer_id: customerId });
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
  });

  return NextResponse.json({ clientSecret: setupIntent.client_secret });
}
