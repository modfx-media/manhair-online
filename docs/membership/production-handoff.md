# Membership production handoff

The owner confirmed that ManHair charges go through the connected Stripe account `acct_1DhNFjGiafo5ImyE`. Charges and payouts are enabled, card payments are active, and there are no due requirements. The statement descriptor is `MODFXMEDIA, LLC`. Do not change that shared business profile. This pull request does not set `STRIPE_ACCOUNT_ID`, `MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED`, or `MEMBERSHIP_PAYMENTS_LIVE` in any environment, and it does not create products, prices, portal configurations, or webhook endpoints. No sandbox context is available yet. The owner answered on November 7, 2026 that ManHair does not currently collect sales tax. Do not enable `automatic_tax`. Products can be created without tax once Stripe write access exists. They do not exist yet.

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
- The confirmed account has no ManHair products, prices, portal configurations, or webhook endpoints. Sales tax is answered: do not collect it and do not enable `automatic_tax`. Stripe write permission is still rejected, so this pull request does not create those products.
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

One product per tier. Do not put the three tiers on one product. The owner said ManHair does not currently collect sales tax. Leave `automatic_tax` off. Do not add a tax registration for this launch.

The app opens a Customer Portal session for the signed-in member's own Stripe customer id. Set `STRIPE_PORTAL_CONFIGURATION_ID` to the approved configuration. On the live account that id is `bpc_1UZPyXGiafo5ImyEcopKjnZr`. It is not hard-coded. A sandbox or preview must use its own configuration id, not this live one. The app retrieves that configuration and opens the session only when invoice history and payment-method update are enabled and cancel, plan changes, and customer edits are disabled. A missing or different configuration returns an error. The app does not create or update a portal configuration.

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

HighLevel stays off until `GHL_API_TOKEN` is a private app token for location `jv4grExvok7omWurc4PE`. Connector OAuth is not that token. Do not put the token in git.

Non-secret values are already in code. Leave these unset unless you are pinning the same values:

- `GHL_LOCATION_ID` — only `jv4grExvok7omWurc4PE`. Any other value turns calls off.
- `GHL_PIPELINE_ID` — only `arkMXixdGM81H9FjL2gc` (ManHair Marketing Pipeline). Legacy pipeline `nN1jyhFV5trEjTBGlc46` is refused.
- `GHL_STAGE_MAP` — optional JSON. Each of these labels must keep its verified id. A different id turns calls off. If unset, the app uses these ids:
  - New Leads `6a222649-1e28-4ac5-b6eb-b0f80624911d`
  - Hot Leads `6695bb51-2314-4cfc-8c0b-c1d54dc3d1ed`
  - Proposal Sent `c37b7f54-f4a4-47aa-897b-d3a7577a0a58`
  - Phone Consult `2241d975-fa06-4138-b33a-2333f5cd52fc`
  - Video Consultation `118eff81-ca9d-481b-a00a-d8495fdfb461`
  - No show/Cancelled `e4034e59-8a30-4648-bead-667f8d5a11a6`
  - Active Clients `58fb7eaa-4fc7-47f3-b00c-392e4cbd91e8`
  - No Buy/Nurture `4ee34d60-d48c-4455-b851-3ef989374a11`
  - DND `8dd0b5f8-9db1-43c9-89d3-831da9a70185`

`GHL_PIPELINE_STAGE_ID` is ignored. A new opportunity is created in New Leads. An inbound stage id outside this list is stored as `unmapped:<id>` with status `unknown_stage`. It is not dropped and it is not marked synced. Griselda is a local assignee from `MEMBERSHIP_COORDINATOR_EMAILS`. There is no HighLevel user id for her. The app timezone is `America/Los_Angeles`. Do not copy a HighLevel address onto the public site.
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
- `checkout.session.async_payment_failed`
- `checkout.session.expired`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `charge.refunded`
- `charge.dispute.created`
- `radar.early_fraud_warning.created`

Alert drain cron: `GET` or `POST` `/api/membership/alerts/run/` with `Authorization: Bearer $CRON_SECRET`. It retries pending alert rows and runs the phase-1 lifecycle schedule. It does not send held alerts. Scheduled mail stays off until `MEMBERSHIP_LIFECYCLE_SEND=true` and `MEMBERSHIP_LIFECYCLE_PHASE1=true`.

Keep Stripe's automatic receipt emails off so `monthly_receipt_email` is the only receipt. Set `MEMBERSHIP_STRIPE_RECEIPTS=true` only if those Stripe receipts are turned on and ours should be suppressed.

Lifecycle mail is sent from `ManHair <info@manhaironline.com>` with reply-to `info@manhaironline.com`. Staff mail goes to `MEMBERSHIP_STAFF_ALERT_EMAILS`. `billing_portal_url` is `https://www.manhaironline.com/account/billing/`, which signs the member in and opens a fresh portal session. Do not put a raw Stripe portal URL in a template.

