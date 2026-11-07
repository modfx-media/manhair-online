import { staffRole, assignableStaff } from "./access";
import { reduceBillingEvent, type MemberBilling } from "./billing";
import { billingDisclosure, billingTimeline, formatStudio } from "./dates";
import { buildCheckoutParams, checkoutIdempotencyKey, isSameOrigin, priceMatches, safeAppOrigin, type PriceSnapshot } from "./checkout";
import { syncHash, syncLead, ghlMode } from "./ghl";
import {
  allowance,
  planCancel,
  planPauseApply,
  planUsage,
  revenueReport,
  rollEntitlementYear,
  tierChangeParams,
  cancelStripeParams,
} from "./lifecycle";
import {
  FIRST_SYSTEM_LEAD,
  PAUSE_POLICY_VERSION,
  SCHEDULING,
  TERMS_VERSION,
  TIERS,
  isTierId,
  formatUsd,
} from "./offer";
import {
  CHECKOUT_TIMELINE_SANDBOX_CONFIRMED,
  databaseReady,
  foundingConfig,
  paymentBlockers,
  portalBlockers,
  sessionSecret,
  setupCentsFor,
  type AppEnv,
} from "./readiness";
import { mapStripeEvent, type StripeEventShape } from "./stripe-map";
import { newId, normalizeEmail, signToken, validEmail, verifyToken } from "./tokens";
import type { DealRecord, DealStage, MemberRecord, MembershipStore } from "./types";
import { DEAL_STAGES } from "./types";

