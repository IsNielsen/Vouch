create table if not exists public.user_billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_item_id text,
  billing_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.user_billing enable row level security;

-- Users can read their own billing status
create policy "Users can view own billing" on public.user_billing
  for select using (auth.uid() = user_id);
