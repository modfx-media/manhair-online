# Membership production handoff

This build is not taking live payments. Do not merge it, do not set `MEMBERSHIP_PAYMENTS_LIVE=true`, and do not point it at the ModFXMedia Stripe account `acct_1DhNFjGiafo5ImyE`.

## What is in the branch

- Public `/memberships/`, `/join/`, `/membership-terms/`
- Member `/account/`
- Staff `/hub/`
- Neon tables in `db/membership/001_init.sql`
- Stripe Checkout, webhooks, and a restricted Customer Portal path
- HighLevel sync that stays off until a verified location is set
- Tests in `tests/membership/`

The marketing site, Payload admin, Cherry page, and consult modal are unchanged aside from a Memberships link in the header and a preview-only exception to the `*.vercel.app` canonical redirect.

## Verified gaps from the connector audit

- HighLevel searches for ManHair, Man, and Hair returned no locations. No location id is stored in this repo.
- The only accessible Stripe merchant is ModFXMedia, live account `acct_1DhNFjGiafo5ImyE`. Checkout refuses that id.
- Vercel project `prj_KYNMITbRpNx4np9hRPZQzZuNG3fd` on team `team_FQDxgNtaJYX8DHFa0X5V7jiN` was not readable (`get_project` 404, `list_deployments` 403). There is no preview URL from this run. A GitHub preview deployment can appear only if that project’s integration builds the branch. Production builds still redirect `*.vercel.app` to `https://www.manhaironline.com`. Preview builds omit that redirect and send `X-Robots-Tag: noindex`.

## Variable names

Set these on the confirmed ManHair Vercel project for Preview first. Leave values out of git.

Payments, all required before checkout will open:

- `STRIPE_SECRET_KEY` — restricted key on the confirmed ManHair account. Test key until the sandbox check below passes.
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ACCOUNT_ID` — must match the account that owns the key, and must not be `acct_1DhNFjGiafo5ImyE`
- `STRIPE_PRICE_ESSENTIAL` — $449 USD monthly
- `STRIPE_PRICE_SIGNATURE` — $559 USD monthly
- `STRIPE_PRICE_ELITE` — $669 USD monthly
- `STRIPE_PRICE_SETUP` — $495 USD one time
- `STRIPE_PORTAL_CONFIGURATION_ID`

One product per tier. Do not put the three tiers on one product. Do not turn on `automatic_tax` until a tax registration exists. This app does not enable it.

Portal configuration must allow invoice history and payment-method updates only. Disable subscription cancel and plan changes in that configuration. The app will not open the default portal.

Founding, leave off:

- `MEMBERSHIP_FOUNDING_ENABLED` — set to `true` only when the owner opens it
- `MEMBERSHIP_FOUNDING_CAP` — integer 1 through 25, default 25
- `STRIPE_PRICE_SETUP_FOUNDING` — $295 USD one time, required only when founding is on

Live gate:

- `MEMBERSHIP_PAYMENTS_LIVE` — must be `true` together with a live key. Absent or any other value keeps live keys blocked.

Staff and sessions:

- `MEMBERSHIP_OWNER_EMAILS` — comma-separated Payload user emails
- `MEMBERSHIP_COORDINATOR_EMAILS` — Griselda’s Payload user email, after that user exists
- `MEMBERSHIP_SESSION_SECRET` — optional; falls back to `PAYLOAD_SECRET`
- `DATABASE_URL` — existing Neon pooled URL
- `PAYLOAD_SECRET` — existing

HighLevel, leave empty until the owner confirms the location:

- `GHL_API_TOKEN`
- `GHL_LOCATION_ID`
- `GHL_PIPELINE_ID`
- `GHL_PIPELINE_STAGE_ID` — required before an opportunity is created
- `GHL_WEBHOOK_SECRET` — reserved; inbound webhook route is not enabled in this build

Pause:

- `MEMBERSHIP_PAUSE_SELF_SERVE` — leave unset. Members can file a request. Billing changes only when staff apply it and Stripe accepts it.

Do not set `RESEND_API_KEY` for this feature. The account page reports that email sign-in is not sent.

## Database

From a machine that already has the ManHair `DATABASE_URL`:

```bash
MEMBERSHIP_MIGRATE_CONFIRM=apply npm run membership:migrate
```

The script refuses to run without that flag. It creates only `membership_*` tables. It does not change Payload tables. It was not run in this change.

## Stripe sandbox check before any live key

In a ManHair test sandbox, not the ModFXMedia account:

1. Create the four prices above.
2. Complete Checkout for Signature.
3. Confirm exactly one immediate invoice and that its total is the $495 setup, not setup plus $559.
4. Confirm the subscription is trialing for 30 days and no second subscription exists.
5. Advance the test clock 30 days and confirm one $559 invoice, then a monthly invoice after that.
6. Send the webhook fixtures for `checkout.session.completed`, `customer.subscription.created`, `invoice.paid`, `invoice.payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, and `radar.early_fraud_warning.created`.
7. If the immediate invoice includes the first month, stop. The app flags that as `recurring_charged_at_checkout` and does not describe the timeline as confirmed. `CHECKOUT_TIMELINE_SANDBOX_CONFIRMED` stays false in code until that sandbox result is reviewed.

Webhook endpoint: `https://www.manhaironline.com/api/membership/webhook/`

## Staff access

1. Create Griselda’s user in the existing Payload admin with a password she chooses. Do not reuse a shared password.
2. Add her email to `MEMBERSHIP_COORDINATOR_EMAILS`.
3. Add the owner’s Payload email to `MEMBERSHIP_OWNER_EMAILS`.
4. An empty allowlist means even a CMS admin gets a denial on `/hub/`.

## Still unresolved on purpose

- Refund rule. The app records refunds and does not issue them.
- Add-on balances for the $849 system, $225 maintenance, and $849 Elite backup. Prices are shown. Checkout does not sell them.
- Whether pause days should move the minimum term and rate lock. The app does that only after staff apply a pause, and the terms say attorney review is pending.
- Current-client priority for founding. There is no client list to enforce it.
- Founding end date. None is shown.
- Griselda’s scheduler. The hub says scheduling is not connected.
- Customer email and SMS. Drafts save. Send returns an error.
- Legal review. The terms page says compliance is not guaranteed.
- Vercel production access for this agent. Deployment stays with the coordinator.

## Readiness

`GET /api/membership/readiness/` returns blocker text and booleans. It does not return secret values. `payments` stays blocked until the account lookup at checkout also matches `STRIPE_ACCOUNT_ID`.
