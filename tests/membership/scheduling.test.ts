import assert from "node:assert/strict";
import { test } from "node:test";
import { handleHub, type Deps, type StripeLike } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { schedulingMessages } from "../../lib/membership/scheduling";
import { planSuitabilityFailure } from "../../lib/membership/suitability";
import type { MemberRecord } from "../../lib/membership/types";
import { billingTimeline } from "../../lib/membership/dates";

const NOW = new Date("2026-11-07T19:00:00.000Z");

function member(): MemberRecord {
  const timeline = billingTimeline(NOW);
  return {
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
    systemsUsed: 0,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: NOW.toISOString(),
  };
}

function deps(stripe: StripeLike): Deps {
  return {
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
      MEMBERSHIP_OWNER_EMAILS: "owner@manhaironline.com",
      NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    },
    store: createMemoryStore(),
    stripe,
    now: () => NOW,
    staffEmail: "owner@manhaironline.com",
  };
}

test("staff can record a real visit and a missing time does not trigger a confirmation", async () => {
  const calls: string[] = [];
  const context = deps({
    accounts: { async retrieveCurrent() { return { id: "acct_manhair_confirmed" }; } },
    prices: { async retrieve() { return { id: "price", unit_amount: 1, currency: "usd", recurring: null }; } },
    checkout: { sessions: { async create() { return { id: "cs", url: "https://checkout.stripe.test/c/cs" }; } } },
    billingPortal: {
      configurations: { async retrieve(id: string) { return { id }; } },
      sessions: { async create() { return { url: "https://billing.stripe.test/p/session" }; } },
    },
    subscriptions: { async update() { return {}; } },
  });
  await context.store.saveMember(member());
  const missing = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=appointment", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: "mem_1", startsAt: "2026-12-01", timeZone: "America/Los_Angeles", state: "scheduled" }),
  }), context);
  assert.equal(missing.status, 400);
  const saved = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=appointment", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({
      memberId: "mem_1",
      startsAt: "2026-12-01T18:00:00.000Z",
      timeZone: "America/Los_Angeles",
      state: "scheduled",
    }),
  }), context);
  assert.equal(saved.status, 200);
  const body = await saved.json();
  assert.equal(body.bookingUrl, null);
  assert.equal(body.messages.every((message: { send: boolean; status: string }) => message.send === false && message.status === "held"), true);
  assert.equal(JSON.stringify(body).includes("http"), false);
  assert.equal(calls.length, 0);
  const canceled = schedulingMessages({ startsAt: "2026-12-01T18:00:00.000Z", timeZone: "America/Los_Angeles", state: "canceled" });
  assert.equal(canceled.every((message) => message.reason === "appointment_not_recorded"), true);
});

test("unsuitability refunds collected setup and membership charges without waiting out the minimum", async () => {
  let refundCalls = 0;
  const cancels: Array<{ prorate: boolean; invoice_now: boolean }> = [];
  const context = deps({
    accounts: { async retrieveCurrent() { return { id: "acct_manhair_confirmed" }; } },
    prices: { async retrieve() { return { id: "price", unit_amount: 1, currency: "usd", recurring: null }; } },
    checkout: { sessions: { async create() { return { id: "cs", url: "https://checkout.stripe.test/c/cs" }; } } },
    billingPortal: {
      configurations: { async retrieve(id: string) { return { id }; } },
      sessions: { async create() { return { url: "https://billing.stripe.test/p/session" }; } },
    },
    subscriptions: {
      async update() { return {}; },
      async cancel(_id, params) {
        cancels.push(params);
        return { status: "canceled" };
      },
    },
    refunds: {
      async create() {
        refundCalls += 1;
        return { id: "re_1", status: "succeeded" };
      },
    },
  });
  await context.store.saveMember(member());
  await context.store.upsertInvoice({ id: "in_setup", memberId: "mem_1", kind: "setup", status: "paid", amountPaid: 49500, amountRefunded: 0 });
  await context.store.upsertInvoice({ id: "in_month", memberId: "mem_1", kind: "recurring", status: "paid", amountPaid: 55900, amountRefunded: 0 });
  await context.store.upsertInvoice({ id: "in_failed", memberId: "mem_1", kind: "recurring", status: "failed", amountPaid: 0, amountRefunded: 0 });
  const response = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=suitability-failure", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({
      memberId: "mem_1",
      confirmation: "refund-and-cancel",
      note: "Staff confirmed this membership is unsuitable.",
    }),
  }), context);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.minimumTermWaived, true);
  assert.equal(body.cancelStatus, "processor_canceled");
  assert.deepEqual(cancels[0], { prorate: false, invoice_now: false });
  assert.deepEqual(
    body.refunds.map((refund: { amountCents: number; status: string; receipt: boolean }) => [refund.amountCents, refund.status, refund.receipt]),
    [[49500, "requested", false], [55900, "requested", false]],
  );
  assert.equal(refundCalls, 0);
  assert.equal(body.completed, false);
  assert.match(body.message, /Nothing here is a completed refund receipt/);
  const plan = planSuitabilityFailure({
    invoices: [{ id: "in_setup", kind: "setup", status: "paid", amountPaid: 49500, amountRefunded: 0, chargeId: "ch_1" }],
    confirmation: "refund-and-cancel",
    note: "Staff confirmed this membership is unsuitable.",
  });
  assert.equal(plan.ok, true);
});
