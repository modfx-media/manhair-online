-- Public /book/ click log. Additive only. Does not store the destination URL or tokens.

CREATE TABLE IF NOT EXISTS membership_booking_clicks (
  id text PRIMARY KEY,
  clicked_at timestamptz NOT NULL,
  contact_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  utm_id text
);

CREATE INDEX IF NOT EXISTS membership_booking_clicks_clicked_at_idx
  ON membership_booking_clicks (clicked_at DESC);
