-- Additive consent columns. No DROP. Apply with scripts/membership-migrate.ts.
-- Existing rows stay email-only: SMS consent defaults to false.

ALTER TABLE membership_consents ADD COLUMN IF NOT EXISTS marketing_email boolean NOT NULL DEFAULT false;
ALTER TABLE membership_consents ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;
ALTER TABLE membership_consents ADD COLUMN IF NOT EXISTS sms_consent_text text;
ALTER TABLE membership_consents ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz;
ALTER TABLE membership_consents ADD COLUMN IF NOT EXISTS sms_consent_version text;
