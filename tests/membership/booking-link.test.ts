import assert from "node:assert/strict";
import { test } from "node:test";
import { recordBookingClick } from "../../lib/booking/clicks";
import {
  DEFAULT_BOOKING_URL,
  bookingPageHref,
  bookingRedirectUrl,
  consultStartPath,
  contactIdFromFormMessage,
  safeBookingUrl,
} from "../../lib/booking/link";
import { loadMembershipSchema } from "../../lib/membership/sql-store";

const TOKEN = "1000f-392ff7d2-eaf7-4009-8cdd-d8dbd8166a22";

test("the booking redirect keeps safe utm params and logs the contact id without forwarding it", () => {
  const params = new URLSearchParams({
    utm_source: "instagram",
    utm_campaign: "spring consult",
    utm_medium: "bio",
    cid: "Ab12cd34Ef56",
    service_token: "not-forwarded",
    token: "bypass-me",
  });
  const click = bookingRedirectUrl({}, params);
  const destination = new URL(click.url);
  assert.equal(destination.origin + destination.pathname, "https://backcombbandit.glossgenius.com/book");
  assert.equal(destination.searchParams.get("service_token"), TOKEN);
  assert.equal(destination.searchParams.get("utm_source"), "instagram");
  assert.equal(destination.searchParams.get("utm_medium"), "bio");
  assert.equal(destination.searchParams.get("utm_campaign"), "spring consult");
  assert.equal(destination.searchParams.get("cid"), null);
  assert.equal(destination.searchParams.get("token"), null);
  assert.equal(click.contactId, "Ab12cd34Ef56");
  assert.equal(click.url.includes("bypass"), false);
});

test("a bare /book/ click still tells GlossGenius the visit came from ManHair", () => {
  const click = bookingRedirectUrl({}, new URLSearchParams());
  const destination = new URL(click.url);
  assert.equal(click.url.startsWith(DEFAULT_BOOKING_URL), true);
  assert.equal(destination.searchParams.get("utm_source"), "manhair");
  assert.equal(destination.searchParams.get("utm_medium"), "booking");
  assert.equal(click.contactId, null);
});

test("an unsafe booking URL falls back to the verified service link", () => {
  assert.equal(safeBookingUrl("http://evil.example/book"), null);
  assert.equal(safeBookingUrl("javascript:alert(1)"), null);
  assert.equal(safeBookingUrl("https://www.manhaironline.com/book/"), null);
  assert.equal(safeBookingUrl("https://user:pass@glossgenius.com/book"), null);
  const click = bookingRedirectUrl({ MANHAIR_BOOKING_URL: "https://evil.vercel.app/phish" }, new URLSearchParams("utm_source=ok"));
  assert.equal(new URL(click.url).hostname, "backcombbandit.glossgenius.com");
  assert.equal(new URL(click.url).searchParams.get("utm_source"), "ok");
});

test("unsafe utm values are dropped", () => {
  const click = bookingRedirectUrl({}, new URLSearchParams({ utm_source: "https://evil.example", utm_term: "hair_ok" }));
  const destination = new URL(click.url);
  assert.equal(destination.searchParams.get("utm_source"), "manhair");
  assert.equal(destination.searchParams.get("utm_term"), "hair_ok");
  assert.equal(click.utm.utm_source, undefined);
});

test("opt-in sends the visitor to /book/ with campaign params and a contact id", () => {
  const href = bookingPageHref(new URLSearchParams("utm_source=meta&utm_content=hero&gclid=abc"), "Contact12345");
  assert.equal(href, "/book/?utm_source=meta&utm_content=hero&cid=Contact12345");
  assert.equal(bookingPageHref(new URLSearchParams(), "nope"), "/book/");
});

test("old calendar URLs open the opt-in and keep utm params", () => {
  assert.equal(consultStartPath({ utm_source: "email", cid: "Contact12345" }), "/?consult=1&utm_source=email");
});

test("a form submit message can carry a contact id and nothing else is trusted", () => {
  assert.equal(contactIdFromFormMessage({ event: "form_submitted", data: { contactId: "Hh9qLIaLPQ8U" } }), "Hh9qLIaLPQ8U");
  assert.equal(contactIdFromFormMessage('{"contact_id":"Hh9qLIaLPQ8U","token":"secret"}'), "Hh9qLIaLPQ8U");
  assert.equal(contactIdFromFormMessage({ id: "not-a-contact", email: "a@b.com" }), null);
  assert.equal(contactIdFromFormMessage({ contactId: "short" }), null);
});

test("booking clicks are stored in an additive membership table and skip a missing database", async () => {
  const schema = loadMembershipSchema();
  assert.match(schema, /create table if not exists membership_booking_clicks/i);
  assert.doesNotMatch(schema, /drop\s+table/i);
  assert.equal(await recordBookingClick({}, { at: "2026-11-10T00:00:00.000Z", contactId: null, utm: {} }), false);
});
