# ManHair launch readiness — November 8, 2026

The owner assigned launch coordination to Codex in this session. The release branch is `cursor/membership-billing-72ca` (PR 9). The isolated payment verification branch is `codex/manhair-sandbox-verification-20261108`. Keep a single operator responsible for the shared Stripe test destination; do not repoint it to another database during a test.

## Verified

- Hosted test Checkout collected $495 setup with Signature $559/month starting 30 days later. Native Stripe events recorded the paid setup invoice and membership.
- A separate Essential test-clock subscription collected $495 setup, $449 at day 30, and $449 at the following calendar-month boundary (31 days later). All three native invoices are stored as paid; the test member is active and setup-paid.
- Invoice-first delivery uses subscription metadata; an older paid setup invoice does not lose its payment fact when a newer subscription status already exists.
- Dispute and early-fraud-warning events resolve the customer through their charge; lookup errors remain retryable. Test/live mode mismatches are rejected. Delayed payment failures cannot regress a paid member.
- The live Neon database was backed up and restored into an isolated local database. Counts matched across all 25 CMS tables. The additive 29-statement membership migration then completed. Backup evidence and the private dump are stored outside the repository.
- Isolated SQL-backed integration checks passed for one-use account recovery, sign-out, unauthorized staff rejection, fulfillment usage idempotency, and payment-grace persistence and clearing. The recovery message was marked Delivered by the Resend simulator. These checks exercised local application handlers with the real test database; production ingress still needs verification after deployment.
- Resend's `manhaironline.com` domain is verified. A sending-only key restricted to this domain is stored as a sensitive production environment variable. Recovery uses `ManHair <accounts@manhaironline.com>`.

## Still required before opening production checkout

- Complete Stripe identity verification, create the live restricted application key, and install it as a sensitive production environment variable.
- Verify the live account, four price amounts and billing-only portal configuration using that key.
- Create a separate live webhook at `https://www.manhaironline.com/api/membership/webhook/`; use the 12 event types exported by `lib/membership/alerts.ts`, including delayed-payment failure. Install its signing secret in production.
- Confirm the owner's payment-alert inbox and customer support/booking details. Customer lifecycle emails and SMS remain held.
- Deploy the final release, verify public endpoints, account recovery and live Checkout configuration, then enable `MEMBERSHIP_PAYMENTS_LIVE`. No real card has been charged in these tests.

HighLevel workflow access is still with provider support. It does not establish payment readiness. Keep CRM sync disabled until verified; do not treat local persistence as a CRM receipt.

## Known test cleanup

One unused incomplete test subscription remains while Stripe's agent approval request for cancellation is pending. It has no collected payment. Do not bypass Stripe's approval policy to clean it up.
