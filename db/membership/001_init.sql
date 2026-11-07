-- ManHair membership tables. Idempotent. Does not alter Payload CMS tables.
-- Apply only with scripts/membership-migrate.ts and MEMBERSHIP_MIGRATE_CONFIRM=apply.

CREATE TABLE IF NOT EXISTS membership_members (
  id text PRIMARY KEY,
  email text NOT NULL,
  phone text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  tier text NOT NULL,
  status text NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_item_id text,
  monthly_cents integer NOT NULL,
  setup_cents integer NOT NULL,
  setup_paid boolean NOT NULL DEFAULT false,
  recurring_start_at timestamptz,
  minimum_term_ends_at timestamptz NOT NULL,
  rate_lock_ends_at timestamptz NOT NULL,
  entitlement_year_ends_at timestamptz NOT NULL,
  systems_used integer NOT NULL DEFAULT 0,
  maintenance_used integer NOT NULL DEFAULT 0,
  pause_days_used integer NOT NULL DEFAULT 0,
  cancel_at timestamptz,
  pause_collection boolean NOT NULL DEFAULT false,
  attention text,
  terms_version text NOT NULL,
  last_status_event_created bigint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS membership_members_email_idx
  ON membership_members (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS membership_members_customer_idx
  ON membership_members (stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS membership_members_subscription_idx
  ON membership_members (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS membership_consents (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  terms_version text NOT NULL,
  terms_accepted_at timestamptz NOT NULL,
  autorenew_accepted_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_founding_reservations (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  status text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_checkouts (
  idempotency_key text PRIMARY KEY,
  member_id text NOT NULL,
  session_id text,
  url text,
  reservation_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_invoices (
  id text PRIMARY KEY,
  member_id text,
  kind text NOT NULL,
  status text NOT NULL,
  amount_paid integer NOT NULL,
  amount_refunded integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS membership_ledger (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  kind text NOT NULL,
  quantity integer NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_deals (
  id text PRIMARY KEY,
  member_id text,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  stage text NOT NULL,
  assignee text NOT NULL DEFAULT '',
  next_follow_up date,
  ghl_contact_id text,
  ghl_opportunity_id text,
  sync_status text NOT NULL,
  sync_hash text NOT NULL DEFAULT '',
  location_id text
);

CREATE TABLE IF NOT EXISTS membership_notes (
  id text PRIMARY KEY,
  deal_id text NOT NULL,
  author text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_activity (
  id text PRIMARY KEY,
  deal_id text NOT NULL,
  actor text NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_pause_requests (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  days integer NOT NULL,
  status text NOT NULL,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_sessions (
  id text PRIMARY KEY,
  member_id text NOT NULL,
  expires_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS membership_drafts (
  id text PRIMARY KEY,
  deal_id text NOT NULL,
  body text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_rate_limits (
  bucket text PRIMARY KEY,
  hits integer NOT NULL,
  window_started_at timestamptz NOT NULL
);
