import Stripe from "stripe";

/** Node SDK 23 exposes the client as `Stripe`. Instantiate it per request; do not set a global key. */
export function createStripeClient(secret: string): Stripe {
  return new Stripe(secret, {
    appInfo: { name: "manhair-membership", url: "https://www.manhaironline.com" },
  });
}

export function constructStripeEvent(secret: string, payload: string, header: string, webhookSecret: string) {
  return createStripeClient(secret).webhooks.constructEvent(payload, header, webhookSecret);
}
