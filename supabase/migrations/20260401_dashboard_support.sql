-- Add failure tracking to vouch_challenges
ALTER TABLE vouch_challenges ADD COLUMN IF NOT EXISTS failure_reason text;

-- Fast queries for dashboard (filter by api_key_hash + time range)
CREATE INDEX IF NOT EXISTS vouch_challenges_api_key_hash_created_at_idx
  ON vouch_challenges (api_key_hash, created_at DESC);
