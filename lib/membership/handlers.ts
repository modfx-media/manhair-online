import { alertAfterFailure, alertLogFields, alertsForPayment, customerAlertsReady, ownerAlertText, ownerAlertsReady, type AlertRecord } from "./alerts";
import { staffRole, assignableStaff } from "./access";
import { reduceBillingEvent, type MemberBilling } from "./billing";
import { billingDisclosure, billingTimeline, formatStudio } from "./dates";
import { buildCheckoutParams, checkoutIdempotencyKey, isSameOrigin, priceMatches, safeAppOrigin, type PriceSnapshot } from "./checkout";
import { ghlMode, pushOpportunityStage, syncHash, syncLead } from "./ghl";
import { MANHAIR_GHL_LOCATION_ID, resolveGhlTarget } from "./manhair-ghl";
import { ghlFreshness, mergeInboundLead, parseInbound, pullHighLevel, verifyGhlSignature, webhookTimestampFresh } from "./ghl-inbound";
import { reviewedLifecycle } from "./lifecycle-review";
import { isMembershipSchemaMissing } from "./sql-store";
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
  portalConfigurationId,
  sessionSecret,
  setupCentsFor,
  type AppEnv,
} from "./readiness";
import { mapStripeEvent, type StripeEventShape } from "./stripe-map";
import { hashSecret, newId, newSecret, normalizeEmail, signToken, validEmail, verifyToken } from "./tokens";
import type { DealRecord, MemberRecord, MembershipStore } from "./types";
import { DEAL_STAGES, isSalesStage } from "./types";

export const BILLING_PORTAL_FEATURES = {
  invoice_history: { enabled: true },
  payment_method_update: { enabled: true },
  subscription_cancel: { enabled: false },
  subscription_update: { enabled: false },
  customer_update: { enabled: false },
} as const;

export type PortalConfigurationSnapshot = {
  id: string;
  features?: Partial<Record<keyof typeof BILLING_PORTAL_FEATURES, { enabled?: boolean }>>;
};

/** True only when Stripe returned the requested configuration and its features match the approved billing-only set. */
export function portalConfigurationMatches(configuration: PortalConfigurationSnapshot | null, expectedId: string): boolean {
  if (!configuration || configuration.id !== expectedId) return false;
  const features = configuration.features ?? {};
  return (Object.keys(BILLING_PORTAL_FEATURES) as Array<keyof typeof BILLING_PORTAL_FEATURES>).every(
    (key) => features[key]?.enabled === BILLING_PORTAL_FEATURES[key].enabled,
  );
}

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
    configurations: {
      retrieve(id: string): Promise<PortalConfigurationSnapshot>;
    };
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
  deliverRecovery?: (input: { to: string; url: string }) => Promise<{ sent: boolean; reason?: string }>;
  verifyGhl?: (rawBody: string, signature: string | null) => boolean;
};

const OPEN_STATUSES = new Set(["trialing", "active", "past_due", "paused", "cancel_scheduled"]);

function storageNotReady(): Response {
  return json({
    ok: false,
    synced: false,
    error: "database_not_configured",
    message: "Membership storage is not ready on this site yet. Nothing was saved, synced, charged, or sent.",
  }, 503);
}

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
    portal: paymentBlockers(deps.env).length === 0 ? "billing_only_when_customer_exists" : "not_configured",
    recoveryEmail: recoveryEmailReady(deps.env) ? "enabled" : "not_configured",
    founding: founding.enabled ? { enabled: true, cap: founding.cap } : { enabled: false, reason: founding.reason },
    ghl: ghlMode(deps.env),
    scheduling: SCHEDULING.status,
    messaging: "disabled",
    database: databaseReady(deps.env) ? "configured" : "missing",
    sandboxTimelineConfirmed: CHECKOUT_TIMELINE_SANDBOX_CONFIRMED,
    legalReview: "pending",
  });
}

