import type { AppEnv } from "@/lib/membership/readiness";

/** Public tracked link. The GlossGenius calendar stays behind /book/. */
export const PUBLIC_BOOKING_PATH = "/book/";
export const PUBLIC_BOOKING_URL = "https://www.manhaironline.com/book/";

/** Verified ManHair Consultation service on Griselda's GlossGenius calendar. */
export const DEFAULT_BOOKING_URL =
  "https://backcombbandit.glossgenius.com/book?service_token=1000f-392ff7d2-eaf7-4009-8cdd-d8dbd8166a22";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"] as const;

export type UtmKey = (typeof UTM_KEYS)[number];

export function safeUtmValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) return null;
  if (!/^[A-Za-z0-9 ._\-~]+$/.test(trimmed)) return null;
  return trimmed;
}

/** GHL contact ids are opaque tokens. Reject anything that could carry a secret or a URL. */
export function safeContactId(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9]{10,40}$/.test(trimmed)) return null;
  return trimmed;
}

export function safeBookingUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".localhost")) return null;
    if (host === "manhaironline.com" || host.endsWith(".manhaironline.com")) return null;
    if (host.endsWith(".vercel.app")) return null;
    return url;
  } catch {
    return null;
  }
}

export function configuredBookingUrl(env: AppEnv): URL {
  const configured = env.MANHAIR_BOOKING_URL?.trim() ?? "";
  return safeBookingUrl(configured) ?? new URL(DEFAULT_BOOKING_URL);
}

export function inboundUtm(params: URLSearchParams): Partial<Record<UtmKey, string>> {
  const utm: Partial<Record<UtmKey, string>> = {};
  for (const key of UTM_KEYS) {
    const value = safeUtmValue(params.get(key) ?? "");
    if (value) utm[key] = value;
  }
  return utm;
}

export function bookingRedirectUrl(env: AppEnv, params: URLSearchParams): {
  url: string;
  utm: Partial<Record<UtmKey, string>>;
  contactId: string | null;
} {
  const destination = configuredBookingUrl(env);
  const utm = inboundUtm(params);
  for (const key of UTM_KEYS) {
    const value = utm[key];
    if (value) destination.searchParams.set(key, value);
  }
  if (!destination.searchParams.get("utm_source")) destination.searchParams.set("utm_source", "manhair");
  if (!destination.searchParams.get("utm_medium")) destination.searchParams.set("utm_medium", "booking");
  return {
    url: destination.toString(),
    utm,
    contactId: safeContactId(params.get("cid")),
  };
}

export function bookingClickLog(input: {
  at: string;
  utm: Partial<Record<UtmKey, string>>;
  contactId: string | null;
  stored: boolean;
}) {
  return {
    scope: "booking",
    event: "click",
    at: input.at,
    utm: input.utm,
    contactId: input.contactId,
    stored: input.stored,
  };
}

/** After the opt-in, keep campaign params and an optional GHL contact id on our own /book/ URL. */
export function bookingPageHref(current: URLSearchParams, contactId: string | null): string {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries(inboundUtm(current))) {
    if (value) next.set(key, value);
  }
  const cid = safeContactId(contactId);
  if (cid) next.set("cid", cid);
  const query = next.toString();
  return query ? `${PUBLIC_BOOKING_PATH}?${query}` : PUBLIC_BOOKING_PATH;
}

export function consultStartPath(query: URLSearchParams | Record<string, string | string[] | undefined>): string {
  const params = query instanceof URLSearchParams ? query : recordParams(query);
  const next = new URLSearchParams();
  next.set("consult", "1");
  for (const [key, value] of Object.entries(inboundUtm(params))) {
    if (value) next.set(key, value);
  }
  return `/?${next.toString()}`;
}

function recordParams(query: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    const raw = Array.isArray(value) ? value[0] : value;
    if (raw) params.set(key, raw);
  }
  return params;
}

const CONTACT_KEYS = new Set(["contactid", "contact_id"]);

/** Pull a contact id out of a GoHighLevel form-submit message. Ignore every other field. */
export function contactIdFromFormMessage(data: unknown): string | null {
  const parsed = typeof data === "string" ? tryJson(data) ?? data : data;
  return findContactId(parsed, 0, { seen: 0 });
}

function tryJson(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function findContactId(value: unknown, depth: number, budget: { seen: number }): string | null {
  if (budget.seen > 40 || depth > 5 || value == null) return null;
  budget.seen += 1;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findContactId(item, depth + 1, budget);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (CONTACT_KEYS.has(key.toLowerCase()) && typeof child === "string") {
      const id = safeContactId(child);
      if (id) return id;
    }
  }
  for (const child of Object.values(value as Record<string, unknown>)) {
    const found = findContactId(child, depth + 1, budget);
    if (found) return found;
  }
  return null;
}
