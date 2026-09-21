import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-IP rate limiter for the /api/hair-preview Gemini image call.
 * Backed by Upstash Redis so the quota is shared across serverless
 * instances. Requires UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN — see .env.example for setup notes.
 */

const HAIR_PREVIEW_LIMIT = 3;
const HAIR_PREVIEW_WINDOW = "1 d";

let ratelimit: Ratelimit | null | undefined;

// Lazy singleton: env vars aren't read until the first request, and a
// missing config only logs a warning instead of crashing the route.
function getRatelimit(): Ratelimit | null {
  if (ratelimit !== undefined) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn(
      "hair-preview rate limit: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN not set — skipping rate limiting."
    );
    ratelimit = null;
    return ratelimit;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(HAIR_PREVIEW_LIMIT, HAIR_PREVIEW_WINDOW),
    prefix: "hair-preview",
    analytics: true,
  });
  return ratelimit;
}

export type RateLimitResult =
  | { limited: false }
  | { limited: true; retryAfterSeconds: number };

/** Checks (and consumes) one request against the per-IP daily quota. */
export async function checkHairPreviewRateLimit(ip: string): Promise<RateLimitResult> {
  const limiter = getRatelimit();
  if (!limiter) return { limited: false };

  const { success, reset } = await limiter.limit(ip);
  if (success) return { limited: false };

  const retryAfterSeconds = Math.max(0, Math.ceil((reset - Date.now()) / 1000));
  return { limited: true, retryAfterSeconds };
}

/** Best-effort client IP extraction (Vercel sets x-forwarded-for on incoming requests). */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const first = forwardedFor?.split(",")[0]?.trim();
  if (first) return first;

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}
