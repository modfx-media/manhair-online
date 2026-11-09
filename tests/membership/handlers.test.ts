import assert from "node:assert/strict";
import { test } from "node:test";
import { handleAccountGet, handleAccountPost, handleCheckout, handleConsultation, handleHub, handleHubEnter, handleHubSignIn, handleReadiness, handleWebhook, type Deps, type StripeLike } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import type { MemberRecord } from "../../lib/membership/types";
import { billingTimeline } from "../../lib/membership/dates";
import { hashSecret } from "../../lib/membership/tokens";
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
    MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
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
      sessions: { async create(params) { creates.push({ portalSession: params }); return { url: "https://billing.stripe.com/p/session_test" }; } },
    },
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
  const context = deps({
    env: baseEnv({ MEMBERSHIP_FOUNDING_ENABLED: "true", MEMBERSHIP_FOUNDING_CAP: "1" }),
    now: () => new Date(),
  });
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

test("a verified 30-day subscription clears a previous trial timing false alarm", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
  assert.equal((await handleCheckout(checkoutRequest(checkoutBody()), context)).status, 200);
  const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
  await context.store.saveMember({ ...member, attention: "unexpected_trial", status: "needs_review", setupPaid: true });
  const start = Math.floor(NOW.getTime() / 1000) + 15 * 60;
  const response = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST", headers: { "stripe-signature": "test" },
    body: JSON.stringify({ id: "evt_confirmed_trial", type: "customer.subscription.created", created: start,
      data: { object: { id: "sub_1", customer: "cus_1", status: "trialing",
        metadata: { member_id: member.id }, trial_start: start, trial_end: start + 30 * 86400,
        items: { data: [{ id: "si_1" }] } } } }),
  }), context);
  assert.equal(response.status, 200);
  const saved = await context.store.findMemberById(member.id);
  assert.equal(saved?.attention, null);
  assert.equal(saved?.status, "trialing");
});

test("unconfirmed and mismatched Stripe accounts do not open checkout", async () => {
  const unconfirmed = deps({ env: baseEnv({ MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "false" }) });
  const unconfirmedResponse = await handleCheckout(checkoutRequest(checkoutBody()), unconfirmed);
  assert.equal(unconfirmedResponse.status, 503);
  assert.equal(unconfirmed.stripe.creates.length, 0);
  const mismatched = deps({ stripe: fakeStripe("acct_1DhNFjGiafo5ImyE") });
  const mismatchedResponse = await handleCheckout(checkoutRequest(checkoutBody()), mismatched);
  assert.equal(mismatchedResponse.status, 503);
  assert.equal(mismatched.stripe.creates.length, 0);
  const mismatch = deps({ stripe: fakeStripe("acct_manhair_confirmed", true) });
  const mismatchResponse = await handleCheckout(checkoutRequest(checkoutBody()), mismatch);
  assert.equal(mismatchResponse.status, 503);
  assert.equal(mismatch.stripe.creates.length, 0);
});

for (const [type, attention] of [["charge.dispute.created", "dispute"], ["radar.early_fraud_warning.created", "fraud"]] as const) {
  test(`${type} follows the charge customer and remains retryable after a lookup failure`, async () => {
    const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
    await handleCheckout(checkoutRequest(checkoutBody()), context);
    const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
    await context.store.saveMember({ ...member, stripeCustomerId: "cus_owner", setupPaid: true });
    const event = { id: `evt_${attention}`, type, created: 1, livemode: false,
      data: { object: { id: "risk_1", charge: "ch_1" } } };
    const request = () => new Request("https://www.manhaironline.com/api/membership/webhook/", {
      method: "POST", headers: { "stripe-signature": "test" }, body: JSON.stringify(event),
    });
    context.stripe.charges = { async retrieve() { throw new Error("temporary failure"); } };
    assert.equal((await handleWebhook(request(), context)).status, 503);
    assert.equal(await context.store.seenEvent(event.id), false);
    context.stripe.charges = { async retrieve(id) { assert.equal(id, "ch_1"); return { customer: "cus_owner" }; } };
    assert.equal((await handleWebhook(request(), context)).status, 200);
    assert.equal((await context.store.findMemberById(member.id))?.attention, attention);
    assert.equal(await context.store.seenEvent(event.id), true);
  });
}