export type StripeLike = {
  accounts: { retrieveCurrent(): Promise<{ id: string }> };
  prices: { retrieve(id: string): Promise<PriceSnapshot> };
  checkout: {
    sessions: {
      create(
        params: Record<string, unknown>,
        options?: { idempotencyKey?: string },
      ): Promise<{ id: string; url: string | null }>;
    };
  };
  billingPortal: {
    sessions: {
      create(params: { customer: string; return_url: string; configuration: string }): Promise<{ url: string }>;
    };
  };
  subscriptions: {
    update(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
  };
};

export type Deps = {
  env: AppEnv;
  store: MembershipStore;
  stripe: StripeLike | null;
  now: () => Date;
  fetchImpl?: typeof fetch;
  constructEvent?: (payload: string, header: string, secret: string) => StripeEventShape;
  staffEmail?: string | null;
};

const OPEN_STATUSES = new Set(["trialing", "active", "past_due", "paused", "cancel_scheduled"]);

function json(body: unknown, status = 200, headers?: HeadersInit): Response {
  return Response.json(body, { status, headers: { "cache-control": "no-store", ...Object.fromEntries(new Headers(headers)) } });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object") return null;
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

function cookieHeader(sessionId: string, secure: boolean): string {
  const parts = [`mh_member_session=${sessionId}`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=2592000"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function readSessionId(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)mh_member_session=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function toBilling(member: MemberRecord): MemberBilling {
  return {
    id: member.id,
    tier: member.tier,
    status: member.status,
    stripeCustomerId: member.stripeCustomerId,
    stripeSubscriptionId: member.stripeSubscriptionId,
    stripeSubscriptionItemId: member.stripeSubscriptionItemId,
    setupCents: member.setupCents,
    monthlyCents: member.monthlyCents,
    setupPaid: member.setupPaid,
    recurringStartAt: member.recurringStartAt,
    cancelAt: member.cancelAt,
    pauseCollection: member.pauseCollection,
    lastStatusEventCreated: member.lastStatusEventCreated,
    attention: member.attention,
    version: member.version,
  };
}

async function memberFromEvent(store: MembershipStore, event: ReturnType<typeof mapStripeEvent>): Promise<MemberRecord | null> {
  if ("memberId" in event && event.memberId) {
    const byId = await store.findMemberById(event.memberId);
    if (byId) return byId;
  }
  if ("subscriptionId" in event && event.subscriptionId) {
    const bySub = await store.findMemberBySubscription(event.subscriptionId);
    if (bySub) return bySub;
  }
  if ("customerId" in event && event.customerId) return store.findMemberByCustomer(event.customerId);
  return null;
}

export async function handleReadiness(deps: Deps): Promise<Response> {
  const founding = foundingConfig(deps.env);
  return json({
    payments: paymentBlockers(deps.env).length === 0 ? "blocked_until_account_lookup" : "blocked",
    paymentBlockers: paymentBlockers(deps.env).map((blocker) => blocker.operatorMessage),
    portal: portalBlockers(deps.env).some((blocker) => blocker.code.includes("PORTAL")) ? "not_configured" : "configured",
    founding: founding.enabled ? { enabled: true, cap: founding.cap } : { enabled: false, reason: founding.reason },
    ghl: ghlMode(deps.env),
    scheduling: SCHEDULING.status,
    messaging: "disabled",
    database: databaseReady(deps.env) ? "configured" : "missing",
    sandboxTimelineConfirmed: CHECKOUT_TIMELINE_SANDBOX_CONFIRMED,
    legalReview: "pending",
  });
}

export async function handleCheckout(request: Request, deps: Deps): Promise<Response> {
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  if (deps.store.kind === "unavailable") {
    return json({ ok: false, error: "database_not_configured", message: "Membership storage is not configured." }, 503);
  }
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: "invalid_json" }, 400);
  const tier = body.tier;
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;
  if (!isTierId(tier) || !validEmail(email) || !firstName || !lastName) {
    return json({ ok: false, error: "invalid_member" }, 400);
  }
  if (body.termsAccepted !== true || body.autorenewAccepted !== true) {
    return json({ ok: false, error: "consent_required" }, 400);
  }
  const blockers = paymentBlockers(deps.env);
  if (blockers.length || !deps.stripe) {
    return json({ ok: false, error: "payments_not_ready", message: blockers[0]?.publicMessage ?? "Payments are not ready." }, 503);
  }
  const secret = sessionSecret(deps.env);
  if (!secret) return json({ ok: false, error: "session_secret_missing" }, 503);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await deps.store.consumeRate(`checkout:${email}:${ip}`, deps.now(), 8, 60 * 60 * 1000);
  if (!allowed) return json({ ok: false, error: "rate_limited" }, 429);

  const now = deps.now();
  const founding = foundingConfig(deps.env);
  const useFounding = body.founding === true;
  if (useFounding && !founding.enabled) return json({ ok: false, error: "founding_closed" }, 409);
  const timeline = billingTimeline(now);
  const setupCents = setupCentsFor(deps.env, useFounding);
  const offer = TIERS[tier];
  let member = await deps.store.findMemberByEmail(email);
  if (member && OPEN_STATUSES.has(member.status)) return json({ ok: false, error: "already_member" }, 409);
  if (!member) {
    member = {
      id: newId(),
      email,
      phone,
      firstName,
      lastName,
      tier,
      status: "checkout_open",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripeSubscriptionItemId: null,
      monthlyCents: offer.monthlyCents,
      setupCents,
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
      termsVersion: TERMS_VERSION,
      lastStatusEventCreated: 0,
      version: 0,
      createdAt: now.toISOString(),
    };
  } else {
    member = {
      ...member,
      firstName,
      lastName,
      phone,
      tier,
      monthlyCents: offer.monthlyCents,
      setupCents,
      status: "checkout_open",
      recurringStartAt: timeline.firstRecurringAt.toISOString(),
      minimumTermEndsAt: timeline.minimumTermEndsAt.toISOString(),
      rateLockEndsAt: timeline.rateLockEndsAt.toISOString(),
      entitlementYearEndsAt: timeline.entitlementYearEndsAt.toISOString(),
    };
  }
  await deps.store.saveMember(member);
  await deps.store.addConsent({
    id: newId(),
    memberId: member.id,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: now.toISOString(),
    autorenewAcceptedAt: now.toISOString(),
  });

  const idempotencyKey = checkoutIdempotencyKey({
    memberId: member.id,
    tier,
    setupCents,
    termsVersion: TERMS_VERSION,
  });
  const existingCheckout = await deps.store.getCheckout(idempotencyKey);
  if (existingCheckout?.url && now.getTime() - new Date(existingCheckout.createdAt).getTime() < 30 * 60 * 1000) {
    return json({
      ok: true,
      url: existingCheckout.url,
      reused: true,
      disclosure: billingDisclosure(now, offer.monthlyCents, setupCents),
    });
  }

  let reservationId: string | null = null;
  if (useFounding && founding.enabled) {
    reservationId = newId();
    const reserved = await deps.store.reserveFounding({
      id: reservationId,
      memberId: member.id,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      cap: founding.cap,
    });
    if (reserved === "cap") return json({ ok: false, error: "founding_cap" }, 409);
  }

  const sessionId = newId();
  const returnToken = signToken({ purpose: "checkout_return", sid: sessionId, mid: member.id }, secret, 30 * 60, now);
  const built = buildCheckoutParams({
    env: deps.env,
    memberId: member.id,
    email,
    tier,
    useFounding,
    origin,
    now,
    returnToken,
    reservationId,
  });
  if (!built.ok) return json({ ok: false, error: "price_not_configured" }, 503);
  try {
    const account = await deps.stripe.accounts.retrieveCurrent();
    const accountBlockers = paymentBlockers(deps.env, account.id);
    if (accountBlockers.length) {
      if (reservationId) await deps.store.setFoundingStatus(reservationId, "released");
      return json({ ok: false, error: "payments_not_ready", message: accountBlockers[0]?.publicMessage }, 503);
    }
    const tierPrice = await deps.stripe.prices.retrieve(built.params.line_items[0]!.price);
    const setupPrice = await deps.stripe.prices.retrieve(built.params.line_items[1]!.price);
    const pricesOk =
      priceMatches(tierPrice, { id: built.params.line_items[0]!.price, cents: offer.monthlyCents, interval: "month" }) &&
      priceMatches(setupPrice, { id: built.params.line_items[1]!.price, cents: setupCents, interval: null });
    if (!pricesOk) {
      if (reservationId) await deps.store.setFoundingStatus(reservationId, "released");
      return json({ ok: false, error: "price_mismatch" }, 503);
    }
    const session = await deps.stripe.checkout.sessions.create(built.params as unknown as Record<string, unknown>, {
      idempotencyKey: built.idempotencyKey,
    });
    if (!session.url) {
      if (reservationId) await deps.store.setFoundingStatus(reservationId, "released");
      return json({ ok: false, error: "checkout_url_missing" }, 502);
    }
    await deps.store.saveCheckout({
      idempotencyKey: built.idempotencyKey,
      memberId: member.id,
      sessionId: session.id,
      url: session.url,
      reservationId,
      createdAt: now.toISOString(),
    });
    await deps.store.createSession({
      id: sessionId,
      memberId: member.id,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      active: false,
    });
    const dealId = newId();
    const deal: DealRecord = {
      id: dealId,
      memberId: member.id,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      stage: "checkout",
      assignee: "",
      nextFollowUp: null,
      ghlContactId: null,
      ghlOpportunityId: null,
      syncStatus: "not_connected",
      syncHash: syncHash({ stage: "checkout", assignee: "", followUp: "" }),
      locationId: null,
    };
    const ghl = await syncLead(
      deps.env,
      { email, phone, firstName, lastName, dealId },
      deps.fetchImpl ?? fetch,
    );
    deal.syncStatus = ghl.status;
    deal.ghlContactId = ghl.contactId;
    deal.ghlOpportunityId = ghl.opportunityId;
    deal.locationId = ghl.status === "not_connected" ? null : deps.env.GHL_LOCATION_ID?.trim() ?? null;
    await deps.store.saveDeal(deal);
    await deps.store.addActivity({
      id: newId(),
      dealId,
      actor: "checkout",
      action: "Checkout opened. No payment is confirmed until the processor webhook arrives.",
      createdAt: now.toISOString(),
    });
    return json({
      ok: true,
      url: session.url,
      reused: false,
      disclosure: billingDisclosure(now, offer.monthlyCents, setupCents),
      firstRecurringAt: formatStudio(timeline.firstRecurringAt),
      leadTime: FIRST_SYSTEM_LEAD,
    });
  } catch {
    if (reservationId) await deps.store.setFoundingStatus(reservationId, "released");
    member.status = "checkout_failed";
    await deps.store.saveMember(member);
    return json({ ok: false, error: "processor_error" }, 502);
  }
}

export async function handleReturn(request: Request, deps: Deps): Promise<Response> {
  const secret = sessionSecret(deps.env);
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!secret) return json({ ok: false, error: "session_secret_missing" }, 503);
  const payload = verifyToken(token, secret, deps.now());
  if (!payload || payload.purpose !== "checkout_return" || typeof payload.sid !== "string") {
    return json({ ok: false, error: "return_token_rejected" }, 400);
  }
  const session = await deps.store.findSession(payload.sid);
  if (!session || new Date(session.expiresAt).getTime() <= deps.now().getTime()) {
    return json({ ok: false, error: "return_expired" }, 400);
  }
  await deps.store.activateSession(session.id);
  const secure = safeAppOrigin(request, deps.env).startsWith("https://");
  return new Response(null, {
    status: 302,
    headers: {
      location: "/account/",
      "set-cookie": cookieHeader(session.id, secure),
      "cache-control": "no-store",
    },
  });
}

