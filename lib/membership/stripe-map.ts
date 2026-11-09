import { linePriceId, type InternalEvent } from "./billing";
import { formatStudioDay } from "./email-copy";

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return null;
}

function unix(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}

function meta(object: Record<string, unknown>): Record<string, string> {
  const metadata = object.metadata;
  if (!metadata || typeof metadata !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function linesOf(object: Record<string, unknown>): InternalEvent extends never ? never : { priceId: string | null; amount: number; proration: boolean }[] {
  const lines = object.lines;
  const data = lines && typeof lines === "object" && "data" in lines && Array.isArray(lines.data) ? lines.data : [];
  return data.map((line) => {
    const record = line as Record<string, unknown>;
    const parent = record.parent as { subscription_item_details?: { proration?: boolean } } | null;
    return {
      priceId: linePriceId(line),
      amount: typeof record.amount === "number" ? record.amount : 0,
      proration: Boolean(parent?.subscription_item_details?.proration),
    };
  });
}

export type StripeEventShape = {
  id: string;
  type: string;
  created: number;
  livemode?: boolean;
  data: { object: Record<string, unknown> };
};

/** Disputes and fraud warnings identify a charge, not a customer. */
export async function resolveRiskCustomer(
  event: StripeEventShape,
  charges?: { retrieve(id: string): Promise<{ customer: unknown }> },
): Promise<StripeEventShape> {
  if (event.type !== "charge.dispute.created" && event.type !== "radar.early_fraud_warning.created") return event;
  const object = event.data.object;
  const charge = object.charge;
  const expandedCustomer = charge && typeof charge === "object" && "customer" in charge ? idOf(charge.customer) : null;
  let customer = expandedCustomer;
  if (!customer) {
    const chargeId = idOf(charge);
    if (!chargeId || !charges) throw new Error("risk_charge_lookup_unavailable");
    customer = idOf((await charges.retrieve(chargeId)).customer);
  }
  return { ...event, data: { object: { ...object, customer } } };
}

export function invoiceCopyFacts(object: Record<string, unknown>): Record<string, string> {
  const transitions = object.status_transitions as { paid_at?: number } | undefined;
  const charge = object.charge;
  let last4 = "";
  if (charge && typeof charge === "object" && "payment_method_details" in charge) {
    const details = charge.payment_method_details as { card?: { last4?: string } } | undefined;
    if (typeof details?.card?.last4 === "string") last4 = details.card.last4;
  }
  const paidAt = typeof transitions?.paid_at === "number" ? new Date(transitions.paid_at * 1000).toISOString() : "";
  const amountDue = typeof object.amount_due === "number" ? String(object.amount_due) : "";
  const hosted = typeof object.hosted_invoice_url === "string" ? object.hosted_invoice_url : "";
  const failedAt = typeof object.created === "number" ? new Date(object.created * 1000) : null;
  return {
    amount_due_cents: amountDue,
    hosted_invoice_url: hosted,
    card_last4: last4,
    paid_at: paidAt,
    failed_amount: amountDue ? formatCents(Number(amountDue)) : "",
    payment_amount: typeof object.amount_paid === "number" ? formatCents(object.amount_paid) : "",
    payment_date: paidAt ? formatStudioDay(new Date(paidAt)) : "",
    failed_payment_date: failedAt ? formatStudioDay(failedAt) : "",
    invoice_url: hosted,
    card_last4_display: last4,
  };
}

export function disputeCopyFacts(object: Record<string, unknown>): Record<string, string> {
  const evidence = object.evidence_details as { due_by?: number } | undefined;
  const chargeId = idOf(object.charge);
  const disputeId = typeof object.id === "string" ? object.id : "";
  return {
    dispute_amount: typeof object.amount === "number" ? formatCents(object.amount) : "",
    dispute_reason: typeof object.reason === "string" ? object.reason.replaceAll("_", " ") : "",
    dispute_evidence_due_date: typeof evidence?.due_by === "number" ? formatStudioDay(new Date(evidence.due_by * 1000)) : "",
    stripe_dashboard_url: chargeId
      ? `https://dashboard.stripe.com/payments/${chargeId}`
      : disputeId
        ? `https://dashboard.stripe.com/disputes/${disputeId}`
        : "",
    event_id: disputeId,
  };
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function mapStripeEvent(event: StripeEventShape): InternalEvent {
  const object = event.data.object;
  const metadata = meta(object);
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    return {
      id: event.id,
      type: event.type,
      created: event.created,
      memberId: typeof object.client_reference_id === "string" ? object.client_reference_id : metadata.member_id ?? null,
      customerId: idOf(object.customer),
      subscriptionId: idOf(object.subscription),
      amountTotal: typeof object.amount_total === "number" ? object.amount_total : null,
      paymentStatus: typeof object.payment_status === "string" ? object.payment_status : null,
      reservationId: metadata.founding_reservation_id || null,
    };
  }
  if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    return {
      id: event.id,
      type: event.type,
      created: event.created,
      memberId: typeof object.client_reference_id === "string" ? object.client_reference_id : metadata.member_id ?? null,
      reservationId: metadata.founding_reservation_id || null,
    };
  }
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const items = object.items as { data?: Array<Record<string, unknown>> } | undefined;
    const first = items?.data?.[0];
    const pause = object.pause_collection as { resumes_at?: number | null } | null;
    return {
      id: event.id,
      type: "customer.subscription.updated",
      created: event.created,
      memberId: metadata.member_id ?? null,
      customerId: idOf(object.customer),
      subscriptionId: typeof object.id === "string" ? object.id : "",
      subscriptionItemId: typeof first?.id === "string" ? first.id : null,
      status: event.type === "customer.subscription.deleted" ? "canceled" : typeof object.status === "string" ? object.status : "incomplete",
      trialStart: unix(object.trial_start),
      trialEnd: unix(object.trial_end),
      currentPeriodEnd: unix(object.current_period_end),
      cancelAt: typeof object.cancel_at === "number" ? object.cancel_at : null,
      pauseResumesAt: typeof pause?.resumes_at === "number" ? pause.resumes_at : null,
    };
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const lineList = linesOf(object);
    const parent = object.parent as { subscription_details?: { subscription?: unknown; metadata?: Record<string, string> } } | undefined;
    const subscriptionId = idOf(parent?.subscription_details?.subscription) ?? idOf(object.subscription) ?? (lineList.length
      ? idOf((object.lines as { data?: Array<{ subscription?: unknown }> } | undefined)?.data?.[0]?.subscription) ??
        idOf(
          (
            (object.lines as { data?: Array<{ parent?: { subscription_item_details?: { subscription?: unknown } } }> })
              .data?.[0]?.parent
          )?.subscription_item_details?.subscription,
        )
      : null);
    return {
      id: event.id,
      type: event.type,
      created: event.created,
      memberId: parent?.subscription_details?.metadata?.member_id ?? metadata.member_id ?? null,
      customerId: idOf(object.customer),
      subscriptionId,
      invoiceId: typeof object.id === "string" ? object.id : event.id,
      amountPaid: typeof object.amount_paid === "number" ? object.amount_paid : 0,
      billingReason: typeof object.billing_reason === "string" ? object.billing_reason : null,
      lines: lineList,
    };
  }
  if (event.type === "charge.refunded" || event.type === "charge.dispute.created" || event.type === "radar.early_fraud_warning.created") {
    const amount = event.type === "charge.refunded" && typeof object.amount_refunded === "number" ? object.amount_refunded : 0;
    return { id: event.id, type: event.type, created: event.created, customerId: idOf(object.customer), amount };
  }
  return { id: event.id, type: "ignored", created: event.created };
}