test("a live event cannot change test membership data", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
  const response = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST", headers: { "stripe-signature": "test" },
    body: JSON.stringify({ id: "evt_wrong_mode", type: "invoice.paid", livemode: true, created: 1, data: { object: {} } }),
  }), context);
  assert.equal(response.status, 400);
  assert.equal(await context.store.seenEvent("evt_wrong_mode"), false);
});

test("a setup invoice arriving before checkout uses subscription metadata even after a newer status", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
  await handleCheckout(checkoutRequest(checkoutBody()), context);
  const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
  await context.store.saveMember({ ...member, status: "active", lastStatusEventCreated: 100 });
  const response = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST", headers: { "stripe-signature": "test" },
    body: JSON.stringify({ id: "evt_early_invoice", type: "invoice.paid", livemode: false, created: 99,
      data: { object: { id: "in_setup_first", customer: "cus_before_checkout", amount_paid: 49500,
        billing_reason: "subscription_create", metadata: {},
        parent: { subscription_details: { subscription: "sub_before_checkout", metadata: { member_id: member.id } } },
        lines: { data: [{ amount: 49500, pricing: { price_details: { price: "price_setup" } } }] } } } }),
  }), context);
  assert.equal(response.status, 200);
  const saved = await context.store.findMemberById(member.id);
  assert.equal(saved?.setupPaid, true);
  assert.equal(saved?.status, "active");
  const invoices = await context.store.listInvoices(member.id);
  assert.equal(invoices[0]?.id, "in_setup_first");
  assert.equal(invoices[0]?.amountPaid, 49500);
});

test("failed delayed checkout stays unpaid and cannot regress a paid member", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
  await handleCheckout(checkoutRequest(checkoutBody()), context);
  const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
  const send = (id: string) => handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST", headers: { "stripe-signature": "test" },
    body: JSON.stringify({ id, type: "checkout.session.async_payment_failed", livemode: false, created: 1,
      data: { object: { client_reference_id: member.id } } }),
  }), context);
  assert.equal((await send("evt_failed_delayed")).status, 200);
  assert.equal((await context.store.findMemberById(member.id))?.status, "checkout_failed");
  assert.equal((await context.store.findMemberById(member.id))?.setupPaid, false);
  await context.store.saveMember({ ...member, setupPaid: true, status: "active" });
  assert.equal((await send("evt_stale_delayed")).status, 200);
  assert.equal((await context.store.findMemberById(member.id))?.status, "active");
});

test("setup payment moves the deal to Active Clients once and can push HighLevel", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw) });
  assert.equal((await handleCheckout(checkoutRequest(checkoutBody()), context)).status, 200);
  const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
  const deal = (await context.store.listDeals()).find((item) => item.memberId === member.id)!;
  const calls: Array<{ url: string; method: string; body: string }> = [];
  context.env = baseEnv({ GHL_API_TOKEN: "token" });
  deal.ghlContactId = "contact_1";
  deal.ghlOpportunityId = "opp_1";
  await context.store.saveDeal(deal);
  context.fetchImpl = async (input, init) => {
    calls.push({ url: String(input), method: String(init?.method ?? "GET"), body: String(init?.body ?? "") });
    return Response.json({ opportunity: { locationId: "jv4grExvok7omWurc4PE", pipelineId: "arkMXixdGM81H9FjL2gc" } });
  };
  const send = (id: string, type: string, object: Record<string, unknown>) => handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "test" },
    body: JSON.stringify({ id, type, livemode: false, created: 20, data: { object } }),
  }), context);
  assert.equal((await send("evt_checkout_paid", "checkout.session.completed", {
    client_reference_id: member.id,
    customer: "cus_paid",
    amount_total: 49500,
    payment_status: "paid",
  })).status, 200);
  const paid = (await context.store.listDeals()).find((item) => item.memberId === member.id);
  assert.equal(paid?.stage, "Active Clients");
  assert.equal(paid?.syncStatus, "pushed");
  const stageNotes = (await context.store.listActivity(deal.id)).filter((item) => item.action === "stage_changed:Active Clients");
  assert.equal(stageNotes.length, 1);
  const tagPost = calls.find((call) => call.method === "POST" && call.url.endsWith("/tags"));
  assert.match(tagPost?.body ?? "", /mh-v1-setup-paid/);
  assert.match(tagPost?.body ?? "", /mh-v1-plan-signature/);
  const fieldPut = calls.find((call) => call.method === "PUT" && call.url.endsWith("/contacts/contact_1"));
  assert.match(fieldPut?.body ?? "", /contact\.mh_internal_customer_id/);
  assert.match(fieldPut?.body ?? "", /mh_membership_id/);
  assert.match(fieldPut?.body ?? "", /mh_sync_version/);
  assert.ok(calls.some((call) => call.method === "PUT" && call.url.includes("/opportunities/opp_1") && call.body.includes("58fb7eaa-4fc7-47f3-b00c-392e4cbd91e8")));
  assert.equal((await send("evt_setup_invoice", "invoice.paid", {
    id: "in_setup_deal",
    customer: "cus_paid",
    amount_paid: 49500,
    billing_reason: "subscription_create",
    metadata: { member_id: member.id },
    lines: { data: [{ amount: 49500, pricing: { price_details: { price: "price_setup" } } }] },
  })).status, 200);
  assert.equal((await context.store.listActivity(deal.id)).filter((item) => item.action === "stage_changed:Active Clients").length, 1);
});

