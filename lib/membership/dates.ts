import { MIN_TERM_MONTHS, RATE_LOCK_MONTHS, TRIAL_DAYS } from "./offer";

const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date.getTime());
  const day = next.getUTCDate();
  next.setUTCDate(1);
  next.setUTCMonth(next.getUTCMonth() + months);
  const last = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, last));
  return next;
}

export type BillingTimeline = {
  setupAt: Date;
  firstRecurringAt: Date;
  secondRecurringAt: Date;
  minimumTermEndsAt: Date;
  rateLockEndsAt: Date;
  entitlementYearStartsAt: Date;
  entitlementYearEndsAt: Date;
};

/** Setup is due at `start`. The first membership charge is exactly 30 days later. */
export function billingTimeline(start: Date): BillingTimeline {
  const setupAt = new Date(start.getTime());
  const firstRecurringAt = addDays(setupAt, TRIAL_DAYS);
  return {
    setupAt,
    firstRecurringAt,
    secondRecurringAt: addMonths(firstRecurringAt, 1),
    minimumTermEndsAt: addMonths(setupAt, MIN_TERM_MONTHS),
    rateLockEndsAt: addMonths(setupAt, RATE_LOCK_MONTHS),
    entitlementYearStartsAt: setupAt,
    entitlementYearEndsAt: addMonths(setupAt, 12),
  };
}

export function formatStudio(date: Date): string {
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).format(date);
  return `${datePart}, ${timePart} Pacific Time`;
}

export function billingDisclosure(start: Date, monthlyCents: number, setupCents: number): string {
  const timeline = billingTimeline(start);
  const monthly = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    monthlyCents / 100,
  );
  const setup = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(setupCents / 100);
  return [
    `${setup} Custom Design & First Fitting is charged today and goes toward the first system. It is not a separate initiation fee.`,
    `The first ${monthly} membership charge is ${formatStudio(timeline.firstRecurringAt)}, then monthly.`,
    "The 30 days before that charge are not unlimited free service.",
    "The first system is made to order and typically takes 8–12 weeks. That lead time is separate from the billing date. The system is not promised within 30 days.",
    `The rate of the tier you join is locked until ${formatStudio(timeline.rateLockEndsAt)}.`,
    `The minimum term runs until ${formatStudio(timeline.minimumTermEndsAt)}. After that the plan is month to month. Cancellation online adds no fee. During the minimum, cancellation is scheduled for the end of the minimum rather than today.`,
    "This application does not issue refunds. A refund rule has not been approved.",
  ].join(" ");
}