export async function handleConsultation(request: Request, deps: Deps): Promise<Response> {
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  if (deps.store.kind === "unavailable") {
    return json({
      ok: false,
      error: "database_not_configured",
      message: "This preview has no membership database, so the consultation was not stored. Nothing was sent and nothing was marked synced.",
    }, 503);
  }
  const body = await readJson(request);
  if (!body) return json({ ok: false, error: "invalid_json" }, 400);
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
  const phone = typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : null;
  if (!validEmail(email) || !firstName || !lastName) return json({ ok: false, error: "invalid_lead" }, 400);
  try {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const allowed = await deps.store.consumeRate(`consult:${email}:${ip}`, deps.now(), 6, 60 * 60 * 1000);
  if (!allowed) return json({ ok: false, error: "rate_limited", message: "Too many consultation requests. Nothing was sent." }, 429);
  const marketing = body.marketingConsent === true;
  const dealId = newId();
  const now = deps.now().toISOString();
  await deps.store.saveDeal({
    id: dealId,
    memberId: null,
    name: `${firstName} ${lastName}`,
    email,
    phone,
    stage: "New Leads",
    assignee: "",
    nextFollowUp: null,
    ghlContactId: null,
    ghlOpportunityId: null,
    syncStatus: "local_only",
    syncHash: syncHash({ stage: "New Leads", assignee: "", followUp: marketing ? "marketing" : "" }),
    locationId: null,
    remoteUpdatedAt: null,
    staffEditedAt: null,
  });
  await deps.store.addActivity({
    id: newId(),
    dealId,
    actor: "consultation",
    action: marketing
      ? `Consultation stored ${now}. Marketing consent recorded. Not synced. No message sent.`
      : `Consultation stored ${now}. Marketing consent declined. Not synced. No message sent.`,
    createdAt: now,
  });
  return json({
    ok: true,
    synced: false,
    message: "Saved for the studio as a local lead. It is not in HighLevel, and no email was sent.",
  });
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return storageNotReady();
    throw error;
  }
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
  const idempotencyKey = checkoutIdempotencyKey({
    email,
    tier,
    setupCents,
    termsVersion: TERMS_VERSION,
  });
  const existingCheckout = await deps.store.getCheckout(idempotencyKey);
  if (existingCheckout?.url && now.getTime() - new Date(existingCheckout.createdAt).getTime() < 30 * 60 * 1000) {
    const open = await deps.store.findMemberById(existingCheckout.memberId);
    if (open?.status === "checkout_open") {
      return json({
        ok: true,
        url: existingCheckout.url,
        reused: true,
        disclosure: billingDisclosure(now, offer.monthlyCents, setupCents),
      });
    }
  }
  const holders = await deps.store.listMembersByEmail(email);
  if (holders.some((holder) => OPEN_STATUSES.has(holder.status))) {
    return json({
      ok: false,
      error: "already_member",
      message: "A membership is already open for this email. Entering the email does not sign you in.",
    }, 409);
  }
  const member: MemberRecord = {
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
  await deps.store.saveMember(member);
  await deps.store.addConsent({
    id: newId(),
    memberId: member.id,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: now.toISOString(),
    autorenewAcceptedAt: now.toISOString(),
  });

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
      tokenHash: "",
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      active: false,
      returnUsed: false,
    });
    const dealId = newId();
    const deal: DealRecord = {
      id: dealId,
      memberId: member.id,
      name: `${firstName} ${lastName}`,
      email,
      phone,
      stage: "New Leads",
      assignee: "",
      nextFollowUp: null,
      ghlContactId: null,
      ghlOpportunityId: null,
      syncStatus: "not_connected",
      syncHash: syncHash({ stage: "New Leads", assignee: "", followUp: "" }),
      locationId: null,
      remoteUpdatedAt: null,
      staffEditedAt: null,
    };
    const ghl = await syncLead(
      deps.env,
      { email, phone, firstName, lastName, dealId },
      deps.fetchImpl ?? fetch,
    );
    deal.syncStatus = ghl.status;
    deal.ghlContactId = ghl.contactId;
    deal.ghlOpportunityId = ghl.opportunityId;
    const target = resolveGhlTarget(deps.env);
    deal.locationId = ghl.status === "pushed" && target.ok ? target.locationId : null;
    await deps.store.saveDeal(deal);
    await deps.store.addActivity({
      id: newId(),
      dealId,
      actor: "checkout",
      action: body.marketingConsent === true
        ? "Checkout opened. Marketing messages accepted. No payment is confirmed until the processor webhook arrives, and no message is sent."
        : "Checkout opened. Marketing messages declined. No payment is confirmed until the processor webhook arrives, and no message is sent.",
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
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return storageNotReady();
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
  if (!payload || payload.purpose !== "checkout_return" || typeof payload.sid !== "string" || typeof payload.mid !== "string") {
    return json({ ok: false, error: "return_token_rejected" }, 400);
  }
  const session = await deps.store.findSession(payload.sid);
  if (!session || session.memberId !== payload.mid || session.returnUsed || new Date(session.expiresAt).getTime() <= deps.now().getTime()) {
    return json({ ok: false, error: "return_expired" }, 400);
  }
  const raw = newSecret();
  const expiresAt = new Date(deps.now().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const tokenHash = hashSecret(raw);
  await deps.store.activateSession(session.id, tokenHash, expiresAt);
  const activated = await deps.store.findSession(session.id);
  if (activated?.tokenHash !== tokenHash) return json({ ok: false, error: "return_replay" }, 400);
  await deps.store.addAuthAudit({ id: newId(), memberId: session.memberId, action: "checkout_return", createdAt: deps.now().toISOString() });
  const secure = safeAppOrigin(request, deps.env).startsWith("https://");
  return new Response(null, {
    status: 302,
    headers: {
      location: "/account/?next=checkout",
      "set-cookie": cookieHeader(raw, secure),
      "cache-control": "no-store",
    },
  });
}

async function currentMember(request: Request, deps: Deps): Promise<MemberRecord | null> {
  const raw = readSessionId(request);
  if (!raw) return null;
  const session = await deps.store.findSessionByHash(hashSecret(raw));
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
  const body = (await readJson(request)) ?? {};
  if (action === "recover") return recoverMember(body, request, deps);
  if (action === "logout") return logoutMember(request, deps);
  const member = await currentMember(request, deps);
  if (!member) return json({ ok: false, error: "signed_out" }, 401);
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
      billingChanged: false,
      message:
        "Pause request recorded only. Billing is not paused, collection is unchanged, and studio access is unchanged. A staff member has to apply the pause before any of that happens.",
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
  if (!member.stripeCustomerId || !deps.stripe) {
    return json({
      ok: false,
      error: "portal_not_configured",
      message: "The processor has not confirmed a customer for this membership yet.",
    }, 503);
  }
  if (portalBlockers(deps.env).length) {
    return json({
      ok: false,
      error: "portal_not_configured",
      message: paymentBlockers(deps.env).length
        ? "Payment method update is not available until the confirmed payment account is connected."
        : "Payment method update is not available until STRIPE_PORTAL_CONFIGURATION_ID is set.",
    }, 503);
  }
  const configurationId = portalConfigurationId(deps.env);
  if (!configurationId) {
    return json({ ok: false, error: "portal_not_configured" }, 503);
  }
  let configuration: PortalConfigurationSnapshot;
  try {
    configuration = await deps.stripe.billingPortal.configurations.retrieve(configurationId);
  } catch {
    return json({
      ok: false,
      error: "portal_configuration_rejected",
      message: "The billing portal configuration could not be read. No portal configuration was created or changed.",
    }, 503);
  }
  if (!portalConfigurationMatches(configuration, configurationId)) {
    return json({
      ok: false,
      error: "portal_configuration_rejected",
      message: "The billing portal configuration does not match the approved invoice and payment-method settings. It was not changed.",
    }, 503);
  }
  const session = await deps.stripe.billingPortal.sessions.create({
    customer: member.stripeCustomerId,
    return_url: `${origin}/account/`,
    configuration: configurationId,
  });
  const returned = new URL(session.url);
  if (returned.protocol !== "https:") return json({ ok: false, error: "portal_url_rejected" }, 502);
  return json({ ok: true, url: session.url });
}

export function recoveryEmailReady(env: AppEnv): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.RESEND_FROM?.trim() && env.MEMBERSHIP_RECOVERY_SEND === "true");
}

