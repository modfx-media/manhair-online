import assert from "node:assert/strict";
import { test } from "node:test";
import { reduceBillingEvent, type MemberBilling } from "../../lib/membership/billing";
import { handleAccountPost, handleHub, handleWebhook, type Deps, type StripeLike } from "../../lib/membership/handlers";
import { planUsage } from "../../lib/membership/lifecycle";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { applyInvoiceObservation, PAYMENT_GRACE_DAYS, reconcileGrace, type GraceInvoice } from "../../lib/membership/payment-grace";
import type { MemberRecord } from "../../lib/membership/types";
import { billingTimeline } from "../../lib/membership/dates";
import { hashSecret } from "../../lib/membership/tokens";

const NOW = new Date("2026-11-07T19:00:00.000Z");

function billing(grace: string | null = null): MemberBilling {
  return {
    id: "mem_1",
    tier: "signature",
    status: "active",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    setupCents: 49500,
    monthlyCents: 55900,
    setupPaid: true,
    recurringStartAt: "2026-12-07T19:00:00.000Z",
    cancelAt: null,
    pauseCollection: false,
    lastStatusEventCreated: 0,
    attention: null,
    version: 0,
    paymentGraceStartedAt: grace,
  };
}

function invoice(type: "invoice.payment_failed" | "invoice.paid", created: number, billingReason = "subscription_cycle") {
  return {
    id: `evt_${type}_${created}`,
    type,
    created,
    memberId: "mem_1",
    customerId: "cus_1",
    subscriptionId: "sub_1",
    invoiceId: "in_month",
    amountPaid: type === "invoice.paid" ? 55900 : 0,
    billingReason,
    lines: [] as Array<{ priceId: string | null; amount: number; proration: boolean }>,
  };
}

function row(id: string, status: "paid" | "failed", created: number, failedAt: string | null = null): GraceInvoice {
  return { id, kind: "recurring", status, failedAt, statusEventCreated: created, amountPaid: status === "paid" ? 55900 : 0, amountRefunded: 0, memberId: "mem_1" };
}

test("one paid month does not clear the hold while another monthly invoice is still failed", () => {
  assert.equal(PAYMENT_GRACE_DAYS, 14);
  const firstFail = applyInvoiceObservation(null, { ...row("in_a", "failed", 100), statusEventCreated: 100 });
  assert.equal(firstFail.applied, true);
  const started = firstFail.invoice.failedAt;
  const retry = applyInvoiceObservation(firstFail.invoice, { ...row("in_a", "failed", 200, started), statusEventCreated: 200 });
  assert.equal(retry.invoice.failedAt, started);
  const second = applyInvoiceObservation(null, { ...row("in_b", "failed", 300), statusEventCreated: 300 });
  const grace = reconcileGrace(null, [retry.invoice, second.invoice]);
  assert.equal(grace, started);
  const paidA = applyInvoiceObservation(retry.invoice, { ...row("in_a", "paid", 400, started), statusEventCreated: 400 });
  assert.equal(reconcileGrace(grace, [paidA.invoice, second.invoice]), grace);
  const paidB = applyInvoiceObservation(second.invoice, { ...row("in_b", "paid", 500, second.invoice.failedAt), statusEventCreated: 500 });
  assert.equal(reconcileGrace(grace, [paidA.invoice, paidB.invoice]), null);
  const stalePaid = applyInvoiceObservation(second.invoice, { ...row("in_b", "paid", 50), statusEventCreated: 50 });
  assert.equal(stalePaid.applied, false);
  assert.equal(stalePaid.invoice.status, "failed");
  const failure = reduceBillingEvent(billing(null), invoice("invoice.payment_failed", 100), new Set());
  assert.equal(failure.statusPatch?.status, "past_due");
  assert.notEqual(failure.statusPatch?.status, "canceled");
});

test("visits and new system orders hold after the grace period and an in-progress count stays", () => {
  const start = "2026-11-01T00:00:00.000Z";
  const during = new Date("2026-11-14T23:00:00.000Z");
  const after = new Date("2026-11-15T00:00:00.000Z");
  const base = {
    id: "mem_1",
    status: "past_due" as const,
    tier: "signature" as const,
    systemsUsed: 2,
    maintenanceUsed: 1,
    pauseCollection: false,
    entitlementYearEndsAt: "2027-11-01T00:00:00.000Z",
    paymentGraceStartedAt: start,
  };
  assert.equal(planUsage(base, "system", 1, during).ok, true);
  const held = planUsage(base, "system", 1, after);
  assert.equal(held.ok, false);
  if (!held.ok) assert.equal(held.reason, "payment_hold");
  assert.equal(planUsage(base, "maintenance", 1, after).ok, false);
  assert.equal(base.systemsUsed, 2);
});