async function currentMember(request: Request, deps: Deps): Promise<MemberRecord | null> {
  const sessionId = readSessionId(request);
  if (!sessionId) return null;
  const session = await deps.store.findSession(sessionId);
  if (!session?.active || new Date(session.expiresAt).getTime() <= deps.now().getTime()) return null;
  return deps.store.findMemberById(session.memberId);
}

export async function handleAccountGet(request: Request, deps: Deps): Promise<Response> {
  const member = await currentMember(request, deps);
  if (!member) return json({ ok: false, error: "signed_out" }, 401);
  const invoices = await deps.store.listInvoices(member.id);
  const pauses = await deps.store.listPauseRequests(member.id);
  return json({
    ok: true,
    member: publicMember(member),
    invoices,
    pauses,
    scheduling: SCHEDULING,
    disclosure: billingDisclosure(new Date(member.createdAt), member.monthlyCents, member.setupCents),
  });
}

function publicMember(member: MemberRecord) {
  const timeline = {
    firstRecurringAt: member.recurringStartAt,
    minimumTermEndsAt: member.minimumTermEndsAt,
    rateLockEndsAt: member.rateLockEndsAt,
  };
  return {
    id: member.id,
    firstName: member.firstName,
    tier: member.tier,
    tierName: TIERS[member.tier].name,
    status: member.status,
    monthly: formatUsd(member.monthlyCents),
    setup: formatUsd(member.setupCents),
    setupPaid: member.setupPaid,
    attention: member.attention,
    systemsUsed: member.systemsUsed,
    systemsIncluded: TIERS[member.tier].systems,
    maintenanceUsed: member.maintenanceUsed,
    maintenanceIncluded: TIERS[member.tier].maintenance,
    pauseDaysUsed: member.pauseDaysUsed,
    cancelAt: member.cancelAt,
    pauseCollection: member.pauseCollection,
    ...timeline,
    paymentMethod: "Shown by the processor. This app does not store a card number.",
  };
}

