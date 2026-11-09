import { alertAfterFailure, alertLogFields, alertsForPayment, confirmationEmailReady, customerAlertsReady, messagingSummary, messagingStatus, ownerAlertText, ownerAlertsReady, staffAlertRecipients, staffNoticeDraft, type AlertDraft, type AlertRecord } from "./alerts";
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION, businessIdentity, emailComplianceFooter, memberEmailFrom, recoveryUnavailableMessage, statementDescriptorSuffix } from "./business";
import { confirmationMessage, customerStatusLabel, publicSiteOrigin, staffAlertMessage } from "./email-copy";
import { messageHolds, messageTransport } from "./message-holds";
import { staffRole, assignableStaff } from "./access";
import { mapStripeStatus, promoteCheckoutStatus, reduceBillingEvent, stripeChargePatch, type MemberBilling } from "./billing";
import { billingDisclosure, billingTimeline, formatStudio } from "./dates";
import { buildCheckoutParams, checkoutIdempotencyKey, checkoutPaymentView, isSameOrigin, priceMatches, publicCheckoutOrigin, safeAppOrigin, type PriceSnapshot } from "./checkout";
import { ghlMode, paidMemberStageChange, pushMembershipProfile, pushOpportunityStage, sendLocationSms, syncHash, syncLead } from "./ghl";
import { SUBSCRIPTION_LIFECYCLE_TEMPLATES, postMembershipEmail, renderAlertCatalog, runDueLifecycle, sendCatalogMessage } from "./lifecycle-send";
import { formatAppointmentWhen, memberMergeVars } from "./lifecycle-vars";
import { disputeCopyFacts, invoiceCopyFacts } from "./stripe-map";
import { membershipGhlPayload, type MembershipGhlInput } from "./ghl-profile";
import { MANHAIR_GHL_LOCATION_ID, resolveGhlTarget } from "./manhair-ghl";
import { ghlFreshness, mergeInboundLead, parseInbound, pullHighLevel, verifyGhlSignature, webhookTimestampFresh } from "./ghl-inbound";
import { reviewedLifecycle } from "./lifecycle-review";
import { appointmentInput, schedulingMessages, MANUAL_SCHEDULING } from "./scheduling";
import { matchConfirmedRefund, planSuitabilityFailure, refundStatusFromProcessor } from "./suitability";
import { applyInvoiceObservation, paymentServiceHold, reconcileGrace } from "./payment-grace";
import { isMembershipSchemaMissing } from "./sql-store";
import {
  allowance,
  planPauseApply,
  planUsage,
  revenueReport,
  rollEntitlementYear,
  tierChangeParams,
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
  stripeKeyMode,
  type AppEnv,
} from "./readiness";
import { mapStripeEvent, resolveRiskCustomer, type StripeEventShape } from "./stripe-map";
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
  charges?: { retrieve(id: string): Promise<{ customer: unknown }> };
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
    cancel?(id: string, params: { prorate: false; invoice_now: false }): Promise<{ status: string }>;
    retrieve?(id: string): Promise<{
      status: string;
      cancel_at?: number | null;
      pause_collection?: { resumes_at?: number | null } | null;
      trial_end?: number | null;
      current_period_end?: number | null;
    }>;
  };
  refunds?: {
    create(
      params: { charge: string; amount: number },
      options?: { idempotencyKey?: string },
    ): Promise<{ id: string; status: string }>;
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
    heldStripeStatus: member.heldStripeStatus ?? null,
    version: member.version,
  };
}

async function memberFromEvent(store: MembershipStore, event: ReturnType<typeof mapStripeEvent>): Promise<MemberRecord | null> {
  if ("subscriptionId" in event && event.subscriptionId) {
    const bySub = await store.findMemberBySubscription(event.subscriptionId);
    if (bySub) return bySub;
  }
  if ("customerId" in event && event.customerId) {
    const byCustomer = await store.findMemberByCustomer(event.customerId);
    if (byCustomer) return byCustomer;
  }
  if ("memberId" in event && event.memberId) return store.findMemberById(event.memberId);
  return null;
}

