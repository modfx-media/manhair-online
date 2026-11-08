import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { staffRole, memberCanRead } from "../../lib/membership/access";
import { assessCheckoutAmount, buildCheckoutParams, priceMatches } from "../../lib/membership/checkout";
import { reduceBillingEvent, type MemberBilling } from "../../lib/membership/billing";
import { APP_TIMEZONE, addMonths, billingTimeline, formatStudio } from "../../lib/membership/dates";
import { chooseContact, ghlErrorDisposition, ghlMode, paidMemberStageChange, planSync, syncLead } from "../../lib/membership/ghl";
import { MANHAIR_GHL_LOCATION_ID, MANHAIR_LEGACY_PIPELINE_ID } from "../../lib/membership/manhair-ghl";
import { planCancel, planPauseApply, planUsage, revenueReport, rollEntitlementYear, tierChangeParams } from "../../lib/membership/lifecycle";
import { FOUNDING_SETUP_CENTS, SETUP_CENTS, TIERS } from "../../lib/membership/offer";
import { foundingConfig, paymentBlockers, type AppEnv } from "../../lib/membership/readiness";
import { FOUNDING_RESERVE_SQL, USAGE_SQL } from "../../lib/membership/sql-store";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { signToken, verifyToken } from "../../lib/membership/tokens";
import type { MemberRecord } from "../../lib/membership/types";

const NOW = new Date("2026-11-07T19:00:00.000Z");

function env(extra: AppEnv = {}): AppEnv {
  return {
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
    STRIPE_ACCOUNT_ID: "acct_manhair_confirmed",
    STRIPE_PRICE_ESSENTIAL: "price_essential",
    STRIPE_PRICE_SIGNATURE: "price_signature",
    STRIPE_PRICE_ELITE: "price_elite",
    STRIPE_PRICE_SETUP: "price_setup",
    STRIPE_PORTAL_CONFIGURATION_ID: "bpc_123",
    NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
    ...extra,
  };
}

