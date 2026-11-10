import { neon } from "@neondatabase/serverless";
import { newId } from "@/lib/membership/tokens";
import type { AppEnv } from "@/lib/membership/readiness";
import type { UtmKey } from "./link";

export type BookingClick = {
  at: string;
  contactId: string | null;
  utm: Partial<Record<UtmKey, string>>;
};

/** Insert one click. A missing table or database must not block the redirect. */
export async function recordBookingClick(env: AppEnv, click: BookingClick): Promise<boolean> {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) return false;
  try {
    const sql = neon(databaseUrl);
    await sql`
      INSERT INTO membership_booking_clicks (
        id, clicked_at, contact_id, utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_id
      ) VALUES (
        ${newId()},
        ${click.at},
        ${click.contactId},
        ${click.utm.utm_source ?? null},
        ${click.utm.utm_medium ?? null},
        ${click.utm.utm_campaign ?? null},
        ${click.utm.utm_term ?? null},
        ${click.utm.utm_content ?? null},
        ${click.utm.utm_id ?? null}
      )
    `;
    return true;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
    console.info(JSON.stringify({ scope: "booking", event: "click_store_failed", code }));
    return false;
  }
}

export function withTimeout<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}
