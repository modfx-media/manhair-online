import { STRIPE_WEBHOOK_EVENTS, STRIPE_WEBHOOK_PATH, alertsForPayment, customerAlertsReady, ownerAlertsReady } from "../lib/membership/alerts";
import { billingTimeline } from "../lib/membership/dates";
import { BILLING_PORTAL_FEATURES, handleAccountGet, handleCheckout, handleWebhook, drainAlerts, type Deps } from "../lib/membership/handlers";
import { revenueReport } from "../lib/membership/lifecycle";
import { MERCHANT } from "../lib/membership/offer";
import { createMemoryStore } from "../lib/membership/memory-store";
import type { MemberRecord } from "../lib/membership/types";
import Stripe from "stripe";

const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

function check(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name} — ${detail}`);
}

const now = new Date("2026-11-07T19:00:00.000Z");
const timeline = billingTimeline(now);
check(
  "billing timeline",
  timeline.firstRecurringAt.getTime() - now.getTime() === 30 * 24 * 60 * 60 * 1000 &&
    timeline.secondRecurringAt.toISOString() === "2027-01-07T19:00:00.000Z",
  "setup at checkout instant, first membership +30 days, next charge one calendar month later",
);
check("merchant disclosure", MERCHANT.statementDescriptor === "MANHAIR", MERCHANT.disclosure);
check(
  "stripe events",
  STRIPE_WEBHOOK_EVENTS.includes("invoice.paid") && STRIPE_WEBHOOK_EVENTS.includes("invoice.payment_failed"),
  `${STRIPE_WEBHOOK_PATH} listens for ${STRIPE_WEBHOOK_EVENTS.join(", ")}`,
);

const env = {
  STRIPE_SECRET_KEY: "sk_test_smoke",
  STRIPE_WEBHOOK_SECRET: "whsec_smoke",
  STRIPE_ACCOUNT_ID: "acct_1DhNFjGiafo5ImyE",
  MEMBERSHIP_STRIPE_ACCOUNT_CONFIRMED: "true",
  STRIPE_PRICE_ESSENTIAL: "price_essential",
  STRIPE_PRICE_SIGNATURE: "price_signature",
  STRIPE_PRICE_ELITE: "price_elite",
  STRIPE_PRICE_SETUP: "price_setup",
  MEMBERSHIP_SESSION_SECRET: "smoke-secret",
  NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com",
  MEMBERSHIP_OWNER_EMAILS: "owner@example.com",
};
const store = createMemoryStore();
const creates: Array<Record<string, unknown>> = [];
const deps = {
  env,
  store,
  now: () => now,
  stripe: {
    accounts: { async retrieveCurrent() { return { id: "acct_1DhNFjGiafo5ImyE" }; } },
    prices: {
      async retrieve(id: string) {
        if (id === "price_signature") return { id, unit_amount: 55900, currency: "usd", recurring: { interval: "month" } };
        return { id, unit_amount: 49500, currency: "usd", recurring: null };
      },
    },
    checkout: {
      sessions: {
        async create(params: Record<string, unknown>) {
          creates.push(params);
          return { id: "cs_smoke", url: "https://checkout.stripe.test/c/cs_smoke" };
        },
      },
    },
    billingPortal: {
      configurations: {
        async retrieve(id: string) {
          return {
            id,
            features: {
              invoice_history: { enabled: true },
              payment_method_update: { enabled: true },
              subscription_cancel: { enabled: false },
              subscription_update: { enabled: false },
              customer_update: { enabled: false },
            },
          };
        },
      },
      sessions: { async create() { return { url: "https://billing.stripe.com/p/smoke" }; } },
    },
    subscriptions: { async update() { return { id: "sub_smoke" }; } },
  },
  fetchImpl: async () => {
    throw new Error("smoke must not send email");
  },
} as Deps;

const checkout = await handleCheckout(
  new Request("https://www.manhaironline.com/api/membership/checkout/", {
    method: "POST",
    headers: { origin: "https://www.manhaironline.com", host: "www.manhaironline.com", "content-type": "application/json" },
    body: JSON.stringify({
      tier: "signature",
      firstName: "Smoke",
      lastName: "Test",
      email: "smoke@example.com",
      termsAccepted: true,
      autorenewAccepted: true,
      founding: false,
    }),
  }),
  deps,
);
const checkoutBody = await checkout.json();
const params = creates[0] as { mode?: string; subscription_data?: { trial_period_days?: number }; line_items?: unknown[]; payment_method_types?: string[] };
check("hosted checkout", checkout.status === 200 && params?.mode === "subscription" && params.subscription_data?.trial_period_days === 30 && params.line_items?.length === 2 && params.payment_method_types?.length === 1 && params.payment_method_types[0] === "card", checkoutBody.url ?? checkoutBody.error ?? "no url");

const isolated = await handleAccountGet(new Request("https://www.manhaironline.com/account/?email=smoke@example.com"), deps);
check("auth isolation", isolated.status === 401, "email query does not open an account");

const stripe = new Stripe("sk_test_smoke");
const payload = JSON.stringify({
  id: "evt_smoke",
  object: "event",
  type: "invoice.paid",
  created: 20,
  data: {
    object: {
      id: "in_smoke",
      object: "invoice",
      customer: "cus_smoke",
      amount_paid: 49500,
      billing_reason: "subscription_create",
      lines: { data: [{ amount: 49500, pricing: { price_details: { price: "price_setup" } } }] },
    },
  },
});
const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_smoke" });
const member = (await store.listMembers())[0] as MemberRecord;
member.stripeCustomerId = "cus_smoke";
member.setupCents = 49500;
await store.saveMember(member);
const webhook = await handleWebhook(
  new Request("https://www.manhaironline.com/api/membership/webhook/", { method: "POST", headers: { "stripe-signature": header }, body: payload }),
  { ...deps, constructEvent: (raw, signature, secret) => stripe.webhooks.constructEvent(raw, signature, secret) as never },
);
const duplicate = await handleWebhook(
  new Request("https://www.manhaironline.com/api/membership/webhook/", { method: "POST", headers: { "stripe-signature": header }, body: payload }),
  { ...deps, constructEvent: (raw, signature, secret) => stripe.webhooks.constructEvent(raw, signature, secret) as never },
);
check("webhook signature and idempotency", webhook.status === 200 && (await duplicate.json()).duplicate === true, "first accepted, replay duplicate");

const alerts = await store.listAlerts();
check(
  "alert outbox held",
  alerts.some((alert) => alert.kind === "setup_paid" && alert.audience === "owner" && alert.status === "held") &&
    !ownerAlertsReady(env) &&
    !customerAlertsReady(env),
  `${alerts.length} alert rows recorded, none sent`,
);
const drain = await drainAlerts(deps);
check("alert drain does not send", drain.delivered === 0, `delivered ${drain.delivered}, held ${drain.held}`);

const report = revenueReport(
  [{ status: "paid", kind: "setup", amountPaid: 49500, amountRefunded: 0 }],
  [
    { status: "trialing", monthlyCents: 55900 },
    { status: "active", monthlyCents: 66900 },
  ],
);
check(
  "trial versus paid reporting",
  report.setupCollectedCents === 49500 && report.projectedMrrCents === 66900 && report.trialingUnpaidMonthlyCents === 55900,
  "setup cash is separate from projected MRR, and the trial is not counted as paid MRR",
);
check(
  "portal isolation",
  BILLING_PORTAL_FEATURES.subscription_cancel.enabled === false && BILLING_PORTAL_FEATURES.payment_method_update.enabled === true,
  "portal cannot cancel or change the plan",
);
check(
  "held alert retry math",
  alertsForPayment({
    eventId: "evt_repeat",
    previousStatus: "past_due",
    invoice: { kind: "recurring", status: "paid", amountPaid: 55900 },
    webhookFailed: false,
    memberId: "mem",
    now,
    env,
  }).every((alert) => alert.status === "held"),
  "recovered invoice is recorded and held until sender and recipient are configured",
);

const failed = checks.filter((item) => !item.ok);
console.log(`Smoke ${failed.length === 0 ? "passed" : "failed"}: ${checks.length - failed.length}/${checks.length}. No Stripe account was called.`);
if (failed.length) process.exit(1);
