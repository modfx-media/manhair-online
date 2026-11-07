# ManHair membership design

Date: 2026-11-07
Status: Approved direction from the owner request, updated with the live connector audit. This document is the commercial and technical contract for the build in this change.

## Current state (verified in this repository)

- Next.js 16 App Router (`next@16.3.8`), React 19, TypeScript, Tailwind CSS 4. Public pages live in `app/(site)`. Payload 3.90 lives in `app/(payload)` at `/admin` and `/api`.
- Postgres is Neon through `DATABASE_URL` and `@payloadcms/db-vercel-postgres`. Schema push is disabled when `VERCEL=1`. A down database must not take down the marketing site (`withCMS`).
- Payload `users` is the only auth collection. Any logged-in user can open the CMS admin. There is no role field. This change does not take that access away, so existing editors are not locked out.
- Fonts are already Manrope (body) and Outfit (display). Cream `#FAF7F1`, ivory `#F5EFE3`, gold `#C9A24A`, ink `#2A211A` / `#1A130E`, and red `#B00400` are the live tokens in `app/globals.css`.
- GoHighLevel is a browser embed only: the consult form at `link.manhaironline.com` and the `/booking/` calendar. There is no server-side HighLevel client and no location id in the repo.
- Cherry is a financing widget on `/payment-plans` only. It is not the membership processor.
- Resend is not installed and no email sender exists. Membership mail must not pretend otherwise.
- Stripe is not installed on `main`. No ManHair price ids exist in the repo.
- `next.config.ts` permanently redirects every `*.vercel.app` host to `https://www.manhaironline.com`. Preview deployments of this branch would be invisible unless that redirect is omitted for `VERCEL_ENV=preview` only. Production builds keep the redirect.
- There is no test runner on `main`.

## Live connector audit (do not rediscover through other businesses)

- HighLevel name searches for ManHair, Man, and Hair returned no locations. There is no verified location id. The integration stays off until `GHL_LOCATION_ID` is set to a location the owner confirms. No default location is allowed.
- The only accessible Stripe merchant in the 2026-11-07 audit identifies as ModFXMedia, `acct_1DhNFjGiafo5ImyE`, in live mode. The owner has not said whether that merchant is intended. Checkout does not hard-code that id as allowed or refused. It stays closed until `MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED=true` and the authenticated account matches `STRIPE_ACCOUNT_ID`. This pull request does not set that confirmation.
- Vercel project `manhair-online` (`prj_KYNMITbRpNx4np9hRPZQzZuNG3fd`, team `team_FQDxgNtaJYX8DHFa0X5V7jiN`) returned 404 on project read and 403 on deployment list. Production deployment is unverified. This change does not use the Vercel CLI or session tokens to get around that.

## Product

Three monthly memberships. Every tier is 13 studio visits a year, about every 4 weeks, 100% human hair, cut and style at each visit.

| Tier | Monthly | Custom systems / year | Maintenance visits / year | Notes |
| --- | ---: | ---: | ---: | --- |
| Essential | $449 | 4 | 9 | Suited to French lace, mono, and 0.08 skin |
| Signature | $559 | 6 | 7 | Default recommendation. Badge: “Most guys pick this.” |
| Elite | $669 | 8 | 5 | Suited to thin skin and Swiss lace. Priority booking is a service promise, not a connected scheduler |

Published add-on prices, not sold in this checkout: additional fitted system $849, extra maintenance $225, Elite backup $849. Entitlement accounting for those add-ons is unresolved. The app shows the prices and does not increment balances when someone pays them.

Custom Design & First Fitting is $495 once, charged at checkout, and goes toward the first system. There is no separate initiation fee.

Founding setup is $295 for the first 25 members, with current clients intended to go first. No closing date was given, so none is shown. The offer is off unless `MEMBERSHIP_FOUNDING_ENABLED=true`. The cap is atomic. Expired and abandoned holds do not consume the cap. There is no current-client list in this app, so client priority cannot be enforced. That limit is shown whenever founding is on. Nothing auto-enrolls an existing customer.

Rate lock is 24 months from signup at the monthly amount of the chosen tier. A tier change moves the member to the published price of the destination tier, prorated, with no change fee. The minimum term does not restart.

Minimum term is 3 months, then month-to-month. Online cancellation after month 3 adds no fee and stops future charges at the end of the current paid period. During the minimum, cancellation is scheduled for the minimum-term end, not today, and still adds no fee. The application does not refund. Whether money already collected is refundable is unresolved and is not decided here.

Pause is up to 60 days per entitlement year. A member can file a pause request. Billing does not change until a staff member applies it and Stripe accepts `pause_collection` with behavior `void`. While applied: collection stops until the resume time, studio use is suspended, used counts stay, and the minimum-term end, rate-lock end, and entitlement-year end move forward by the paused days. This pause rule is application behavior pending attorney review. It is not a claim of legal compliance. Self-serve billing pause is off unless `MEMBERSHIP_PAUSE_SELF_SERVE=true`.

