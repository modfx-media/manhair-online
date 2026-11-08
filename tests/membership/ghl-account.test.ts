import { generateKeyPairSync, sign } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { pushOpportunityStage } from "../../lib/membership/ghl";
import {
  MANHAIR_GHL_LOCATION_ID,
  MANHAIR_LEGACY_PIPELINE_ID,
  MANHAIR_MARKETING_PIPELINE_ID,
  MANHAIR_STAGE_IDS,
} from "../../lib/membership/manhair-ghl";
import { GHL_ED25519_PUBLIC_KEY, mergeInboundLead, pullHighLevel, verifyGhlSignature } from "../../lib/membership/ghl-inbound";
import { BILLING_PORTAL_FEATURES, handleAccountPost, handleGhlWebhook, handleHub, handleRecover, type Deps } from "../../lib/membership/handlers";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { hashSecret } from "../../lib/membership/tokens";
import type { DealRecord, MemberRecord } from "../../lib/membership/types";

const NOW = new Date("2026-11-07T19:40:00.000Z");

function env(extra: Record<string, string> = {}) {
  return {
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    STRIPE_ACCOUNT_ID: "acct_owner_confirmed",
    MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
    STRIPE_PRICE_ESSENTIAL: "price_essential",
    STRIPE_PRICE_SIGNATURE: "price_signature",
    STRIPE_PRICE_ELITE: "price_elite",
    STRIPE_PRICE_SETUP: "price_setup",
    MEMBERSHIP_SESSION_SECRET: "test-secret",
    MEMBERSHIP_OWNER_EMAILS: "owner@manhaironline.com",
    NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    GHL_API_TOKEN: "token",
    ...extra,
  };
}

function deal(partial: Partial<DealRecord> = {}): DealRecord {
  return {
    id: "deal_1",
    memberId: null,
    name: "Alex Rivera",
    email: "alex@example.com",
    phone: null,
    stage: "Phone Consult",
    assignee: "owner@manhaironline.com",
    nextFollowUp: "2026-11-10",
    ghlContactId: "contact_1",
    ghlOpportunityId: null,
    syncStatus: "updated",
    syncHash: "old",
    locationId: MANHAIR_GHL_LOCATION_ID,
    remoteUpdatedAt: "2026-11-01T00:00:00.000Z",
    staffEditedAt: "2026-11-02T00:00:00.000Z",
    ...partial,
  };
}

test("HighLevel Ed25519 signature matches the published contract and rejects a bad signature", () => {
  assert.match(GHL_ED25519_PUBLIC_KEY, /MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=/);
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const body = JSON.stringify({ ok: true });
  const signature = sign(null, Buffer.from(body), privateKey).toString("base64");
  assert.equal(verifyGhlSignature(body, signature, publicKey.export({ type: "spki", format: "pem" }).toString()), true);
  assert.equal(verifyGhlSignature(body, signature), false);
  assert.equal(verifyGhlSignature(body, null), false);
});

