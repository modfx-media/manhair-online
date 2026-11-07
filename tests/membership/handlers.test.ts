import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAccountGet, handleAccountPost, handleCheckout, handleHub, handleWebhook, type Deps, type StripeLike } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import type { MemberRecord } from "../../lib/membership/types";
import { billingTimeline } from "../../lib/membership/dates";
import type { AppEnv } from "../../lib/membership/readiness";

const NOW = new Date("2026-11-07T19:00:00.000Z");

function baseEnv(extra: AppEnv = {}): AppEnv {
  return {
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    STRIPE_ACCOUNT_ID: "acct_manhair_confirmed",
    STRIPE_PRICE_ESSENTIAL: "price_essential",
    STRIPE_PRICE_SIGNATURE: "price_signature",
    STRIPE_PRICE_ELITE: "price_elite",
    STRIPE_PRICE_SETUP: "price_setup",
    STRIPE_PRICE_SETUP_FOUNDING: "price_founding",
    STRIPE_PORTAL_CONFIGURATION_ID: "bpc_123",
    MEMBERSHIP_SESSION_SECRET: "test-secret",
    MEMBERSHIP_OWNER_EMAILS: "owner@manhaironline.com",
    NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    ...extra,
  };
}

function fakeStripe(accountId = "acct_manhair_confirmed", mismatch = false): StripeLike & { creates: unknown[]; updates: Array<Record<string, unknown>> } {
  const creates: unknown[] = [];
  const updates: Array<Record<string, unknown>> = [];
  return {
    creates,
    updates,
    accounts: { async retrieveCurrent() { return { id: accountId }; } },
    prices: {
      async retrieve(id: string) {
        const monthly = id === "price_essential" ? 44900 : id === "price_elite" ? 66900 : id === "price_signature" ? 55900 : null;
        if (monthly) {
          return { id, unit_amount: mismatch ? 1 : monthly, currency: "usd", recurring: { interval: "month" } };
        }
        return { id, unit_amount: id === "price_founding" ? 29500 : 49500, currency: "usd", recurring: null };
      },
    },
    checkout: {
      sessions: {
        async create(params, options) {
          creates.push({ params, options });
          return { id: "cs_test", url: "https://checkout.stripe.test/c/cs_test" };
        },
      },
    },
    billingPortal: { sessions: { async create() { return { url: "https://billing.stripe.com/p/session_test" }; } } },
    subscriptions: {
      async update(id, params) {
        updates.push({ id, params });
        return { id };
      },
    },
  };
}

function deps(partial: Partial<Deps> = {}): Deps & { stripe: ReturnType<typeof fakeStripe>; store: ReturnType<typeof createMemoryStore> } {
  const stripe = (partial.stripe as ReturnType<typeof fakeStripe> | null) ?? fakeStripe();
  const store = (partial.store as ReturnType<typeof createMemoryStore> | undefined) ?? createMemoryStore();
  return {
    env: partial.env ?? baseEnv(),
    store,
    stripe,
    now: partial.now ?? (() => NOW),
    fetchImpl: partial.fetchImpl,
    constructEvent: partial.constructEvent,
    staffEmail: partial.staffEmail,
  };
}

function checkoutBody(email = "member@example.com") {
  return {
    tier: "signature",
    firstName: "Alex",
    lastName: "Rivera",
    email,
    phone: "9045550100",
    termsAccepted: true,
    autorenewAccepted: true,
    founding: false,
  };
}

function checkoutRequest(body: unknown, origin = "https://www.manhaironline.com") {
  return new Request("https://www.manhaironline.com/api/membership/checkout/", {
    method: "POST",
    headers: { origin, host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("duplicate checkout creates one processor session", async () => {
  const context = deps({ env: baseEnv({ MEMBERSHIP_FOUNDING_ENABLED: "true", MEMBERSHIP_FOUNDING_CAP: "1" }) });
  const first = await handleCheckout(checkoutRequest({ ...checkoutBody(), founding: true }), context);
  const second = await handleCheckout(checkoutRequest({ ...checkoutBody(), founding: true }), context);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(context.stripe.creates.length, 1);
  const body = await second.json();
  assert.equal(body.reused, true);
  const other = await handleCheckout(checkoutRequest({ ...checkoutBody("other@example.com"), founding: true }), context);
  assert.equal(other.status, 409);
});

test("denylisted Stripe account and price mismatch do not open checkout", async () => {
  const denied = deps({ stripe: fakeStripe("acct_1DhNFjGiafo5ImyE") });
  const deniedResponse = await handleCheckout(checkoutRequest(checkoutBody()), denied);
  assert.equal(deniedResponse.status, 503);
  assert.equal(denied.stripe.creates.length, 0);
  const mismatch = deps({ stripe: fakeStripe("acct_manhair_confirmed", true) });
  const mismatchResponse = await handleCheckout(checkoutRequest(checkoutBody()), mismatch);
  assert.equal(mismatchResponse.status, 503);
  assert.equal(mismatch.stripe.creates.length, 0);
});

test("missing consent is rejected and HighLevel is not called without a location", async () => {
  let called = false;
  const context = deps({
    fetchImpl: async () => {
      called = true;
      return new Response("{}", { status: 200 });
    },
  });
  const missing = await handleCheckout(checkoutRequest({ ...checkoutBody(), autorenewAccepted: false }), context);
  assert.equal(missing.status, 400);
  const ok = await handleCheckout(checkoutRequest(checkoutBody()), context);
  assert.equal(ok.status, 200);
  assert.equal(called, false);
  const deals = await context.store.listDeals();
  assert.equal(deals[0]?.syncStatus, "not_connected");
  assert.equal(deals[0]?.ghlContactId, null);
});

test("HighLevel location mismatch does not keep the foreign contact", async () => {
  const context = deps({
    env: baseEnv({ GHL_API_TOKEN: "token", GHL_LOCATION_ID: "loc_manhair" }),
    fetchImpl: async () => Response.json({ contacts: [{ id: "c_1", locationId: "loc_other", email: "member@example.com" }] }),
  });
  const response = await handleCheckout(checkoutRequest(checkoutBody()), context);
  assert.equal(response.status, 200);
  const deals = await context.store.listDeals();
  assert.equal(deals[0]?.syncStatus, "location_mismatch");
  assert.equal(deals[0]?.ghlContactId, null);
});

test("webhook signature failure and duplicate events", async () => {
  const context = deps({
    constructEvent: (payload, header) => {
      if (header === "bad") throw new Error("bad");
      return JSON.parse(payload);
    },
  });
  const bad = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "bad" },
    body: "{}",
  }), context);
  assert.equal(bad.status, 400);
  const payload = JSON.stringify({
    id: "evt_setup",
    type: "invoice.paid",
    created: 10,
    data: {
      object: {
        id: "in_1",
        customer: "cus_1",
        amount_paid: 49500,
        billing_reason: "subscription_create",
        lines: { data: [{ amount: 49500, pricing: { price_details: { price: "price_setup" } } }] },
      },
    },
  });
  await context.store.saveMember(await seedMember(context.store));
  const first = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "t=1" },
    body: payload,
  }), context);
  const second = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "t=1" },
    body: payload,
  }), context);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  const invoices = await context.store.listInvoices("mem_1");
  assert.equal(invoices.length, 1);
  assert.equal(invoices[0]?.kind, "setup");
});

