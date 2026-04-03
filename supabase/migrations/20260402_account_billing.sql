CREATE TABLE account_billing (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  stripe_checkout_session_id text,
  billing_status text NOT NULL DEFAULT 'not_started',
  billing_setup_completed_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  last_checkout_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE billing_usage_events (
  challenge_id uuid PRIMARY KEY REFERENCES vouch_challenges(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  meter_event_name text NOT NULL,
  stripe_event_identifier text NOT NULL UNIQUE,
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE account_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_usage_events ENABLE ROW LEVEL SECURITY;

-- Users can only read their own billing record.
CREATE POLICY "account_billing_select_own"
  ON account_billing FOR SELECT
  USING (auth.uid() = user_id);

-- All writes go through the service-role admin client (bypasses RLS).
-- No INSERT/UPDATE/DELETE policies needed for authenticated users.
