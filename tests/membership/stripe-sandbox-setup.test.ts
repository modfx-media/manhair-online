import assert from "node:assert/strict";
import { test } from "node:test";
import {
  APPROVED_STRIPE_ACCOUNT,
  SANDBOX_CATALOG,
  previewSandboxBody,
  priceDecision,
  redactStripeText,
  runSandboxSetup,
  sandboxSetupDecision,
  stripeKeyClass,
  stripeKeyShape,
  type SandboxPrice,
  type SandboxStripe,
} from "../../lib/membership/stripe-sandbox-setup";

const previewEnv = {
  VERCEL_ENV: "preview",
  VERCEL_GIT_COMMIT_REF: "cursor/membership-billing-72ca",
  MEMBERSHIP_STRIPE_SETUP: "apply",
  STRIPE_SECRET_KEY: "rk_test_example",
};

test("sandbox setup stays off outside the preview branch and without a test key", () => {
  assert.equal(sandboxSetupDecision({}).run, false);
  const production = sandboxSetupDecision({ ...previewEnv, VERCEL_ENV: "production" });
  const otherBranch = sandboxSetupDecision({ ...previewEnv, VERCEL_GIT_COMMIT_REF: "main" });
  const unrequested = sandboxSetupDecision({ ...previewEnv, MEMBERSHIP_STRIPE_SETUP: undefined });
  const liveKey = sandboxSetupDecision({ ...previewEnv, STRIPE_SECRET_KEY: "rk_live_example" });
  assert.equal(production.run, false);
  assert.equal(otherBranch.run, false);
  assert.equal(unrequested.run, false);
  assert.equal(liveKey.run, false);
  if (!production.run) assert.equal(production.reason, "not_preview");
  if (!otherBranch.run) assert.equal(otherBranch.reason, "wrong_branch");
  if (!unrequested.run) assert.equal(unrequested.reason, "setup_not_requested");
  if (!liveKey.run) assert.equal(liveKey.reason, "test_key_rejected");
  assert.equal(stripeKeyShape(undefined), "absent");
  assert.equal(stripeKeyShape('"rk_test_example"'), "test");
  assert.equal(stripeKeyShape("\uFEFFrk_test_example").startsWith("test"), true);
  assert.equal(sandboxSetupDecision({ ...previewEnv, STRIPE_SECRET_KEY: "\uFEFFrk_test_example" }).run, true);
  assert.equal(sandboxSetupDecision({ ...previewEnv, STRIPE_SECRET_KEY: "Bearer rk_test_example" }).run, true);
  assert.equal(sandboxSetupDecision({ ...previewEnv, STRIPE_SECRET_KEY: "STRIPE_SECRET_KEY=rk_test_example" }).run, true);
  assert.equal(sandboxSetupDecision({ ...previewEnv, STRIPE_SECRET_KEY: "'rk_test_example'" }).run, true);
  assert.equal(sandboxSetupDecision(previewEnv).run, true);
  const wrapped = stripeKeyClass("\uFEFF  \"Bearer rk_test_example\"\n");
  assert.equal(wrapped.present, true);
  assert.equal(wrapped.rkTest, true);
  assert.equal(wrapped.skTest, false);
  assert.equal(wrapped.rkLive, false);
  assert.equal(wrapped.skLive, false);
  assert.equal(wrapped.leadingBom, true);
  assert.equal(Object.values(wrapped).every((value) => typeof value === "boolean"), true);
  assert.equal(JSON.stringify(wrapped).includes("rk_test"), false);
  const unknown = stripeKeyClass("not-a-stripe-key");
  assert.equal(unknown.present, true);
  assert.equal(unknown.rkTest, false);
  assert.equal(unknown.skTest, false);
  assert.equal(unknown.rkLive, false);
  assert.equal(unknown.skLive, false);
});

test("runtime setup does not call Stripe or echo the key when the key is absent", async () => {
  let called = false;
  const secret = "rk_test_example_secret";
  const skipped = await previewSandboxBody({ ...previewEnv, STRIPE_SECRET_KEY: undefined }, () => {
    called = true;
    throw new Error(secret);
  });
  assert.equal(called, false);
  assert.equal(skipped.run, false);
  if (!skipped.run) assert.equal(skipped.reason, "test_key_absent");
  assert.equal(skipped.keyShape, "absent");
  assert.equal(JSON.stringify(skipped).includes(secret), false);
  assert.equal(JSON.stringify(skipped).includes("rk_test_"), false);
});

