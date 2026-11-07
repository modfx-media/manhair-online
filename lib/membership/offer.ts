/** Published ManHair membership offer. Server code is the price authority. */

export const TERMS_VERSION = "2026-11-07";

export const SETUP_CENTS = 49_500;
export const FOUNDING_SETUP_CENTS = 29_500;
export const FOUNDING_CAP_MAX = 25;
export const EXTRA_SYSTEM_CENTS = 84_900;
export const EXTRA_MAINTENANCE_CENTS = 22_500;
export const ELITE_BACKUP_CENTS = 84_900;
export const TRIAL_DAYS = 30;
export const MIN_TERM_MONTHS = 3;
export const RATE_LOCK_MONTHS = 24;
export const MAX_PAUSE_DAYS = 60;
export const VISITS_PER_YEAR = 13;

export const ADDON_POLICY = {
  status: "unresolved" as const,
  summary:
    "Additional fitted systems ($849), extra maintenance ($225), and the Elite backup ($849) are published prices. Checkout does not sell them, and paying one does not change system or visit balances.",
};

export const REFUND_POLICY = {
  status: "unresolved" as const,
  summary:
    "This application does not refund charges. Whether money already collected is refundable has not been decided.",
};

export const PAUSE_POLICY_VERSION = "2026-11-07-void-collection-freeze-term";

export const SCHEDULING = {
  status: "not_connected" as const,
  summary:
    "Studio scheduling is not connected. Griselda’s appointment system has not been identified. This app does not book a visit and does not confirm one.",
};

export const FIRST_SYSTEM_LEAD = "8–12 weeks";

/** Owner-confirmed processor identity. The app discloses it and does not change the shared Stripe profile. */
export const MERCHANT = {
  statementDescriptor: "MODFXMEDIA, LLC",
  disclosure:
    "Card charges are processed by Stripe and will show on your statement as MODFXMEDIA, LLC. This checkout does not change that shared Stripe business profile.",
} as const;

export type TierId = "essential" | "signature" | "elite";

export type TierOffer = {
  id: TierId;
  name: string;
  monthlyCents: number;
  systems: number;
  maintenance: number;
  priorityBooking: boolean;
  recommended: boolean;
  badge: string | null;
  fit: string;
};

export const TIERS: Record<TierId, TierOffer> = {
  essential: {
    id: "essential",
    name: "Essential",
    monthlyCents: 44_900,
    systems: 4,
    maintenance: 9,
    priorityBooking: false,
    recommended: false,
    badge: null,
    fit: "Suited to French lace, mono, and 0.08 skin.",
  },
  signature: {
    id: "signature",
    name: "Signature",
    monthlyCents: 55_900,
    systems: 6,
    maintenance: 7,
    priorityBooking: false,
    recommended: true,
    badge: "Most guys pick this",
    fit: "The membership most members choose.",
  },
  elite: {
    id: "elite",
    name: "Elite",
    monthlyCents: 66_900,
    systems: 8,
    maintenance: 5,
    priorityBooking: true,
    recommended: false,
    badge: null,
    fit: "Suited to thin skin and Swiss lace, with priority booking.",
  },
};

export const TIER_IDS = Object.keys(TIERS) as TierId[];

/** No merchant account is hard-coded as allowed or refused. The owner confirms one with configuration. */

export function isTierId(value: unknown): value is TierId {
  return typeof value === "string" && value in TIERS;
}

export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