test("email checkout works without SMS consent, and a checked box is stored", async () => {
  const context = deps();
  const declined = await handleCheckout(checkoutRequest({ ...checkoutBody(), smsConsent: true, phone: "" }), context);
  assert.equal(declined.status, 400);
  const emailOnly = await handleCheckout(checkoutRequest(checkoutBody()), context);
  assert.equal(emailOnly.status, 200);
  const member = (await context.store.listMembersByEmail("member@example.com"))[0]!;
  const skipped = await context.store.listConsents(member.id);
  assert.equal(skipped[0]?.smsConsent, false);
  assert.equal(skipped[0]?.smsConsentText, null);
  const opted = deps();
  const accepted = await handleCheckout(checkoutRequest({ ...checkoutBody("sms@example.com"), phone: "9045550199", smsConsent: true }), opted);
  assert.equal(accepted.status, 200);
  const smsMember = (await opted.store.listMembersByEmail("sms@example.com"))[0]!;
  const saved = await opted.store.listConsents(smsMember.id);
  assert.equal(saved[0]?.smsConsent, true);
  assert.match(saved[0]?.smsConsentText ?? "", /STOP/);
  assert.match(saved[0]?.smsConsentText ?? "", /HELP/);
});

test("a consultation alert stays held and is visible to the hub", async () => {
  const context = deps({ staffEmail: "owner@manhaironline.com" });
  const saved = await handleConsultation(new Request("https://www.manhaironline.com/api/membership/consultation/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Ari", lastName: "Cole", email: "ari@example.com", marketingConsent: false }),
  }), context);
  assert.equal(saved.status, 200);
  const hub = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/"), context);
  assert.equal(hub.status, 200);
  const body = await hub.json();
  const held = body.alerts.find((alert: { kind: string; status: string }) => alert.kind === "consultation_requested");
  assert.equal(held?.status, "held");
  assert.ok(Array.isArray(body.pauseRequests));
  assert.ok(Array.isArray(body.refundRequests));
});

test("subscription checkout does not set a statement descriptor suffix", async () => {
  const context = deps();
  assert.equal((await handleCheckout(checkoutRequest(checkoutBody()), context)).status, 200);
  const created = context.stripe.creates[0] as { params: Record<string, unknown> };
  assert.equal("payment_intent_data" in created.params, false);
});

test("staff hub links are single-use, allowlisted, and separate from member sessions", async () => {
  const context = deps({
    env: baseEnv({
      RESEND_API_KEY: "re_test",
      MEMBERSHIP_COORDINATOR_EMAILS: "griselda@manhaironline.com",
    }),
    fetchImpl: async (_input, init) => {
      sent.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response("ok", { status: 200 });
    },
  });
  const sent: Array<{ to?: string; reply_to?: string; text?: string }> = [];
  const stranger = await handleHubSignIn(new Request("https://www.manhaironline.com/api/membership/hub/sign-in/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ email: "stranger@example.com" }),
  }), context);
  assert.equal(stranger.status, 200);
  assert.equal(sent.length, 0);
  const coordinator = await handleHubSignIn(new Request("https://www.manhaironline.com/api/membership/hub/sign-in/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ email: "Griselda@manhaironline.com" }),
  }), context);
  assert.equal(coordinator.status, 200);
  assert.equal(sent[0]?.to, "griselda@manhaironline.com");
  assert.equal(sent[0]?.reply_to, "info@manhaironline.com");
  const token = decodeURIComponent((sent[0]?.text ?? "").split("token=")[1] ?? "");
  const enter = await handleHubEnter(new Request(`https://www.manhaironline.com/api/membership/hub/enter/?token=${encodeURIComponent(token)}`), context);
  assert.equal(enter.status, 302);
  assert.match(enter.headers.get("set-cookie") ?? "", /mh_staff_session=/);
  assert.equal(enter.headers.get("location"), "/hub/");
  const replay = await handleHubEnter(new Request(`https://www.manhaironline.com/api/membership/hub/enter/?token=${encodeURIComponent(token)}`), context);
  assert.equal(replay.status, 400);
});

