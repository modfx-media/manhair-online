import { createHash, randomBytes } from "node:crypto";
import { billingDisclosure, billingTimeline } from "./dates";
import { TERMS_VERSION, TRIAL_DAYS, type TierId } from "./offer";
import { expectedPrice, type AppEnv, type Blocker } from "./readiness";

export type PriceSnapshot = {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string } | null;
};

export function priceMatches(
  price: PriceSnapshot,
  expected: { id: string; cents: number; interval: "month" | null },
): boolean {
  if (price.id !== expected.id) return false;
  if (price.currency !== "usd") return false;
  if (price.unit_amount !== expected.cents) return false;
  if (expected.interval === null) return price.recurring === null;
  return price.recurring?.interval === expected.interval;
}

export type CheckoutLine = { price: string; quantity: 1 };

export type CheckoutParams = {
  mode: "subscription";
  client_reference_id: string;
  customer_email: string;
  line_items: CheckoutLine[];
  subscription_data: {
    trial_period_days: number;
    trial_settings: { end_behavior: { missing_payment_method: "cancel" } };
    metadata: Record<string, string>;
    description: string;
  };
  metadata: Record<string, string>;
  success_url: string;
  cancel_url: string;
  payment_method_collection: "always";
  custom_text: { submit: { message: string } };
  expires_at: number;
  integration_identifier: string;
};

export function integrationIdentifier(alphabet = randomLetters(8)): string {
  if (!/^[a-z]{8}$/.test(alphabet)) {
    throw new Error("integration identifier suffix must be 8 letters");
  }
  return `manhair_membership_${alphabet}`;
}

function randomLetters(count: number): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const bytes = randomBytes(count);
  let out = "";
  for (let i = 0; i < count; i += 1) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

export function checkoutIdempotencyKey(input: {
  memberId: string;
  tier: TierId;
  setupCents: number;
  termsVersion: string;
}): string {
  const digest = createHash("sha256")
    .update(`${input.memberId}|${input.tier}|${input.setupCents}|${input.termsVersion}`)
    .digest("hex")
    .slice(0, 32);
  return `mh_${digest}`;
}

export function assessCheckoutAmount(
  amountTotal: number | null,
  setupCents: number,
  monthlyCents: number,
): "setup_only" | "setup_and_recurring" | "zero" | "unexpected" {
  if (amountTotal === null || amountTotal === 0) return "zero";
  if (amountTotal === setupCents) return "setup_only";
  if (amountTotal === setupCents + monthlyCents) return "setup_and_recurring";
  return "unexpected";
}

export function buildCheckoutParams(input: {
  env: AppEnv;
  memberId: string;
  email: string;
  tier: TierId;
  useFounding: boolean;
  origin: string;
  now: Date;
  returnToken: string;
  reservationId: string | null;
}): { ok: true; params: CheckoutParams; idempotencyKey: string } | { ok: false; blockers: Blocker[] } {
  const expected = expectedPrice(input.env, input.tier, input.useFounding);
  if (!expected) {
    return {
      ok: false,
      blockers: [
        {
          code: "price_not_configured",
          publicMessage: "Card checkout is not available yet. A confirmed ManHair payment account is not connected.",
          operatorMessage: "Tier or setup price id is missing.",
        },
      ],
    };
  }
  const timeline = billingTimeline(input.now);
  const disclosure = billingDisclosure(input.now, expected.monthlyCents, expected.setupCents);
  const params: CheckoutParams = {
    mode: "subscription",
    client_reference_id: input.memberId,
    customer_email: input.email,
    line_items: [
      { price: expected.tierPriceId, quantity: 1 },
      { price: expected.setupPriceId, quantity: 1 },
    ],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      description: `ManHair ${input.tier} membership. Setup today, first monthly charge 30 days later.`,
      metadata: {
        member_id: input.memberId,
        tier: input.tier,
        terms_version: TERMS_VERSION,
        autorenew_consent: "yes",
      },
    },
    metadata: {
      member_id: input.memberId,
      tier: input.tier,
      terms_version: TERMS_VERSION,
      founding_reservation_id: input.reservationId ?? "",
      first_recurring_at: timeline.firstRecurringAt.toISOString(),
    },
    success_url: `${input.origin}/api/membership/return/?token=${encodeURIComponent(input.returnToken)}`,
    cancel_url: `${input.origin}/join/?tier=${input.tier}&checkout=cancelled`,
    payment_method_collection: "always",
    custom_text: { submit: { message: disclosure.slice(0, 1200) } },
    expires_at: Math.floor(input.now.getTime() / 1000) + 30 * 60,
    integration_identifier: integrationIdentifier(),
  };
  assertSingleSubscription(params);
  return {
    ok: true,
    params,
    idempotencyKey: checkoutIdempotencyKey({
      memberId: input.memberId,
      tier: input.tier,
      setupCents: expected.setupCents,
      termsVersion: TERMS_VERSION,
    }),
  };
}

export function assertSingleSubscription(params: CheckoutParams): void {
  if (params.mode !== "subscription") throw new Error("checkout must be a single subscription");
  if (params.subscription_data.trial_period_days !== TRIAL_DAYS) {
    throw new Error("trial must be 30 days");
  }
  if (params.line_items.length !== 2) throw new Error("expected one recurring price and one setup price");
  if ("payment_method_types" in params) throw new Error("payment_method_types is not allowed");
}

export function safeAppOrigin(request: Request, env: AppEnv): string {
  const configured = (env.NEXT_PUBLIC_SITE_URL || "https://www.manhaironline.com").replace(/\/$/, "");
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  const bare = host.split(",")[0]?.trim().toLowerCase() ?? "";
  if (bare === "localhost:3000" || bare.endsWith(".vercel.app")) {
    return `${proto}://${bare}`;
  }
  return configured;
}

export function isSameOrigin(request: Request, origin: string): boolean {
  const header = request.headers.get("origin");
  return header === origin;
}
