import { addDays } from "./dates";
import type { InvoiceKind } from "./billing";

export const PAYMENT_GRACE_DAYS = 14;

export type ServiceAccess = "open" | "grace" | "held";

/** First unresolved failed monthly invoice starts the clock. A later failure does not move it. */
export function nextGraceStart(input: {
  failed: boolean;
  paid: boolean;
  kind: InvoiceKind;
  stale: boolean;
  current: string | null;
  eventCreated: number;
}): string | null | undefined {
  if (input.stale || input.kind !== "recurring") return undefined;
  if (input.failed) return input.current ? undefined : new Date(input.eventCreated * 1000).toISOString();
  if (input.paid) return null;
  return undefined;
}

export function paymentServiceHold(graceStartedAt: string | null | undefined, now: Date): ServiceAccess {
  if (!graceStartedAt) return "open";
  const ends = addDays(new Date(graceStartedAt), PAYMENT_GRACE_DAYS);
  return now.getTime() < ends.getTime() ? "grace" : "held";
}