test("a consented text is sent from the location default number only when SMS is enabled", async () => {
  const context = deps({ constructEvent: (raw) => JSON.parse(raw), env: baseEnv({ GHL_API_TOKEN: "token" }) });
  const calls: string[] = [];
  context.fetchImpl = async (input, init) => {
    calls.push(`${init?.method ?? "GET"} ${String(input)} ${String(init?.body ?? "")}`);
    return Response.json({ contact: { id: "contact_sms", locationId: "jv4grExvok7omWurc4PE" }, opportunity: { id: "opp_sms", locationId: "jv4grExvok7omWurc4PE", pipelineId: "arkMXixdGM81H9FjL2gc" } });
  };
  assert.equal((await handleCheckout(checkoutRequest({ ...checkoutBody("sms-flag@example.com"), phone: "9045550199", smsConsent: true }), context)).status, 200);
  const member = (await context.store.listMembersByEmail("sms-flag@example.com"))[0]!;
  const send = () => handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "test" },
    body: JSON.stringify({
      id: "evt_sms_setup",
      type: "checkout.session.completed",
      livemode: false,
      created: 30,
      data: { object: { client_reference_id: member.id, customer: "cus_sms", amount_total: 49500, payment_status: "paid" } },
    }),
  }), context);
  assert.equal((await send()).status, 200);
  assert.equal(calls.some((call) => call.includes("/conversations/messages")), false);
  context.env = baseEnv({ GHL_API_TOKEN: "token", MEMBERSHIP_SMS_SEND: "true" });
  assert.equal((await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "test" },
    body: JSON.stringify({
      id: "evt_sms_setup_on",
      type: "invoice.paid",
      livemode: false,
      created: 31,
      data: { object: { id: "in_sms", customer: "cus_sms", amount_paid: 49500, billing_reason: "subscription_create", metadata: { member_id: member.id }, lines: { data: [{ amount: 49500, pricing: { price_details: { price: "price_setup" } } }] } } },
    }),
  }), context)).status, 200);
  const smsCall = calls.find((call) => call.includes("/conversations/messages"));
  assert.ok(smsCall);
  assert.match(smsCall ?? "", /"type":"SMS"/);
  assert.match(smsCall ?? "", /"fromNumber":"\+19045268500"/);
  assert.doesNotMatch(smsCall ?? "", /"from":/);
  assert.match(smsCall ?? "", /STOP/);
});

test("checkout does not require a consultation", async () => {
  const context = deps();
  assert.equal((await context.store.listDeals()).length, 0);
  const response = await handleCheckout(checkoutRequest(checkoutBody()), context);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.error, undefined);
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
    env: baseEnv({ GHL_API_TOKEN: "token" }),
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
  await context.store.createSession({ id: "sess_a", memberId: "mem_1", tokenHash: hashSecret("cookie-a"), expiresAt: "2026-12-01T00:00:00.000Z", active: true, returnUsed: true });
  const response = await handleAccountGet(new Request("https://www.manhaironline.com/account/", {
    headers: { cookie: "mh_member_session=cookie-a", host: "www.manhaironline.com" },
  }), context);
  const body = await response.json();
  assert.equal(body.member.id, "mem_1");
  assert.equal(body.invoices.length, 1);
  assert.equal(body.invoices[0].id, "in_a");
});

