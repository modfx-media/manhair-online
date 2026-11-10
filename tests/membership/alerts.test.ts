import assert from "node:assert/strict";
import { test } from "node:test";
import { alertAfterFailure, alertsForPayment, ownerAlertsReady } from "../../lib/membership/alerts";
import { staffAlertMessage } from "../../lib/membership/email-copy";
import { drainAlerts, type Deps } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { newId } from "../../lib/membership/tokens";

const now = new Date("2026-11-07T20:00:00.000Z");

test("payment alerts are idempotent, held until sender and recipient exist, and retry with a cap", async () => {
  const env = { RESEND_API_KEY: "", RESEND_FROM: "", MEMBERSHIP_ALERT_TO: "" };
  assert.equal(ownerAlertsReady(env), false);
  const drafts = alertsForPayment({
    eventId: "evt_1",
    previousStatus: "trialing",
    invoice: { kind: "setup", status: "paid", amountPaid: 49500 },
    webhookFailed: false,
    memberId: "mem_1",
    now,
    env,
  });
  assert.deepEqual(
    drafts.map((draft) => draft.kind + ":" + draft.audience + ":" + draft.status),
    ["setup_paid:owner:held"],
  );
  const store = createMemoryStore();
  for (const draft of drafts) {
    assert.equal(
      await store.enqueueAlert({ ...draft, id: newId(), attempts: 0, lastError: null, createdAt: now.toISOString() }),
      "created",
    );
  }
  assert.equal(
    await store.enqueueAlert({ ...drafts[0]!, id: newId(), attempts: 0, lastError: null, createdAt: now.toISOString() }),
    "duplicate",
  );
  let calls = 0;
  const deps = {
    env,
    store,
    stripe: null,
    now: () => now,
    fetchImpl: async () => {
      calls += 1;
      return new Response("no", { status: 500 });
    },
  } as Deps;
  const drained = await drainAlerts(deps);
  assert.equal(drained.delivered, 0);
  assert.equal(calls, 0);
  const retry = alertAfterFailure(6, now);
  assert.equal(retry.status, "failed");
  const again = alertAfterFailure(1, now);
  assert.equal(again.status, "pending");
  assert.ok(again.nextAttemptAt);
});

test("a setup confirmation is queued when customer mail is enabled, and a fake transport does not call the provider", async () => {
  const env = {
    RESEND_API_KEY: "re_test",
    RESEND_FROM: "ManHair <studio@manhaironline.com>",
    MEMBERSHIP_ALERT_TO: "owner@example.com",
    MEMBERSHIP_OWNER_ALERTS_SEND: "true",
    MEMBERSHIP_CUSTOMER_ALERTS_SEND: "true",
    MEMBERSHIP_MESSAGE_TRANSPORT: "fake",
  };
  const drafts = alertsForPayment({
    eventId: "evt_fake",
    previousStatus: "trialing",
    invoice: { kind: "setup", status: "paid", amountPaid: 49500 },
    webhookFailed: false,
    memberId: "mem_1",
    now,
    env,
    chargeDateReady: true,
  });
  assert.deepEqual(
    drafts.map((draft) => draft.audience + ":" + draft.status),
    ["owner:pending", "customer:pending"],
  );
  const store = createMemoryStore();
  await store.saveMember({
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "trialing",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionItemId: null,
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    chargeAtSource: "stripe",
    recurringStartAt: "2026-12-09T04:44:00.000Z",
    minimumTermEndsAt: "2027-02-08T04:44:00.000Z",
    rateLockEndsAt: "2028-11-08T04:44:00.000Z",
    entitlementYearEndsAt: "2027-11-08T04:44:00.000Z",
    systemsUsed: 0,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: now.toISOString(),
  });
  for (const draft of drafts) {
    await store.enqueueAlert({ ...draft, id: newId(), attempts: 0, lastError: null, createdAt: now.toISOString() });
  }
  let calls = 0;
  const drained = await drainAlerts({
    env,
    store,
    stripe: null,
    now: () => now,
    fetchImpl: async () => {
      calls += 1;
      return new Response("sent", { status: 200 });
    },
  } as Deps);
  assert.equal(calls, 0);
  assert.equal(drained.delivered, 0);
  assert.equal(drained.fake, 2);
  const saved = await store.listAlerts();
  assert.equal(saved.find((alert) => alert.audience === "customer")?.status, "fake_recorded");
  assert.equal(saved.find((alert) => alert.audience === "owner")?.status, "fake_recorded");
});

