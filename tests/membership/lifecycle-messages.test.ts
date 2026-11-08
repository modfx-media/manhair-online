import assert from "node:assert/strict";
import { test } from "node:test";
import { handleConsultation } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { dedupePlans, planMessages, type Suppression } from "../../lib/membership/message-lifecycle";
import { unavailableStore } from "../../lib/membership/sql-store";

const open: Suppression = {
  marketingConsent: true,
  unsubscribed: false,
  dnd: false,
  converted: false,
  signupStarted: false,
};

test("marketing plans stay held and stop after signup, unsubscribe, or do-not-disturb", () => {
  const planned = planMessages({
    eventId: "consult_1",
    type: "consultation_stored",
    occurredAt: "2026-11-08T09:00:00.000Z",
    memberId: null,
    email: "lead@example.com",
  }, open);
  assert.equal(planned.length, 2);
  assert.ok(planned.every((plan) => plan.status === "held" && plan.send === false));
  const stopped = planMessages({
    eventId: "consult_1",
    type: "consultation_stored",
    occurredAt: "2026-11-08T09:00:00.000Z",
    memberId: null,
    email: "lead@example.com",
  }, { ...open, signupStarted: true });
  assert.ok(stopped.every((plan) => plan.status === "suppressed" && plan.reason === "converted"));
  const dnd = planMessages({
    eventId: "consult_2",
    type: "consultation_stored",
    occurredAt: "2026-11-08T09:00:00.000Z",
    memberId: null,
    email: "lead@example.com",
  }, { ...open, dnd: true });
  assert.equal(dnd[0]?.reason, "dnd");
  assert.equal(dedupePlans([...planned, ...planned]).length, planned.length);
});

test("transactional plans require a verified timestamp and never invent a fitting date", () => {
  const paid = planMessages({
    eventId: "evt_setup",
    type: "stripe_setup_paid",
    occurredAt: "2026-11-08T09:12:00.000Z",
    memberId: "mem_1",
    email: "member@example.com",
  }, { ...open, marketingConsent: false });
  assert.equal(paid[0]?.status, "held");
  assert.equal(paid[0]?.templateId, "member.setup.confirmed");
  assert.equal(paid[0]?.send, false);
  const fitting = planMessages({
    eventId: "fit_1",
    type: "staff_verified_fitting_at",
    occurredAt: null,
    memberId: "mem_1",
    email: "member@example.com",
  }, open);
  assert.equal(fitting[0]?.status, "suppressed");
  assert.equal(fitting[0]?.reason, "missing_verified_timestamp");
});

test("a consultation stays local when storage exists and is refused without a database", async () => {
  const store = createMemoryStore();
  let called = false;
  const saved = await handleConsultation(new Request("https://www.manhaironline.com/api/membership/consultation/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Ari", lastName: "Cole", email: "ari@example.com", marketingConsent: false }),
  }), {
    env: { NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com" },
    store,
    stripe: null,
    now: () => new Date("2026-11-08T09:00:00.000Z"),
    fetchImpl: async () => {
      called = true;
      return new Response("{}");
    },
  });
  assert.equal(saved.status, 200);
  const body = await saved.json();
  assert.equal(body.synced, false);
  assert.equal(called, false);
  const deals = await store.listDeals();
  assert.equal(deals[0]?.stage, "New Leads");
  assert.equal(deals[0]?.syncStatus, "local_only");
  assert.equal(deals[0]?.ghlContactId, null);
  const closed = await handleConsultation(new Request("https://www.manhaironline.com/api/membership/consultation/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Ari", lastName: "Cole", email: "ari@example.com" }),
  }), {
    env: { NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com" },
    store: unavailableStore(),
    stripe: null,
    now: () => new Date("2026-11-08T09:00:00.000Z"),
  });
  assert.equal(closed.status, 503);
  const missing = createMemoryStore();
  missing.saveDeal = async () => {
    const error = new Error('relation "membership_deals" does not exist') as Error & { code: string };
    error.code = "42P01";
    throw error;
  };
  const refused = await handleConsultation(new Request("https://www.manhaironline.com/api/membership/consultation/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Ari", lastName: "Cole", email: "ari@example.com" }),
  }), {
    env: { NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com" },
    store: missing,
    stripe: null,
    now: () => new Date("2026-11-08T09:00:00.000Z"),
  });
  assert.equal(refused.status, 503);
  const refusedBody = await refused.json();
  assert.equal(refusedBody.ok, false);
  assert.equal(refusedBody.synced, false);
});
