import type { InvoiceKind } from "./billing";

export const SUITABILITY_POLICY_VERSION = "2026-11-08-unsuitable-refund-and-cancel";
export const SUITABILITY_CONFIRMATION = "refund-and-cancel";

export type SuitabilityInvoice = {
  id: string;
  kind: InvoiceKind;
  status: "paid" | "failed";
  amountPaid: number;
  amountRefunded: number;
  chargeId?: string | null;
};

export type PlannedRefund = {
  invoiceId: string;
  kind: InvoiceKind;
  amountCents: number;
  chargeId: string | null;
};

export type SuitabilityPlan = {
  policyVersion: string;
  minimumTermWaived: true;
  cancel: { prorate: false; invoice_now: false };
  refunds: PlannedRefund[];
};

const REFUNDABLE_KINDS = new Set<InvoiceKind>(["setup", "recurring", "proration"]);

export function planSuitabilityFailure(input: {
  invoices: SuitabilityInvoice[];
  confirmation: unknown;
  note: unknown;
}): { ok: true; plan: SuitabilityPlan } | { ok: false; reason: "confirmation" | "note" } {
  if (input.confirmation !== SUITABILITY_CONFIRMATION) return { ok: false, reason: "confirmation" };
  if (typeof input.note !== "string" || input.note.trim().length < 8) return { ok: false, reason: "note" };
  const refunds = input.invoices.flatMap((invoice): PlannedRefund[] => {
    if (invoice.status !== "paid" || !REFUNDABLE_KINDS.has(invoice.kind)) return [];
    const amountCents = invoice.amountPaid - invoice.amountRefunded;
    if (!Number.isInteger(amountCents) || amountCents < 1) return [];
    return [{
      invoiceId: invoice.id,
      kind: invoice.kind,
      amountCents,
      chargeId: invoice.chargeId?.trim() || null,
    }];
  });
  return {
    ok: true,
    plan: {
      policyVersion: SUITABILITY_POLICY_VERSION,
      minimumTermWaived: true,
      cancel: { prorate: false, invoice_now: false },
      refunds,
    },
  };
}

export type RefundRequestStatus = "requested" | "processor_pending" | "processor_succeeded" | "processor_failed";

export function refundStatusFromProcessor(status: string | null | undefined): RefundRequestStatus {
  if (status === "succeeded") return "processor_succeeded";
  if (status === "pending") return "processor_pending";
  return "processor_failed";
}

/** Match one open request to a processor-confirmed amount. A miss confirms nothing. */
export function matchConfirmedRefund<T extends { id: string; amountCents: number; status: RefundRequestStatus }>(
  requests: T[],
  amountCents: number,
): string | null {
  if (!Number.isInteger(amountCents) || amountCents < 1) return null;
  const open = requests.find(
    (request) =>
      (request.status === "requested" || request.status === "processor_pending") && request.amountCents === amountCents,
  );
  return open?.id ?? null;
}
