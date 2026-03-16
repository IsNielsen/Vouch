-- API keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,  -- SHA-256 of the raw key
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add API-source fields to document_sessions
ALTER TABLE document_sessions
  ADD COLUMN api_key_id UUID REFERENCES api_keys(id),
  ADD COLUMN webhook_url TEXT,
  ADD COLUMN branding_logo_url TEXT,
  ADD COLUMN branding_primary_color TEXT;  -- hex string e.g. "#6366f1"