export async function handleAccountPost(request: Request, deps: Deps): Promise<Response> {
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  if (action === "login") {
    return json({
      ok: false,
      error: "email_not_sent",
      message: "Membership email sign-in is not sent. No customer email is configured for this app.",
    }, 501);
  }
  const member = await currentMember(request, deps);
  if (!member) return json({ ok: false, error: "signed_out" }, 401);
  const body = (await readJson(request)) ?? {};
  if (action === "logout") {
    const sessionId = readSessionId(request);
    if (sessionId) await deps.store.deleteSession(sessionId);
    return json({ ok: true }, 200, { "set-cookie": "mh_member_session=; HttpOnly; Path=/; Max-Age=0" });
  }
  if (action === "cancel") return cancelMember(member, deps);
  if (action === "pause") return requestPause(member, body, deps);
  if (action === "tier") return changeTier(member, body, deps);
  if (action === "portal") return openPortal(member, deps, origin);
  return json({ ok: false, error: "unknown_action" }, 404);
}

async function cancelMember(member: MemberRecord, deps: Deps): Promise<Response> {
  if (!member.stripeSubscriptionId || !deps.stripe || paymentBlockers(deps.env).length) {
    return json({
      ok: false,
      error: "cancel_not_sent",
      message: "Cancellation was not sent to the processor. Nothing was changed.",
    }, 503);
  }
  const plan = planCancel(member.minimumTermEndsAt, deps.now());
  try {
    await deps.stripe.subscriptions.update(member.stripeSubscriptionId, cancelStripeParams(plan));
  } catch {
    return json({ ok: false, error: "processor_error", message: "The processor did not accept the cancellation. Nothing was marked cancelled." }, 502);
  }
  const cancelAt = plan.mode === "at_minimum_term" ? plan.cancelAt.toISOString() : member.cancelAt;
  await deps.store.saveMember({ ...member, status: "cancel_scheduled", cancelAt });
  return json({
    ok: true,
    cancelAt,
    message:
      plan.mode === "at_minimum_term"
        ? `The 3-month minimum is still in effect, so cancellation is scheduled for ${formatStudio(plan.cancelAt)}, not today. No cancellation fee was added. This application does not issue a refund.`
        : "The processor accepted a cancellation at the end of the current paid period. No cancellation fee was added. This application does not issue a refund.",
  });
}