export async function defaultRecoveryDelivery(
  env: AppEnv,
  message: { to: string; url: string },
  fetchImpl: typeof fetch,
): Promise<{ sent: boolean; reason?: string }> {
  if (!recoveryEmailReady(env)) {
    return {
      sent: false,
      reason: "Account recovery email is not enabled. No message was sent. The membership stays on file and does not need another payment.",
    };
  }
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: message.to,
      subject: "Your ManHair membership sign-in link",
      text: `This link signs you in to the membership you already have. It does not start a new payment. ${message.url}`,
    }),
  });
  if (!response.ok) return { sent: false, reason: "The email provider did not accept the sign-in link. No session was opened." };
  return { sent: true };
}

async function recoverMember(body: Record<string, unknown>, request: Request, deps: Deps): Promise<Response> {
  const origin = safeAppOrigin(request, deps.env);
  const sender = deps.deliverRecovery ?? ((input: { to: string; url: string }) => defaultRecoveryDelivery(deps.env, input, deps.fetchImpl ?? fetch));
  if (!deps.deliverRecovery && !recoveryEmailReady(deps.env)) {
    const blocked = await defaultRecoveryDelivery(deps.env, { to: "", url: "" }, async () => {
      throw new Error("recovery email must not be attempted");
    });
    return json({ ok: false, error: "email_not_sent", billingRequired: false, message: blocked.reason }, 501);
  }
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const holders = email && validEmail(email) ? await deps.store.listMembersByEmail(email) : [];
  const eligible = holders.filter((holder) => holder.status !== "checkout_open" && holder.status !== "checkout_failed");
  if (eligible.length === 1) {
    const secret = newSecret();
    const expiresAt = new Date(deps.now().getTime() + 30 * 60 * 1000).toISOString();
    await deps.store.saveRecovery({ tokenHash: hashSecret(secret), memberId: eligible[0]!.id, expiresAt, used: false });
    const sent = await sender({ to: email, url: `${origin}/api/membership/recover/?token=${encodeURIComponent(secret)}` });
    if (!sent.sent) {
      await deps.store.consumeRecovery(hashSecret(secret), deps.now());
      return json({ ok: false, error: "email_not_sent", billingRequired: false, message: sent.reason ?? "No message was sent." }, 502);
    }
    await deps.store.addAuthAudit({ id: newId(), memberId: eligible[0]!.id, action: "recovery_issued", createdAt: deps.now().toISOString() });
  }
  return json({
    ok: true,
    billingRequired: false,
    message: "If an account exists, a sign-in link was sent. Entering an email does not sign you in.",
  });
}

