import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import type { Deps } from "./handlers";
import { createStripeClient } from "./stripe-client";
import { getMembershipStore } from "./sql-store";
import type { StripeEventShape } from "./stripe-map";

export function runtimeDeps(staffEmail: string | null = null): Deps {
  const env = process.env;
  const secret = env.STRIPE_SECRET_KEY?.trim();
  const stripe = secret ? createStripeClient(secret) : null;
  return {
    env,
    store: getMembershipStore(env),
    stripe: stripe as Deps["stripe"],
    now: () => new Date(),
    staffEmail,
    constructEvent: secret
      ? (payload, header, webhookSecret) =>
          createStripeClient(secret).webhooks.constructEvent(payload, header, webhookSecret) as unknown as StripeEventShape
      : undefined,
  };
}

export async function currentStaffEmail(): Promise<{ email: string | null; authError: string | null }> {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    return { email: null, authError: "Staff sign-in needs DATABASE_URL and PAYLOAD_SECRET." };
  }
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: await headers() });
    const email = user && typeof user.email === "string" ? user.email : null;
    return { email, authError: null };
  } catch {
    return { email: null, authError: "Staff sign-in could not be checked." };
  }
}
