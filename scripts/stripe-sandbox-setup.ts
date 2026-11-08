import Stripe from "stripe";
import {
  BILLING_PORTAL_FEATURES,
} from "../lib/membership/handlers";
import {
  SANDBOX_METADATA,
  redactStripeText,
  runSandboxSetup,
  sandboxSetupDecision,
  type CatalogItem,
  type SandboxPortal,
  type SandboxPrice,
  type SandboxStripe,
} from "../lib/membership/stripe-sandbox-setup";

/**
 * Runs only on the membership preview branch when MEMBERSHIP_STRIPE_SETUP=apply
 * and the key is a test key. Failure to set up Stripe does not fail the site build.
 * The key is never printed.
 */
async function main() {
  const decision = sandboxSetupDecision(process.env);
  if (!decision.run) {
    console.log(JSON.stringify({ scope: "stripe_sandbox_setup", run: false, reason: decision.reason }));
    return;
  }
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  const stripe = new Stripe(key, { appInfo: { name: "manhair-membership", url: "https://www.manhaironline.com" } });
  const report = await Promise.race([
    runSandboxSetup(client(stripe)),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("sandbox_setup_timeout")), 25_000);
    }),
  ]);
  console.log(JSON.stringify({ scope: "stripe_sandbox_setup", run: true, ...report }));
}

function client(stripe: Stripe): SandboxStripe {
  return {
    async account() {
      const account = await stripe.accounts.retrieveCurrent();
      const livemode = "livemode" in account ? Boolean(account.livemode) : null;
      return { id: account.id, livemode };
    },
    async listPrices(lookupKeys) {
      const page = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 10 });
      return page.data.map(mapPrice);
    },
    async listProducts() {
      const page = await stripe.products.list({ limit: 100, active: true });
      return page.data.map((product) => ({ id: product.id, lookup: product.metadata.lookup ?? null }));
    },
    async createProduct(item) {
      const product = await stripe.products.create(
        {
          name: item.productName,
          metadata: { manhair_sandbox: SANDBOX_METADATA, lookup: item.lookupKey },
        },
        { idempotencyKey: `manhair-sandbox-product-${item.lookupKey}` },
      );
      return { id: product.id };
    },
    async createPrice(item, productId) {
      const price = await stripe.prices.create(priceParams(item, productId), {
        idempotencyKey: `manhair-sandbox-price-${item.lookupKey}`,
      });
      return mapPrice(price);
    },
    async listPortals() {
      const page = await stripe.billingPortal.configurations.list({ limit: 100 });
      return page.data.map(mapPortal);
    },
    async createPortal() {
      const configuration = await stripe.billingPortal.configurations.create(
        {
          metadata: { manhair_sandbox: SANDBOX_METADATA },
          default_return_url: "https://www.manhaironline.com/account/",
          business_profile: { headline: "ManHair membership" },
          features: {
            invoice_history: { enabled: true },
            payment_method_update: { enabled: true },
            customer_update: { enabled: false },
            subscription_cancel: { enabled: false },
            subscription_update: { enabled: false },
          },
        },
        { idempotencyKey: "manhair-sandbox-portal-billing-only" },
      );
      return { id: configuration.id };
    },
    async listWebhookEndpoints() {
      const page = await stripe.webhookEndpoints.list({ limit: 1 });
      return { count: page.data.length };
    },
    async listCustomers() {
      const page = await stripe.customers.list({ limit: 1 });
      return { count: page.data.length };
    },
  };
}

function mapPrice(price: Stripe.Price): SandboxPrice {
  return {
    id: price.id,
    lookupKey: price.lookup_key,
    unitAmount: price.unit_amount,
    currency: price.currency,
    livemode: price.livemode,
    interval: price.recurring?.interval === "month" ? "month" : null,
  };
}

function mapPortal(configuration: Stripe.BillingPortal.Configuration): SandboxPortal {
  const features = configuration.features;
  const featuresMatch = (Object.keys(BILLING_PORTAL_FEATURES) as Array<keyof typeof BILLING_PORTAL_FEATURES>).every(
    (key) => features[key]?.enabled === BILLING_PORTAL_FEATURES[key].enabled,
  );
  return {
    id: configuration.id,
    livemode: configuration.livemode,
    sandbox: configuration.metadata?.manhair_sandbox === SANDBOX_METADATA,
    featuresMatch,
  };
}

function priceParams(item: CatalogItem, productId: string): Stripe.PriceCreateParams {
  return {
    product: productId,
    currency: "usd",
    unit_amount: item.unitAmount,
    lookup_key: item.lookupKey,
    nickname: item.productName,
    metadata: { manhair_sandbox: SANDBOX_METADATA },
    ...(item.interval ? { recurring: { interval: item.interval } } : {}),
  };
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "sandbox_setup_failed";
  console.log(JSON.stringify({ scope: "stripe_sandbox_setup", run: false, reason: "error", message: redactStripeText(message) }));
});