Billing timing: the setup fee is charged at checkout. The first membership fee is 30 days later (`trial_period_days: 30` on one subscription, plus one one-time setup price). Then the membership bills monthly. The 30 days are not unlimited free service. The first system lead time is 8–12 weeks and is not a promise that the system arrives in 30 days.

Annual visit and system balances use an entitlement year starting at signup. That year is not the Stripe month. Usage is an append-only ledger with an idempotency key. Balances cannot go negative. Replaying a key does not consume twice. A pause freezes use. A tier change keeps recorded use.

Scheduling: Griselda’s appointment system is not identified. The hub says scheduling is not connected. It does not collect a booking and does not confirm a visit. The existing consult modal stays the marketing-site consult form.

Messaging: draft text can be saved. Send stays disabled. No customer email or SMS is sent. Processor receipts inside a future Stripe account are a Stripe dashboard setting, not this app.

## Architecture

One canonical commercial record lives in new Neon tables (`membership_*`), migrated by an explicit script. Payload remains the staff login and the marketing CMS. Members are not Payload users and cannot open `/admin` through a membership session.

Stripe is the billing source of truth once a confirmed account is connected. Fulfillment runs in the webhook handler after signature verification. The browser return only opens the member session. It does not mark a payment successful.

GoHighLevel is the canonical contact and opportunity store only when a location, token, and pipeline are all set. Until then, deals stay in Neon and the hub says they were not sent. Sync is one-way per write, hashed, and dropped when the location does not match. Ambiguous contact matches are not auto-merged. Missing pipeline stage id skips opportunity creation rather than guessing a stage.

Staff hub access is an email allowlist: `MEMBERSHIP_OWNER_EMAILS` and `MEMBERSHIP_COORDINATOR_EMAILS`. Empty lists mean nobody, including a logged-in CMS user. A hidden URL is not a control.

Card numbers are collected only by Stripe Checkout. Portal sessions require `STRIPE_PORTAL_CONFIGURATION_ID` so the default portal cannot cancel or change plans outside these rules. Invoices shown in `/account` come from webhook rows.

Payments fail closed. Live secret keys require `MEMBERSHIP_PAYMENTS_LIVE=true` and a non-denylisted account id that matches `accounts.retrieve()`. Price ids are read from the environment and checked against the published cents before a session is created. The browser cannot submit an amount.

The 30-day split is the supported Checkout shape (one subscription, 30-day trial, one one-time setup price, `payment_method_collection: always`, no `payment_method_types`). It has not been executed in a ManHair Stripe sandbox. Readiness reports that. The webhook compares `amount_total` with the setup fee and flags a checkout that also collected the first month, or that collected nothing, instead of describing it as the intended schedule.

Tax is not enabled. `automatic_tax` stays off until the owner has a registration and asks for it.

## Access and privacy

- Public: `/memberships/`, `/membership-terms/`, `/join/`.
- Member: `/account/` and member JSON routes, scoped to the session’s member id.
- Staff: `/hub/` and hub JSON routes, allowlisted emails only.
- `/join/`, `/account/`, `/hub/`, and `/api/membership/` are `noindex` and disallowed in robots.
- Logs omit email, phone, name, note text, and secret values.
- No shared or default password is created. Griselda gets a hub seat only after a Payload user exists and her email is added to `MEMBERSHIP_COORDINATOR_EMAILS`.

## Routes

- `/memberships/` — three tiers, Start Now, billing disclosure, founding state.
- `/join/?tier=` — consents, then redirect to Checkout when payments are ready.
- `/account/` — plan, next charge, invoices, cancel, pause request, portal or an honest unavailable state.
- `/hub/` — stages, assignee, notes, follow-up, activity, filters, cash versus contracted monthly rate.
- `POST /api/membership/checkout/`
- `POST /api/membership/webhook/`
- `GET /api/membership/return/`
- `GET /api/membership/readiness/` — names and booleans, no secret values.
- Account and hub mutation routes under `/api/membership/account/` and `/api/membership/hub/`.

## Self-review

Reviewed against this file before implementation:

- No open price, date, or cap. Founding is off and has no invented deadline.
- The ModFXMedia account is refused, not used as a fallback.
- HighLevel has no placeholder location.
- Revenue has no annualized or projected figure.
- Refunds and add-on balances are called unresolved instead of being automated.
- Pause distinguishes collection, service access, and term dates, and does not change Stripe until staff apply it.
- The 30-day deferral is not described as free service, and the system lead time is separate.
- CMS admin behavior for current users stays as it is; the new hub is deny-by-default.
- Preview host handling is limited to `VERCEL_ENV=preview` and does not weaken the production canonical redirect.
- Sandbox confirmation of the Stripe timeline is an explicit remaining gate, not a checked box.
