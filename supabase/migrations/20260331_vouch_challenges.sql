-- vouch_challenges: stores fraud-prevention biometric challenge/verify flows.
-- Each row represents one challenge created by a B2B customer via the Vouch API.
-- See app/api/vouch/ routes for usage.
CREATE TABLE vouch_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | verified | expired
  webauthn_challenge text NOT NULL,
  transaction_context jsonb,
  user_id text, -- customer's own user identifier, nullable, no FK to auth.users
  verified_at timestamptz,
  assertion jsonb,
  credential_id text, -- passkey credential ID used to verify
  device_id text GENERATED ALWAYS AS (credential_id) STORED, -- spec alias for credential_id
  ip_address text,
  api_key_hash text, -- SHA-256 of the API key that created this challenge
  pqc_signature text,
  pqc_public_key text,
  authenticator_data text,
  webhook_url text -- optional webhook fired on successful verification
);
