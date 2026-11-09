import { assessCheckoutAmount } from "./checkout";
import { TRIAL_DAYS, type TierId } from "./offer";

export type MemberStatus =
  | "checkout_open"
  | "checkout_failed"
  | "trialing"
  | "active"
  | "past_due"
  | "paused"
  | "cancel_scheduled"
  | "canceled"
  | "needs_review";

export type Attention =
  | "recurring_charged_at_checkout"
  | "setup_not_collected"
  | "unexpected_checkout_amount"
  | "unexpected_trial"
  | "dispute"
  | "refund"
  | "fraud"
  | "usage_over_new_allowance"
  | null;

export type InvoiceKind = "setup" | "recurring" | "proration" | "other";

export type MemberBilling = {
  id: string;
  tier: TierId;
  status: MemberStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionItemId: string | null;
  setupCents: number;
  monthlyCents: number;
  setupPaid: boolean;
  recurringStartAt: string | null;
  nextChargeAt?: string | null;
  chargeAtSource?: "estimate" | "stripe" | null;
  cancelAt: string | null;
  pauseCollection: boolean;
  lastStatusEventCreated: number;
  attention: Attention;
  version: number;
  paymentGraceStartedAt?: string | null;
  pauseResumeAt?: string | null;
};

export type StoredInvoice = {
  id: string;
  memberId: string | null;
  kind: InvoiceKind;
  status: "paid" | "failed";
  amountPaid: number;
  amountRefunded: number;
};

export type BillingEffect = {
  duplicate: boolean;
  staleStatus: boolean;
  unmapped: boolean;
  ignored: boolean;
  statusPatch: Partial<MemberBilling> | null;
  invoice: StoredInvoice | null;
  refundCents: number;
  founding: "convert" | "release" | null;
  attention: Attention;
};

export type CatalogPrices = {
  setupPriceIds: string[];
  tierPriceIds: string[];
};

type Line = { priceId: string | null; amount: number; proration: boolean };

export type InternalEvent =
  | {
      id: string;
      type: "checkout.session.completed" | "checkout.session.async_payment_succeeded";
      created: number;
      memberId: string | null;
      customerId: string | null;
      subscriptionId: string | null;
      amountTotal: number | null;
      paymentStatus: string | null;
      reservationId: string | null;
    }
  | {
      id: string;
      type: "checkout.session.expired" | "checkout.session.async_payment_failed";
      created: number;
      memberId: string | null;
      reservationId: string | null;
    }
  | {
      id: string;
      type: "customer.subscription.updated";
      created: number;
      memberId: string | null;
      customerId: string | null;
      subscriptionId: string;
      subscriptionItemId: string | null;
      status: string;
      trialStart?: number | null;
      trialEnd: number | null;
      currentPeriodEnd?: number | null;
      cancelAt: number | null;
      pauseResumesAt: number | null;
    }
  | {
      id: string;
      type: "invoice.paid" | "invoice.payment_failed";
      created: number;
      memberId: string | null;
      customerId: string | null;
      subscriptionId: string | null;
      invoiceId: string;
      amountPaid: number;
      billingReason: string | null;
      lines: Line[];
    }
  | {
      id: string;
      type: "charge.refunded" | "charge.dispute.created" | "radar.early_fraud_warning.created";
      created: number;
      customerId: string | null;
      amount: number;
    }
  | { id: string; type: "ignored"; created: number };

export function emptyEffect(): BillingEffect {
  return {
    duplicate: false,
    staleStatus: false,
    unmapped: false,
    ignored: false,
    statusPatch: null,
    invoice: null,
    refundCents: 0,
    founding: null,
    attention: null,
  };
}