function member(partial: Partial<MemberRecord> = {}): MemberRecord {
  return {
    id: "mem_1",
    email: "member@example.com",
    phone: null,
    firstName: "Alex",
    lastName: "Rivera",
    tier: "signature",
    status: "trialing",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    monthlyCents: 55900,
    setupCents: 49500,
    setupPaid: false,
    recurringStartAt: billingTimeline(NOW).firstRecurringAt.toISOString(),
    minimumTermEndsAt: billingTimeline(NOW).minimumTermEndsAt.toISOString(),
    rateLockEndsAt: billingTimeline(NOW).rateLockEndsAt.toISOString(),
    entitlementYearEndsAt: billingTimeline(NOW).entitlementYearEndsAt.toISOString(),
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

test("tier prices and included visits", () => {
  assert.equal(TIERS.essential.monthlyCents, 44900);
  assert.equal(TIERS.signature.monthlyCents, 55900);
  assert.equal(TIERS.elite.monthlyCents, 66900);
  assert.deepEqual([TIERS.essential.systems, TIERS.essential.maintenance], [4, 9]);
  assert.deepEqual([TIERS.signature.systems, TIERS.signature.maintenance], [6, 7]);
  assert.deepEqual([TIERS.elite.systems, TIERS.elite.maintenance], [8, 5]);
  assert.equal(TIERS.essential.systems + TIERS.essential.maintenance, 13);
  assert.equal(TIERS.signature.recommended, true);
  assert.equal(SETUP_CENTS, 49500);
  assert.equal(FOUNDING_SETUP_CENTS, 29500);
});

test("billing timeline charges setup now and membership 30 days later", () => {
  const timeline = billingTimeline(NOW);
  assert.equal(timeline.setupAt.toISOString(), NOW.toISOString());
  assert.equal(timeline.firstRecurringAt.getTime() - NOW.getTime(), 30 * 24 * 60 * 60 * 1000);
  assert.equal(timeline.secondRecurringAt.toISOString(), "2027-01-07T19:00:00.000Z");
  assert.notEqual(timeline.secondRecurringAt.getTime() - timeline.firstRecurringAt.getTime(), 30 * 24 * 60 * 60 * 1000);
  assert.equal(addMonths(new Date("2026-01-31T00:00:00.000Z"), 1).toISOString(), "2026-02-28T00:00:00.000Z");
  assert.equal(timeline.minimumTermEndsAt.toISOString(), "2027-02-07T19:00:00.000Z");
  assert.equal(timeline.rateLockEndsAt.toISOString(), "2028-11-07T19:00:00.000Z");
});

test("founding stays off and rejects an expanded cap", () => {
  assert.equal(foundingConfig({}).enabled, false);
  assert.equal(foundingConfig({ MEMBERSHIP_FOUNDING_ENABLED: "true", MEMBERSHIP_FOUNDING_CAP: "26" }).enabled, false);
  const open = foundingConfig({ MEMBERSHIP_FOUNDING_ENABLED: "true" });
  assert.equal(open.enabled && open.cap, 25);
});

test("checkout params are one subscription with a 30 day trial and no card types", () => {
  const built = buildCheckoutParams({
    env: env(),
    memberId: "mem_1",
    email: "member@example.com",
    tier: "signature",
    useFounding: false,
    origin: "https://www.manhaironline.com",
    now: NOW,
    returnToken: "token",
    reservationId: null,
  });
  assert.equal(built.ok, true);
  if (!built.ok) return;
  assert.equal(built.params.mode, "subscription");
  assert.equal(built.params.subscription_data.trial_period_days, 30);
  assert.equal(built.params.line_items.length, 2);
  assert.equal(built.params.payment_method_collection, "always");
  assert.equal("payment_method_types" in built.params, false);
  assert.match(built.params.integration_identifier, /^manhair_membership_[a-z]{8}$/);
  assert.equal(assessCheckoutAmount(49500, 49500, 55900), "setup_only");
  assert.equal(assessCheckoutAmount(105400, 49500, 55900), "setup_and_recurring");
  assert.equal(assessCheckoutAmount(0, 49500, 55900), "zero");
});

test("live checkout waits for an owner-confirmed account and does not hard-code a merchant", () => {
  const unconfirmed = paymentBlockers(env({ STRIPE_ACCOUNT_ID: "acct_1DhNFjGiafo5ImyE" }));
  assert.ok(unconfirmed.some((blocker) => blocker.code === "stripe_account_unconfirmed"));
  assert.equal(unconfirmed.some((blocker) => blocker.code === "stripe_account_denied"), false);
  const confirmed = paymentBlockers(
    env({ STRIPE_ACCOUNT_ID: "acct_owner_confirmed", MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true" }),
    "acct_owner_confirmed",
  );
  assert.equal(confirmed.some((blocker) => blocker.code.startsWith("stripe_account")), false);
  const mismatch = paymentBlockers(
    env({ STRIPE_ACCOUNT_ID: "acct_owner_confirmed", MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true" }),
    "acct_other",
  );
  assert.ok(mismatch.some((blocker) => blocker.code === "stripe_account_mismatch"));
  const live = paymentBlockers(env({ STRIPE_SECRET_KEY: "sk_live_secret" }));
  assert.ok(live.some((blocker) => blocker.code === "live_payments_blocked"));
  assert.equal(
    priceMatches(
      { id: "price_signature", unit_amount: 55900, currency: "usd", recurring: { interval: "month" } },
      { id: "price_signature", cents: 55900, interval: "month" },
    ),
    true,
  );
  assert.equal(
    priceMatches(
      { id: "price_setup", unit_amount: 100, currency: "usd", recurring: null },
      { id: "price_setup", cents: 49500, interval: null },
    ),
    false,
  );
});

test("usage, pause, cancel, and revenue guards", () => {
  const current = member();
  assert.equal(planUsage(current, "system", 1).ok, true);
  assert.equal(planUsage({ ...current, systemsUsed: 6 }, "system", 1).ok, false);
  assert.equal(planUsage({ ...current, status: "paused", pauseCollection: true }, "maintenance", 1).ok, false);
  const early = planCancel(current.minimumTermEndsAt, NOW);
  assert.equal(early.mode, "at_minimum_term");
  const later = planCancel(current.minimumTermEndsAt, new Date("2027-03-01T00:00:00.000Z"));
  assert.equal(later.mode, "period_end");
  const pause = planPauseApply(current, 14, NOW);
  assert.equal(pause.ok, true);
  if (pause.ok) assert.equal(pause.apply.stripe.pause_collection.behavior, "void");
  assert.equal(planPauseApply({ ...current, pauseDaysUsed: 50 }, 20, NOW).ok, false);
  const change = tierChangeParams("si_1", "price_elite");
  assert.equal(change.proration_behavior, "create_prorations");
  assert.equal(JSON.stringify(change).includes("change_fee"), false);
  const report = revenueReport(
    [
      { status: "paid", kind: "setup", amountPaid: 49500, amountRefunded: 0 },
      { status: "paid", kind: "recurring", amountPaid: 55900, amountRefunded: 1000 },
    ],
    [
      { status: "active", monthlyCents: 55900 },
      { status: "trialing", monthlyCents: 66900 },
    ],
  );
  assert.equal(report.netCashCents, 49500 + 55900 - 1000);
  assert.equal(report.projectedMrrCents, 55900);
  assert.equal(report.trialingUnpaidMonthlyCents, 66900);
  assert.equal(report.setupCollectedCents, 49500);
  assert.equal("projectedAnnualCents" in report, false);
  assert.match(report.note, /Projected MRR is not cash collected|not cash collected/);
});

test("staff deny by default and member isolation", () => {
  assert.equal(staffRole("owner@manhaironline.com", {}), null);
  assert.equal(staffRole("owner@manhaironline.com", { MEMBERSHIP_OWNER_EMAILS: "other@example.com" }), null);
  assert.equal(
    staffRole("Griselda@manhaironline.com", { MEMBERSHIP_COORDINATOR_EMAILS: "griselda@manhaironline.com" }),
    "coordinator",
  );
  assert.equal(memberCanRead("mem_1", "mem_2"), false);
  assert.equal(memberCanRead("mem_1", "mem_1"), true);
});

test("HighLevel stays off for the wrong tenant and does not guess among duplicates", async () => {
  assert.equal(APP_TIMEZONE, "America/Los_Angeles");
  assert.notEqual(APP_TIMEZONE, "America/New_York");
  assert.match(formatStudio(NOW), /Pacific Time/);
  assert.equal(ghlMode({}), "off");
  assert.equal(ghlMode({ GHL_API_TOKEN: "token" }), "contacts_and_opportunities");
  assert.equal(ghlMode({ GHL_API_TOKEN: "token", GHL_LOCATION_ID: "default" }), "off");
  assert.equal(ghlMode({ GHL_API_TOKEN: "token", GHL_PIPELINE_ID: MANHAIR_LEGACY_PIPELINE_ID }), "off");
  assert.equal(ghlMode({ GHL_API_TOKEN: "token", GHL_STAGE_MAP: JSON.stringify({ "New Leads": "not-the-real-stage" }) }), "off");
  let called = false;
  const result = await syncLead({ GHL_API_TOKEN: "token", GHL_LOCATION_ID: "other-location" }, {
    email: "a@example.com",
    phone: null,
    firstName: "A",
    lastName: "B",
    dealId: "deal",
  }, async () => {
    called = true;
    return new Response("{}");
  });
  assert.equal(called, false);
  assert.equal(result.status, "not_connected");
  assert.deepEqual(
    chooseContact("loc_real", [
      { id: "1", locationId: "loc_real", email: "a@example.com" },
      { id: "2", locationId: "loc_real", email: "a@example.com" },
    ], "a@example.com"),
    { action: "ambiguous" },
  );
  assert.equal(planSync("same", "same", "ghl"), "skip_loop");
  assert.equal(
    chooseContact("loc_real", [{ id: "1", locationId: "loc_other", email: "a@example.com" }], "a@example.com").action,
    "create",
  );
  assert.equal(paidMemberStageChange(true, "Phone Consult"), "keep_active_client");
  assert.equal(paidMemberStageChange(true, "Active Clients"), "allow");
  assert.equal(paidMemberStageChange(false, "New Leads"), "allow");
  assert.equal(ghlErrorDisposition(403, "WORKFLOW_API_NOT_ENABLED_FOR_LOCATION"), "stop_availability");
  assert.equal(ghlErrorDisposition(403, null), "stop");
  assert.equal(ghlErrorDisposition(500, null), "retry");
  const schema = readFileSync(new URL("../../db/membership/001_init.sql", import.meta.url), "utf8");
  assert.equal(/^\s*drop\s+/im.test(schema), false);
});

test("a workflow availability 403 is not retried", async () => {
  let calls = 0;
  const result = await syncLead({ GHL_API_TOKEN: "token", GHL_LOCATION_ID: MANHAIR_GHL_LOCATION_ID }, {
    email: "a@example.com",
    phone: null,
    firstName: "A",
    lastName: "B",
    dealId: "deal",
  }, async () => {
    calls += 1;
    return new Response(JSON.stringify({ code: "WORKFLOW_API_NOT_ENABLED_FOR_LOCATION" }), { status: 403 });
  });
  assert.equal(calls, 1);
  assert.equal(result.status, "push_failed");
});

test("return tokens expire and atomic SQL keeps a cap and an idempotency key", () => {
  const token = signToken({ purpose: "checkout_return", sid: "s1" }, "secret", 60, NOW);
  assert.ok(verifyToken(token, "secret", NOW));
  assert.equal(verifyToken(token, "secret", new Date(NOW.getTime() + 61_000)), null);
  assert.match(FOUNDING_RESERVE_SQL, /COUNT\(\*\)/);
  assert.match(FOUNDING_RESERVE_SQL, /< \$4::int/);
  assert.match(USAGE_SQL, /idempotency_key/);
  assert.match(USAGE_SQL, /systems_used \+ \$5::int <= \$6::int/);
});

test("founding holds expire and webhook claims do not double-apply", async () => {
  const store = createMemoryStore();
  assert.equal(
    await store.reserveFounding({ id: "old", memberId: "m", expiresAt: new Date(NOW.getTime() - 1000).toISOString(), cap: 1 }),
    "reserved",
  );
  assert.equal(
    await store.reserveFounding({ id: "new", memberId: "m2", expiresAt: new Date(NOW.getTime() + 60_000).toISOString(), cap: 1 }),
    "reserved",
  );
  assert.equal(await store.claimEvent("evt_1", "invoice.paid"), "claimed");
  assert.equal(await store.claimEvent("evt_1", "invoice.paid"), "duplicate");
  await store.finishEvent("evt_1", "failed");
  assert.equal(await store.claimEvent("evt_1", "invoice.paid"), "retry");
});

test("entitlement year rolls on its boundary and stays frozen while paused", () => {
  const current = member();
  const before = new Date(new Date(current.entitlementYearEndsAt).getTime() - 1);
  assert.equal(rollEntitlementYear({ ...current, systemsUsed: 2 }, before).rolled, false);
  const rolled = rollEntitlementYear({ ...current, systemsUsed: 2 }, new Date(current.entitlementYearEndsAt));
  assert.equal(rolled.rolled, true);
  assert.equal(rolled.systemsUsed, 0);
  assert.equal(rolled.entitlementYearEndsAt, "2028-11-07T19:00:00.000Z");
  const paused = rollEntitlementYear(
    { ...current, status: "paused", pauseCollection: true },
    new Date(current.entitlementYearEndsAt),
  );
  assert.equal(paused.rolled, false);
});

test("HighLevel retries a failed search and does not open a second opportunity", async () => {
  let searches = 0;
  let posts = 0;
  const env = {
    GHL_API_TOKEN: "token",
    GHL_LOCATION_ID: MANHAIR_GHL_LOCATION_ID,
  };
  const result = await syncLead(env, {
    email: "a@example.com",
    phone: null,
    firstName: "A",
    lastName: "B",
    dealId: "deal",
    contactId: "contact_1",
    opportunityId: "opp_1",
  }, async (input) => {
    const url = String(input);
    if (url.includes("/contacts/")) {
      searches += 1;
      if (searches === 1) return new Response("no", { status: 500 });
      return Response.json({ contacts: [{ id: "contact_1", locationId: MANHAIR_GHL_LOCATION_ID, email: "a@example.com" }] });
    }
    posts += 1;
    return Response.json({ opportunity: { id: "opp_new" } });
  });
  assert.equal(result.status, "pushed");
  assert.equal(result.opportunityId, "opp_1");
  assert.equal(posts, 0);
  assert.ok(searches >= 2);
});

test("stale subscription status does not overwrite a newer event", () => {
  const billing: MemberBilling = {
    id: "mem_1",
    tier: "signature",
    status: "active",
    stripeCustomerId: "cus_1",
    stripeSubscriptionId: "sub_1",
    stripeSubscriptionItemId: "si_1",
    setupCents: 49500,
    monthlyCents: 55900,
    setupPaid: true,
    recurringStartAt: null,
    cancelAt: null,
    pauseCollection: false,
    lastStatusEventCreated: 500,
    attention: null,
    version: 2,
  };
  const effect = reduceBillingEvent(
    billing,
    {
      id: "evt_old",
      type: "customer.subscription.updated",
      created: 400,
      memberId: "mem_1",
      customerId: "cus_1",
      subscriptionId: "sub_1",
      subscriptionItemId: "si_1",
      status: "trialing",
      trialEnd: null,
      cancelAt: null,
      pauseResumesAt: null,
    },
    new Set(),
  );
  assert.equal(effect.staleStatus, true);
  assert.equal(effect.statusPatch, null);
});
