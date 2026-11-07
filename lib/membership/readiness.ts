import {
  FOUNDING_CAP_MAX,
  FOUNDING_SETUP_CENTS,
  isTierId,
  SETUP_CENTS,
  TIERS,
  type TierId,
} from "./offer";

export type AppEnv = Record<string, string | undefined>;

export type Blocker = {
  code: string;
  publicMessage: string;
  operatorMessage: string;
};

const PUBLIC_PAYMENTS =
  "Card checkout is not available yet. A confirmed ManHair payment account is not connected.";

function missing(name: string): Blocker {
  return {
    code: `missing_${name}`,
    publicMessage: PUBLIC_PAYMENTS,
    operatorMessage: `${name} is not set.`,
  };
}

export type KeyMode = "live" | "test" | "unknown";

export function stripeKeyMode(secret: string | undefined): KeyMode {
  const key = secret?.trim() ?? "";
  if (key.startsWith("sk_live_") || key.startsWith("rk_live_")) return "live";
  if (key.startsWith("sk_test_") || key.startsWith("rk_test_")) return "test";
  return "unknown";
}

export function paymentBlockers(
  env: AppEnv,
  retrievedAccountId?: string | null,
): Blocker[] {
  const blockers: Blocker[] = [];
  const secret = env.STRIPE_SECRET_KEY?.trim();
  const account = env.STRIPE_ACCOUNT_ID?.trim();
  const mode = stripeKeyMode(secret);

  if (!secret) blockers.push(missing("STRIPE_SECRET_KEY"));
  else if (mode === "unknown") {
    blockers.push({
      code: "stripe_key_unrecognized",
      publicMessage: PUBLIC_PAYMENTS,
      operatorMessage: "STRIPE_SECRET_KEY must be a Stripe secret or restricted key.",
    });
  }

  if (!env.STRIPE_WEBHOOK_SECRET?.trim()) blockers.push(missing("STRIPE_WEBHOOK_SECRET"));
  if (!account) blockers.push(missing("STRIPE_ACCOUNT_ID"));
  if (env.MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED !== "true") {
    blockers.push({
      code: "stripe_account_unconfirmed",
      publicMessage: PUBLIC_PAYMENTS,
      operatorMessage:
        "MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED is not true. Checkout stays closed until the owner confirms the expected Stripe account. No account id is hard-coded as allowed or refused.",
    });
  } else if (retrievedAccountId && account && retrievedAccountId !== account) {
    blockers.push({
      code: "stripe_account_mismatch",
      publicMessage: PUBLIC_PAYMENTS,
      operatorMessage: "The key's Stripe account does not match STRIPE_ACCOUNT_ID.",
    });
  }

  if (mode === "live" && env.MEMBERSHIP_PAYMENTS_LIVE !== "true") {
    blockers.push({
      code: "live_payments_blocked",
      publicMessage: PUBLIC_PAYMENTS,
      operatorMessage: "Live Stripe keys stay blocked until MEMBERSHIP_PAYMENTS_LIVE=true.",
    });
  }
  if (env.MEMBERSHIP_PAYMENTS_LIVE === "true" && mode !== "live") {
    blockers.push({
      code: "live_flag_without_live_key",
      publicMessage: PUBLIC_PAYMENTS,
      operatorMessage: "MEMBERSHIP_PAYMENTS_LIVE=true requires a live Stripe key.",
    });
  }

  for (const tier of Object.keys(TIERS) as TierId[]) {
    const name = `STRIPE_PRICE_${tier.toUpperCase()}`;
    if (!env[name]?.trim()) blockers.push(missing(name));
  }
  if (!env.STRIPE_PRICE_SETUP?.trim()) blockers.push(missing("STRIPE_PRICE_SETUP"));

  const founding = foundingConfig(env);
  if (founding.enabled && !env.STRIPE_PRICE_SETUP_FOUNDING?.trim()) {
    blockers.push(missing("STRIPE_PRICE_SETUP_FOUNDING"));
  }

  return blockers;
}

export function portalBlockers(env: AppEnv): Blocker[] {
  const blockers = paymentBlockers(env);
  if (!env.STRIPE_PORTAL_CONFIGURATION_ID?.trim()) {
    blockers.push({
      code: "missing_STRIPE_PORTAL_CONFIGURATION_ID",
      publicMessage: "Payment-method update is not available yet.",
      operatorMessage:
        "STRIPE_PORTAL_CONFIGURATION_ID is not set. The default Customer Portal is not opened, because it can cancel or change plans outside these rules.",
    });
  }
  return blockers;
}

export type FoundingConfig =
  | { enabled: false; reason: string }
  | { enabled: true; cap: number; setupCents: number };

export function foundingConfig(env: AppEnv): FoundingConfig {
  if (env.MEMBERSHIP_FOUNDING_ENABLED !== "true") {
    return { enabled: false, reason: "MEMBERSHIP_FOUNDING_ENABLED is not true." };
  }
  const raw = env.MEMBERSHIP_FOUNDING_CAP?.trim();
  const cap = raw ? Number(raw) : 25;
  if (!Number.isInteger(cap) || cap < 1 || cap > FOUNDING_CAP_MAX) {
    return {
      enabled: false,
      reason: `MEMBERSHIP_FOUNDING_CAP must be an integer from 1 to ${FOUNDING_CAP_MAX}.`,
    };
  }
  return { enabled: true, cap, setupCents: FOUNDING_SETUP_CENTS };
}

export function setupCentsFor(env: AppEnv, useFounding: boolean): number {
  const founding = foundingConfig(env);
  if (useFounding && founding.enabled) return founding.setupCents;
  return SETUP_CENTS;
}

export function priceEnvName(tier: TierId): string {
  return `STRIPE_PRICE_${tier.toUpperCase()}`;
}

export function expectedPrice(
  env: AppEnv,
  tier: TierId,
  useFounding: boolean,
): { tierPriceId: string; setupPriceId: string; monthlyCents: number; setupCents: number } | null {
  if (!isTierId(tier)) return null;
  const tierPriceId = env[priceEnvName(tier)]?.trim();
  const founding = foundingConfig(env);
  const setupPriceId = (useFounding && founding.enabled
    ? env.STRIPE_PRICE_SETUP_FOUNDING
    : env.STRIPE_PRICE_SETUP
  )?.trim();
  if (!tierPriceId || !setupPriceId) return null;
  return {
    tierPriceId,
    setupPriceId,
    monthlyCents: TIERS[tier].monthlyCents,
    setupCents: useFounding && founding.enabled ? founding.setupCents : SETUP_CENTS,
  };
}

export function databaseReady(env: AppEnv): boolean {
  return Boolean(env.DATABASE_URL?.trim());
}

export function sessionSecret(env: AppEnv): string | null {
  return env.MEMBERSHIP_SESSION_SECRET?.trim() || env.PAYLOAD_SECRET?.trim() || null;
}

export const CHECKOUT_TIMELINE_SANDBOX_CONFIRMED = false;
