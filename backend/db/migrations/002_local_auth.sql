BEGIN;
CREATE TABLE IF NOT EXISTS brain_local_credentials (
  tenant_id uuid NOT NULL,
  subject text NOT NULL,
  password_hash text NOT NULL,
  PRIMARY KEY (tenant_id, subject),
  FOREIGN KEY (tenant_id, subject) REFERENCES brain_identities(tenant_id, subject) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS brain_local_sessions (
  token_hash text PRIMARY KEY,
  tenant_id uuid NOT NULL,
  subject text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (tenant_id, subject) REFERENCES brain_identities(tenant_id, subject) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS brain_local_sessions_expiry_idx ON brain_local_sessions(expires_at);
COMMIT;