export async function handleRecover(request: Request, deps: Deps): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const memberId = token ? await deps.store.consumeRecovery(hashSecret(token), deps.now()) : null;
  if (!memberId) return json({ ok: false, error: "recovery_rejected" }, 400);
  const raw = newSecret();
  const expiresAt = new Date(deps.now().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  await deps.store.createSession({
    id: newId(),
    memberId,
    tokenHash: hashSecret(raw),
    expiresAt,
    active: true,
    returnUsed: true,
  });
  await deps.store.addAuthAudit({ id: newId(), memberId, action: "recovery_redeemed", createdAt: deps.now().toISOString() });
  const secure = safeAppOrigin(request, deps.env).startsWith("https://");
  return new Response(null, {
    status: 302,
    headers: { location: "/account/", "set-cookie": cookieHeader(raw, secure), "cache-control": "no-store" },
  });
}

async function logoutMember(request: Request, deps: Deps): Promise<Response> {
  const raw = readSessionId(request);
  if (raw) {
    const session = await deps.store.findSessionByHash(hashSecret(raw));
    await deps.store.deleteSessionByHash(hashSecret(raw));
    if (session) {
      await deps.store.addAuthAudit({ id: newId(), memberId: session.memberId, action: "logout", createdAt: deps.now().toISOString() });
    }
  }
  return json({ ok: true }, 200, { "set-cookie": "mh_member_session=; HttpOnly; Path=/; Max-Age=0" });
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
  const previousStatus = member?.status ?? null;
  const seen = new Set<string>();
  if (await deps.store.seenEvent(event.id)) seen.add(event.id);
  const effect = reduceBillingEvent(member ? toBilling(member) : null, internal, seen);
  if (effect.duplicate) {
    await deps.store.finishEvent(event.id, "processed");
    return json({ ok: true, duplicate: true });
  }
  try {
    if (member && !effect.staleStatus && (effect.statusPatch || effect.attention)) {
      const next = {
        ...member,
        ...effect.statusPatch,
        attention: effect.attention ?? effect.statusPatch?.attention ?? member.attention,
        version: member.version,
      };
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
    await recordPaymentAlerts(deps, {
      eventId: event.id,
      previousStatus,
      invoice: effect.invoice,
      webhookFailed: false,
      memberId: member?.id ?? effect.invoice?.memberId ?? null,
    });
    await deps.store.finishEvent(event.id, "processed");
    return json({ ok: true, unmapped: effect.unmapped, stale: effect.staleStatus });
  } catch {
    await deps.store.finishEvent(event.id, "failed");
    await recordPaymentAlerts(deps, {
      eventId: event.id,
      previousStatus,
      invoice: null,
      webhookFailed: true,
      memberId: member?.id ?? null,
    });
    return json({ ok: false, error: "webhook_failed" }, 500);
  }
}

async function recordPaymentAlerts(
  deps: Deps,
  input: {
    eventId: string;
    previousStatus: MemberRecord["status"] | null;
    invoice: { kind: string; status: "paid" | "failed"; amountPaid: number; memberId: string | null } | null;
    webhookFailed: boolean;
    memberId: string | null;
  },
): Promise<void> {
  try {
    const drafts = alertsForPayment({ ...input, now: deps.now(), env: deps.env });
    for (const draft of drafts) {
      await deps.store.enqueueAlert({
        ...draft,
        id: newId(),
        attempts: 0,
        lastError: null,
        createdAt: deps.now().toISOString(),
      });
    }
    await drainAlerts(deps);
  } catch {
    console.info(JSON.stringify({ scope: "membership", event: "alert_enqueue_failed", sourceEventId: input.eventId }));
  }
}

export async function drainAlerts(deps: Deps): Promise<{ delivered: number; failed: number; held: number; unavailable?: boolean }> {
  let due;
  try {
    due = await deps.store.claimDueAlerts(deps.now(), 20);
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return { delivered: 0, failed: 0, held: 0, unavailable: true };
    throw error;
  }
  let delivered = 0;
  let failed = 0;
  for (const alert of due) {
    const outcome = await deliverAlert(deps, alert);
    if (outcome === "held") continue;
    if (outcome === "delivered") delivered += 1;
    else failed += 1;
  }
  const held = (await deps.store.listAlerts()).filter((alert) => alert.status === "held").length;
  return { delivered, failed, held };
}

async function deliverAlert(deps: Deps, alert: AlertRecord): Promise<"delivered" | "failed" | "held"> {
  const ready = alert.audience === "owner" ? ownerAlertsReady(deps.env) : customerAlertsReady(deps.env);
  if (!ready) {
    await deps.store.updateAlert(alert.id, { status: "held", nextAttemptAt: null, lastError: "alerts_not_configured" });
    return "held";
  }
  let to = deps.env.MEMBERSHIP_ALERT_TO?.trim() ?? "";
  if (alert.audience === "customer") {
    const member = alert.memberId ? await deps.store.findMemberById(alert.memberId) : null;
    to = member?.email ?? "";
    if (!to) {
      await deps.store.updateAlert(alert.id, { status: "failed", nextAttemptAt: null, lastError: "member_email_missing" });
      return "failed";
    }
  }
  try {
    const response = await (deps.fetchImpl ?? fetch)("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${deps.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: deps.env.RESEND_FROM,
        to,
        subject: `ManHair ${alert.kind.replaceAll("_", " ")}`,
        text: ownerAlertText(alert),
      }),
    });
    if (!response.ok) throw new Error("provider_rejected");
    await deps.store.updateAlert(alert.id, { status: "delivered", lastError: null });
    console.info(JSON.stringify({ scope: "membership", event: "alert_delivered", ...alertLogFields(alert) }));
    return "delivered";
  } catch {
    const next = alertAfterFailure(alert.attempts, deps.now());
    await deps.store.updateAlert(alert.id, { ...next, lastError: "delivery_failed" });
    console.info(JSON.stringify({ scope: "membership", event: "alert_delivery_failed", ...alertLogFields({ ...alert, status: next.status }) }));
    return "failed";
  }
}