test("inbound merge keeps staff workflow on conflict and imports a new location lead", () => {
  const remote = {
    webhookId: "wh_1",
    type: "ContactUpdate",
    timestamp: NOW.toISOString(),
    locationId: MANHAIR_GHL_LOCATION_ID,
    contactId: "contact_1",
    opportunityId: "opp_1",
    pipelineId: null,
    pipelineStageId: MANHAIR_STAGE_IDS["Phone Consult"],
    email: "alex@example.com",
    name: "Alex Updated",
    phone: "9045550100",
    updatedAt: NOW.toISOString(),
  };
  const conflict = mergeInboundLead({
    configuredLocation: MANHAIR_GHL_LOCATION_ID,
    remote: { ...remote, updatedAt: "2026-11-01T00:00:00.000Z" },
    deals: [deal()],
    now: NOW,
    stageMap: MANHAIR_STAGE_IDS,
  });
  assert.equal(conflict.action, "conflict");
  if (conflict.action === "conflict") {
    assert.equal(conflict.deal.stage, "Phone Consult");
    assert.equal(conflict.deal.assignee, "owner@manhaironline.com");
    assert.equal(conflict.deal.name, "Alex Updated");
  }
  const moved = mergeInboundLead({
    configuredLocation: MANHAIR_GHL_LOCATION_ID,
    remote: { ...remote, pipelineStageId: MANHAIR_STAGE_IDS["Proposal Sent"] },
    deals: [deal({ staffEditedAt: "2026-11-01T00:00:00.000Z" })],
    now: NOW,
    stageMap: MANHAIR_STAGE_IDS,
  });
  assert.equal(moved.action, "update");
  if (moved.action === "update") assert.equal(moved.deal.stage, "Proposal Sent");
  const unknown = mergeInboundLead({
    configuredLocation: MANHAIR_GHL_LOCATION_ID,
    remote: { ...remote, contactId: "contact_unknown", email: "unknown-stage@example.com", pipelineStageId: "stage-not-in-pipeline" },
    deals: [deal()],
    now: NOW,
    stageMap: MANHAIR_STAGE_IDS,
  });
  assert.equal(unknown.action, "import");
  if (unknown.action === "import") {
    assert.equal(unknown.deal.stage, "unmapped:stage-not-in-pipeline");
    assert.equal(unknown.deal.syncStatus, "unknown_stage");
  }
  const legacy = mergeInboundLead({
    configuredLocation: MANHAIR_GHL_LOCATION_ID,
    remote: { ...remote, contactId: "contact_legacy", pipelineId: MANHAIR_LEGACY_PIPELINE_ID },
    deals: [],
    now: NOW,
    stageMap: MANHAIR_STAGE_IDS,
  });
  assert.equal(legacy.action, "unchanged");
  const wrong = mergeInboundLead({ configuredLocation: MANHAIR_GHL_LOCATION_ID, remote: { ...remote, locationId: "loc_other" }, deals: [], now: NOW });
  assert.equal(wrong.action, "skip_location");
  const imported = mergeInboundLead({
    configuredLocation: MANHAIR_GHL_LOCATION_ID,
    remote: { ...remote, contactId: "contact_new", email: "new@example.com" },
    deals: [deal()],
    now: NOW,
    stageMap: MANHAIR_STAGE_IDS,
  });
  assert.equal(imported.action, "import");
  if (imported.action === "import") assert.equal(imported.deal.stage, "Phone Consult");
});

test("unsigned or wrong-location HighLevel posts do not create leads, and a signed post imports once", async () => {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const store = createMemoryStore();
  const payload = JSON.stringify({
    type: "ContactCreate",
    webhookId: "wh_signed",
    timestamp: NOW.toISOString(),
    locationId: MANHAIR_GHL_LOCATION_ID,
    data: { id: "contact_9", email: "new@example.com", firstName: "New", lastName: "Lead", locationId: MANHAIR_GHL_LOCATION_ID },
  });
  const signature = sign(null, Buffer.from(payload), privateKey).toString("base64");
  const deps = {
    env: env(),
    store,
    stripe: null,
    now: () => NOW,
    verifyGhl: (raw: string, header: string | null) => verifyGhlSignature(raw, header, publicKey.export({ type: "spki", format: "pem" }).toString()),
  } as Deps;
  const unsigned = await handleGhlWebhook(new Request("https://www.manhaironline.com/api/membership/ghl/", {
    method: "POST",
    body: payload,
  }), deps);
  assert.equal(unsigned.status, 401);
  assert.equal((await store.listDeals()).length, 0);
  const signed = await handleGhlWebhook(new Request("https://www.manhaironline.com/api/membership/ghl/", {
    method: "POST",
    headers: { "x-ghl-signature": signature },
    body: payload,
  }), deps);
  assert.equal(signed.status, 200);
  assert.equal((await store.listDeals()).length, 1);
  const again = await handleGhlWebhook(new Request("https://www.manhaironline.com/api/membership/ghl/", {
    method: "POST",
    headers: { "x-ghl-signature": signature },
    body: payload,
  }), deps);
  assert.equal((await again.json()).duplicate, true);
  assert.equal((await store.listDeals()).length, 1);
  const disconnected = await handleGhlWebhook(new Request("https://www.manhaironline.com/api/membership/ghl/", {
    method: "POST",
    headers: { "x-ghl-signature": signature },
    body: payload,
  }), { ...deps, env: env({ GHL_LOCATION_ID: "loc_other" }) });
  assert.equal(disconnected.status, 503);
  const foreignBody = JSON.stringify({
    type: "ContactCreate",
    webhookId: "wh_foreign",
    timestamp: NOW.toISOString(),
    locationId: "loc_other",
    data: { id: "contact_other", email: "other@example.com" },
  });
  const foreign = await handleGhlWebhook(new Request("https://www.manhaironline.com/api/membership/ghl/", {
    method: "POST",
    headers: { "x-ghl-signature": sign(null, Buffer.from(foreignBody), privateKey).toString("base64") },
    body: foreignBody,
  }), deps);
  assert.equal(foreign.status, 403);
  assert.equal((await store.listDeals()).length, 1);
});

