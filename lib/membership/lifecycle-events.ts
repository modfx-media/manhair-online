/**
 * Single source of membership lifecycle event names.
 * App templates and manhair-lifecycle/lifecycle.json both use these strings.
 * Older names stay as aliases so a stored key still collapses to one event.
 */

export const LIFECYCLE_EVENTS = {
  setupPaid: "membership.setup_paid",
  paymentSucceeded: "payment.succeeded",
  invoicePaymentFailed: "invoice.payment_failed",
  invoicePaid: "invoice.paid",
  invoiceUpcoming: "invoice.upcoming",
  pauseSubmitted: "pause_request.submitted",
  pauseApproved: "pause_request.approved",
  consultation: "lead.consultation_interest",
  signupStarted: "signup.started",
  signupAbandoned: "signup.abandoned",
  appointmentConfirmed: "appointment.confirmed",
  serviceReady: "service.ready",
  fittingCompleted: "appointment.completed.fitting",
  visitCompleted: "visit.completed",
} as const;

export type LifecycleEventName = (typeof LIFECYCLE_EVENTS)[keyof typeof LIFECYCLE_EVENTS];

export const LIFECYCLE_EVENT_NAMES: ReadonlySet<string> = new Set(Object.values(LIFECYCLE_EVENTS));

const ALIASES: Array<[string, string]> = [
  ["membership.setup_payment_verified", LIFECYCLE_EVENTS.setupPaid],
  ["stripe_setup_paid", LIFECYCLE_EVENTS.setupPaid],
  ["payment_intent.succeeded", LIFECYCLE_EVENTS.paymentSucceeded],
  ["stripe.invoice.upcoming", LIFECYCLE_EVENTS.invoiceUpcoming],
  ["stripe_invoice_failed", LIFECYCLE_EVENTS.invoicePaymentFailed],
  ["stripe_recurring_timestamp", LIFECYCLE_EVENTS.invoiceUpcoming],
  ["consultation_stored", LIFECYCLE_EVENTS.consultation],
  ["staff_verified_fitting_at", LIFECYCLE_EVENTS.fittingCompleted],
  ["signup_started", LIFECYCLE_EVENTS.signupStarted],
];

export function canonicalEvent(name: string): string {
  let next = name;
  for (const [from, to] of ALIASES) next = next.replaceAll(from, to);
  return next;
}

/** Primary event names inside a catalog key. Schedules like "+ 14 days" are not separate events. */
export function eventBases(eventKey: string): string[] {
  return canonicalEvent(eventKey)
    .split(/\s+AND\s+/i)
    .map((part) => part.replace(/\s+\+\s+\d+\s+days$/i, "").trim())
    .filter(Boolean);
}

export function eventNamesAligned(eventKey: string): boolean {
  const bases = eventBases(eventKey);
  return bases.length > 0 && bases.every((base) => LIFECYCLE_EVENT_NAMES.has(base));
}
