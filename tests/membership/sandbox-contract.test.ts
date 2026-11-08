import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAccountPost, handleCheckout, handleHub, handleWebhook, type Deps, type StripeLike } from "../../lib/membership/handlers";
import { reviewedLifecycle } from "../../lib/membership/lifecycle-review";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { hashSecret } from "../../lib/membership/tokens";
import type { AppEnv } from "../../lib/membership/readiness";

const NOW = new Date("2026-11-08T20:00:00.000Z");
const PRICES = {
  essential: "price_1UZawDGiafo5ImyEcLddKviO",
  signature: "price_1UZawEGiafo5ImyEqH65Bs3J",
  elite: "price_1UZawFGiafo5ImyEP8ziBEzm",
  setup: "price_1UZawGGiafo5ImyEpXGb0AkL",
};

function env(): AppEnv {
  return {
    STRIPE_SECRET_KEY: "rk_test_contract",
    STRIPE_WEBHOOK_SECRET: "whsec_contract",
    STRIPE_ACCOUNT_ID: "acct_1DhNFjGiafo5ImyE",
    STRIPE_PRICE_ESSENTIAL: PRICES.essential,
    STRIPE_PRICE_SIGNATURE: PRICES.signature,
    STRIPE_PRICE_ELITE: PRICES.elite,
    STRIPE_PRICE_SETUP: PRICES.setup,
    STRIPE_PORTAL_CONFIGURATION_ID: "bpc_1UZZlpGiafo5ImyEJ3a0ctpv",
    MEMBERSHIP_SESSION_SECRET: "contract-secret",
    MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
    MEMBERSHIP_OWNER_EMAILS: "owner@manhaironline.com",
    NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
  };
}

function cents(id: string): { cents: number; interval: "month" | null } | null {
  if (id === PRICES.essential) return { cents: 44900, interval: "month" };
  if (id === PRICES.signature) return { cents: 55900, interval: "month" };
  if (id === PRICES.elite) return { cents: 66900, interval: "month" };
  if (id === PRICES.setup) return { cents: 49500, interval: null };
  return null;
}

