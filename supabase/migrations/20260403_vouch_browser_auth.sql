-- Add webauthn_options column to vouch_challenges so the hosted auth page
-- can retrieve the full options object without regenerating it.
ALTER TABLE vouch_challenges ADD COLUMN IF NOT EXISTS webauthn_options jsonb;
