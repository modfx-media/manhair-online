# ManHair membership implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a fail-closed membership funnel, member account, and staff hub on the existing ManHair Next.js and Neon app without charging the unverified ModFXMedia Stripe account or writing to an unverified HighLevel location.

**Architecture:** Commercial rules are pure functions with unit tests. Neon `membership_*` tables hold members, consents, invoices, usage, and deals. Stripe Checkout and webhooks are the billing source of truth when configuration passes the denylist and price checks. HighLevel sync is off until a location id is configured. Payload stays the staff login.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Payload 3, Neon, Stripe Node SDK 23 (`2026-09-30.endive`), `node:test` via `tsx`.

## Global Constraints

- Essential $449 / 4 systems / 9 maintenance; Signature $559 / 6 / 7 (recommended); Elite $669 / 8 / 5 plus priority booking. All tiers 13 visits a year.
- Setup $495 now, or founding $295 only when `MEMBERSHIP_FOUNDING_ENABLED=true`, cap from `MEMBERSHIP_FOUNDING_CAP` (default 25, maximum 25). No invented end date.
- One subscription, `trial_period_days: 30`, one one-time setup price, `payment_method_collection: 'always'`, no `payment_method_types`.
- Refuse Stripe account `acct_1DhNFjGiafo5ImyE`. Live keys require `MEMBERSHIP_PAYMENTS_LIVE=true`.
- No HighLevel call without `GHL_LOCATION_ID` plus token. No default location.
- No customer email or SMS. No raw card fields. No automatic refunds. No add-on balance increments.
- Hub deny-by-default via `MEMBERSHIP_OWNER_EMAILS` and `MEMBERSHIP_COORDINATOR_EMAILS`.
- Do not change Payload admin access for existing users. Do not run a migration against a live database in this change.
- Do not deploy or merge. Production Vercel access is unverified.

---

### Task 1: Domain rules

**Files:**
- Create: `lib/membership/offer.ts`, `dates.ts`, `readiness.ts`, `checkout.ts`, `billing.ts`, `lifecycle.ts`, `access.ts`, `ghl.ts`, `tokens.ts`
- Test: `tests/membership/domain.test.ts`

**Interfaces:**
- Consumes: environment strings and clock dates only.
- Produces: `TIERS`, `billingTimeline(start)`, `paymentBlockers(env, retrievedAccountId)`, `buildCheckoutParams(input)`, `assessCheckoutAmount`, `planUsage`, `planCancel`, `planPauseApply`, `revenueReport`, `staffRole`, `ghlPlan`, `signToken` / `verifyToken`.

- [x] Write failing tests for tier cents, 30-day timeline, denylist, founding cap, checkout param shape, usage replay, cancel date, pause void-collection, revenue without annualization, staff deny-default, HighLevel location mismatch, token expiry.
- [x] Implement the pure modules until `npm test` passes.

### Task 2: Persistence

**Files:**
- Create: `db/membership/001_init.sql`, `lib/membership/types.ts`, `memory-store.ts`, `sql-store.ts`, `scripts/membership-migrate.ts`
- Test: `tests/membership/store.test.ts`

**Interfaces:**
- Produces: `MembershipStore` with member, checkout idempotency, founding reserve, webhook claim, invoice, usage, deal, pause request, and session methods.
- `createMemoryStore()` for tests. `createSqlStore(connectionString)` for runtime. Migrate script requires `MEMBERSHIP_MIGRATE_CONFIRM=apply` and never prints the URL.

- [x] Tests for founding cap, expired hold, duplicate webhook claim, usage replay, and version conflict.
- [x] SQL file uses one statement for founding reserve and one for usage so retries cannot double-consume.

### Task 3: HTTP boundary

**Files:**
- Create: `lib/membership/handlers.ts`, `lib/membership/stripe-client.ts`
- Create routes under `app/(site)/api/membership/`
- Test: `tests/membership/handlers.test.ts`, `tests/membership/webhook-signature.test.ts`

**Interfaces:**
- `handleCheckout`, `handleWebhook`, `handleReturn`, `handleAccount`, `handleHub`, `handleReadiness`.
- Fake Stripe in tests. Real `Stripe.webhooks.constructEvent` for the signature test.

- [x] Duplicate checkout returns one session. Denylisted account creates none. Missing consent is 400. Webhook bad signature is 400. Stale subscription status does not overwrite a newer one. Member route cannot read another member. Hub without allowlist is 401. HighLevel fetch is not called when location is missing.

### Task 4: Pages

**Files:**
- Create: `app/(site)/memberships/page.tsx`, `join/page.tsx`, `account/page.tsx`, `hub/page.tsx`, `membership-terms/page.tsx`
- Create: `components/membership/JoinForm.tsx`, `AccountPanel.tsx`, `HubConsole.tsx`
- Modify: `lib/site.ts` nav, `app/robots.ts`, `app/(site)/sitemap.ts`, `next.config.ts`, `.env.example`

- [x] Public page renders three real tiers and the billing disclosure with founding off.
- [x] Join, account, and hub show fail-closed copy when configuration is absent. No sample member and no fake payment success.
- [x] Preview builds (`VERCEL_ENV=preview`) skip the `*.vercel.app` canonical redirect and send `X-Robots-Tag: noindex`. Production builds keep the redirect.

### Task 5: Proof and handoff

**Files:**
- Create: `docs/membership/production-handoff.md`
- Modify: `package.json` scripts `test` and `membership:migrate`

- [x] `npm test`, `npx tsc --noEmit`, `npx eslint` on new files, `npm run build`.
- [x] Mobile and desktop screenshots of `/memberships/`, `/join/`, `/account/`, and `/hub/`.
- [x] Handoff lists variable names, the Stripe sandbox clock check, portal configuration, allowlists, and the unverified Vercel project. No secret values.

## Self-review against the spec

- Tiers, setup, founding guard, 30-day trial, term, pause, entitlements, hub, and HighLevel isolation each have a task and a test.
- No task activates live charges, sends mail, or migrates a live database.
- Portal checkout is blocked without a restricted portal configuration id.
- Webhook amount check covers the case where Stripe collects the first month immediately.
- Unresolved refund and add-on policy stay out of the ledger math.
