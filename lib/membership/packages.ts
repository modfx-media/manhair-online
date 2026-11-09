import {
  EXTRA_MAINTENANCE_CENTS,
  EXTRA_SYSTEM_CENTS,
  FIRST_SYSTEM_LEAD,
  MAX_PAUSE_DAYS,
  MIN_TERM_MONTHS,
  RATE_LOCK_MONTHS,
  SETUP_CENTS,
  TIERS,
  TRIAL_DAYS,
  VISITS_PER_YEAR,
  formatUsd,
  type TierId,
} from "./offer";

export const PACKAGE_ORDER: TierId[] = ["essential", "signature", "elite"];

export const SYSTEM_VS_MAINTENANCE =
  "A hair system is one of the custom systems counted for the year. A maintenance visit is a scheduled studio visit that is not a new system. Those two counts add up to 13 scheduled visits. They are not 13 maintenance visits plus extra systems.";

export const VISIT_CADENCE =
  "The 13 visits are scheduled about every 4 weeks. That rhythm is separate from the monthly bill.";

export type PackageFact = {
  id: TierId;
  name: string;
  monthlyCents: number;
  systems: number;
  maintenance: number;
  visits: number;
  priorityBooking: boolean;
  isDefault: boolean;
  /** Twelve monthly charges only. The setup fee is not included. */
  annualMonthlyChargesCents: number;
  selectLabel: string;
  mixLabel: string;
  sumLabel: string;
  difference: string;
  annualNote: string;
  choiceHeadline: string;
  whyChoose: string[];
  bestFor: string;
};

export function packageFact(id: TierId): PackageFact {
  const tier = TIERS[id];
  const visits = tier.systems + tier.maintenance;
  if (visits !== VISITS_PER_YEAR) {
    throw new Error(`${id} visits ${visits} do not add up to ${VISITS_PER_YEAR}`);
  }
  const annualMonthlyChargesCents = tier.monthlyCents * 12;
  return {
    id,
    name: tier.name,
    monthlyCents: tier.monthlyCents,
    systems: tier.systems,
    maintenance: tier.maintenance,
    visits,
    priorityBooking: tier.priorityBooking,
    isDefault: tier.recommended,
    annualMonthlyChargesCents,
    selectLabel: `Choose ${tier.name}`,
    choiceHeadline: packageHeadline(id),
    mixLabel: `${tier.systems} hair systems + ${tier.maintenance} maintenance visits a year`,
    sumLabel: `${tier.systems} + ${tier.maintenance} = ${visits} scheduled studio visits a year`,
    difference: packageDifference(id),
    annualNote: `Twelve monthly charges add up to ${formatUsd(annualMonthlyChargesCents)}. That figure does not include the ${formatUsd(SETUP_CENTS)} setup, and it is not a discounted annual plan.`,
    whyChoose: packageWhy(id),
    bestFor: packageBestFor(id),
  };
}

export function packageFacts(): PackageFact[] {
  return PACKAGE_ORDER.map(packageFact);
}

export const PACKAGE_PAGE = {
  headline: "Your hair. Your terms.",
  subhead: "Three plans. The same 13 visits a year. Pick the mix of new systems and the monthly price.",
  primaryCta: "Choose Signature",
} as const;

export function packageHeadline(id: TierId): string {
  if (id === "essential") return "Lower monthly price, fewer new systems.";
  if (id === "signature") return "Our default pick.";
  return "Most new systems, priority booking.";
}

export function packageWhy(id: TierId): string[] {
  const tier = TIERS[id];
  if (id === "essential") {
    return ["Lowest monthly price of the three plans", "Same 13 visits a year as every other plan"];
  }
  if (id === "signature") {
    return ["More new systems than Essential", `${tier.systems} systems plus ${tier.maintenance} maintenance visits`];
  }
  return ["Most new systems of any plan", "Our team schedules visits. This is not a booking link."];
}

export function packageBestFor(id: TierId): string {
  if (id === "essential") return "Best for those who want the lowest monthly cost and fewer new systems a year.";
  if (id === "signature") return "Best for those who want more new systems a year without the top tier.";
  return "Best for those who want the most new systems a year and priority booking.";
}

export function packageDifference(id: TierId): string {
  if (id === "essential") return "The fewest hair systems and the most maintenance visits. No priority booking.";
  if (id === "signature") return "More hair systems than Essential and fewer than Elite. No priority booking.";
  return "The most hair systems, the fewest maintenance visits, and the only priority booking.";
}

export const SHARED_PACKAGE = {
  setupCents: SETUP_CENTS,
  setupName: "Custom Design & First Fitting",
  trialDays: TRIAL_DAYS,
  leadTime: FIRST_SYSTEM_LEAD,
  minimumMonths: MIN_TERM_MONTHS,
  rateLockMonths: RATE_LOCK_MONTHS,
  pauseDays: MAX_PAUSE_DAYS,
  extraSystemCents: EXTRA_SYSTEM_CENTS,
  extraMaintenanceCents: EXTRA_MAINTENANCE_CENTS,
} as const;