export async function handleHub(request: Request, deps: Deps): Promise<Response> {
  const role = staffRole(deps.staffEmail, deps.env);
  if (!role) return json({ ok: false, error: "staff_denied" }, 401);
  if (deps.store.kind === "unavailable") return json({ ok: false, error: "database_not_configured" }, 503);
  try {
  if (request.method === "GET") return json(await hubSnapshot(deps));
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  const body = (await readJson(request)) ?? {};
  const action = new URL(request.url).searchParams.get("action");
  if (action === "deal") return saveDealAction(body, deps);
  if (action === "delete-deal") return deleteDealAction(body, deps);
  if (action === "note") return addNoteAction(body, deps);
  if (action === "usage") return usageAction(body, deps);
  if (action === "pause") return staffPause(body, deps);
  if (action === "draft") return saveDraftAction(body, deps);
  if (action === "ghl-pull") return json(await pullGhl(deps));
  if (action === "alerts-drain") return json({ ok: true, ...(await drainAlerts(deps)) });
  if (action === "send") return json({ ok: false, error: "messaging_disabled", message: "No customer email or SMS is sent from this hub." }, 403);
  return json({ ok: false, error: "unknown_action" }, 404);
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return storageNotReady();
    throw error;
  }
}

function messageDrafts() {
  const reviewed = reviewedLifecycle();
  return reviewed.ok ? reviewed.emails : [];
}

