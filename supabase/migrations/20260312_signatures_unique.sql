-- Prevent double-signing: one credential per session
ALTER TABLE signatures
  ADD CONSTRAINT signatures_session_credential_unique
  UNIQUE (session_id, credential_id);
