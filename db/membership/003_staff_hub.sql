-- Password-free staff hub sign-in. Additive. No DROP.

CREATE TABLE IF NOT EXISTS membership_staff_links (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS membership_staff_sessions (
  token_hash text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL,
  expires_at timestamptz NOT NULL
);