async function hubSnapshot(deps: Deps) {
  const deals = await Promise.all(
    (await deps.store.listDeals()).map(async (deal) => ({
      ...deal,
      notes: await deps.store.listNotes(deal.id),
      activity: await deps.store.listActivity(deal.id),
    })),
  );
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
    messageTemplates: messageDrafts(),
    assignees: assignableStaff(deps.env),
    stages: DEAL_STAGES,
    stageCounts: stage,
    revenue: revenueReport(invoices, members),
    alerts: await deps.store.listAlerts(),
    deals,
    ghlSync: await deps.store.getSyncState(),
    freshness: ghlFreshness(await deps.store.getSyncState(), ghlMode(deps.env)),
  };
}

export async function handleGhlWebhook(request: Request, deps: Deps): Promise<Response> {
  const ghlTarget = resolveGhlTarget(deps.env);
  if (!ghlTarget.ok || deps.store.kind === "unavailable") {
    return json({ ok: false, error: "not_connected" }, 503);
  }
  const raw = await request.text();
  const signatureOk = (deps.verifyGhl ?? verifyGhlSignature)(raw, request.headers.get("x-ghl-signature"));
  if (!signatureOk) {
    return json({ ok: false, error: "bad_signature" }, 401);
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
  const inbound = parseInbound(body);
  if (!inbound || !webhookTimestampFresh(inbound.timestamp, deps.now())) {
    return json({ ok: false, error: "stale_or_incomplete" }, 401);
  }
  if (inbound.locationId !== ghlTarget.locationId) return json({ ok: false, error: "location_rejected" }, 403);
  const claim = await deps.store.claimEvent(inbound.webhookId, inbound.type);
  if (claim === "duplicate") return json({ ok: true, duplicate: true });
  const applied = await applyInbound(deps, inbound);
  await deps.store.finishEvent(inbound.webhookId, "processed");
  return json({ ok: true, applied });
}

async function pullGhl(deps: Deps): Promise<Record<string, unknown>> {
  const mode = ghlMode(deps.env);
  if (mode === "off" || deps.store.kind === "unavailable") {
    return { ok: false, status: "not_connected", freshness: ghlFreshness(null, mode) };
  }
  const state = await deps.store.getSyncState();
  try {
    const page = await pullHighLevel({
      env: deps.env,
      fetchImpl: deps.fetchImpl ?? fetch,
      contactCursor: state?.contactCursor ?? null,
      opportunityPage: state?.opportunityPage || 1,
    });
    if (!page.ok) return { ok: false, status: "not_connected", freshness: ghlFreshness(state, mode) };
    let imported = 0;
    let conflicts = 0;
    for (const lead of [...page.contacts, ...page.opportunities]) {
      const result = await applyInbound(deps, lead);
      if (result === "import") imported += 1;
      if (result === "conflict") conflicts += 1;
    }
    const next = {
      locationId: MANHAIR_GHL_LOCATION_ID,
      contactCursor: page.nextContactCursor,
      opportunityPage: page.nextOpportunityPage ?? (state?.opportunityPage || 1),
      pulledAt: deps.now().toISOString(),
      status: page.nextContactCursor || page.nextOpportunityPage ? "partial" : "caught_up",
      error: null,
    };
    await deps.store.saveSyncState(next);
    return { ok: true, imported, conflicts, status: next.status, freshness: ghlFreshness(next, mode) };
  } catch {
    const failed = {
      locationId: MANHAIR_GHL_LOCATION_ID,
      contactCursor: state?.contactCursor ?? null,
      opportunityPage: state?.opportunityPage || 1,
      pulledAt: state?.pulledAt ?? null,
      status: "pull_failed",
      error: "HighLevel pull failed. Local leads were not deleted.",
    };
    await deps.store.saveSyncState(failed);
    return { ok: false, status: "pull_failed", freshness: ghlFreshness(failed, mode) };
  }
}

async function applyInbound(deps: Deps, inbound: ReturnType<typeof parseInbound>): Promise<string> {
  if (!inbound) return "skipped";
  const target = resolveGhlTarget(deps.env);
  if (!target.ok) return "skipped";
  const deals = await deps.store.listDeals();
  const merged = mergeInboundLead({
    configuredLocation: target.locationId,
    remote: inbound,
    deals,
    now: deps.now(),
    stageMap: target.stageMap,
  });
  if (merged.action === "import" || merged.action === "update" || merged.action === "conflict") {
    await deps.store.saveDeal(merged.deal);
    await deps.store.addActivity({
      id: newId(),
      dealId: merged.deal.id,
      actor: "ghl",
      action: merged.activity,
      createdAt: deps.now().toISOString(),
    });
  }
  return merged.action;
}

async function saveDealAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : newId();
  const existing = (await deps.store.listDeals()).find((deal) => deal.id === id);
  const stage = typeof body.stage === "string" && isSalesStage(body.stage) ? body.stage : existing?.stage ?? "New Leads";
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
    locationId: resolveGhlTarget(deps.env).ok ? MANHAIR_GHL_LOCATION_ID : null,
    remoteUpdatedAt: existing?.remoteUpdatedAt ?? null,
    staffEditedAt: deps.now().toISOString(),
  };
  if (!deal.name || !validEmail(deal.email)) return json({ ok: false, error: "invalid_deal" }, 400);
  const decision = existing ? "push" : "push";
  if (decision === "push" && ghlMode(deps.env) !== "off") {
    const synced = await syncLead(
      deps.env,
      {
        email: deal.email,
        phone: deal.phone,
        firstName: deal.name,
        lastName: "",
        dealId: deal.id,
        contactId: deal.ghlContactId,
        opportunityId: deal.ghlOpportunityId,
      },
      deps.fetchImpl ?? fetch,
    );
    deal.syncStatus = synced.status;
    deal.ghlContactId = synced.contactId ?? deal.ghlContactId;
    deal.ghlOpportunityId = synced.opportunityId ?? deal.ghlOpportunityId;
    const stagePush = await pushOpportunityStage(deps.env, deal.ghlOpportunityId, deal.stage, deps.fetchImpl ?? fetch);
    if (stagePush !== "not_connected") deal.syncStatus = stagePush === "pushed" ? synced.status : stagePush;
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

async function deleteDealAction(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return json({ ok: false, error: "invalid_deal" }, 400);
  await deps.store.deleteDeal(id);
  return json({
    ok: true,
    crmChanged: false,
    message: "Local lead removed. GoHighLevel was not contacted and no contact was deleted there.",
  });
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
  try {
    const member = await currentMember(request, deps);
    if (!member) return { member: null, invoices: [], pauses: [] };
    return {
      member: publicMember(member),
      invoices: await deps.store.listInvoices(member.id),
      pauses: await deps.store.listPauseRequests(member.id),
    };
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return { member: null, invoices: [], pauses: [] };
    throw error;
  }
}
