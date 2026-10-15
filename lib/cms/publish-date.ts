/**
 * Publish-date helpers for public blog visibility.
 *
 * Studio timezone is America/Los_Angeles (Orange, CA). Date-only values
 * (YYYY-MM-DD) are treated as 00:00:00 that calendar day in the studio
 * timezone so "publish on Oct 14" matches the studio business day instead of
 * shifting with UTC midnight.
 */

export const STUDIO_TIMEZONE = "America/Los_Angeles";

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Current instant as an ISO string for Payload `less_than_equal` filters. */
export function publishCutoffISO(now: Date = new Date()): string {
  return now.toISOString();
}

/**
 * Normalize a CMS/admin publish value to a UTC instant.
 * - Instant/offset strings parse via Date.
 * - Date-only strings become 00:00:00 in STUDIO_TIMEZONE that day.
 */
export function publishedAtToUtc(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = DATE_ONLY.exec(trimmed);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return zonedTimeToUtc(Number(y), Number(m), Number(d), 0, 0, 0, STUDIO_TIMEZONE);
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** True when a post should be publicly visible for its publish date. */
export function isPublishedAtPublic(
  value: unknown,
  now: Date = new Date(),
): boolean {
  const at = publishedAtToUtc(value);
  if (!at) return true; // missing publish date → do not hide
  return at.getTime() <= now.getTime();
}

function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let ts = targetAsUtc;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(
      formatter
        .formatToParts(new Date(ts))
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value]),
    );
    const asIfUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    ts += targetAsUtc - asIfUtc;
  }
  return new Date(ts);
}
