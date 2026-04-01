-- Add pqc_key_version to track which key derivation scheme produced the signature.
-- v1 = HMAC(SUPABASE_SERVICE_ROLE_KEY, "pqc-v1:" + credential_id)  [legacy, no PQC_SIGNING_SECRET set]
-- v2 = HMAC(PQC_SIGNING_SECRET, "pqc-v2:" + credential_id)         [current, preferred]
--
-- To rotate: set a new PQC_SIGNING_SECRET. New receipts will use v2.
-- Old receipts (v1) can still be verified by re-deriving with the original service role key.
ALTER TABLE vouch_challenges ADD COLUMN IF NOT EXISTS pqc_key_version integer DEFAULT 1;
ALTER TABLE signatures ADD COLUMN IF NOT EXISTS pqc_key_version integer DEFAULT 1;
