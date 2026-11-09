import { linePriceId, type InternalEvent } from "./billing";

function idOf(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
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
  data: { object: Record<string, unknown> };
};

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
  if (event.type === "checkout.session.expired") {
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
      trialStart: typeof object.trial_start === "number" ? object.trial_start : null,
      trialEnd: typeof object.trial_end === "number" ? object.trial_end : null,
      cancelAt: typeof object.cancel_at === "number" ? object.cancel_at : null,
      pauseResumesAt: typeof pause?.resumes_at === "number" ? pause.resumes_at : null,
    };
  }
  if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
    const lineList = linesOf(object);
    const subscriptionId = lineList.length
      ? idOf((object.lines as { data?: Array<{ subscription?: unknown }> } | undefined)?.data?.[0]?.subscription) ??
        idOf(
          (
            (object.lines as { data?: Array<{ parent?: { subscription_item_details?: { subscription?: unknown } } }> })
              .data?.[0]?.parent
          )?.subscription_item_details?.subscription,
        )
      : null;
    return {
      id: event.id,
      type: event.type,
      created: event.created,
      memberId: metadata.member_id ?? null,
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
