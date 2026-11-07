# Membership production handoff

The owner confirmed that ManHair charges go through the connected Stripe account `acct_1DhNFjGiafo5ImyE`. Charges and payouts are enabled, card payments are active, and there are no due requirements. The statement descriptor is `MODFXMEDIA, LLC`. Do not change that shared business profile. This pull request does not set `STRIPE_ACCOUNT_ID`, `MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED`, or `MEMBERSHIP_PAYMENTS_LIVE` in any environment, and it does not create products, prices, portal configurations, or webhook endpoints. No sandbox context is available yet. Sales tax must be answered by the owner before any product is created. This checkout does not enable `automatic_tax`.

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
- The owner has now confirmed merchant `acct_1DhNFjGiafo5ImyE` (statement descriptor `MODFXMEDIA, LLC`). Checkout still stays closed until the integration operator sets `STRIPE_ACCOUNT_ID` to that id and `MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED=true`, and the key's account matches. Live mode also needs `MEMBERSHIP_PAYMENTS_LIVE=true`. Those variables are not set by this code.
- The confirmed account has no ManHair products, prices, portal configurations, or webhook endpoints. Do not create products until the owner says whether sales tax is collected.
- Vercel project `prj_KYNMITbRpNx4np9hRPZQzZuNG3fd` on team `team_FQDxgNtaJYX8DHFa0X5V7jiN` was not readable (`get_project` 404, `list_deployments` 403). There is no preview URL from this run. A GitHub preview deployment can appear only if that project’s integration builds the branch. Production builds still redirect `*.vercel.app` to `https://www.manhaironline.com`. Preview builds omit that redirect and send `X-Robots-Tag: noindex`.

## Variable names

Set these on the confirmed ManHair Vercel project for Preview first. Leave values out of git.

Payments, all required before checkout will open:

- `STRIPE_SECRET_KEY` — restricted key on the confirmed ManHair account. Test key until the sandbox check below passes.
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_ACCOUNT_ID` — set this to `acct_1DhNFjGiafo5ImyE` only in the ManHair environment, after the scoped key is installed. The code does not embed it as an automatic allow.
- `MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED` — set to `true` in that same environment when the key is installed. This pull request does not mark it set.
- `STRIPE_PRICE_ESSENTIAL` — $449 USD monthly
- `STRIPE_PRICE_SIGNATURE` — $559 USD monthly
- `STRIPE_PRICE_ELITE` — $669 USD monthly
- `STRIPE_PRICE_SETUP` — $495 USD one time

One product per tier. Do not put the three tiers on one product. Do not turn on `automatic_tax` until a tax registration exists. This app does not enable it.

The app creates a Customer Portal session for the signed-in member's own Stripe customer id. The session configuration turns on invoice history and payment-method update, and turns off subscription cancel, subscription update, and customer update. `STRIPE_PORTAL_CONFIGURATION_ID` is no longer required. A missing processor customer id fails closed.

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
- `GHL_WEBHOOK_SECRET` is not used. Inbound events must carry HighLevel's Ed25519 `X-GHL-Signature`. The public key is the one published in HighLevel's webhook guide. Do not put a shared secret in the URL.

Pause:

- `MEMBERSHIP_PAUSE_SELF_SERVE` — leave unset. Members can file a request. Billing changes only when staff apply it and Stripe accepts it.

Account recovery email stays off unless all three are set. This build does not send mail unless they are set, and they are not set here.

- `RESEND_API_KEY`
- `RESEND_FROM`
- `MEMBERSHIP_RECOVERY_SEND` — must be `true`

Payment alerts use the same Resend sender and stay off until the owner names a recipient. No production send has been tested. Held rows are not released automatically.

- `MEMBERSHIP_OWNER_ALERTS_SEND` — `true` only after the recipient is approved
- `MEMBERSHIP_ALERT_TO` — one owner inbox. Do not guess it.
- `MEMBERSHIP_CUSTOMER_ALERTS_SEND` — leave unset. This does not email existing clients. Stripe's own receipts, if wanted, are configured in the Stripe dashboard for `acct_1DhNFjGiafo5ImyE`, not by this app.

Webhook endpoint to create later: `https://www.manhaironline.com/api/membership/webhook/`

Events to subscribe:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`
- `charge.dispute.created`
- `radar.early_fraud_warning.created`

Alert drain cron: `POST /api/membership/alerts/run` with `Authorization: Bearer $CRON_SECRET`. It does not send held alerts.

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

## What this review verified

Unit tests cover pricing, the 30-day then calendar-month timeline, account confirmation, email not signing a member in, cancellation scheduled through the minimum term, pause requests leaving billing unchanged, webhook staleness and duplicates, entitlement-year boundaries, HighLevel location mismatch, bounded search retry, and local lead create/delete. They do not call Stripe. No Stripe test-clock or sandbox checkout has been run. `CHECKOUT_TIMELINE_SANDBOX_CONFIRMED` remains false.

HighLevel code is present and disabled until `GHL_LOCATION_ID` and `GHL_API_TOKEN` are set. Signed inbound events use `POST /api/membership/ghl/`. The verifier checks `X-GHL-Signature` with HighLevel's published Ed25519 public key over the raw body, rejects a missing or bad signature, rejects a stale `timestamp`, and rejects any other location. A pull from the hub reads contacts with a cursor and opportunities by page, retries failed reads, dedupes by contact id, and keeps staff stage, assignee, and follow-up when both sides changed. The hub says the last pull time. It is not a live socket. No verified location is configured, so runtime calls do not leave this app.

Member sessions are stored as a hash of the cookie secret. Checkout return links work once. Logout deletes the session and writes an audit row. A later visit asks for a one-time email link. That link is sent only when `RESEND_API_KEY`, `RESEND_FROM`, and `MEMBERSHIP_RECOVERY_SEND=true` are all set. They are not set here, and the request fails closed without sending mail or opening a session. Typing an email never signs someone in. A member does not pay again to recover an existing membership.

The Customer Portal session uses the signed-in member's Stripe customer id. Its configuration allows invoice history and payment-method updates and disallows cancel, plan changes, and customer edits.

Screenshots in the pull request are rendered pages on a local production server with payments, founding, database, and staff sign-in unconfigured. They show the public offer, the blocked checkout form, the signed-out account gate, and the hub denial. They are not a successful payment or a populated lead board.

## Readiness

`GET /api/membership/readiness/` returns blocker text and booleans. It does not return secret values. `payments` stays blocked until the account lookup at checkout also matches `STRIPE_ACCOUNT_ID`.
