-- Billing setup table: tracks Stripe customer + subscription per user
CREATE TABLE user_billing (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_subscription_item_id TEXT,
  billing_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Only service role can write; users can read their own row
ALTER TABLE user_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own billing"
  ON user_billing FOR SELECT
  USING (auth.uid() = user_id);
