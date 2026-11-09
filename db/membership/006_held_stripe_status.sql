-- Subscription status seen before the setup payment clears. Additive only.

ALTER TABLE membership_members ADD COLUMN IF NOT EXISTS held_stripe_status text;
