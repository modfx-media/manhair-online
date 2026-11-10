import { bookingClickLog, bookingRedirectUrl } from "@/lib/booking/link";
import { recordBookingClick, withTimeout } from "@/lib/booking/clicks";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tracked ManHair booking link. 302 so browsers do not cache past a later URL change. */
export function HEAD(request: Request) {
  return redirectResponse(request);
}

export async function GET(request: Request) {
  const current = new URL(request.url);
  const click = bookingRedirectUrl(process.env, current.searchParams);
  const at = new Date().toISOString();
  const stored = await withTimeout(
    recordBookingClick(process.env, { at, contactId: click.contactId, utm: click.utm }),
    1500,
    false,
  );
  console.info(JSON.stringify(bookingClickLog({ at, utm: click.utm, contactId: click.contactId, stored })));
  return redirectResponse(request);
}

function redirectResponse(request: Request) {
  const click = bookingRedirectUrl(process.env, new URL(request.url).searchParams);
  return new Response(null, {
    status: 302,
    headers: {
      location: click.url,
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