test("the setup confirmation names MANHAIR, the studio address, and the member reply-to", async () => {
  const env = {
    RESEND_API_KEY: "re_test",
    MEMBERSHIP_CUSTOMER_ALERTS_SEND: "true",
    MEMBERSHIP_MESSAGE_TRANSPORT: "live",
  };
  const drafts = alertsForPayment({
    eventId: "evt_mail",
    previousStatus: "checkout_open",
    invoice: { kind: "setup", status: "paid", amountPaid: 49500 },
    webhookFailed: false,
    memberId: "mem_mail",
    now,
    env,
    chargeDateReady: true,
  });
  const store = createMemoryStore();
  await store.saveMember({
    id: "mem_mail",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "trialing",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionItemId: null,
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    chargeAtSource: "stripe",
    recurringStartAt: "2026-12-09T04:44:00.000Z",
    minimumTermEndsAt: "2027-02-07T19:00:00.000Z",
    rateLockEndsAt: "2028-11-07T19:00:00.000Z",
    entitlementYearEndsAt: "2027-11-07T19:00:00.000Z",
    systemsUsed: 0,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: now.toISOString(),
  });
  const customer = drafts.find((draft) => draft.audience === "customer")!;
  await store.enqueueAlert({ ...customer, id: "alert_mail", attempts: 0, lastError: null, createdAt: now.toISOString() });
  let payload: { from?: string; reply_to?: string; text?: string; html?: string; subject?: string } = {};
  await drainAlerts({
    env,
    store,
    stripe: null,
    now: () => now,
    fetchImpl: async (_input, init) => {
      payload = JSON.parse(String(init?.body ?? "{}"));
      return new Response("sent", { status: 200 });
    },
  } as Deps);
  assert.equal(payload.from, "ManHair <info@manhaironline.com>");
  assert.equal(payload.reply_to, "info@manhaironline.com");
  assert.match(payload.text ?? "", /MANHAIR/);
  assert.match(payload.text ?? "", /20 Heron, Lake Forest, CA 92630/);
  assert.match(payload.text ?? "", /Signature/);
  assert.match(payload.text ?? "", /\$495/);
  assert.match(payload.text ?? "", /\$559/);
  assert.match(payload.text ?? "", /Dec 8, 2026/);
  assert.doesNotMatch(payload.text ?? "", /Dec 9, 2026/);
  assert.match(payload.text ?? "", /our ManHair stylist/);
  assert.match(payload.text ?? "", /https:\/\/www\.manhaironline\.com\/book\//);
  assert.match(payload.text ?? "", /isn't the right fit/);
  assert.match(payload.text ?? "", /https:\/\/www\.manhaironline\.com\/account\//);
  assert.doesNotMatch(payload.text ?? "", /Unsubscribe/i);
  assert.doesNotMatch(payload.text ?? "", /Griselda/);
  assert.match(payload.html ?? "", /Welcome to ManHair/);
  assert.match(payload.html ?? "", /Alex/);
  assert.doesNotMatch(payload.html ?? "", /Unsubscribe/i);
});

test("a staff alert names the member and links to the hub", async () => {
  const env = {
    RESEND_API_KEY: "re_test",
    RESEND_FROM: "ManHair <info@manhaironline.com>",
    MEMBERSHIP_STAFF_ALERT_EMAILS: "justin@example.com,griselda@example.com",
    MEMBERSHIP_OWNER_ALERTS_SEND: "true",
    MEMBERSHIP_MESSAGE_TRANSPORT: "live",
  };
  const store = createMemoryStore();
  await store.saveMember({
    id: "mem_staff",
    email: "member@example.com",
    phone: "+1 (904) 555-0100",
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "trialing",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeSubscriptionItemId: null,
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    recurringStartAt: "2026-12-07T19:00:00.000Z",
    minimumTermEndsAt: "2027-02-07T19:00:00.000Z",
    rateLockEndsAt: "2028-11-07T19:00:00.000Z",
    entitlementYearEndsAt: "2027-11-07T19:00:00.000Z",
    systemsUsed: 0,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: null,
    pauseCollection: false,
    attention: null,
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 0,
    version: 0,
    createdAt: now.toISOString(),
  });
  await store.enqueueAlert({
    id: "alert_staff",
    dedupeKey: "evt_staff:setup_paid:owner",
    sourceEventId: "evt_staff",
    kind: "setup_paid",
    audience: "owner",
    memberId: "mem_staff",
    amountCents: 49500,
    status: "pending",
    nextAttemptAt: now.toISOString(),
    attempts: 0,
    lastError: null,
    createdAt: "2026-12-09T04:44:00.000Z",
  });
  let payload: { subject?: string; text?: string; to?: string[] } = {};
  await drainAlerts({
    env,
    store,
    stripe: null,
    now: () => now,
    fetchImpl: async (_input, init) => {
      payload = JSON.parse(String(init?.body ?? "{}"));
      return new Response("sent", { status: 200 });
    },
  } as Deps);
  assert.equal(payload.subject, "New member: Alex Rivera, Signature");
  assert.match(payload.text ?? "", /member@example.com/);
  assert.match(payload.text ?? "", /\+1 \(904\) 555-0100/);
  assert.match(payload.text ?? "", /\$495/);
  assert.match(payload.text ?? "", /https:\/\/www\.manhaironline\.com\/hub\//);
  assert.match(payload.text ?? "", /Dec 7, 2026/);
  assert.doesNotMatch(payload.text ?? "", /Dec 9, 2026/);
});

test("a missing phone is labeled not provided", () => {
  const message = staffAlertMessage({
    kind: "consultation_requested",
    name: "Ari Cole",
    email: "ari@example.com",
    phone: null,
    plan: null,
    amountCents: 0,
    occurredAt: now,
    hubUrl: "https://www.manhaironline.com/hub/",
  });
  assert.match(message.text, /Phone: not provided/);
  assert.match(message.html, /Phone: not provided/);
  assert.doesNotMatch(message.text, /Phone: None/);
  assert.doesNotMatch(message.html, /Phone: None/);
});
