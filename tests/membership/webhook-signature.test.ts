import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";

test("Stripe webhook signatures reject a different secret", () => {
  const stripe = new Stripe("sk_test_123");
  const payload = JSON.stringify({
    id: "evt_signature",
    object: "event",
    type: "checkout.session.expired",
    created: 1,
    data: { object: { id: "cs_1", object: "checkout.session" } },
  });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: "whsec_test_secret" });
  const event = stripe.webhooks.constructEvent(payload, header, "whsec_test_secret");
  assert.equal(event.type, "checkout.session.expired");
  assert.throws(() => stripe.webhooks.constructEvent(payload, header, "whsec_other_secret"));
});