SMS uses the GoHighLevel Conversations API for location `jv4grExvok7omWurc4PE` from `+19045268500`. Set either `GHL_API_TOKEN` or `GHL_PRIVATE_TOKEN` (the same private integration token). Leave `MEMBERSHIP_SMS_SEND` unset until quiet hours, consent, and the sending number are confirmed. Quiet hours are 9:00 AM to 8:00 PM Pacific unless a member time zone is stored.

Apply `db/membership/005_lifecycle_messages.sql` with the other membership migrations before turning lifecycle mail on. Phase 2 templates stay disabled.

## Database

From a machine that already has the ManHair `DATABASE_URL`:

Confirm a Neon point-in-time restore on the production branch, then run this from a machine that already has the ManHair `DATABASE_URL`. The timestamp is the restore point you just confirmed. It is not a secret and it is not a copy of production data.

```bash
MEMBERSHIP_MIGRATE_CONFIRM=apply MEMBERSHIP_MIGRATE_RESTORE_POINT=2026-11-08T16:00:00Z npm run membership:migrate
```

The script refuses to run without both values. It creates only `membership_*` tables. It does not change Payload tables. It was not run in this change. There is no public migration route.

## Stripe sandbox check before any live key

In test mode on the approved ModFXMedia account `acct_1DhNFjGiafo5ImyE`. Do not use a live key, and do not reuse the live price ids:

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

## Least-privilege provider access

Sandbox or test credentials first. Do not put live prices or a live key on Preview. `MEMBERSHIP_PAYMENTS_LIVE` stays unset until a real sandbox checkout is reviewed.

Stripe restricted key, only these calls. The app does not create products, prices, customers by hand, refunds, or portal configurations.

- `GET /v1/account` — confirm the key's account matches `STRIPE_ACCOUNT_ID`
- `GET /v1/prices/:id` — confirm the four price amounts before checkout
- `POST /v1/checkout/sessions` — hosted checkout only
- `GET /v1/billing_portal/configurations/:id` — read `STRIPE_PORTAL_CONFIGURATION_ID`; do not write configurations
- `POST /v1/billing_portal/sessions` — one session for the signed-in customer
- `POST /v1/subscriptions/:id` — set `cancel_at`, replace the subscription item price, or set `pause_collection` after staff apply a pause

Webhook receive is `POST /api/membership/webhook/` with the signing secret. It is not a Stripe write permission.

HighLevel private token for location `jv4grExvok7omWurc4PE` only. No workflow, conversation, user, calendar, or location-write scope.

- `GET` and `POST /contacts/`
- `POST /opportunities/` and `POST /opportunities/search`
- `PUT /opportunities/:id`
- Inbound `POST /api/membership/ghl/` verified with the published Ed25519 key

Resend, when a send is later approved: one sending key for the verified domain `manhaironline.com` (`156da5ef-13f5-4b44-a4bb-b3cdcbe23544`). Tracking and receiving stay off. The key should not be an account-admin key. No send flag is on.

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

HighLevel calls stay off until `GHL_API_TOKEN` is set. The location, marketing pipeline, and nine stage ids are fixed in code to the verified ManHair account. A token plus a different location, the legacy pipeline, or a stage id that disagrees with those nine turns the adapter off. Signed inbound events use `POST /api/membership/ghl/`. The verifier checks `X-GHL-Signature` with HighLevel's published Ed25519 public key over the raw body, rejects a missing or bad signature, rejects a stale `timestamp`, rejects a duplicate `webhookId`, and rejects any other location. A pull from the hub reads contacts with a cursor and opportunities on the marketing pipeline, retries failed reads, and keeps the staff stage when the staff edit is newer than the remote update. A newer remote stage is applied only when its id is one of the nine. The hub dropdown uses those labels, refreshes about every 15 seconds, and shows each lead's sync status. That refresh is not a live socket. No token is in this repo, so these tests use a fake fetch. They are not a live HighLevel call.

Member sessions are stored as a hash of the cookie secret. Checkout return links work once. Logout deletes the session and writes an audit row. A later visit asks for a one-time email link. That link is sent only when `RESEND_API_KEY`, `RESEND_FROM`, and `MEMBERSHIP_RECOVERY_SEND=true` are all set. They are not set here, and the request fails closed without sending mail or opening a session. Typing an email never signs someone in. A member does not pay again to recover an existing membership.

The Customer Portal session uses the signed-in member's Stripe customer id and the configuration id in `STRIPE_PORTAL_CONFIGURATION_ID`. Tests reject a missing id, a non-portal id, a retrieved id that differs, and a configuration that allows cancellation. They do not create a Stripe configuration.

Screenshots in the pull request are rendered pages on a local production server with payments, founding, database, and staff sign-in unconfigured. They show the public offer, the blocked checkout form, the signed-out account gate, and the hub denial. They are not a successful payment or a populated lead board.

## Readiness

`GET /api/membership/readiness/` returns blocker text and booleans. It does not return secret values. `payments` stays blocked until the account lookup at checkout also matches `STRIPE_ACCOUNT_ID`.