test("sandbox contract covers join, day-30 billing, dedup, grace, staff orders, unsuitability, and manual visits", async () => {
  const creates: Array<Record<string, unknown>> = [];
  let fetches = 0;
  const stripe: StripeLike = {
    accounts: { async retrieveCurrent() { return { id: "acct_1DhNFjGiafo5ImyE" }; } },
    prices: {
      async retrieve(id: string) {
        const price = cents(id);
        assert.ok(price);
        return { id, unit_amount: price.cents, currency: "usd", recurring: price.interval ? { interval: price.interval } : null };
      },
    },
    checkout: {
      sessions: {
        async create(params) {
          creates.push(params);
          return { id: "cs_test_contract", url: "https://checkout.stripe.test/c/cs_test_contract" };
        },
      },
    },
    billingPortal: {
      configurations: {
        async retrieve(id: string) {
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
      sessions: { async create() { return { url: "https://billing.stripe.test/p/session_contract" }; } },
    },
    subscriptions: { async update() { return { id: "sub_test" }; } },
  };
  const store = createMemoryStore();
  const deps = (now = NOW): Deps => ({
    env: env(),
    store,
    stripe,
    now: () => now,
    fetchImpl: async () => {
      fetches += 1;
      return new Response("no", { status: 500 });
    },
    constructEvent: (payload, header) => {
      if (header === "bad") throw new Error("bad");
      return JSON.parse(payload);
    },
    staffEmail: "owner@manhaironline.com",
  });

  const join = await handleCheckout(new Request("https://www.manhaironline.com/api/membership/checkout/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({
      tier: "signature",
      firstName: "Alex",
      lastName: "Rivera",
      email: "member@example.com",
      termsAccepted: true,
      autorenewAccepted: true,
      founding: false,
    }),
  }), deps());
  assert.equal(join.status, 200);
  const session = creates[0] as {
    mode: string;
    line_items: Array<{ price: string }>;
    subscription_data: { trial_period_days: number };
  };
  assert.equal(session.mode, "subscription");
  assert.equal(session.subscription_data.trial_period_days, 30);
  assert.deepEqual(session.line_items.map((item) => item.price), [PRICES.signature, PRICES.setup]);
  const member = (await store.listMembersByEmail("member@example.com"))[0];
  assert.ok(member);

  const post = (event: Record<string, unknown>, now = NOW) => handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "ok" },
    body: JSON.stringify(event),
  }), deps(now));
  const invoice = (id: string, type: string, created: number, invoiceId: string, amount: number, reason: string) => ({
    id,
    type,
    created,
    data: {
      object: {
        id: invoiceId,
        customer: "cus_contract",
        subscription: "sub_contract",
        amount_paid: amount,
        billing_reason: reason,
        metadata: { member_id: member.id },
        lines: { data: [{ amount, price: reason === "subscription_create" ? PRICES.setup : PRICES.signature }] },
      },
    },
  });

  const completed = await post({
    id: "evt_completed",
    type: "checkout.session.completed",
    created: 100,
    data: {
      object: {
        client_reference_id: member.id,
        customer: "cus_contract",
        subscription: "sub_contract",
        amount_total: 49500,
        payment_status: "paid",
        metadata: { member_id: member.id },
      },
    },
  });
  assert.equal(completed.status, 200);
  assert.equal((await store.findMemberById(member.id))?.setupPaid, true);
  const replay = await post({
    id: "evt_completed",
    type: "checkout.session.completed",
    created: 100,
    data: { object: { client_reference_id: member.id, amount_total: 49500, payment_status: "paid" } },
  });
  assert.equal((await replay.json()).duplicate, true);

  assert.equal((await post({
    id: "evt_sub",
    type: "customer.subscription.created",
    created: 110,
    data: {
      object: {
        id: "sub_contract",
        customer: "cus_contract",
        status: "trialing",
        trial_end: Math.floor(NOW.getTime() / 1000) + 30 * 24 * 60 * 60,
        metadata: { member_id: member.id },
        items: { data: [{ id: "si_contract" }] },
      },
    },
  })).status, 200);
  assert.equal((await store.findMemberById(member.id))?.status, "trialing");

  assert.equal((await post(invoice("evt_setup", "invoice.paid", 120, "in_setup", 49500, "subscription_create"))).status, 200);
  assert.equal((await post(invoice("evt_month_1", "invoice.paid", 200, "in_month_1", 55900, "subscription_cycle"))).status, 200);
  assert.equal((await post(invoice("evt_month_1", "invoice.paid", 200, "in_month_1", 55900, "subscription_cycle"))).status, 200);
  assert.equal((await post(invoice("evt_month_2", "invoice.paid", 300, "in_month_2", 55900, "subscription_cycle"))).status, 200);
  const invoices = await store.listInvoices(member.id);
  assert.equal(invoices.filter((row) => row.id === "in_month_1").length, 1);
  assert.equal(invoices.find((row) => row.id === "in_setup")?.amountPaid, 49500);
  assert.equal(invoices.find((row) => row.id === "in_month_2")?.amountPaid, 55900);

  const usage = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: member.id, kind: "system", quantity: 1, idempotencyKey: "order_1" }),
  }), deps());
  assert.equal(usage.status, 200);
  assert.equal((await store.findMemberById(member.id))?.systemsUsed, 1);

  assert.equal((await post(invoice("evt_fail_a", "invoice.payment_failed", 400, "in_fail_a", 0, "subscription_cycle"))).status, 200);
  const grace = (await store.findMemberById(member.id))?.paymentGraceStartedAt;
  assert.equal(grace, new Date(400 * 1000).toISOString());
  assert.equal((await post(invoice("evt_fail_a_retry", "invoice.payment_failed", 460, "in_fail_a", 0, "subscription_cycle"))).status, 200);
  assert.equal((await post(invoice("evt_fail_b", "invoice.payment_failed", 500, "in_fail_b", 0, "subscription_cycle"))).status, 200);
  assert.equal((await post(invoice("evt_pay_a", "invoice.paid", 600, "in_fail_a", 55900, "subscription_cycle"))).status, 200);
  assert.equal((await store.findMemberById(member.id))?.paymentGraceStartedAt, grace);
  assert.notEqual((await store.findMemberById(member.id))?.status, "canceled");

  const held = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: member.id, kind: "maintenance", quantity: 1, idempotencyKey: "visit_held" }),
  }), deps(new Date(400 * 1000 + 15 * 24 * 60 * 60 * 1000)));
  assert.equal(held.status, 409);
  assert.equal((await held.json()).error, "payment_hold");
  assert.equal((await store.findMemberById(member.id))?.systemsUsed, 1);

  const unfit = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=suitability-failure", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: member.id, confirmation: "refund-and-cancel", note: "Staff confirmed this membership is unsuitable." }),
  }), deps());
  const unfitBody = await unfit.json();
  assert.equal(unfit.status, 200);
  assert.equal(unfitBody.minimumTermWaived, true);
  assert.equal(unfitBody.completed, false);
  assert.ok(unfitBody.refunds.some((refund: { amountCents: number; receipt: boolean }) => refund.amountCents === 49500 && refund.receipt === false));

  const visit = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=appointment", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: member.id, startsAt: "2026-12-15T18:00:00.000Z", timeZone: "America/Los_Angeles", state: "scheduled" }),
  }), deps());
  const visitBody = await visit.json();
  assert.equal(visit.status, 200);
  assert.equal(visitBody.bookingUrl, null);
  assert.equal(visitBody.messages.every((message: { send: boolean }) => message.send === false), true);

  await store.createSession({
    id: "sess_contract",
    memberId: member.id,
    tokenHash: hashSecret("cookie-contract"),
    expiresAt: "2027-01-01T00:00:00.000Z",
    active: true,
    returnUsed: true,
  });
  const pause = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=pause", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=cookie-contract", "content-type": "application/json" },
    body: JSON.stringify({ days: 10 }),
  }), deps());
  const pauseBody = await pause.json();
  assert.equal(pauseBody.applied, false);
  assert.equal(pauseBody.billingChanged, false);

  const drafts = reviewedLifecycle();
  assert.equal(drafts.ok, true);
  if (drafts.ok) {
    assert.equal(drafts.emails.length, 19);
    assert.equal(drafts.emails.every((email) => email.enabled === false && email.sendable === false), true);
  }
  assert.equal(fetches, 0);
});
