import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { drainAlerts, type Deps } from "../../lib/membership/handlers";
import { runDueLifecycle } from "../../lib/membership/lifecycle-send";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { newId } from "../../lib/membership/tokens";
import type { MemberRecord } from "../../lib/membership/types";

const now = new Date("2026-11-09T18:00:00.000Z");

function member(): MemberRecord {
  return {
    id: "mem_flow",
    email: "member@example.com",
    phone: "+1 (904) 555-0100",
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "past_due",
    stripeCustomerId: "cus_flow",
    stripeSubscriptionId: "sub_flow",
    stripeSubscriptionItemId: null,
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    chargeAtSource: "stripe",
    recurringStartAt: "2026-12-09T04:44:00.000Z",
    nextChargeAt: "2027-01-09T04:44:00.000Z",
    minimumTermEndsAt: "2027-02-09T04:44:00.000Z",
    rateLockEndsAt: "2028-11-09T04:44:00.000Z",
    entitlementYearEndsAt: "2027-11-09T04:44:00.000Z",
    systemsUsed: 0,
    maintenanceUsed: 0,
    pauseDaysUsed: 0,
    cancelAt: "2027-02-09T04:44:00.000Z",
    pauseCollection: false,
    attention: null,
    paymentGraceStartedAt: "2026-11-09T18:00:00.000Z",
    pauseResumeAt: "2026-12-09T18:00:00.000Z",
    termsVersion: "2026-11-07",
    lastStatusEventCreated: 1,
    version: 1,
    createdAt: "2026-10-10T18:00:00.000Z",
  };
}

test("customer and staff alerts render from the catalog to the sandbox recipient", async () => {
  const store = createMemoryStore();
  await store.saveMember(member());
  await store.upsertInvoice({
    id: "in_failed",
    memberId: "mem_flow",
    kind: "recurring",
    status: "failed",
    amountPaid: 0,
    amountRefunded: 0,
    amountDue: 55900,
    failedAt: now.toISOString(),
    cardLast4: "4242",
  });
  await store.upsertInvoice({
    id: "in_paid",
    memberId: "mem_flow",
    kind: "recurring",
    status: "paid",
    amountPaid: 55900,
    amountRefunded: 0,
    paidAt: now.toISOString(),
    hostedInvoiceUrl: "https://invoice.stripe.com/i/test",
    cardLast4: "4242",
  });
  await store.saveEventFacts("evt_dispute", {
    dispute_amount: "$559",
    dispute_reason: "product unacceptable",
    dispute_evidence_due_date: "Nov 20, 2026",
    stripe_dashboard_url: "https://dashboard.stripe.com/payments/ch_test",
    event_id: "evt_dispute",
  });
  const kinds = ["setup_paid", "monthly_paid", "invoice_failed", "invoice_recovered", "pause_requested", "cancellation_requested", "refund_requested", "dispute", "webhook_error"] as const;
  for (const kind of kinds) {
    for (const audience of kind === "webhook_error" || kind === "dispute" ? ["owner"] as const : ["customer", "owner"] as const) {
      if (kind === "pause_requested" && audience === "customer") continue;
      if (kind === "cancellation_requested" && audience === "customer") continue;
      if (kind === "refund_requested" && audience === "customer") continue;
      await store.enqueueAlert({
        id: newId(),
        dedupeKey: `${kind}:${audience}`,
        sourceEventId: kind === "dispute" ? "evt_dispute" : `evt_${kind}`,
        kind,
        audience,
        memberId: "mem_flow",
        amountCents: 55900,
        status: "pending",
        nextAttemptAt: now.toISOString(),
        attempts: 0,
        lastError: null,
        createdAt: now.toISOString(),
      });
    }
  }
  const sent: Array<{ to?: string; subject?: string; text?: string; html?: string }> = [];
  const deps = {
    env: {
      RESEND_API_KEY: "re_test",
      RESEND_FROM: "ManHair <info@manhaironline.com>",
      MEMBERSHIP_REPLY_TO: "info@manhaironline.com",
      MEMBERSHIP_CUSTOMER_ALERTS_SEND: "true",
      MEMBERSHIP_LIFECYCLE_SEND: "true",
      MEMBERSHIP_LIFECYCLE_PHASE1: "true",
      MEMBERSHIP_OWNER_ALERTS_SEND: "true",
      MEMBERSHIP_STAFF_ALERT_EMAILS: "owner@manhaironline.com",
      MEMBERSHIP_MESSAGE_TRANSPORT: "live",
      MEMBERSHIP_TEST_RECIPIENT: "justin@modfxmedia.com",
      NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    },
    store,
    stripe: null,
    now: () => now,
    fetchImpl: async (_input: unknown, init?: { body?: unknown }) => {
      sent.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response("sent", { status: 200 });
    },
  } as Deps;
  const drained = await drainAlerts(deps);
  assert.equal(drained.failed, 0);
  assert.ok(drained.delivered > 0);
  const dir = "/opt/cursor/artifacts/lifecycle/flow";
  mkdirSync(dir, { recursive: true });
  for (const message of sent) {
    assert.equal(message.to, "justin@modfxmedia.com");
    assert.match(message.subject ?? "", /^\[sandbox\]/);
    assert.doesNotMatch(message.text ?? "", /Amount cents/);
    assert.doesNotMatch(message.text ?? "", /\{\{/);
    assert.match(message.html ?? "", /ManHair/);
    const name = (message.subject ?? "mail").replace(/[^a-z0-9]+/gi, "-").slice(0, 80);
    writeFileSync(`${dir}/${name}.html`, message.html ?? "");
  }
  const logged = await store.listLifecycleMessages();
  assert.ok(logged.every((row) => row.status === "sent"));
  const first = await runDueLifecycle(deps);
  const second = await runDueLifecycle(deps);
  assert.equal(second.sent, 0);
  assert.ok(first.considered >= 0);
});