function fromUnix(seconds: number | null | undefined): string | null {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

/** First charge is trial_end. Later charges use current_period_end. Both are Stripe instants. */
function stripeChargePatch(event: {
  trialEnd: number | null;
  currentPeriodEnd?: number | null;
  status: string;
}): Partial<MemberBilling> | null {
  const trial = fromUnix(event.trialEnd);
  const periodEnd = fromUnix(event.currentPeriodEnd);
  const first = trial ?? (event.status === "trialing" ? periodEnd : null);
  const next = periodEnd ?? trial;
  if (!first && !next) return null;
  return {
    ...(first ? { recurringStartAt: first } : {}),
    ...(next ? { nextChargeAt: next } : {}),
    chargeAtSource: "stripe",
  };
}

function mapStripeStatus(status: string, cancelAt: number | null, paused: boolean): MemberStatus {
  if (status === "canceled") return "canceled";
  if (paused) return "paused";
  if (cancelAt) return "cancel_scheduled";
  if (status === "trialing") return "trialing";
  if (status === "active") return "active";
  if (status === "past_due") return "past_due";
  if (status === "incomplete_expired" || status === "unpaid") return "canceled";
  if (status === "incomplete") return "needs_review";
  return "needs_review";
}

export function reduceBillingEvent(
  member: MemberBilling | null,
  event: InternalEvent,
  seenEventIds: ReadonlySet<string>,
): BillingEffect {
  if (seenEventIds.has(event.id)) {
    return { ...emptyEffect(), duplicate: true };
  }
  if (event.type === "ignored") {
    return { ...emptyEffect(), ignored: true };
  }
  if (!member && event.type !== "charge.refunded" && event.type !== "charge.dispute.created" && event.type !== "radar.early_fraud_warning.created") {
    const memberId = "memberId" in event ? event.memberId : null;
    if (!memberId) return { ...emptyEffect(), unmapped: true };
  }

  if (event.type === "checkout.session.expired") {
    return { ...emptyEffect(), founding: event.reservationId ? "release" : null };
  }

  if (event.type === "checkout.session.async_payment_failed") {
    return {
      ...emptyEffect(),
      founding: member?.setupPaid ? null : event.reservationId ? "release" : null,
      statusPatch: member && !member.setupPaid ? { status: "checkout_failed" } : null,
    };
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (!member) return { ...emptyEffect(), unmapped: true };
    const verdict = assessCheckoutAmount(event.amountTotal, member.setupCents, member.monthlyCents);
    let attention: Attention = null;
    let setupPaid = false;
    if (verdict === "setup_only" && event.paymentStatus === "paid") setupPaid = true;
    if (verdict === "setup_and_recurring") attention = "recurring_charged_at_checkout";
    if (verdict === "zero") attention = "setup_not_collected";
    if (verdict === "unexpected") attention = "unexpected_checkout_amount";
    return {
      ...emptyEffect(),
      founding: setupPaid && event.reservationId ? "convert" : null,
      attention,
      statusPatch: {
        stripeCustomerId: event.customerId ?? member.stripeCustomerId,
        stripeSubscriptionId: event.subscriptionId ?? member.stripeSubscriptionId,
        setupPaid: setupPaid || member.setupPaid,
        attention: attention ?? member.attention,
        status: attention ? "needs_review" : member.status,
      },
    };
  }

  if (event.type === "customer.subscription.updated") {
    if (!member) return { ...emptyEffect(), unmapped: true };
    const stale = event.created < member.lastStatusEventCreated;
    const charges = stripeChargePatch(event);
    if (stale) return { ...emptyEffect(), staleStatus: true, statusPatch: charges };
    const paused = event.pauseResumesAt !== null;
    const status = mapStripeStatus(event.status, event.cancelAt, paused);
    let attention: Attention = member.attention;
    if (event.trialStart && event.trialEnd) {
      // Checkout can remain open for 30 minutes. Stripe starts the trial when
      // payment completes, so validate its actual duration, not the estimate
      // made when the customer first opened Checkout.
      if (event.trialEnd - event.trialStart !== TRIAL_DAYS * 24 * 60 * 60) {
        attention = "unexpected_trial";
      } else if (attention === "unexpected_trial") {
        attention = null;
      }
    }
    return {
      ...emptyEffect(),
      attention,
      statusPatch: {
        status: attention === "unexpected_trial" ? "needs_review" : status,
        stripeCustomerId: event.customerId ?? member.stripeCustomerId,
        stripeSubscriptionId: event.subscriptionId,
        stripeSubscriptionItemId: event.subscriptionItemId ?? member.stripeSubscriptionItemId,
        recurringStartAt: charges?.recurringStartAt ?? member.recurringStartAt,
        nextChargeAt: charges?.nextChargeAt ?? member.nextChargeAt ?? null,
        chargeAtSource: charges?.chargeAtSource ?? member.chargeAtSource ?? "estimate",
        cancelAt: fromUnix(event.cancelAt),
        pauseCollection: paused,
        pauseResumeAt: paused ? fromUnix(event.pauseResumesAt) : null,
        lastStatusEventCreated: event.created,
        attention,
      },
    };
  }

  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    if (!member) return { ...emptyEffect(), unmapped: true };
    const setupLine = event.lines.some((line) => line.priceId !== null && line.amount === member.setupCents && !line.proration);
    const kind: InvoiceKind = event.lines.some((line) => line.proration)
      ? "proration"
      : setupLine
        ? "setup"
        : event.billingReason === "subscription_cycle" || event.billingReason === "subscription_threshold"
          ? "recurring"
          : "other";
    const stale = event.created < member.lastStatusEventCreated;
    return {
      ...emptyEffect(),
      staleStatus: stale && event.type === "invoice.payment_failed",
      invoice: {
        id: event.invoiceId,
        memberId: member.id,
        kind,
        status: event.type === "invoice.paid" ? "paid" : "failed",
        amountPaid: event.type === "invoice.paid" ? event.amountPaid : 0,
        amountRefunded: 0,
      },
      statusPatch: event.type === "invoice.paid" && kind === "setup"
        ? { setupPaid: true }
        : event.type === "invoice.payment_failed" && !stale
          ? { status: "past_due", lastStatusEventCreated: event.created }
          : null,
    };
  }

  if (event.type === "charge.refunded") {
    return { ...emptyEffect(), refundCents: event.amount, attention: "refund" };
  }
  if (event.type === "charge.dispute.created") {
    return { ...emptyEffect(), attention: "dispute" };
  }
  if (event.type === "radar.early_fraud_warning.created") {
    return { ...emptyEffect(), attention: "fraud" };
  }
  return { ...emptyEffect(), ignored: true };
}

export function linePriceId(line: unknown): string | null {
  if (!line || typeof line !== "object") return null;
  const record = line as {
    price?: string | { id?: string };
    pricing?: { price_details?: { price?: string | { id?: string } } };
    parent?: { subscription_item_details?: { proration?: boolean } };
  };
  const priced = record.pricing?.price_details?.price;
  if (typeof priced === "string") return priced;
  if (priced && typeof priced.id === "string") return priced.id;
  if (typeof record.price === "string") return record.price;
  if (record.price && typeof record.price.id === "string") return record.price.id;
  return null;
}