test("cancellation and pause do not claim a processor change when blocked", async () => {
  const context = deps({ env: baseEnv({ STRIPE_SECRET_KEY: "" }) });
  await context.store.saveMember(await seedMember(context.store));
  await context.store.createSession({ id: "sess_a", memberId: "mem_1", tokenHash: hashSecret("cookie-a"), expiresAt: "2026-12-01T00:00:00.000Z", active: true, returnUsed: true });
  const request = () => new Request("https://www.manhaironline.com/api/membership/account/?action=cancel", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=cookie-a", "content-type": "application/json" },
    body: "{}",
  });
  const cancel = await handleAccountPost(request(), { ...context, stripe: null });
  const cancelBody = await cancel.json();
  assert.equal(cancel.status, 200);
  assert.equal(cancelBody.applied, false);
  assert.equal(cancelBody.billingChanged, false);
  const pause = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=pause", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=cookie-a", "content-type": "application/json" },
    body: JSON.stringify({ days: 10 }),
  }), context);
  const pauseBody = await pause.json();
  assert.equal(pauseBody.applied, false);
  assert.equal(pauseBody.billingChanged, false);
  assert.match(pauseBody.message, /not paused/);
  assert.equal(context.stripe.updates.length, 0);
  const unchanged = await context.store.findMemberById("mem_1");
  assert.equal(unchanged?.status, "trialing");
  assert.equal(unchanged?.pauseCollection, false);
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

test("email alone does not grant member account ownership", async () => {
  const context = deps();
  await context.store.saveMember(await seedMember(context.store, { id: "mem_paid", firstName: "Owner", status: "active" }));
  const response = await handleCheckout(checkoutRequest(checkoutBody()), context);
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.id, undefined);
  assert.equal(body.memberId, undefined);
  assert.equal(context.stripe.creates.length, 0);
  const saved = await context.store.findMemberById("mem_paid");
  assert.equal(saved?.firstName, "Owner");
  assert.equal(saved?.status, "active");
  const account = await handleAccountGet(new Request("https://www.manhaironline.com/account/?email=member@example.com", {
    headers: { host: "www.manhaironline.com" },
  }), context);
  assert.equal(account.status, 401);
  const forged = await handleCheckout(checkoutRequest(checkoutBody(), "https://evil.example"), context);
  assert.equal(forged.status, 403);
});

test("older webhook does not roll back a newer subscription status", async () => {
  const context = deps({
    constructEvent: (payload) => JSON.parse(payload),
  });
  await context.store.saveMember(await seedMember(context.store, { status: "active", lastStatusEventCreated: 500 }));
  const response = await handleWebhook(new Request("https://www.manhaironline.com/api/membership/webhook/", {
    method: "POST",
    headers: { "stripe-signature": "t=1" },
    body: JSON.stringify({
      id: "evt_old_sub",
      type: "customer.subscription.updated",
      created: 100,
      data: { object: { id: "sub_1", customer: "cus_1", status: "canceled", metadata: { member_id: "mem_1" } } },
    }),
  }), context);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.stale, true);
  const saved = await context.store.findMemberById("mem_1");
  assert.equal(saved?.status, "active");
});

test("self-serve cancellation is a request and a local lead can be removed without CRM", async () => {
  const context = deps({ staffEmail: "owner@manhaironline.com" });
  await context.store.saveMember(await seedMember(context.store));
  await context.store.createSession({ id: "sess_a", memberId: "mem_1", tokenHash: hashSecret("cookie-a"), expiresAt: "2026-12-01T00:00:00.000Z", active: true, returnUsed: true });
  const cancel = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=cancel", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=cookie-a", "content-type": "application/json" },
    body: "{}",
  }), context);
  assert.equal(cancel.status, 200);
  const cancelBody = await cancel.json();
  assert.equal(cancelBody.applied, false);
  assert.equal(cancelBody.billingChanged, false);
  assert.equal(context.stripe.updates.length, 0);
  const saved = await context.store.findMemberById("mem_1");
  assert.equal(saved?.status, "trialing");
  const created = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=deal", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ name: "New Lead", email: "lead@example.com", stage: "New Leads" }),
  }), context);
  const deal = (await created.json()).deal;
  const removed = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=delete-deal", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ id: deal.id }),
  }), context);
  const removedBody = await removed.json();
  assert.equal(removedBody.crmChanged, false);
  assert.equal((await context.store.listDeals()).some((item) => item.id === deal.id), false);
});

