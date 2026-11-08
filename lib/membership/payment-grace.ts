import { addDays } from "./dates";
import type { InvoiceKind } from "./billing";

export const PAYMENT_GRACE_DAYS = 14;

export type ServiceAccess = "open" | "grace" | "held";

export type GraceInvoice = {
  id: string;
  kind: InvoiceKind | string;
  status: "paid" | "failed";
  failedAt?: string | null;
  statusEventCreated?: number | null;
  amountPaid: number;
  amountRefunded: number;
  memberId: string | null;
  chargeId?: string | null;
};

/** Ignore an older event for the same invoice. A retry keeps the first failure time. */
export function applyInvoiceObservation<T extends GraceInvoice>(
  current: T | null,
  incoming: T & { statusEventCreated: number },
): { applied: boolean; invoice: T } {
  if (current && (current.statusEventCreated ?? -1) > incoming.statusEventCreated) {
    return { applied: false, invoice: current };
  }
  if (current && current.statusEventCreated === incoming.statusEventCreated && current.status === incoming.status) {
    return { applied: false, invoice: current };
  }
  const failedAt = incoming.status === "failed" && incoming.kind === "recurring"
    ? current?.failedAt ?? new Date(incoming.statusEventCreated * 1000).toISOString()
    : current?.failedAt ?? null;
  return {
    applied: true,
    invoice: {
      ...(current ?? incoming),
      ...incoming,
      amountRefunded: current?.amountRefunded ?? incoming.amountRefunded,
      failedAt,
      statusEventCreated: incoming.statusEventCreated,
    },
  };
}

/**
 * The clock stays until every failed monthly invoice is paid.
 * Paying one overdue month does not clear or restart it while another remains open.
 */
export function reconcileGrace(current: string | null, invoices: GraceInvoice[]): string | null {
  const open = invoices.filter((invoice) => invoice.kind === "recurring" && invoice.status === "failed");
  if (open.length === 0) return null;
  if (current) return current;
  const times = open.map((invoice) => invoice.failedAt).filter((value): value is string => Boolean(value)).sort();
  return times[0] ?? null;
}

export function paymentServiceHold(graceStartedAt: string | null | undefined, now: Date): ServiceAccess {
  if (!graceStartedAt) return "open";
  const ends = addDays(new Date(graceStartedAt), PAYMENT_GRACE_DAYS);
  return now.getTime() < ends.getTime() ? "grace" : "held";
}
