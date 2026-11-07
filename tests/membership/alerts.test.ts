import assert from "node:assert/strict";
import { test } from "node:test";
import { alertAfterFailure, alertsForPayment, ownerAlertsReady } from "../../lib/membership/alerts";
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
    ["setup_paid:owner:held", "setup_paid:customer:held"],
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