async function requestPause(member: MemberRecord, body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const days = Number(body.days);
  const planned = planPauseApply(member, days, deps.now());
  if (!planned.ok) return json({ ok: false, error: planned.reason === "cap" ? "pause_cap" : "invalid_pause" }, 400);
  const request = {
    id: newId(),
    memberId: member.id,
    days,
    status: "requested" as const,
    policyVersion: PAUSE_POLICY_VERSION,
    createdAt: deps.now().toISOString(),
  };
  await deps.store.savePauseRequest(request);
  if (deps.env.MEMBERSHIP_PAUSE_SELF_SERVE !== "true") {
    return json({
      ok: true,
      applied: false,
      message:
        "Pause request recorded. Billing is unchanged until the studio applies it. While a pause is applied, collection is voided, visits stop, and the minimum term and rate lock move forward by the paused days. That rule is pending attorney review.",
    });
  }
  return applyPause(member, request.id, days, deps);
}

export async function applyPause(member: MemberRecord, requestId: string, days: number, deps: Deps): Promise<Response> {
  const planned = planPauseApply(member, days, deps.now());
  if (!planned.ok) return json({ ok: false, error: "pause_cap" }, 400);
  if (!member.stripeSubscriptionId || !deps.stripe || paymentBlockers(deps.env).length) {
    return json({ ok: false, error: "pause_not_applied", message: "Billing was not changed because the processor is not ready." }, 503);
  }
  try {
    await deps.stripe.subscriptions.update(member.stripeSubscriptionId, planned.apply.stripe);
  } catch {
    return json({ ok: false, error: "processor_error" }, 502);
  }
  await deps.store.saveMember({
    ...member,
    status: "paused",
    pauseCollection: true,
    pauseDaysUsed: planned.apply.pauseDaysUsed,
    minimumTermEndsAt: planned.apply.minimumTermEndsAt.toISOString(),
    rateLockEndsAt: planned.apply.rateLockEndsAt.toISOString(),
    entitlementYearEndsAt: planned.apply.entitlementYearEndsAt.toISOString(),
  });
  await deps.store.savePauseRequest({
    id: requestId,
    memberId: member.id,
    days,
    status: "applied",
    policyVersion: planned.apply.policyVersion,
    createdAt: deps.now().toISOString(),
  });
  return json({
    ok: true,
    applied: true,
    resumesAt: planned.apply.resumesAt.toISOString(),
    message: "The processor will void membership invoices until the resume time. Studio use is suspended. The minimum term and rate lock were extended by the same number of days.",
  });
}