test("stage push refuses the legacy pipeline and writes only a verified marketing stage", async () => {
  let calls = 0;
  const legacy = await pushOpportunityStage(
    { GHL_API_TOKEN: "token", GHL_PIPELINE_ID: MANHAIR_LEGACY_PIPELINE_ID },
    "opp_1",
    "Phone Consult",
    async () => {
      calls += 1;
      return new Response("{}");
    },
  );
  assert.equal(legacy, "not_connected");
  const unknown = await pushOpportunityStage({ GHL_API_TOKEN: "token" }, "opp_1", "consult", async () => {
    calls += 1;
    return new Response("{}");
  });
  assert.equal(unknown, "stage_map_missing");
  assert.equal(calls, 0);
  const pushed = await pushOpportunityStage({ GHL_API_TOKEN: "token" }, "opp_1", "Phone Consult", async (input, init) => {
    calls += 1;
    assert.equal(String(input), "https://services.leadconnectorhq.com/opportunities/opp_1");
    assert.equal(init?.method, "PUT");
    const body = JSON.parse(String(init?.body));
    assert.equal(body.locationId, MANHAIR_GHL_LOCATION_ID);
    assert.equal(body.pipelineId, MANHAIR_MARKETING_PIPELINE_ID);
    assert.equal(body.pipelineStageId, MANHAIR_STAGE_IDS["Phone Consult"]);
    return Response.json({ opportunity: { locationId: MANHAIR_GHL_LOCATION_ID, pipelineId: MANHAIR_MARKETING_PIPELINE_ID } });
  });
  assert.equal(pushed, "pushed");
  assert.equal(calls, 1);
});

test("HighLevel pull is off without a location and imports a page with a cursor", async () => {
  let calls = 0;
  const disconnected = await pullHighLevel({
    env: { GHL_API_TOKEN: "token", GHL_LOCATION_ID: "other-location" },
    fetchImpl: async () => {
      calls += 1;
      return new Response("{}");
    },
    contactCursor: null,
    opportunityPage: 1,
  });
  assert.equal(disconnected.ok, false);
  assert.equal(calls, 0);
  const store = createMemoryStore();
  const deps = {
    env: env(),
    store,
    stripe: null,
    now: () => NOW,
    staffEmail: "owner@manhaironline.com",
    fetchImpl: async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/contacts/")) {
        return Response.json({
          contacts: [{ id: "contact_2", locationId: MANHAIR_GHL_LOCATION_ID, email: "pull@example.com", firstName: "Pulled", lastName: "Lead", dateUpdated: NOW.toISOString() }],
          meta: { startAfterId: "cursor_2" },
        });
      }
      return Response.json({ opportunities: [], meta: {} });
    },
  } as Deps;
  const response = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/?action=ghl-pull", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com" },
    body: "{}",
  }), deps);
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.equal(body.status, "partial");
  assert.equal((await store.listDeals()).some((item) => item.email === "pull@example.com"), true);
  const state = await store.getSyncState();
  assert.equal(state?.contactCursor, "cursor_2");
});

