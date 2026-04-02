import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = data.claims.sub;

  const admin = createAdminClient();
  const { data: billing } = await admin
    .from('user_billing')
    .select('billing_active')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({
    billing_active: billing?.billing_active ?? false,
    has_billing: billing !== null,
  });
}