async function changeTier(member: MemberRecord, body: Record<string, unknown>, deps: Deps): Promise<Response> {
  if (!isTierId(body.tier)) return json({ ok: false, error: "invalid_tier" }, 400);
  if (!member.stripeSubscriptionId || !member.stripeSubscriptionItemId || !deps.stripe || paymentBlockers(deps.env).length) {
    return json({ ok: false, error: "tier_not_changed", message: "The tier was not changed because the processor is not ready." }, 503);
  }
  const priceId = deps.env[`STRIPE_PRICE_${body.tier.toUpperCase()}`]?.trim();
  if (!priceId) return json({ ok: false, error: "price_not_configured" }, 503);
  const price = await deps.stripe.prices.retrieve(priceId);
  if (!priceMatches(price, { id: priceId, cents: TIERS[body.tier].monthlyCents, interval: "month" })) {
    return json({ ok: false, error: "price_mismatch" }, 503);
  }
  const params = tierChangeParams(member.stripeSubscriptionItemId, priceId);
  if ("add_invoice_items" in params || JSON.stringify(params).includes("change_fee")) {
    return json({ ok: false, error: "fee_rejected" }, 500);
  }
  try {
    await deps.stripe.subscriptions.update(member.stripeSubscriptionId, params);
  } catch {
    return json({ ok: false, error: "processor_error" }, 502);
  }
  const next = TIERS[body.tier];
  const over = member.systemsUsed > next.systems || member.maintenanceUsed > next.maintenance;
  await deps.store.saveMember({
    ...member,
    tier: body.tier,
    monthlyCents: next.monthlyCents,
    attention: over ? "usage_over_new_allowance" : member.attention,
  });
  return json({
    ok: true,
    message: over
      ? "The tier changed with processor proration and no change fee. Recorded use this year is above the new allowance, so further use waits. A manual adjustment tool is not part of this app."
      : "The tier changed with processor proration and no change fee. The minimum term did not restart.",
  });
}

