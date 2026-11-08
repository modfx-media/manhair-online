/**
 * Preview-only Stripe test catalog setup.
 * Creates no customers, checkout sessions, subscriptions, or charges.
 * Refuses any live-mode price. Never prints a key.
 */

export const SANDBOX_BRANCH = "cursor/membership-billing-72ca";
export const APPROVED_STRIPE_ACCOUNT = "acct_1DhNFjGiafo5ImyE";
export const SANDBOX_METADATA = "membership";

export type CatalogItem = {
  envName: "STRIPE_PRICE_ESSENTIAL" | "STRIPE_PRICE_SIGNATURE" | "STRIPE_PRICE_ELITE" | "STRIPE_PRICE_SETUP";
  lookupKey: string;
  productName: string;
  unitAmount: number;
  interval: "month" | null;
};

export const SANDBOX_CATALOG: readonly CatalogItem[] = [
  {
    envName: "STRIPE_PRICE_ESSENTIAL",
    lookupKey: "manhair_essential_monthly_44900",
    productName: "ManHair Essential",
    unitAmount: 44_900,
    interval: "month",
  },
  {
    envName: "STRIPE_PRICE_SIGNATURE",
    lookupKey: "manhair_signature_monthly_55900",
    productName: "ManHair Signature",
    unitAmount: 55_900,
    interval: "month",
  },
  {
    envName: "STRIPE_PRICE_ELITE",
    lookupKey: "manhair_elite_monthly_66900",
    productName: "ManHair Elite",
    unitAmount: 66_900,
    interval: "month",
  },
  {
    envName: "STRIPE_PRICE_SETUP",
    lookupKey: "manhair_setup_49500",
    productName: "ManHair Custom Design and First Fitting",
    unitAmount: 49_500,
    interval: null,
  },
];

export type SetupSkipReason = "not_preview" | "wrong_branch" | "setup_not_requested" | "test_key_absent" | "test_key_rejected";

export type SetupDecision = { run: false; reason: SetupSkipReason } | { run: true };

export type KeyShape = "absent" | "test" | "live" | "unrecognized";

/** Removes wrapping quotes and whitespace. Does not log or return the key. */
export function normalizedStripeKey(secret: string | undefined): string {
  let key = secret?.trim() ?? "";
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function stripeKeyShape(secret: string | undefined): KeyShape {
  const key = normalizedStripeKey(secret);
  if (!key) return "absent";
  if (key.startsWith("rk_test_") || key.startsWith("sk_test_")) return "test";
  if (key.startsWith("rk_live_") || key.startsWith("sk_live_")) return "live";
  return "unrecognized";
}

export function sandboxSetupDecision(env: Record<string, string | undefined>): SetupDecision {
  if (env.VERCEL_ENV !== "preview") return { run: false, reason: "not_preview" };
  if (env.VERCEL_GIT_COMMIT_REF !== SANDBOX_BRANCH) return { run: false, reason: "wrong_branch" };
  if (env.MEMBERSHIP_STRIPE_SETUP !== "apply") return { run: false, reason: "setup_not_requested" };
  const shape = stripeKeyShape(env.STRIPE_SECRET_KEY);
  if (shape === "absent") return { run: false, reason: "test_key_absent" };
  if (shape !== "test") return { run: false, reason: "test_key_rejected" };
  return { run: true };
}

export function redactStripeText(value: string): string {
  return value
    .replace(/\b(?:rk|sk)_(?:test|live)_[A-Za-z0-9]+/g, "[redacted-key]")
    .replace(/\bwhsec_[A-Za-z0-9]+/g, "[redacted-webhook]")
    .replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted-database]")
    .slice(0, 300);
}

export type Probe = {
  resource: string;
  action: "read" | "write";
  ok: boolean;
  httpStatus: number | null;
  code: string | null;
  message: string | null;
};

export function probeFromError(resource: string, action: "read" | "write", error: unknown): Probe {
  const record = error && typeof error === "object" ? (error as { statusCode?: number; code?: string; message?: string }) : {};
  const message = redactStripeText(typeof record.message === "string" ? record.message : "stripe_error");
  return {
    resource,
    action,
    ok: false,
    httpStatus: typeof record.statusCode === "number" ? record.statusCode : null,
    code: typeof record.code === "string" ? record.code : null,
    message,
  };
}

export type SandboxPrice = {
  id: string;
  lookupKey: string | null;
  unitAmount: number | null;
  currency: string | null;
  livemode: boolean;
  interval: "month" | null;
};

export type SandboxProduct = { id: string; lookup: string | null };
export type SandboxPortal = { id: string; livemode: boolean; sandbox: boolean; featuresMatch: boolean };

export type SandboxStripe = {
  account(): Promise<{ id: string; livemode?: boolean | null }>;
  listPrices(lookupKeys: string[]): Promise<SandboxPrice[]>;
  listProducts(): Promise<SandboxProduct[]>;
  createProduct(item: CatalogItem): Promise<{ id: string }>;
  createPrice(item: CatalogItem, productId: string): Promise<SandboxPrice>;
  listPortals(): Promise<SandboxPortal[]>;
  createPortal(): Promise<{ id: string }>;
  listWebhookEndpoints(): Promise<{ count: number }>;
  listCustomers(): Promise<{ count: number }>;
};