test("portal session uses the configured id and does not create a configuration", async () => {
  const store = createMemoryStore();
  await store.saveMember(await seedMember(store));
  await store.createSession({
    id: "sess_portal",
    memberId: "mem_1",
    tokenHash: hashSecret("cookie-portal"),
    expiresAt: "2026-12-01T00:00:00.000Z",
    active: true,
    returnUsed: true,
  });
  const headers = {
    origin: "https://www.manhaironline.com",
    host: "www.manhaironline.com",
    cookie: "mh_member_session=cookie-portal",
    "content-type": "application/json",
  };
  const request = () => new Request("https://www.manhaironline.com/api/membership/account/?action=portal", {
    method: "POST",
    headers,
    body: JSON.stringify({ customer: "cus_attacker" }),
  });
  let creates = 0;
  let retrieves = 0;
  let sessionConfiguration = "";
  let sessionCustomer = "";
  const stripe = fakeStripe();
  stripe.billingPortal = {
    configurations: {
      async retrieve(id: string) {
        retrieves += 1;
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
    sessions: {
      async create(params) {
        sessionConfiguration = params.configuration;
        sessionCustomer = params.customer;
        return { url: "https://billing.stripe.com/p/session_test" };
      },
    },
  };
  (stripe.billingPortal.configurations as { create?: () => void }).create = () => {
    creates += 1;
  };
  const opened = await handleAccountPost(request(), deps({ store, stripe, env: baseEnv({ STRIPE_PORTAL_CONFIGURATION_ID: "bpc_approved" }) }));
  assert.equal(opened.status, 200);
  assert.equal(creates, 0);
  assert.equal(retrieves, 1);
  assert.equal(sessionConfiguration, "bpc_approved");
  assert.equal(sessionCustomer, "cus_1");

  const missing = await handleAccountPost(request(), deps({
    store,
    stripe,
    env: baseEnv({ STRIPE_PORTAL_CONFIGURATION_ID: "" }),
  }));
  assert.equal(missing.status, 503);
  assert.equal(creates, 0);

  const malformed = await handleAccountPost(request(), deps({
    store,
    stripe,
    env: baseEnv({ STRIPE_PORTAL_CONFIGURATION_ID: "price_not_a_portal" }),
  }));
  assert.equal(malformed.status, 503);
  assert.equal(retrieves, 1);

  const mismatched = await handleAccountPost(request(), deps({
    store,
    stripe: {
      ...stripe,
      billingPortal: {
        ...stripe.billingPortal,
        configurations: {
          async retrieve(id: string) {
            retrieves += 1;
            return { id, features: { invoice_history: { enabled: true }, payment_method_update: { enabled: true }, subscription_cancel: { enabled: true }, subscription_update: { enabled: false }, customer_update: { enabled: false } } };
          },
        },
      },
    },
    env: baseEnv({ STRIPE_PORTAL_CONFIGURATION_ID: "bpc_approved" }),
  }));
  assert.equal(mismatched.status, 503);
  assert.equal(sessionConfiguration, "bpc_approved");

  const otherId = await handleAccountPost(request(), deps({
    store,
    stripe: {
      ...stripe,
      billingPortal: {
        ...stripe.billingPortal,
        configurations: {
          async retrieve() {
            retrieves += 1;
            return {
              id: "bpc_other",
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
      },
    },
    env: baseEnv({ STRIPE_PORTAL_CONFIGURATION_ID: "bpc_approved" }),
  }));
  assert.equal(otherId.status, 503);
  assert.equal(creates, 0);
});

test("a paid member is not moved from Active Clients into a prospect stage", async () => {
  const context = deps({ staffEmail: "owner@manhaironline.com" });
  await context.store.saveMember(await seedMember(context.store, { setupPaid: true, status: "active" }));
  const response = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=deal", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ name: "Alex Rivera", email: "member@example.com", stage: "Phone Consult", memberId: "mem_1" }),
  }), context);
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.equal(body.error, "stage_regression");
});

test("readiness reports the real email and SMS flags", async () => {
  const off = await handleReadiness(deps());
  const offBody = await off.json();
  assert.deepEqual(offBody.messaging, {
    confirmationEmail: "off",
    lifecycleEmail: "off",
    staffAlerts: "off",
    sms: "off",
  });
  const on = await handleReadiness(deps({
    env: baseEnv({
      RESEND_API_KEY: "re_test",
      RESEND_FROM: "ManHair <info@manhaironline.com>",
      MEMBERSHIP_CUSTOMER_ALERTS_SEND: "true",
      MEMBERSHIP_LIFECYCLE_SEND: "true",
      MEMBERSHIP_OWNER_ALERTS_SEND: "true",
      MEMBERSHIP_STAFF_ALERT_EMAILS: "owner@manhaironline.com",
      MEMBERSHIP_SMS_SEND: "true",
    }),
  }));
  const onBody = await on.json();
  assert.deepEqual(onBody.messaging, {
    confirmationEmail: "enabled",
    lifecycleEmail: "enabled",
    staffAlerts: "enabled",
    sms: "enabled",
  });
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
