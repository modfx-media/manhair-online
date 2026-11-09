-- Lifecycle message log, pause resume date, and Stripe invoice copy fields.
-- Additive only.

ALTER TABLE membership_members ADD COLUMN IF NOT EXISTS pause_resume_at timestamptz;
ALTER TABLE membership_invoices ADD COLUMN IF NOT EXISTS amount_due integer;
ALTER TABLE membership_invoices ADD COLUMN IF NOT EXISTS hosted_invoice_url text;
ALTER TABLE membership_invoices ADD COLUMN IF NOT EXISTS card_last4 text;
ALTER TABLE membership_invoices ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE membership_pause_requests ADD COLUMN IF NOT EXISTS resume_at timestamptz;
ALTER TABLE membership_pause_requests ADD COLUMN IF NOT EXISTS decline_reason text;

CREATE TABLE IF NOT EXISTS membership_messages (
  id text PRIMARY KEY,
  dedupe_key text NOT NULL UNIQUE,
  member_id text,
  template_id text NOT NULL,
  channel text NOT NULL,
  cycle_key text NOT NULL,
  status text NOT NULL,
  recipient text NOT NULL,
  subject text NOT NULL DEFAULT '',
  text_body text NOT NULL DEFAULT '',
  html_body text NOT NULL DEFAULT '',
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS membership_event_facts (
  event_id text PRIMARY KEY,
  facts text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