async function openPortal(member: MemberRecord, deps: Deps, origin: string): Promise<Response> {
  const blockers = portalBlockers(deps.env);
  if (blockers.length || !deps.stripe || !member.stripeCustomerId) {
    return json({ ok: false, error: "portal_not_configured", message: blockers.at(-1)?.publicMessage ?? "Portal is not available." }, 503);
  }
  const configuration = deps.env.STRIPE_PORTAL_CONFIGURATION_ID!.trim();
  const session = await deps.stripe.billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${origin}/account/`,
    configuration,
  });
  const returned = new URL(session.url);
  if (returned.protocol !== "https:") return json({ ok: false, error: "portal_url_rejected" }, 502);
  return json({ ok: true, url: session.url });
}

export async function handleWebhook(request: Request, deps: Deps): Promise<Response> {
  const secret = deps.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!secret || !deps.constructEvent) return json({ ok: false, error: "webhook_not_configured" }, 503);
  const signature = request.headers.get("stripe-signature");
  if (!signature) return json({ ok: false, error: "missing_signature" }, 400);
  const raw = await request.text();
  let event: StripeEventShape;
  try {
    event = deps.constructEvent(raw, signature, secret);
  } catch {
    return json({ ok: false, error: "bad_signature" }, 400);
  }
  const claim = await deps.store.claimEvent(event.id, event.type);
  if (claim === "duplicate") return json({ ok: true, duplicate: true });
  const internal = mapStripeEvent(event);
  const member = await memberFromEvent(deps.store, internal);
  const seen = new Set<string>();
  if (await deps.store.seenEvent(event.id)) seen.add(event.id);
  const effect = reduceBillingEvent(member ? toBilling(member) : null, internal, seen);
  if (effect.duplicate) {
    await deps.store.finishEvent(event.id, "processed");
    return json({ ok: true, duplicate: true });
  }
  try {
    if (member && effect.statusPatch && !effect.staleStatus) {
      const next = { ...member, ...effect.statusPatch, version: member.version };
      const saved = await deps.store.compareAndSave(next, member.version);
      if (saved === "conflict") {
        await deps.store.finishEvent(event.id, "failed");
        return json({ ok: false, error: "conflict" }, 409);
      }
    }
    if (effect.invoice) await deps.store.upsertInvoice(effect.invoice);
    if (effect.refundCents > 0) {
      await deps.store.upsertInvoice({
        id: `refund_${event.id}`,
        memberId: member?.id ?? null,
        kind: "other",
        status: "paid",
        amountPaid: 0,
        amountRefunded: effect.refundCents,
      });
    }
    if (effect.founding === "release" && "reservationId" in internal && internal.reservationId) {
      await deps.store.setFoundingStatus(internal.reservationId, "released");
    }
    if (effect.founding === "convert" && "reservationId" in internal && internal.reservationId) {
      await deps.store.setFoundingStatus(internal.reservationId, "converted");
    }
    if (effect.attention && member) {
      await deps.store.saveMember({ ...(await deps.store.findMemberById(member.id))!, attention: effect.attention });
    }
    await deps.store.finishEvent(event.id, "processed");
    return json({ ok: true, unmapped: effect.unmapped, stale: effect.staleStatus });
  } catch {
    await deps.store.finishEvent(event.id, "failed");
    return json({ ok: false, error: "webhook_failed" }, 500);
  }
}

export async function handleHub(request: Request, deps: Deps): Promise<Response> {
  const role = staffRole(deps.staffEmail, deps.env);
  if (!role) return json({ ok: false, error: "staff_denied" }, 401);
  if (deps.store.kind === "unavailable") return json({ ok: false, error: "database_not_configured" }, 503);
  if (request.method === "GET") return json(await hubSnapshot(deps));
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  const body = (await readJson(request)) ?? {};
  const action = new URL(request.url).searchParams.get("action");
  if (action === "deal") return saveDealAction(body, deps);
  if (action === "note") return addNoteAction(body, deps);
  if (action === "usage") return usageAction(body, deps);
  if (action === "pause") return staffPause(body, deps);
  if (action === "draft") return saveDraftAction(body, deps);
  if (action === "send") return json({ ok: false, error: "messaging_disabled", message: "No customer email or SMS is sent from this hub." }, 403);
  return json({ ok: false, error: "unknown_action" }, 404);
}

async function hubSnapshot(deps: Deps) {
  const deals = await deps.store.listDeals();
  const members = await deps.store.listMembers();
  const invoices = await deps.store.listInvoices();
  const stage = deals.reduce<Record<string, number>>((counts, deal) => {
    counts[deal.stage] = (counts[deal.stage] ?? 0) + 1;
    return counts;
  }, {});
  return {
    ok: true,
    ghl: ghlMode(deps.env),
    scheduling: SCHEDULING,
    messaging: "disabled",
    assignees: assignableStaff(deps.env),
    stages: DEAL_STAGES,
    stageCounts: stage,
    revenue: revenueReport(invoices, members),
    deals,
  };
}

async function saveDealAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : newId();
  const existing = (await deps.store.listDeals()).find((deal) => deal.id === id);
  const stage = DEAL_STAGES.includes(body.stage as DealStage) ? (body.stage as DealStage) : existing?.stage ?? "new";
  const assignee = typeof body.assignee === "string" ? body.assignee.trim().toLowerCase() : existing?.assignee ?? "";
  if (assignee && !assignableStaff(deps.env).includes(assignee)) return json({ ok: false, error: "assignee_rejected" }, 400);
  const followUp = typeof body.nextFollowUp === "string" ? body.nextFollowUp : existing?.nextFollowUp ?? null;
  const deal: DealRecord = {
    id,
    memberId: existing?.memberId ?? null,
    name: typeof body.name === "string" ? body.name.trim() : existing?.name ?? "",
    email: typeof body.email === "string" ? normalizeEmail(body.email) : existing?.email ?? "",
    phone: typeof body.phone === "string" ? body.phone : existing?.phone ?? null,
    stage,
    assignee,
    nextFollowUp: followUp,
    ghlContactId: existing?.ghlContactId ?? null,
    ghlOpportunityId: existing?.ghlOpportunityId ?? null,
    syncStatus: ghlMode(deps.env) === "off" ? "not_connected" : existing?.syncStatus ?? "local_only",
    syncHash: syncHash({ stage, assignee, followUp: followUp ?? "" }),
    locationId: ghlMode(deps.env) === "off" ? null : deps.env.GHL_LOCATION_ID?.trim() ?? null,
  };
  if (!deal.name || !validEmail(deal.email)) return json({ ok: false, error: "invalid_deal" }, 400);
  const decision = existing ? "push" : "push";
  if (decision === "push" && ghlMode(deps.env) !== "off") {
    const synced = await syncLead(
      deps.env,
      { email: deal.email, phone: deal.phone, firstName: deal.name, lastName: "", dealId: deal.id },
      deps.fetchImpl ?? fetch,
    );
    deal.syncStatus = synced.status;
    deal.ghlContactId = synced.contactId ?? deal.ghlContactId;
    deal.ghlOpportunityId = synced.opportunityId ?? deal.ghlOpportunityId;
  }
  await deps.store.saveDeal(deal);
  await deps.store.addActivity({
    id: newId(),
    dealId: deal.id,
    actor: deps.staffEmail ?? "staff",
    action: `Stage ${deal.stage}. Assignee ${deal.assignee || "unassigned"}.`,
    createdAt: deps.now().toISOString(),
  });
  return json({ ok: true, deal });
}

async function addNoteAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const dealId = typeof body.dealId === "string" ? body.dealId : "";
  const note = typeof body.body === "string" ? body.body.trim() : "";
  if (!dealId || !note) return json({ ok: false, error: "invalid_note" }, 400);
  await deps.store.addNote({
    id: newId(),
    dealId,
    author: deps.staffEmail ?? "staff",
    body: note,
    createdAt: deps.now().toISOString(),
  });
  await deps.store.addActivity({
    id: newId(),
    dealId,
    actor: deps.staffEmail ?? "staff",
    action: "Note added",
    createdAt: deps.now().toISOString(),
  });
  return json({ ok: true });
}

async function usageAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const kind = body.kind === "maintenance" ? "maintenance" : body.kind === "system" ? "system" : null;
  const quantity = Number(body.quantity ?? 1);
  const key = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim() ? body.idempotencyKey.trim() : "";
  if (!memberId || !kind || !key) return json({ ok: false, error: "invalid_usage" }, 400);
  const member = await deps.store.findMemberById(memberId);
  if (!member) return json({ ok: false, error: "member_not_found" }, 404);
  const rolled = rollEntitlementYear(member, deps.now());
  if (rolled.rolled) await deps.store.saveMember({ ...member, ...rolled });
  const current = rolled.rolled ? { ...member, ...rolled } : member;
  const decision = planUsage(current, kind, quantity);
  if (!decision.ok) return json({ ok: false, error: decision.reason }, 409);
  const result = await deps.store.recordUsage({
    memberId,
    kind,
    quantity,
    idempotencyKey: key,
    allowance: allowance(current.tier, kind),
  });
  if (result === "rejected") return json({ ok: false, error: "exceeds" }, 409);
  return json({ ok: true, result });
}

async function staffPause(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const member = await deps.store.findMemberById(typeof body.memberId === "string" ? body.memberId : "");
  if (!member) return json({ ok: false, error: "member_not_found" }, 404);
  const days = Number(body.days);
  const requestId = typeof body.requestId === "string" ? body.requestId : newId();
  return applyPause(member, requestId, days, deps);
}

async function saveDraftAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const dealId = typeof body.dealId === "string" ? body.dealId : "";
  const draft = typeof body.body === "string" ? body.body : "";
  if (!dealId) return json({ ok: false, error: "invalid_draft" }, 400);
  await deps.store.saveDraft({ id: dealId, dealId, body: draft, updatedAt: deps.now().toISOString() });
  return json({ ok: true, sent: false, message: "Draft saved. Nothing was sent." });
}

export async function loadAccountPage(request: Request, deps: Deps) {
  const member = await currentMember(request, deps);
  if (!member) return { member: null, invoices: [], pauses: [] };
  return {
    member: publicMember(member),
    invoices: await deps.store.listInvoices(member.id),
    pauses: await deps.store.listPauseRequests(member.id),
  };
}
