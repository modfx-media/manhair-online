-- Stripe trial_end and current_period_end. Additive. No DROP.
-- charge_at_source stays null or estimate until a subscription webhook writes stripe.

ALTER TABLE membership_members ADD COLUMN IF NOT EXISTS next_charge_at timestamptz;
ALTER TABLE membership_members ADD COLUMN IF NOT EXISTS charge_at_source text;
