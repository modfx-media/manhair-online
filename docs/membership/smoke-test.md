# Membership smoke test

This checklist has two parts. The script proves the code paths with fakes. It does not create a Stripe charge, call HighLevel, send email, or apply the database migration. The processor section is for the integration operator after a ManHair sandbox exists. That section is not done.

## Code smoke

```bash
npm run membership:smoke
npm run membership:check-migration
npm test
```

`membership:smoke` checks:

- Setup is due at the checkout instant, the first membership charge is 30 days later, and the next charge is one calendar month after that.
- Checkout copy says charges show as MODFXMEDIA, LLC and that this app does not change the shared Stripe profile.
- Hosted Checkout is one subscription, `trial_period_days` 30, one setup price, and no `payment_method_types`.
- An email query does not open `/account/`.
- A signed `invoice.paid` webhook is accepted once and the replay is duplicate.
- Setup-paid alerts are stored as `held` for the owner and the customer. The drain delivers nothing while sender and recipient flags are off.
- Collected setup cash is separate from projected MRR. A trialing subscription is not counted as paid MRR.
- Portal features allow payment-method update and invoice history, and disallow cancel and plan changes.

## Webhook the operator will configure

Route: `https://www.manhaironline.com/api/membership/webhook/`

The site uses trailing slashes. Point Stripe at that URL. Signing secret goes in `STRIPE_WEBHOOK_SECRET`. The route rejects a missing or bad `Stripe-Signature`.

Subscribe only these events:

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

No webhook endpoint exists on the confirmed Stripe account yet. Creating it is an operator step after the key and secret are in the ManHair Vercel project.

Alert retry route, for Vercel cron: `POST /api/membership/alerts/run` with `Authorization: Bearer $CRON_SECRET`. It only delivers rows already marked pending. Held rows stay held.

## Processor sandbox, not done

There is no accessible Stripe sandbox for this account yet. Do not mark this section passed because the fake-client smoke passed.

After the owner authorizes a sandbox on `acct_1DhNFjGiafo5ImyE`:

1. Answer whether ManHair collects sales tax before any product is created. This checkout does not enable `automatic_tax`.
2. Create one product per tier and the setup price. None exist today.
3. Put the price ids in the environment. Do not change the shared business profile or the statement descriptor `MODFXMEDIA, LLC`.
4. Complete one Checkout in the sandbox.
5. Confirm the immediate invoice is only the setup fee.
6. Confirm the subscription is trialing and no second subscription exists.
7. Advance the test clock 30 days and confirm one monthly invoice, then another one calendar month later.
8. Replay the webhook and confirm the alert outbox does not create a second row.
9. Fail a renewal and then pay it. Confirm `invoice_failed` and `invoice_recovered` rows.
10. Open the portal as that member and confirm it cannot cancel the subscription.

Stripe’s own customer receipts are a setting on the confirmed account, separate from this app’s owner alerts. Do not turn on customer emails from this app until `MEMBERSHIP_CUSTOMER_ALERTS_SEND=true` and the sender is approved. That flag is not set.

## Migration check

`npm run membership:check-migration` reads `db/membership/001_init.sql` and fails on `DROP TABLE`, `DELETE`, `TRUNCATE`, or `DROP COLUMN`. The only drop allowed is `DROP INDEX IF EXISTS membership_members_email_idx`, which removes a uniqueness constraint this same file introduced and deletes no rows. The check does not connect to Neon.

Apply later, from a machine that already has the ManHair database URL:

```bash
MEMBERSHIP_MIGRATE_CONFIRM=apply npm run membership:migrate
```
