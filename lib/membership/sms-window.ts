import { APP_TIMEZONE, studioHour } from "./dates";

/** Texts go out from 9:00 AM until 8:00 PM in the member's zone. Default is Pacific. */
export function smsWindowOpen(now: Date, timeZone = APP_TIMEZONE): boolean {
  const hour = studioHour(now, timeZone);
  return hour >= 9 && hour < 20;
}