test("recovery email stays closed, portal uses only this member's customer, and logout revokes the session", async () => {
  const store = createMemoryStore();
  const member: MemberRecord = {
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "active",
    stripeCustomerId: "cus_member",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: true,
    recurringStartAt: null,
    minimumTermEndsAt: "2027-02-07T00:00:00.000Z",
    rateLockEndsAt: "2028-11-07T00:00:00.000Z",
    entitlementYearEndsAt: "2027-11-07T00:00:00.000Z",
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
  await store.saveMember(member);
  await store.createSession({
    id: "sess_1",
    memberId: "mem_1",
    tokenHash: hashSecret("cookie-a"),
    expiresAt: "2026-12-07T00:00:00.000Z",
    active: true,
    returnUsed: true,
  });
  const portalCalls: Array<Record<string, unknown>> = [];
  const deps = {
    env: env(),
    store,
    now: () => NOW,
    stripe: {
      accounts: { async retrieveCurrent() { return { id: "acct_owner_confirmed" }; } },
      prices: { async retrieve(id: string) { return { id, unit_amount: 55900, currency: "usd", recurring: { interval: "month" } }; } },
      checkout: { sessions: { async create() { return { id: "cs", url: "https://checkout.stripe.test" }; } } },
      billingPortal: {
        configurations: { async create(params: Record<string, unknown>) { portalCalls.push(params); return { id: "bpc_test" }; } },
        sessions: { async create(params: { customer: string; return_url: string; configuration: string }) { portalCalls.push(params); return { url: "https://billing.stripe.com/p/session_test" }; } },
      },
      subscriptions: { async update() { return { id: "sub_1" }; } },
    },
  } as Deps;
  const headers = { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", cookie: "mh_member_session=cookie-a", "content-type": "application/json" };
  const closed = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=recover", {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "member@example.com" }),
  }), deps);
  assert.equal(closed.status, 501);
  const sent: string[] = [];
  const opened = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=recover", {
    method: "POST",
    headers,
    body: JSON.stringify({ email: "member@example.com", customer: "cus_attacker" }),
  }), {
    ...deps,
    env: env({ RESEND_API_KEY: "re_test", RESEND_FROM: "studio@example.com", MEMBERSHIP_RECOVERY_SEND: "true" }),
    deliverRecovery: async (input: { to: string; url: string }) => {
      sent.push(input.url);
      return { sent: true };
    },
  });
  assert.equal(opened.status, 200);
  assert.equal(sent.length, 1);
  const token = new URL(sent[0]!).searchParams.get("token") ?? "";
  const redeem = await handleRecover(new Request(`https://www.manhaironline.com/api/membership/recover/?token=${encodeURIComponent(token)}`, {
    headers: { host: "www.manhaironline.com" },
  }), deps);
  assert.equal(redeem.status, 302);
  const replay = await handleRecover(new Request(`https://www.manhaironline.com/api/membership/recover/?token=${encodeURIComponent(token)}`, {
    headers: { host: "www.manhaironline.com" },
  }), deps);
  assert.equal(replay.status, 400);
  const portal = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=portal", {
    method: "POST",
    headers,
    body: JSON.stringify({ customer: "cus_attacker" }),
  }), deps);
  assert.equal(portal.status, 200);
  const features = portalCalls[0]?.features as typeof BILLING_PORTAL_FEATURES;
  assert.equal(features.subscription_cancel.enabled, false);
  assert.equal(features.subscription_update.enabled, false);
  assert.equal(features.payment_method_update.enabled, true);
  assert.equal((portalCalls[1] as { customer: string }).customer, "cus_member");
  const logout = await handleAccountPost(new Request("https://www.manhaironline.com/api/membership/account/?action=logout", {
    method: "POST",
    headers,
    body: "{}",
  }), deps);
  assert.equal(logout.status, 200);
  assert.equal(await store.findSessionByHash(hashSecret("cookie-a")), null);
});
