import { cookies } from "next/headers";
import { staffRole } from "./access";
import type { Deps } from "./handlers";
import { createStripeClient } from "./stripe-client";
import { getMembershipStore } from "./sql-store";
import { hashSecret } from "./tokens";
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

/** Hub identity is the emailed staff session, not a Payload admin login. */
export async function currentStaffEmail(): Promise<{ email: string | null; authError: string | null }> {
  const raw = (await cookies()).get("mh_staff_session")?.value;
  if (!raw) return { email: null, authError: null };
  try {
    const session = await getMembershipStore(process.env).findStaffSession(hashSecret(decodeURIComponent(raw)));
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) return { email: null, authError: null };
    if (!staffRole(session.email, process.env)) return { email: null, authError: null };
    return { email: session.email, authError: null };
  } catch {
    return { email: null, authError: "Staff sign-in could not be checked." };
  }
}