export async function handleReadiness(deps: Deps): Promise<Response> {
  const founding = foundingConfig(deps.env);
  return json({
    payments: paymentBlockers(deps.env).length === 0 ? "ready" : "blocked",
    paymentBlockers: paymentBlockers(deps.env).map((blocker) => blocker.operatorMessage),
    portal: paymentBlockers(deps.env).length === 0 ? "billing_only_when_customer_exists" : "not_configured",
    recoveryEmail: recoveryEmailReady(deps.env) ? "enabled" : "not_configured",
    founding: founding.enabled ? { enabled: true, cap: founding.cap } : { enabled: false, reason: founding.reason },
    ghl: ghlMode(deps.env),
    scheduling: MANUAL_SCHEDULING.status,
    messaging: messagingStatus(deps.env),
    database: databaseReady(deps.env) ? "configured" : "missing",
    sandboxTimelineConfirmed: CHECKOUT_TIMELINE_SANDBOX_CONFIRMED,
    legalReview: paymentBlockers(deps.env).length === 0 ? "ready" : "pending",
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
  await enqueueStaffAlert(deps, staffNoticeDraft({
    eventId: dealId,
    kind: "consultation_requested",
    memberId: null,
    now: deps.now(),
    env: deps.env,
  }));
  const leadMessage = typeof body.message === "string" ? body.message : typeof body.note === "string" ? body.note : "";
  const preferred = typeof body.preferredContact === "string" ? body.preferredContact : "";
  await sendCatalogMessage(deps, {
    templateId: "lead_consult_received_email",
    memberId: null,
    cycleKey: `lead:${dealId}:email`,
    to: email,
    purpose: "lifecycle",
    vars: memberMergeVars({
      env: deps.env,
      lead: { firstName, email, phone, message: leadMessage, preferredContact: preferred },
      now: deps.now(),
    }),
  });
  await sendCatalogMessage(deps, {
    templateId: "lead_consult_received_sms",
    memberId: null,
    cycleKey: `lead:${dealId}:sms`,
    to: phone ?? "",
    purpose: "lifecycle",
    vars: memberMergeVars({
      env: deps.env,
      lead: { firstName, email, phone, message: leadMessage, preferredContact: preferred },
      now: deps.now(),
    }),
    smsConsent: body.smsConsent === true,
  });
  if (resolveGhlTarget(deps.env).ok) {
    const ghl = await syncLead(deps.env, {
      email,
      phone,
      firstName,
      lastName,
      dealId,
      profile: membershipGhlPayload({ lead: true, consultPending: true, suitability: "pending", syncVersion: 1 }),
    }, deps.fetchImpl ?? fetch);
    const saved = await deps.store.listDeals();
    const deal = saved.find((item) => item.id === dealId);
    if (deal) {
      deal.ghlContactId = ghl.contactId;
      deal.ghlOpportunityId = ghl.opportunityId;
      deal.syncStatus = ghl.status;
      await deps.store.saveDeal(deal);
    }
  }
  return json({
    ok: true,
    synced: false,
    message: "Your consultation request is saved. Griselda arranges the time. This did not start a payment or send you an email.",
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
  const smsConsent = body.smsConsent === true;
  if (smsConsent && !phone) {
    return json({
      ok: false,
      error: "sms_phone_required",
      message: "Add a mobile number to opt in to texts, or leave the text checkbox unchecked. Email checkout does not need it.",
    }, 400);
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
  for (const holder of holders) {
    const paidStuck = holder.setupPaid && (holder.status === "checkout_open" || holder.status === "checkout_failed");
    if (OPEN_STATUSES.has(holder.status) || paidStuck) {
      return json({
        ok: false,
        error: "already_member",
        message: "This email already has an active membership. Sign in from the account page to manage it. No second membership was started.",
      }, 409);
    }
    if (holder.status === "checkout_open") {
      const checkout = await deps.store.latestCheckout(holder.id);
      const age = checkout ? now.getTime() - new Date(checkout.createdAt).getTime() : Number.POSITIVE_INFINITY;
      if (checkout?.url && age < 30 * 60 * 1000) {
        return json({
          ok: false,
          error: "already_member",
          message: "A checkout is already open for this email. No second membership was started.",
        }, 409);
      }
    }
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
    nextChargeAt: null,
    chargeAtSource: "estimate",
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
  const consentId = newId();
  await deps.store.addConsent({
    id: consentId,
    memberId: member.id,
    termsVersion: TERMS_VERSION,
    termsAcceptedAt: now.toISOString(),
    autorenewAcceptedAt: now.toISOString(),
    marketingEmail: body.marketingConsent === true,
    smsConsent,
    smsConsentText: smsConsent ? SMS_CONSENT_TEXT : null,
    smsConsentAt: smsConsent ? now.toISOString() : null,
    smsConsentVersion: smsConsent ? SMS_CONSENT_VERSION : null,
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
    origin: publicCheckoutOrigin(request, deps.env),
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
      {
        email,
        phone,
        firstName,
        lastName,
        dealId,
        profile: membershipGhlPayload({
          lead: true,
          memberId: member.id,
          plan: tier,
          billingState: "checkout_open",
          setupPaid: false,
          serviceHold: false,
          marketingEmailConsent: body.marketingConsent === true,
          marketingSmsConsent: smsConsent,
          consentEvidenceReference: consentId,
          firstRecurringAt: member.recurringStartAt,
          syncVersion: 1,
          fulfillment: null,
        }),
      },
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
    logCheckoutFailure(member.id, error);
    if (reservationId) await deps.store.setFoundingStatus(reservationId, "released");
    member.status = "checkout_failed";
    await deps.store.saveMember(member);
    return json({ ok: false, error: "processor_error", message: "Card checkout could not be opened. No payment was taken." }, 502);
  }
}

function logCheckoutFailure(memberId: string, error: unknown): void {
  const record = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const raw = record.raw && typeof record.raw === "object" ? record.raw as Record<string, unknown> : {};
  const message = String(record.message ?? raw.message ?? "unknown")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
    .slice(0, 300);
  console.info(JSON.stringify({
    scope: "membership",
    event: "checkout_session_failed",
    memberId,
    stripeType: String(record.type ?? raw.type ?? "unknown"),
    stripeCode: String(record.code ?? raw.code ?? "unknown"),
    stripeMessage: message,
  }));
}

export async function handleReturn(request: Request, deps: Deps): Promise<Response> {
  const secret = sessionSecret(deps.env);
  const url = new URL(request.url);
  const token = url.searchParams.get("token") ?? "";
  if (!secret) return json({ ok: false, error: "session_secret_missing" }, 503);
  const payload = verifyToken(token, secret, deps.now());
  if (!payload || payload.purpose !== "checkout_return" || typeof payload.sid !== "string" || typeof payload.mid !== "string") {
    return friendlyLink(request, "/account/?link=expired", "return_token_rejected");
  }
  const session = await deps.store.findSession(payload.sid);
  if (!session || session.memberId !== payload.mid || session.returnUsed || new Date(session.expiresAt).getTime() <= deps.now().getTime()) {
    return friendlyLink(request, "/account/?link=expired", "return_expired");
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
  const cancellationRequests = (await deps.store.listAuthAudits(member.id)).filter((row) => row.action === "cancellation_requested");
  return json({
    ok: true,
    member: publicMember(member, deps.now(), invoices),
    invoices,
    pauses,
    cancellationRequests,
    scheduling: SCHEDULING,
    disclosure: billingDisclosure(new Date(member.createdAt), member.monthlyCents, member.setupCents),
  });
}

function publicMember(member: MemberRecord, now: Date, invoices: Array<{ id: string; kind: string; status: string; amountPaid: number }> = []) {
  const timeline = {
    firstRecurringAt: member.recurringStartAt,
    minimumTermEndsAt: member.minimumTermEndsAt,
    rateLockEndsAt: member.rateLockEndsAt,
  };
  const visits = planUsage(member, "maintenance", 1, now);
  const orders = planUsage(member, "system", 1, now);
  return {
    id: member.id,
    firstName: member.firstName,
    tier: member.tier,
    tierName: TIERS[member.tier].name,
    status: member.status,
    monthly: formatUsd(member.monthlyCents),
    setup: formatUsd(member.setupCents),
    setupPaid: member.setupPaid,
    statusLabel: customerStatusLabel(member, now),
    setupNote: member.setupPaid
      ? `${formatUsd(member.setupCents)} setup is paid and applies toward your first system.`
      : "Your setup payment is not confirmed yet.",
    attention: member.attention,
    systemsUsed: member.systemsUsed,
    systemsIncluded: TIERS[member.tier].systems,
    maintenanceUsed: member.maintenanceUsed,
    maintenanceIncluded: TIERS[member.tier].maintenance,
    pauseDaysUsed: member.pauseDaysUsed,
    cancelAt: member.cancelAt,
    pauseCollection: member.pauseCollection,
    serviceHold: paymentServiceHold(member.paymentGraceStartedAt, now) === "held",
    visits: visits.ok ? "available" : visits.reason,
    newSystemOrders: orders.ok ? "available" : orders.reason,
    ...timeline,
    paymentMethod: "Shown by the processor. This app does not store a card number.",
    chargeAtSource: member.chargeAtSource ?? "estimate",
    nextChargeAt: member.nextChargeAt ?? member.recurringStartAt,
    payment: checkoutPaymentView(member, invoices),
  };
}

function friendlyLink(request: Request, location: string, error: string): Response {
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("application/json")) return json({ ok: false, error }, 400);
  return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
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

async function settlePaidCheckoutStatus(deps: Deps, memberId: string): Promise<void> {
  const member = await deps.store.findMemberById(memberId);
  if (!member?.setupPaid) return;
  if (member.status !== "checkout_open" && member.status !== "checkout_failed") return;
  const held = promoteCheckoutStatus(member, true);
  if (held) {
    await deps.store.compareAndSave({ ...member, status: held, heldStripeStatus: null }, member.version);
    return;
  }
  const retrieve = deps.stripe?.subscriptions.retrieve;
  if (!retrieve || !member.stripeSubscriptionId) return;
  try {
    const subscription = await retrieve(member.stripeSubscriptionId);
    const mapped = mapStripeStatus(
      subscription.status,
      subscription.cancel_at ?? null,
      typeof subscription.pause_collection?.resumes_at === "number",
    );
    if (!promoteCheckoutStatus({ status: member.status, heldStripeStatus: mapped }, true)) return;
    const charges = stripeChargePatch({
      trialEnd: subscription.trial_end ?? null,
      currentPeriodEnd: subscription.current_period_end ?? null,
      status: subscription.status,
    });
    const fresh = await deps.store.findMemberById(memberId);
    if (!fresh?.setupPaid || (fresh.status !== "checkout_open" && fresh.status !== "checkout_failed")) return;
    await deps.store.compareAndSave({
      ...fresh,
      status: mapped,
      heldStripeStatus: null,
      ...(charges ?? {}),
    }, fresh.version);
  } catch (error) {
    logCheckoutFailure(memberId, error);
  }
}

async function notifySubscriptionLifecycle(
  deps: Deps,
  member: MemberRecord,
  previousStatus: MemberRecord["status"] | null,
  stripeType: string,
): Promise<void> {
  if (member.status === "cancel_scheduled" && previousStatus !== "cancel_scheduled") {
    const cycle = member.cancelAt ?? member.id;
    for (const templateId of SUBSCRIPTION_LIFECYCLE_TEMPLATES.cancel_scheduled) {
      await notifyLifecycle(deps, member, templateId, `${templateId}:${member.id}:${cycle}`);
    }
  }
  if (stripeType === "customer.subscription.deleted" && member.status === "canceled" && previousStatus !== "canceled") {
    const suitability = await deps.store.findSuitabilityCase(member.id);
    if (suitability) return;
    const cycle = member.stripeSubscriptionId ?? member.id;
    for (const templateId of SUBSCRIPTION_LIFECYCLE_TEMPLATES.ended) {
      await notifyLifecycle(deps, member, templateId, `${templateId}:${member.id}:${cycle}`);
    }
  }
}

async function notifyLifecycle(
  deps: Deps,
  member: MemberRecord,
  templateId: string,
  cycleKey: string,
  extras?: Record<string, string>,
): Promise<void> {
  const invoices = await deps.store.listInvoices(member.id);
  const pauses = await deps.store.listPauseRequests(member.id);
  const refunds = await deps.store.listRefundRequests(member.id);
  const appointments = await deps.store.listAppointments(member.id);
  const appointment = [...appointments].reverse().find((item) => item.state !== "canceled") ?? appointments.at(-1) ?? null;
  const deals = await deps.store.listDeals();
  const consented = (await deps.store.listConsents(member.id)).some((consent) => consent.smsConsent);
  const vars = memberMergeVars({
    env: deps.env,
    member,
    invoices,
    pauses,
    refunds,
    appointment,
    extras,
    now: deps.now(),
  });
  await sendCatalogMessage(deps, {
    templateId,
    memberId: member.id,
    cycleKey,
    to: member.email,
    purpose: "lifecycle",
    vars,
    contactId: deals.find((deal) => deal.memberId === member.id)?.ghlContactId ?? null,
    smsConsent: consented,
  });
}

async function cancelMember(member: MemberRecord, deps: Deps): Promise<Response> {
  await deps.store.addAuthAudit({
    id: newId(),
    memberId: member.id,
    action: "cancellation_requested",
    createdAt: deps.now().toISOString(),
  });
  await enqueueStaffAlert(deps, staffNoticeDraft({
    eventId: `cancel:${member.id}:${deps.now().toISOString()}`,
    kind: "cancellation_requested",
    memberId: member.id,
    now: deps.now(),
    env: deps.env,
  }));
  const inMinimum = new Date(member.minimumTermEndsAt).getTime() > deps.now().getTime();
  await notifyLifecycle(
    deps,
    member,
    inMinimum ? "cancel_request_in_minimum_email" : "cancel_request_after_minimum_email",
    `cancel-request:${member.id}:${deps.now().toISOString()}`,
    { in_minimum: inMinimum ? "true" : "false" },
  );
  await notifyLifecycle(deps, member, "cancel_request_received_sms", `cancel-request-sms:${member.id}:${deps.now().toISOString()}`);
  await syncMemberCrm(deps, member.id, { promotePaidStage: false });
  return json({
    ok: true,
    applied: false,
    billingChanged: false,
    message: "Cancellation request recorded. Billing is unchanged until staff review it. Nothing was sent to the processor.",
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
  await notifyLifecycle(deps, member, "pause_request_received_email", `pause-request:${request.id}`);
  await enqueueStaffAlert(deps, staffNoticeDraft({
    eventId: request.id,
    kind: "pause_requested",
    memberId: member.id,
    now: deps.now(),
    env: deps.env,
  }));
  await syncMemberCrm(deps, member.id, { promotePaidStage: false });
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
    pauseResumeAt: planned.apply.resumesAt.toISOString(),
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
    resumeAt: planned.apply.resumesAt.toISOString(),
  });
  const paused = await deps.store.findMemberById(member.id);
  if (paused) {
    await notifyLifecycle(deps, paused, "pause_confirmed_email", `pause-confirmed:${requestId}`);
    await notifyLifecycle(deps, paused, "pause_confirmed_sms", `pause-confirmed-sms:${requestId}`);
  }
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
    return { sent: false, reason: recoveryUnavailableMessage(env) };
  }
  const origin = (env.NEXT_PUBLIC_SITE_URL || "https://www.manhaironline.com").replace(/\/$/, "");
  const footer = emailComplianceFooter({
    identity: businessIdentity(env),
    manageUrl: `${origin}/account/`,
  });
  const sender = memberEmailFrom(env);
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender.from,
      reply_to: sender.replyTo,
      to: message.to,
      subject: "Your ManHair membership sign-in link",
      text: `This link signs you in to the membership you already have. It does not start a new payment.\n${message.url}\n\n${footer}`,
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
    const next = body.next === "billing" ? "&next=billing" : "";
    const sent = await sender({ to: email, url: `${origin}/api/membership/recover/?token=${encodeURIComponent(secret)}${next}` });
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
  if (!memberId) return friendlyLink(request, "/account/?link=expired", "recovery_rejected");
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
  const next = new URL(request.url).searchParams.get("next");
  return new Response(null, {
    status: 302,
    headers: {
      location: next === "billing" ? "/account/billing/" : "/account/",
      "set-cookie": cookieHeader(raw, secure),
      "cache-control": "no-store",
    },
  });
}

export async function startBillingPortal(request: Request, deps: Deps): Promise<{ url?: string; signedOut?: boolean; message?: string }> {
  const member = await currentMember(request, deps);
  if (!member) return { signedOut: true };
  const origin = safeAppOrigin(request, deps.env);
  const response = await openPortal(member, deps, origin);
  const body = (await response.json()) as { url?: string; message?: string };
  if (typeof body.url === "string") return { url: body.url };
  return { message: body.message ?? "Payment method update is not available yet." };
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
  if (typeof event.livemode === "boolean" && event.livemode !== (stripeKeyMode(deps.env.STRIPE_SECRET_KEY) === "live")) {
    return json({ ok: false, error: "webhook_mode_mismatch" }, 400);
  }
  try {
    event = await resolveRiskCustomer(event, deps.stripe?.charges);
  } catch {
    // Leave the event unclaimed so Stripe can retry a failed API lookup.
    return json({ ok: false, error: "risk_charge_lookup_failed" }, 503);
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
    const chargePatch = effect.staleStatus && effect.statusPatch?.chargeAtSource === "stripe"
      ? {
          recurringStartAt: effect.statusPatch.recurringStartAt ?? member?.recurringStartAt ?? null,
          nextChargeAt: effect.statusPatch.nextChargeAt ?? member?.nextChargeAt ?? null,
          chargeAtSource: "stripe" as const,
        }
      : null;
    if (member && chargePatch) {
      const saved = await deps.store.compareAndSave({ ...member, ...chargePatch, version: member.version }, member.version);
      if (saved === "conflict") {
        await deps.store.finishEvent(event.id, "failed");
        return json({ ok: false, error: "conflict" }, 409);
      }
    } else if (member && !effect.staleStatus && (effect.statusPatch || effect.attention)) {
      const next = {
        ...member,
        ...effect.statusPatch,
        attention: effect.attention ?? (effect.statusPatch && "attention" in effect.statusPatch
          ? effect.statusPatch.attention ?? null
          : member.attention),
        version: member.version,
      };
      const saved = await deps.store.compareAndSave(next, member.version);
      if (saved === "conflict") {
        await deps.store.finishEvent(event.id, "failed");
        return json({ ok: false, error: "conflict" }, 409);
      }
    }
    if (effect.invoice) {
      const ownerId = member?.id ?? effect.invoice.memberId;
      const prior = ownerId
        ? (await deps.store.listInvoices(ownerId)).find((invoice) => invoice.id === effect.invoice!.id) ?? null
        : null;
      const observed = applyInvoiceObservation(prior, { ...effect.invoice, statusEventCreated: internal.created });
      if (internal.type === "invoice.paid" || internal.type === "invoice.payment_failed") {
        if (!prior || observed.applied) {
          const facts = invoiceCopyFacts(event.data.object);
          const amountDue = facts.amount_due_cents ? Number(facts.amount_due_cents) : null;
          await deps.store.upsertInvoice({
            ...observed.invoice,
            amountDue,
            hostedInvoiceUrl: facts.hosted_invoice_url || null,
            cardLast4: facts.card_last4 || null,
            paidAt: facts.paid_at || null,
          });
          await deps.store.saveEventFacts(event.id, facts);
        }
      } else if (!prior || observed.applied) {
        await deps.store.upsertInvoice(observed.invoice);
      }
      if (ownerId) {
        const fresh = (await deps.store.findMemberById(ownerId)) ?? member;
        if (fresh) {
          const grace = reconcileGrace(fresh.paymentGraceStartedAt ?? null, await deps.store.listInvoices(ownerId));
          if ((fresh.paymentGraceStartedAt ?? null) !== grace) {
            await deps.store.compareAndSave({ ...fresh, paymentGraceStartedAt: grace }, fresh.version);
          }
        }
      }
    }
    if (effect.refundCents > 0 && internal.type === "charge.refunded") {
      const holder = member ?? (internal.customerId ? await deps.store.findMemberByCustomer(internal.customerId) : null);
      if (holder) {
        const requests = await deps.store.listRefundRequests(holder.id);
        const matched = matchConfirmedRefund(requests, effect.refundCents);
        const current = requests.find((request) => request.id === matched);
        if (matched && current) {
          await deps.store.updateRefundRequest(matched, { status: "processor_succeeded", stripeRefundId: current.stripeRefundId });
        }
        const suitability = await deps.store.findSuitabilityCase(holder.id);
        const refunded = await deps.store.findMemberById(holder.id);
        if (refunded) {
          const template = suitability ? "refund_completed_email" : "refund_issued_email";
          await notifyLifecycle(deps, refunded, template, `refund:${event.id}`, {
            refund_amount: formatUsd(effect.refundCents),
            refund_total: formatUsd(effect.refundCents),
            refund_date: formatStudio(deps.now()),
          });
          if (suitability) await notifyLifecycle(deps, refunded, "refund_completed_sms", `refund-sms:${event.id}`, { refund_total: formatUsd(effect.refundCents) });
        }
      }
    }
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
    if (member) await settlePaidCheckoutStatus(deps, member.id);
    await recordPaymentAlerts(deps, {
      eventId: event.id,
      previousStatus,
      invoice: effect.invoice,
      webhookFailed: false,
      memberId: member?.id ?? effect.invoice?.memberId ?? null,
    });
    if (member) await enqueueDatedConfirmation(deps, member.id);
    if (internal.type === "charge.dispute.created" && member) {
      await deps.store.saveEventFacts(event.id, { ...disputeCopyFacts(event.data.object), event_id: event.id });
      await enqueueStaffAlert(deps, staffNoticeDraft({
        eventId: event.id,
        kind: "dispute",
        memberId: member.id,
        now: deps.now(),
        env: deps.env,
      }));
    }
    if (internal.type === "radar.early_fraud_warning.created" && member) {
      await deps.store.saveEventFacts(event.id, { event_id: event.id, stripe_dashboard_url: "https://dashboard.stripe.com/radar" });
      await enqueueStaffAlert(deps, staffNoticeDraft({
        eventId: event.id,
        kind: "fraud_warning",
        memberId: member.id,
        now: deps.now(),
        env: deps.env,
      }));
    }
    if (internal.type === "checkout.session.async_payment_failed" && member) {
      await enqueueStaffAlert(deps, staffNoticeDraft({
        eventId: event.id,
        kind: "webhook_error",
        memberId: member.id,
        now: deps.now(),
        env: deps.env,
      }));
    }
    if (member && internal.type === "customer.subscription.updated") {
      const fresh = await deps.store.findMemberById(member.id);
      if (fresh) await notifySubscriptionLifecycle(deps, fresh, previousStatus, event.type);
    }
    const paidNow = Boolean(effect.statusPatch && "setupPaid" in effect.statusPatch && effect.statusPatch.setupPaid);
    if (member && (paidNow || effect.invoice)) {
      await syncMemberCrm(deps, member.id, { promotePaidStage: paidNow });
    }
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
    const fresh = input.memberId ? await deps.store.findMemberById(input.memberId) : null;
    const drafts = alertsForPayment({
      ...input,
      now: deps.now(),
      env: deps.env,
      chargeDateReady: fresh?.chargeAtSource === "stripe",
    });
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

export async function drainAlerts(deps: Deps): Promise<{ delivered: number; failed: number; held: number; fake: number; unavailable?: boolean }> {
  let due;
  try {
    due = await deps.store.claimDueAlerts(deps.now(), 20);
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return { delivered: 0, failed: 0, held: 0, fake: 0, unavailable: true };
    throw error;
  }
  let delivered = 0;
  let failed = 0;
  let fake = 0;
  for (const alert of due) {
    const outcome = await deliverAlert(deps, alert);
    if (outcome === "held") continue;
    if (outcome === "fake") fake += 1;
    else if (outcome === "delivered") delivered += 1;
    else failed += 1;
  }
  const held = (await deps.store.listAlerts()).filter((alert) => alert.status === "held").length;
  return { delivered, failed, held, fake };
}

async function deliverAlert(deps: Deps, alert: AlertRecord): Promise<"delivered" | "failed" | "held" | "fake"> {
  const transport = messageTransport(deps.env);
  const customer = alert.audience === "customer";
  const customerReady = alert.kind === "setup_paid" ? confirmationEmailReady(deps.env) : customerAlertsReady(deps.env);
  if (customer && alert.kind === "setup_paid") {
    const dated = alert.memberId ? await deps.store.findMemberById(alert.memberId) : null;
    if (dated?.chargeAtSource !== "stripe" || !dated.recurringStartAt) {
      await deps.store.updateAlert(alert.id, {
        status: "held",
        nextAttemptAt: null,
        lastError: "awaiting_stripe_charge_date",
      });
      return "held";
    }
  }
  if (customer && !customerReady) {
    await deps.store.updateAlert(alert.id, {
      status: "held",
      nextAttemptAt: null,
      lastError: alert.kind === "setup_paid" ? "confirmation_send_disabled" : "lifecycle_send_disabled",
    });
    return "held";
  }
  if (!customer && (!ownerAlertsReady(deps.env) || transport === "off")) {
    await deps.store.updateAlert(alert.id, {
      status: "held",
      nextAttemptAt: null,
      lastError: ownerAlertsReady(deps.env) ? "transport_not_live" : "alerts_not_configured",
    });
    return "held";
  }
  if (customer && transport === "off") {
    await deps.store.updateAlert(alert.id, { status: "held", nextAttemptAt: null, lastError: "transport_not_live" });
    return "held";
  }
  if (transport === "fake") {
    await deps.store.updateAlert(alert.id, { status: "fake_recorded", nextAttemptAt: null, lastError: "fake_transport" });
    console.info(JSON.stringify({ scope: "membership", event: "alert_fake_recorded", ...alertLogFields(alert) }));
    return "fake";
  }
  const member = alert.memberId ? await deps.store.findMemberById(alert.memberId) : null;
  const deal = !member ? (await deps.store.listDeals()).find((item) => item.id === alert.sourceEventId) ?? null : null;
  const to = customer ? member?.email : staffAlertRecipients(deps.env);
  if (!to || (Array.isArray(to) && to.length === 0)) {
    await deps.store.updateAlert(alert.id, { status: "held", nextAttemptAt: null, lastError: "recipient_missing" });
    return "held";
  }
  const facts = await deps.store.getEventFacts(alert.sourceEventId);
  const invoices = member ? await deps.store.listInvoices(member.id) : [];
  const pauses = member ? await deps.store.listPauseRequests(member.id) : [];
  const refunds = member ? await deps.store.listRefundRequests(member.id) : [];
  const vars = memberMergeVars({
    env: deps.env,
    member,
    lead: deal ? { firstName: deal.name.split(" ")[0] || "there", email: deal.email, phone: deal.phone } : null,
    invoices,
    pauses,
    refunds,
    extras: { ...facts, event_id: facts.event_id || alert.sourceEventId, payment_amount: facts.payment_amount || (alert.amountCents ? formatUsd(alert.amountCents) : "") },
    now: deps.now(),
  });
  const rendered = await renderAlertCatalog(deps, alert, vars);
  if (!rendered.ok) {
    await deps.store.updateAlert(alert.id, { status: "held", nextAttemptAt: null, lastError: rendered.reason });
    return "held";
  }
  const override = deps.env.MEMBERSHIP_TEST_RECIPIENT?.trim();
  const recipient = override?.includes("@") ? override : to;
  try {
    const sent = await postMembershipEmail(deps.env, deps.fetchImpl ?? fetch, {
      to: recipient,
      subject: rendered.subject,
      text: rendered.text,
      html: rendered.html,
    });
    if (!sent) throw new Error("provider_rejected");
    await deps.store.recordLifecycleMessage({
      id: newId(),
      dedupeKey: `alert:${alert.dedupeKey}`,
      memberId: alert.memberId,
      templateId: rendered.templateId,
      channel: "email",
      cycleKey: alert.dedupeKey,
      status: "sent",
      recipient: Array.isArray(recipient) ? recipient.join(",") : recipient,
      subject: rendered.subject,
      textBody: rendered.text,
      htmlBody: rendered.html,
      error: null,
      createdAt: deps.now().toISOString(),
    });
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

async function enqueueDatedConfirmation(deps: Deps, memberId: string): Promise<void> {
  const member = await deps.store.findMemberById(memberId);
  if (!member?.setupPaid || member.chargeAtSource !== "stripe" || !member.recurringStartAt) return;
  const drafts = alertsForPayment({
    eventId: `setup_confirm:${member.id}`,
    previousStatus: "checkout_open",
    invoice: { kind: "setup", status: "paid", amountPaid: member.setupCents },
    webhookFailed: false,
    memberId: member.id,
    now: deps.now(),
    env: deps.env,
    chargeDateReady: true,
  }).filter((draft) => draft.audience === "customer");
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
}

async function enqueueStaffAlert(deps: Deps, draft: AlertDraft): Promise<void> {
  try {
    await deps.store.enqueueAlert({
      ...draft,
      id: newId(),
      attempts: 0,
      lastError: draft.status === "held" ? "alerts_not_configured" : null,
      createdAt: deps.now().toISOString(),
    });
    await drainAlerts(deps);
  } catch {
    console.info(JSON.stringify({ scope: "membership", event: "staff_alert_enqueue_failed", kind: draft.kind }));
  }
}

async function syncMemberCrm(deps: Deps, memberId: string, options: { promotePaidStage: boolean }): Promise<void> {
  try {
    const member = await deps.store.findMemberById(memberId);
    if (!member) return;
    const deals = await deps.store.listDeals();
    const deal = deals.find((item) => item.memberId === member.id) ?? null;
    const payload = membershipGhlPayload(await membershipGhlInput(deps, member, deals));
    let changedStage = false;
    if (options.promotePaidStage && member.setupPaid && deal && deal.stage !== "Active Clients") {
      deal.stage = "Active Clients";
      deal.syncHash = syncHash({ stage: deal.stage, assignee: deal.assignee, followUp: deal.nextFollowUp ?? "" });
      deal.staffEditedAt = deps.now().toISOString();
      changedStage = true;
      await deps.store.addActivity({
        id: newId(),
        dealId: deal.id,
        actor: "billing",
        action: "stage_changed:Active Clients",
        createdAt: deps.now().toISOString(),
      });
    }
    const connected = resolveGhlTarget(deps.env).ok;
    if (!deal) return;
    if (!connected) {
      deal.syncStatus = "queued_not_connected";
      await deps.store.saveDeal(deal);
      return;
    }
    const fetchImpl = deps.fetchImpl ?? fetch;
    const profile = await pushMembershipProfile(deps.env, deal.ghlContactId, payload, fetchImpl);
    const stage = options.promotePaidStage && member.setupPaid
      ? await pushOpportunityStage(deps.env, deal.ghlOpportunityId, "Active Clients", fetchImpl)
      : "not_connected";
    if (profile === "pushed" && (stage === "pushed" || stage === "not_connected")) deal.syncStatus = stage === "pushed" ? "pushed" : deal.syncStatus;
    else if (profile === "no_contact" || stage === "stage_map_missing") deal.syncStatus = "queued_not_connected";
    else if (profile === "push_failed" || stage === "push_failed") deal.syncStatus = "push_failed";
    else if (changedStage) deal.syncStatus = deal.syncStatus || "queued_not_connected";
    if (options.promotePaidStage && member.setupPaid) {
      const prior = await deps.store.listActivity(deal.id);
      if (!prior.some((item) => item.action === "sms_setup_confirmation")) {
        const consented = (await deps.store.listConsents(member.id)).some((item) => item.smsConsent);
        const sms = await sendLocationSms(
          deps.env,
          deal.ghlContactId,
          `ManHair: your membership setup payment is confirmed. Card charges appear as ${statementDescriptorSuffix(deps.env)}. Reply STOP to opt out.`,
          fetchImpl,
          consented,
          deps.now(),
        );
        if (sms.sent) {
          await deps.store.addActivity({
            id: newId(),
            dealId: deal.id,
            actor: "billing",
            action: "sms_setup_confirmation",
            createdAt: deps.now().toISOString(),
          });
        }
      }
    }
    await deps.store.saveDeal(deal);
  } catch {
    console.info(JSON.stringify({ scope: "membership", event: "crm_sync_failed", memberId }));
  }
}

async function membershipGhlInput(deps: Deps, member: MemberRecord, deals: DealRecord[]): Promise<MembershipGhlInput> {
  const consents = await deps.store.listConsents(member.id);
  const consent = consents[consents.length - 1] ?? null;
  const appointments = (await deps.store.listAppointments(member.id))
    .filter((item) => item.state !== "canceled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const nextVisit = appointments.find((item) => new Date(item.startsAt).getTime() >= deps.now().getTime()) ?? appointments[0] ?? null;
  const pauses = await deps.store.listPauseRequests(member.id);
  const audits = await deps.store.listAuthAudits(member.id);
  const refunds = await deps.store.listRefundRequests(member.id);
  const suitability = await deps.store.findSuitabilityCase(member.id);
  const access = paymentServiceHold(member.paymentGraceStartedAt, deps.now());
  const refundOpen = refunds.some((item) => item.status !== "processor_succeeded");
  const refunded = refunds.some((item) => item.status === "processor_succeeded") && !refundOpen;
  const consultPending = !suitability && deals.some((item) => item.memberId === null && item.email === member.email);
  const invoices = await deps.store.listInvoices(member.id);
  const setupInvoice = invoices.find((item) => item.kind === "setup" && item.status === "paid");
  return {
    lead: true,
    memberId: member.id,
    stripeCustomerId: member.stripeCustomerId,
    plan: member.tier,
    billingState: member.status,
    setupPaid: member.setupPaid,
    serviceHold: access === "held",
    billingGrace: access === "grace",
    suitability: suitability ? "unsuitable" : nextVisit ? "suitable" : consultPending ? "pending" : null,
    fulfillment: member.setupPaid ? (member.systemsUsed > 0 ? "system-ready" : "order-pending") : null,
    orderReference: setupInvoice?.id ?? null,
    nextAppointmentAt: nextVisit?.startsAt ?? null,
    appointmentTimezone: nextVisit?.timeZone ?? null,
    marketingEmailConsent: consent ? consent.marketingEmail : null,
    marketingSmsConsent: consent ? consent.smsConsent : null,
    consentEvidenceReference: consent?.id ?? null,
    firstRecurringAt: member.recurringStartAt,
    graceStartedAt: member.paymentGraceStartedAt ?? null,
    syncVersion: member.version,
    consultPending,
    pauseRequested: pauses.some((item) => item.status === "requested"),
    cancelRequested: audits.some((item) => item.action === "cancellation_requested"),
    refundPending: refundOpen,
    refunded,
  };
}

async function staffSuitability(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const role = staffRole(deps.staffEmail, deps.env);
  if (!role || !deps.staffEmail) return json({ ok: false, error: "staff_denied" }, 401);
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const member = memberId ? await deps.store.findMemberById(memberId) : null;
  if (!member) return json({ ok: false, error: "member_not_found" }, 404);
  const invoices = await deps.store.listInvoices(member.id);
  const planned = planSuitabilityFailure({ invoices, confirmation: body.confirmation, note: body.note });
  if (!planned.ok) return json({ ok: false, error: planned.reason }, 400);
  const existing = await deps.store.findSuitabilityCase(member.id);
  if (existing) {
    const prior = await deps.store.listRefundRequests(member.id);
    return json({
      ok: true,
      duplicate: true,
      minimumTermWaived: true,
      cancelStatus: existing.cancelStatus,
      refunds: prior.map(publicRefund),
      completed: false,
      message: "This suitability failure is already recorded. No second refund or cancellation was sent.",
    });
  }
  const now = deps.now().toISOString();
  const caseId = newId();
  let cancelStatus: "not_sent" | "processor_pending" | "processor_canceled" | "processor_failed" = "not_sent";
  const canCall = Boolean(member.stripeSubscriptionId && deps.stripe && paymentBlockers(deps.env).length === 0);
  if (canCall && deps.stripe?.subscriptions.cancel && member.stripeSubscriptionId) {
    try {
      const result = await deps.stripe.subscriptions.cancel(member.stripeSubscriptionId, planned.plan.cancel);
      cancelStatus = result.status === "canceled" ? "processor_canceled" : "processor_pending";
    } catch {
      cancelStatus = "processor_failed";
    }
  }
  await deps.store.saveSuitabilityCase({
    id: caseId,
    memberId: member.id,
    staffEmail: deps.staffEmail,
    staffRole: role,
    note: typeof body.note === "string" ? body.note.trim() : "",
    policyVersion: planned.plan.policyVersion,
    minimumTermWaived: true,
    cancelStatus,
    createdAt: now,
  });
  const refunds = [];
  for (const item of planned.plan.refunds) {
    let status: "requested" | "processor_pending" | "processor_succeeded" | "processor_failed" = "requested";
    let stripeRefundId: string | null = null;
    if (item.chargeId && deps.stripe?.refunds && paymentBlockers(deps.env).length === 0) {
      try {
        const refund = await deps.stripe.refunds.create(
          { charge: item.chargeId, amount: item.amountCents },
          { idempotencyKey: `suitability:${caseId}:${item.invoiceId}` },
        );
        status = refundStatusFromProcessor(refund.status);
        stripeRefundId = refund.id;
      } catch {
        status = "processor_failed";
      }
    }
    const row = {
      id: newId(),
      caseId,
      memberId: member.id,
      invoiceId: item.invoiceId,
      kind: item.kind,
      amountCents: item.amountCents,
      chargeId: item.chargeId,
      status,
      stripeRefundId,
      createdAt: now,
    };
    await deps.store.saveRefundRequest(row);
    refunds.push(row);
  }
  await deps.store.addAuthAudit({ id: newId(), memberId: member.id, action: "suitability_failure_recorded", createdAt: now });
  await enqueueStaffAlert(deps, staffNoticeDraft({
    eventId: caseId,
    kind: "refund_requested",
    memberId: member.id,
    amountCents: refunds.reduce((sum, item) => sum + item.amountCents, 0),
    now: deps.now(),
    env: deps.env,
  }));
  const recorded = await deps.store.findMemberById(member.id);
  if (recorded) {
    const total = formatUsd(refunds.reduce((sum, item) => sum + item.amountCents, 0));
    await notifyLifecycle(deps, recorded, "unsuitable_refund_started_email", `unsuitable:${caseId}`, { refund_total: total, staff_email: deps.staffEmail ?? "" });
    await notifyLifecycle(deps, recorded, "unsuitable_refund_started_sms", `unsuitable-sms:${caseId}`, { refund_total: total });
    await sendCatalogMessage(deps, {
      templateId: "staff_unsuitable_recorded_email",
      memberId: member.id,
      cycleKey: `staff-unsuitable:${caseId}`,
      to: staffAlertRecipients(deps.env),
      purpose: "lifecycle",
      vars: memberMergeVars({
        env: deps.env,
        member: recorded,
        refunds,
        extras: { refund_total: total, staff_email: deps.staffEmail ?? "", event_id: caseId },
        now: deps.now(),
      }),
    });
  }
  await syncMemberCrm(deps, member.id, { promotePaidStage: false });
  const completed = cancelStatus === "processor_canceled" && refunds.length > 0 && refunds.every((refund) => refund.status === "processor_succeeded");
  return json({
    ok: true,
    duplicate: false,
    minimumTermWaived: true,
    cancelStatus,
    refunds: refunds.map(publicRefund),
    completed,
    message: completed
      ? "The processor confirmed the cancellation and each refund. No separate receipt was sent."
      : "Suitability failure recorded by staff. The 3-month minimum does not apply. Future billing and refunds stay unconfirmed until the processor accepts them. Nothing here is a completed refund receipt.",
  });
}

function publicRefund(refund: { invoiceId: string; amountCents: number; status: string }) {
  return { invoiceId: refund.invoiceId, amountCents: refund.amountCents, status: refund.status, receipt: refund.status === "processor_succeeded" };
}

async function staffAppointment(body: Record<string, unknown>, deps: Deps): Promise<Response> {
  const role = staffRole(deps.staffEmail, deps.env);
  if (!role || !deps.staffEmail) return json({ ok: false, error: "staff_denied" }, 401);
  const memberId = typeof body.memberId === "string" ? body.memberId : "";
  const member = memberId ? await deps.store.findMemberById(memberId) : null;
  if (!member) return json({ ok: false, error: "member_not_found" }, 404);
  const parsed = appointmentInput(body);
  if (!parsed.ok) return json({ ok: false, error: parsed.reason }, 400);
  const now = deps.now().toISOString();
  await deps.store.saveAppointment({
    id: newId(),
    memberId: member.id,
    staffEmail: deps.staffEmail,
    startsAt: parsed.appointment.startsAt,
    timeZone: parsed.appointment.timeZone,
    state: parsed.appointment.state,
    note: typeof body.note === "string" ? body.note.trim() : "",
    createdAt: now,
    updatedAt: now,
  });
  await deps.store.addAuthAudit({ id: newId(), memberId: member.id, action: `appointment_${parsed.appointment.state}`, createdAt: now });
  const appointmentTemplate = parsed.appointment.state === "canceled"
    ? "appointment_cancelled"
    : parsed.appointment.state === "updated"
      ? "appointment_updated"
      : "appointment_confirmed";
  const fresh = await deps.store.findMemberById(member.id);
  if (fresh) {
    const when = formatAppointmentWhen(parsed.appointment.startsAt, parsed.appointment.timeZone);
    await notifyLifecycle(deps, fresh, `${appointmentTemplate}_email`, `${appointmentTemplate}:${fresh.id}:${parsed.appointment.startsAt}`, { appointment_date_time: when });
    await notifyLifecycle(deps, fresh, `${appointmentTemplate}_sms`, `${appointmentTemplate}-sms:${fresh.id}:${parsed.appointment.startsAt}`, { appointment_date_time: when });
  }
  await syncMemberCrm(deps, member.id, { promotePaidStage: false });
  return json({
    ok: true,
    bookingUrl: null,
    appointment: parsed.appointment,
    messages: schedulingMessages(parsed.appointment),
    message: "The visit was recorded by staff. No booking link was published, and no confirmation or reminder was sent.",
  });
}

const HUB_LINK_MS = 20 * 60 * 1000;
const HUB_SESSION_MS = 12 * 60 * 60 * 1000;

export function readStaffSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)mh_staff_session=([^;]+)/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export async function handleHubSignIn(request: Request, deps: Deps): Promise<Response> {
  const origin = safeAppOrigin(request, deps.env);
  if (!isSameOrigin(request, origin)) return json({ ok: false, error: "origin_rejected" }, 403);
  const body = (await readJson(request)) ?? {};
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!validEmail(email)) return json({ ok: false, error: "invalid_email", message: "Enter a valid email." }, 400);
  const allowed = await deps.store.consumeRate(`hub-signin:${email}`, deps.now(), 5, 60 * 60 * 1000);
  if (!allowed) {
    return json({ ok: false, error: "rate_limited", message: "Too many sign-in links were requested. Nothing else was sent." }, 429);
  }
  const role = staffRole(email, deps.env);
  const generic = "If this email is on the studio list, a sign-in link was sent.";
  if (!role) return json({ ok: true, message: generic });
  if (!deps.env.RESEND_API_KEY?.trim()) {
    return json({
      ok: false,
      error: "email_not_configured",
      message: "Staff sign-in email is not configured, so no link was sent.",
    }, 501);
  }
  const secret = newSecret();
  const expiresAt = new Date(deps.now().getTime() + HUB_LINK_MS).toISOString();
  await deps.store.saveStaffLink({ tokenHash: hashSecret(secret), email, expiresAt, used: false });
  const sender = memberEmailFrom(deps.env);
  const url = `${origin}/api/membership/hub/enter/?token=${encodeURIComponent(secret)}`;
  const response = await (deps.fetchImpl ?? fetch)("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${deps.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender.from,
      reply_to: sender.replyTo,
      to: email,
      subject: "Your ManHair studio hub sign-in link",
      text: `This link signs you in to the studio hub. It expires in 20 minutes and works once. It does not open the website admin.\n${url}`,
    }),
  });
  if (!response.ok) {
    await deps.store.consumeStaffLink(hashSecret(secret), deps.now());
    return json({ ok: false, error: "email_not_sent", message: "The email provider did not accept the sign-in link. No session was opened." }, 502);
  }
  return json({ ok: true, message: generic });
}

export async function handleHubEnter(request: Request, deps: Deps): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const email = token ? await deps.store.consumeStaffLink(hashSecret(token), deps.now()) : null;
  const role = email ? staffRole(email, deps.env) : null;
  if (!email || !role) return friendlyLink(request, "/hub/?link=expired", "staff_link_rejected");
  const raw = newSecret();
  await deps.store.saveStaffSession({
    tokenHash: hashSecret(raw),
    email,
    role,
    expiresAt: new Date(deps.now().getTime() + HUB_SESSION_MS).toISOString(),
  });
  const secure = safeAppOrigin(request, deps.env).startsWith("https://");
  const parts = [`mh_staff_session=${encodeURIComponent(raw)}`, "HttpOnly", "SameSite=Lax", "Path=/", "Max-Age=43200"];
  if (secure) parts.push("Secure");
  return new Response(null, {
    status: 302,
    headers: { location: "/hub/", "set-cookie": parts.join("; "), "cache-control": "no-store" },
  });
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
  if (action === "suitability-failure") return staffSuitability(body, deps);
  if (action === "appointment") return staffAppointment(body, deps);
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
    messaging: messagingSummary(deps.env),
    messageHolds: messageHolds(),
    messageTemplates: messageDrafts(),
    assignees: assignableStaff(deps.env),
    stages: DEAL_STAGES,
    stageCounts: stage,
    revenue: revenueReport(invoices, members),
    alerts: await deps.store.listAlerts(),
    cancellationRequests: (await deps.store.listAuthAudits()).filter((row) => row.action === "cancellation_requested"),
    pauseRequests: await deps.store.listPauseRequests(),
    refundRequests: await deps.store.listRefundRequests(),
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
    memberId: typeof body.memberId === "string" ? body.memberId : existing?.memberId ?? null,
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
  const linked = deal.memberId ? await deps.store.findMemberById(deal.memberId) : null;
  const paid = Boolean(linked && (linked.setupPaid || ["trialing", "active", "past_due", "paused", "cancel_scheduled"].includes(linked.status)));
  if (paidMemberStageChange(paid, deal.stage) === "keep_active_client") {
    return json({
      ok: false,
      error: "stage_regression",
      message: "A paid membership stays in Active Clients. Appointment and prospect stages do not replace it.",
    }, 409);
  }
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
  const decision = planUsage(current, kind, quantity, deps.now());
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
    if (!member) return { member: null, invoices: [], pauses: [], cancellationRequests: [] };
    const invoices = await deps.store.listInvoices(member.id);
    return {
      member: publicMember(member, deps.now(), invoices),
      invoices,
      pauses: await deps.store.listPauseRequests(member.id),
      cancellationRequests: (await deps.store.listAuthAudits(member.id)).filter((row) => row.action === "cancellation_requested"),
    };
  } catch (error) {
    if (isMembershipSchemaMissing(error)) return { member: null, invoices: [], pauses: [], cancellationRequests: [] };
    throw error;
  }
}
