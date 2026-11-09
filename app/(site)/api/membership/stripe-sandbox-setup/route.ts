import { createStripeSandboxClient } from "@/lib/membership/stripe-sandbox-client";
import { normalizedStripeKey, previewSandboxBody } from "@/lib/membership/stripe-sandbox-setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let report: Promise<unknown> | null = null;

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview") return new Response(null, { status: 404 });
  report ??= previewSandboxBody(process.env, () => createStripeSandboxClient(normalizedStripeKey(process.env.STRIPE_SECRET_KEY))).catch(
    () => {
      report = null;
      return {
        scope: "stripe_sandbox_setup",
        phase: "runtime",
        run: false,
        reason: "error",
      };
    },
  );
  return Response.json(await report, { headers: { "cache-control": "no-store" } });
}