test("opening the payment portal does not clear the grace clock", async () => {
  const store = createMemoryStore();
  const timeline = billingTimeline(NOW);
  const record: MemberRecord = {
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "past_due",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    recurringStartAt: timeline.firstRecurringAt.toISOString(),
    minimumTermEndsAt: timeline.minimumTermEndsAt.toISOString(),
    rateLockEndsAt: timeline.rateLockEndsAt.toISOString(),
    entitlementYearEndsAt: timeline.entitlementYearEndsAt.toISOString(),
    systemsUsed: 2,
    maintenanceUsed: 1,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    paymentGraceStartedAt: "2026-11-01T00:00:00.000Z",
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: NOW.toISOString(),
  };
  await store.saveMember(record);
  await store.createSession({
    id: "sess_1",
    memberId: "mem_1",
    tokenHash: hashSecret("cookie-a"),
    expiresAt: "2026-12-07T00:00:00.000Z",
    active: true,
    returnUsed: true,
  });
  const stripe: StripeLike = {
    accounts: { async retrieveCurrent() { return { id: "acct_manhair_confirmed" }; } },
    prices: { async retrieve(id) { return { id, unit_amount: 55900, currency: "usd", recurring: { interval: "month" } }; } },
    checkout: { sessions: { async create() { return { id: "cs", url: "https://checkout.stripe.test/c/cs" }; } } },
    billingPortal: {
      configurations: {
        async retrieve(id) {
          return {
            id,
            features: {
              invoice_history: { enabled: true },
              payment_method_update: { enabled: true },
              subscription_cancel: { enabled: false },
              subscription_update: { enabled: false },
              customer_update: { enabled: false },
            },
          };
        },
      },
      sessions: { async create() { return { url: "https://billing.stripe.test/p/session" }; } },
    },
    subscriptions: { async update() { return {}; } },
  };
  const deps: Deps = {
    env: {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      STRIPE_ACCOUNT_ID: "acct_manhair_confirmed",
      STRIPE_PRICE_ESSENTIAL: "price_essential",
      STRIPE_PRICE_SIGNATURE: "price_signature",
      STRIPE_PRICE_ELITE: "price_elite",
      STRIPE_PRICE_SETUP: "price_setup",
      STRIPE_PORTAL_CONFIGURATION_ID: "bpc_123",
      MEMBERSHIP_SESSION_SECRET: "test-secret",
      MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    },
    store,
    stripe,
    now: () => NOW,
  };
  const portal = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=portal", {
    method: "POST",
    headers: {
      origin: "https://www.manhaironline.com",
      host: "www.manhaironline.com",
      cookie: "mh_member_session=cookie-a",
      "content-type": "application/json",
    },
    body: "{}",
  }), deps);
  assert.equal(portal.status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, "2026-11-01T00:00:00.000Z");
  const held = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: "mem_1", kind: "system", quantity: 1, idempotencyKey: "order_1" }),
  }), { ...deps, staffEmail: "owner@manhaironline.com", env: { ...deps.env, MEMBERSHIP_OWNER_EMAILS: "owner@manhaironline.com" }, now: () => new Date("2026-11-20T00:00:00.000Z") });
  assert.equal(held.status, 409);
  assert.equal((await held.json()).error, "payment_hold");
  assert.equal((await store.findMemberById("mem_1"))?.systemsUsed, 2);
});

test("webhook keeps the grace clock when one overdue month is paid and an older event arrives late", async () => {
  const store = createMemoryStore();
  const timeline = billingTimeline(NOW);
  await store.saveMember({
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "active",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    recurringStartAt: timeline.firstRecurringAt.toISOString(),
    minimumTermEndsAt: timeline.minimumTermEndsAt.toISOString(),
    rateLockEndsAt: timeline.rateLockEndsAt.toISOString(),
    entitlementYearEndsAt: timeline.entitlementYearEndsAt.toISOString(),
    systemsUsed: 1,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: NOW.toISOString(),
  });
  const deps: Deps = {
    env: {
      STRIPE_SECRET_KEY: "sk_test_123",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
      STRIPE_ACCOUNT_ID: "acct_manhair_confirmed",
      STRIPE_PRICE_ESSENTIAL: "price_essential",
      STRIPE_PRICE_SIGNATURE: "price_signature",
      STRIPE_PRICE_ELITE: "price_elite",
      STRIPE_PRICE_SETUP: "price_setup",
      STRIPE_PORTAL_CONFIGURATION_ID: "bpc_123",
      MEMBERSHIP_SESSION_SECRET: "test-secret",
      MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
      NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    },
    store,
    stripe: null,
    now: () => NOW,
    constructEvent: (_payload, header) => {
      if (header === "bad") throw new Error("bad");
      return JSON.parse(_payload);
    },
  };
  const send = (event: Record<string, unknown>) => handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "ok" },
    body: JSON.stringify(event),
  }), deps);
  const invoiceEvent = (id: string, type: string, created: number, invoiceId: string) => ({
    id,
    type,
    created,
    data: {
      object: {
        id: invoiceId,
        customer: "cus_1",
        amount_paid: type === "invoice.paid" ? 55900 : 0,
        billing_reason: "subscription_cycle",
        lines: { data: [] },
      },
    },
  });
  assert.equal((await send(invoiceEvent("evt_a_fail", "invoice.payment_failed", 100, "in_a"))).status, 200);
  const started = (await store.findMemberById("mem_1"))?.paymentGraceStartedAt;
  assert.equal(started, new Date(100 * 1000).toISOString());
  assert.equal((await send(invoiceEvent("evt_a_retry", "invoice.payment_failed", 180, "in_a"))).status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, started);
  assert.equal((await send(invoiceEvent("evt_b_fail", "invoice.payment_failed", 300, "in_b"))).status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, started);
  assert.equal((await send(invoiceEvent("evt_a_paid", "invoice.paid", 400, "in_a"))).status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, started);
  assert.equal((await store.findMemberById("mem_1"))?.status, "past_due");
  assert.equal((await send(invoiceEvent("evt_b_old_paid", "invoice.paid", 50, "in_b"))).status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, started);
  const open = await store.listInvoices("mem_1");
  assert.equal(open.find((invoice) => invoice.id === "in_b")?.status, "failed");
  assert.equal((await send(invoiceEvent("evt_b_paid", "invoice.paid", 500, "in_b"))).status, 200);
  assert.equal((await store.findMemberById("mem_1"))?.paymentGraceStartedAt, null);
});