test("member session cannot see another member invoice", async () => {
  const context = deps();
  await context.store.saveMember(await seedMember(context.store, { id: "mem_1", email: "a@example.com" }));
  await context.store.saveMember(await seedMember(context.store, { id: "mem_2", email: "b@example.com", stripeCustomerId: "cus_2" }));
  await context.store.upsertInvoice({ id: "in_a", memberId: "mem_1", kind: "setup", status: "paid", amountPaid: 49500, amountRefunded: 0 });
  await context.store.upsertInvoice({ id: "in_b", memberId: "mem_2", kind: "setup", status: "paid", amountPaid: 49500, amountRefunded: 0 });
  await context.store.createSession({ id: "sess_a", memberId: "mem_1", expiresAt: "2026-12-01T00:00:00.000Z", active: true });
  const response = await handleAccountGet(new Request("https://www.manhaironline.com/account/", {
    headers: { cookie: "mh_member_session=sess_a", host: "www.manhaironline.com" },
  }), context);
  const body = await response.json();
  assert.equal(body.member.id, "mem_1");
  assert.equal(body.invoices.length, 1);
  assert.equal(body.invoices[0].id, "in_a");
});

test("cancellation and pause do not claim a processor change when blocked", async () => {
  const context = deps({ env: baseEnv({ STRIPE_SECRET_KEY: "" }) });
  await context.store.saveMember(await seedMember(context.store));
  await context.store.createSession({ id: "sess_a", memberId: "mem_1", expiresAt: "2026-12-01T00:00:00.000Z", active: true });
  const request = () => new Request("https://www.manhaironline.com/api/membership/account/?action=cancel", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=sess_a", "content-type": "application/json" },
    body: "{}",
  });
  const cancel = await handleAccountPost(request(), { ...context, stripe: null });
  assert.equal(cancel.status, 503);
  const pause = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=pause", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=sess_a", "content-type": "application/json" },
    body: JSON.stringify({ days: 10 }),
  }), context);
  const pauseBody = await pause.json();
  assert.equal(pauseBody.applied, false);
  assert.equal(context.stripe.updates.length, 0);
});

test("hub is denied without an allowlisted staff email and usage cannot go negative", async () => {
  const context = deps();
  const denied = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/"), context);
  assert.equal(denied.status, 401);
  await context.store.saveMember(await seedMember(context.store, { systemsUsed: 6 }));
  const staff = { ...context, staffEmail: "owner@manhaironline.com" };
  const usage = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: "mem_1", kind: "system", quantity: 1, idempotencyKey: "use_1" }),
  }), staff);
  assert.equal(usage.status, 409);
  await context.store.saveMember(await seedMember(context.store, { systemsUsed: 0 }));
  const once = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: "mem_1", kind: "system", quantity: 1, idempotencyKey: "use_2" }),
  }), staff);
  const again = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=usage", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ memberId: "mem_1", kind: "system", quantity: 1, idempotencyKey: "use_2" }),
  }), staff);
  assert.equal((await once.json()).result, "applied");
  assert.equal((await again.json()).result, "replay");
  const saved = await context.store.findMemberById("mem_1");
  assert.equal(saved?.systemsUsed, 1);
});

test("messaging send is refused", async () => {
  const context = deps({ staffEmail: "owner@manhaironline.com" });
  const response = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=send", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ dealId: "deal_1" }),
  }), context);
  assert.equal(response.status, 403);
});

async function seedMember(store: ReturnType<typeof createMemoryStore>, partial: Partial<MemberRecord> = {}) {
  const timeline = billingTimeline(NOW);
  return {
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature" as const,
    status: "trialing" as const,
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: false,
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
    ...partial,
  };
}