export type SandboxReport = {
  accountId: string | null;
  livemode: boolean | null;
  writesStopped: string | null;
  prices: Array<{ envName: string; id: string; lookupKey: string; unitAmount: number }>;
  portalConfigurationId: string | null;
  probes: Probe[];
  notCalled: string[];
};

const NOT_CALLED = [
  "POST /v1/customers",
  "POST /v1/checkout/sessions",
  "POST /v1/subscriptions",
  "POST /v1/webhook_endpoints",
  "POST /v1/test_helpers/test_clocks",
];

export function priceDecision(price: SandboxPrice, item: CatalogItem): "accept" | "live_refused" | "amount_mismatch" | "currency_mismatch" | "interval_mismatch" {
  if (price.livemode) return "live_refused";
  if (price.currency !== "usd") return "currency_mismatch";
  if (price.unitAmount !== item.unitAmount) return "amount_mismatch";
  if (price.interval !== item.interval) return "interval_mismatch";
  return "accept";
}

async function probe<T>(resource: string, action: "read" | "write", run: () => Promise<T>, probes: Probe[]): Promise<T | null> {
  try {
    const value = await run();
    probes.push({ resource, action, ok: true, httpStatus: 200, code: null, message: null });
    return value;
  } catch (error) {
    probes.push(probeFromError(resource, action, error));
    return null;
  }
}

export async function runSandboxSetup(stripe: SandboxStripe): Promise<SandboxReport> {
  const probes: Probe[] = [];
  const report: SandboxReport = {
    accountId: null,
    livemode: null,
    writesStopped: null,
    prices: [],
    portalConfigurationId: null,
    probes,
    notCalled: NOT_CALLED,
  };

  const account = await probe("Account", "read", () => stripe.account(), probes);
  if (!account) {
    report.writesStopped = "account_read_failed";
    return report;
  }
  report.accountId = account.id;
  report.livemode = account.livemode ?? null;
  if (account.id !== APPROVED_STRIPE_ACCOUNT) {
    report.writesStopped = "account_mismatch";
    return report;
  }
  if (account.livemode === true) {
    report.writesStopped = "livemode";
    return report;
  }

  await probe("Customers", "read", () => stripe.listCustomers(), probes);
  await probe("Webhook endpoints", "read", () => stripe.listWebhookEndpoints(), probes);

  const portals = await probe("Customer portal configurations", "read", () => stripe.listPortals(), probes);
  const existingPortal = portals?.find((portal) => !portal.livemode && portal.sandbox && portal.featuresMatch) ?? null;
  if (existingPortal) report.portalConfigurationId = existingPortal.id;
  else if (portals) {
    const created = await probe("Customer portal configurations", "write", () => stripe.createPortal(), probes);
    if (created) report.portalConfigurationId = created.id;
  }

  const listedPrices = await probe("Prices", "read", () => stripe.listPrices(SANDBOX_CATALOG.map((item) => item.lookupKey)), probes);
  const products = listedPrices ? await probe("Products", "read", () => stripe.listProducts(), probes) : null;
  if (!listedPrices || !products) {
    report.writesStopped = report.writesStopped ?? "catalog_read_failed";
    return report;
  }

  for (const item of SANDBOX_CATALOG) {
    const found = listedPrices.find((price) => price.lookupKey === item.lookupKey);
    if (found) {
      const decision = priceDecision(found, item);
      if (decision === "accept") {
        report.prices.push({ envName: item.envName, id: found.id, lookupKey: item.lookupKey, unitAmount: item.unitAmount });
        continue;
      }
      probes.push({
        resource: "Prices",
        action: "read",
        ok: false,
        httpStatus: null,
        code: decision,
        message: `${item.lookupKey} was not reused`,
      });
      continue;
    }
    const product = products.find((row) => row.lookup === item.lookupKey);
    const createdProduct = product ?? (await probe("Products", "write", () => stripe.createProduct(item), probes));
    if (!createdProduct) continue;
    const createdPrice = await probe("Prices", "write", () => stripe.createPrice(item, createdProduct.id), probes);
    if (!createdPrice) continue;
    if (priceDecision(createdPrice, item) !== "accept") {
      probes.push({
        resource: "Prices",
        action: "write",
        ok: false,
        httpStatus: null,
        code: "created_price_rejected",
        message: `${item.lookupKey} did not match the published amount`,
      });
      continue;
    }
    report.prices.push({
      envName: item.envName,
      id: createdPrice.id,
      lookupKey: item.lookupKey,
      unitAmount: item.unitAmount,
    });
  }
  return report;
}

export async function previewSandboxBody(env: Record<string, string | undefined>, connect: () => SandboxStripe) {
  const decision = sandboxSetupDecision(env);
  const keyShape = stripeKeyShape(env.STRIPE_SECRET_KEY);
  const deploymentId = env.VERCEL_DEPLOYMENT_ID ?? null;
  if (!decision.run) {
    return {
      scope: "stripe_sandbox_setup",
      phase: "runtime" as const,
      run: false as const,
      reason: decision.reason,
      keyShape,
      deploymentId,
      note: "Sensitive preview keys are not present during the build. This response is from the preview function.",
    };
  }
  const report = await runSandboxSetup(connect());
  return { scope: "stripe_sandbox_setup", phase: "runtime" as const, run: true as const, keyShape, deploymentId, ...report };
}