test("redaction removes keys and a live price is never accepted", () => {
  assert.equal(redactStripeText("rejected rk_test_abc123 and whsec_secret"), "rejected [redacted-key] and [redacted-webhook]");
  const live: SandboxPrice = {
    id: "price_live",
    lookupKey: SANDBOX_CATALOG[0]!.lookupKey,
    unitAmount: SANDBOX_CATALOG[0]!.unitAmount,
    currency: "usd",
    livemode: true,
    interval: "month",
  };
  assert.equal(priceDecision(live, SANDBOX_CATALOG[0]!), "live_refused");
});

test("a permission failure names the resource and does not create customers", async () => {
  const calls: string[] = [];
  const stripe: SandboxStripe = {
    async account() {
      calls.push("account");
      return { id: APPROVED_STRIPE_ACCOUNT, livemode: null };
    },
    async listPrices() {
      calls.push("prices.read");
      const error = new Error("The provided key does not have the required permissions for this endpoint.");
      Object.assign(error, { statusCode: 403, code: "more_permissions_required" });
      throw error;
    },
    async listProducts() {
      calls.push("products.read");
      return [];
    },
    async createProduct() {
      calls.push("products.write");
      return { id: "prod_new" };
    },
    async createPrice() {
      calls.push("prices.write");
      throw new Error("must not create");
    },
    async listPortals() {
      calls.push("portal.read");
      const error = new Error("The provided key does not have the required permissions for this endpoint.");
      Object.assign(error, { statusCode: 403 });
      throw error;
    },
    async createPortal() {
      calls.push("portal.write");
      return { id: "bpc_new" };
    },
    async listWebhookEndpoints() {
      calls.push("webhook.read");
      const error = new Error("permission");
      Object.assign(error, { statusCode: 403, code: "more_permissions_required" });
      throw error;
    },
    async listCustomers() {
      calls.push("customers.read");
      return { count: 0 };
    },
  };
  const report = await runSandboxSetup(stripe);
  assert.equal(report.accountId, APPROVED_STRIPE_ACCOUNT);
  assert.equal(report.prices.length, 0);
  assert.equal(report.portalConfigurationId, null);
  assert.equal(calls.includes("products.write"), false);
  assert.equal(calls.includes("prices.write"), false);
  assert.equal(calls.includes("portal.write"), false);
  assert.deepEqual(
    report.probes.filter((probe) => !probe.ok).map((probe) => probe.resource),
    ["Webhook endpoints", "Customer portal configurations", "Prices"],
  );
  assert.ok(report.notCalled.includes("POST /v1/customers"));
  assert.ok(report.notCalled.includes("POST /v1/checkout/sessions"));
});

test("catalog creation records test price ids and skips a second write", async () => {
  let priceWrites = 0;
  const created: SandboxPrice[] = [];
  const stripe: SandboxStripe = {
    async account() {
      return { id: APPROVED_STRIPE_ACCOUNT, livemode: null };
    },
    async listPrices() {
      return created;
    },
    async listProducts() {
      return [];
    },
    async createProduct(item) {
      return { id: `prod_${item.lookupKey}` };
    },
    async createPrice(item, productId) {
      priceWrites += 1;
      const price: SandboxPrice = {
        id: `price_${productId}`,
        lookupKey: item.lookupKey,
        unitAmount: item.unitAmount,
        currency: "usd",
        livemode: false,
        interval: item.interval,
      };
      created.push(price);
      return price;
    },
    async listPortals() {
      return [{ id: "bpc_test", livemode: false, sandbox: true, featuresMatch: true }];
    },
    async createPortal() {
      throw new Error("portal already present");
    },
    async listWebhookEndpoints() {
      return { count: 0 };
    },
    async listCustomers() {
      return { count: 0 };
    },
  };
  const first = await runSandboxSetup(stripe);
  assert.equal(first.prices.length, 4);
  assert.equal(first.portalConfigurationId, "bpc_test");
  assert.equal(priceWrites, 4);
  const second = await runSandboxSetup(stripe);
  assert.equal(priceWrites, 4);
  assert.deepEqual(
    second.prices.map((price) => price.envName),
    ["STRIPE_PRICE_ESSENTIAL", "STRIPE_PRICE_SIGNATURE", "STRIPE_PRICE_ELITE", "STRIPE_PRICE_SETUP"],
  );
});
