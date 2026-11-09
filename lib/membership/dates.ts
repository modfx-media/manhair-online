import { MERCHANT, MIN_TERM_MONTHS, RATE_LOCK_MONTHS, TRIAL_DAYS } from "./offer";

/** Studio clock. This is the app timezone. It is not copied from a HighLevel location setting. */
export const APP_TIMEZONE = "America/Los_Angeles";

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

/** Calendar date in the studio zone. Charge dates do not include the page-load clock time. */
export function formatStudio(date: Date): string {
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return `${datePart}, Pacific Time`;
}

export function billingDisclosure(start: Date, monthlyCents: number, setupCents: number): string {
  const timeline = billingTimeline(start);
  const monthly = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    monthlyCents / 100,
  );
  const setup = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(setupCents / 100);
  return [
    `${setup} Custom Design & First Fitting is charged today and goes toward the first system. It is not a separate initiation fee.`,
    `The first ${monthly} membership charge is ${formatStudio(timeline.firstRecurringAt)}. The next charge is one calendar month later, on ${formatStudio(timeline.secondRecurringAt)}, then each calendar month.`,
    "The 30 days before that charge are not unlimited free service.",
    "The first system is made to order and typically takes 8–12 weeks. That lead time is separate from the billing date. The system is not promised within 30 days.",
    `The rate of the tier you join is locked until ${formatStudio(timeline.rateLockEndsAt)}.`,
    `The minimum term runs until ${formatStudio(timeline.minimumTermEndsAt)}. After that the plan is month to month. An online cancellation is a request for staff review. It does not change billing by itself.`,
    "A consultation is optional. You can join and pay before one, and a consultation request is not required to check out.",
    "You can join and pay before a consultation. If that consultation finds the membership unsuitable, the setup payment and any membership charges already collected are refunded and future billing is cancelled. The 3-month minimum does not block that refund.",
    "A failed monthly payment has 14 days before visits and new system orders are held. The membership stays open, and an order already underway is not cancelled.",
    "Griselda arranges visits manually. This checkout has no booking link.",
    MERCHANT.disclosure,
  ].join(" ");
}
