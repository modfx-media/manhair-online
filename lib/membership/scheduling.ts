/**
 * Consultations are booked on the public ManHair link. Studio visits are
 * confirmed only after a real date, time, and time zone are recorded.
 * This module does not call GlossGenius and does not send confirmations.
 */

import { PUBLIC_BOOKING_URL } from "@/lib/booking/link";

export const SCHEDULING = {
  status: "booking_link" as const,
  coordinator: "our ManHair stylist",
  bookingUrl: PUBLIC_BOOKING_URL,
  responseTime: null,
  summary:
    `Consultations are booked with our ManHair stylist through the ManHair booking link (${PUBLIC_BOOKING_URL}). A visit is confirmed only after a real date, time, and time zone are on the calendar.`,
};

/** Readiness still reports this object. The name is historical. */
export const MANUAL_SCHEDULING = SCHEDULING;

export type AppointmentState = "scheduled" | "updated" | "canceled";

export type AppointmentDraft = {
  startsAt: string;
  timeZone: string;
  state: AppointmentState;
};

export type SchedulingMessage = {
  event: "appointment.confirmation" | "appointment.reminder";
  channel: "email" | "sms";
  status: "held";
  send: false;
  reason: string;
};

const STATES = new Set<AppointmentState>(["scheduled", "updated", "canceled"]);

export function appointmentInput(body: Record<string, unknown>): { ok: true; appointment: AppointmentDraft } | { ok: false; reason: "state" | "time" | "time_zone" } {
  if (typeof body.state !== "string" || !STATES.has(body.state as AppointmentState)) return { ok: false, reason: "state" };
  if (typeof body.startsAt !== "string" || !body.startsAt.includes("T") || Number.isNaN(Date.parse(body.startsAt))) {
    return { ok: false, reason: "time" };
  }
  if (typeof body.timeZone !== "string" || !validTimeZone(body.timeZone)) return { ok: false, reason: "time_zone" };
  return {
    ok: true,
    appointment: { startsAt: new Date(body.startsAt).toISOString(), timeZone: body.timeZone, state: body.state as AppointmentState },
  };
}

export function validTimeZone(timeZone: string): boolean {
  const zone = timeZone.trim();
  if (!zone || zone.length > 64) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Confirmation and reminder plans stay held. A canceled or missing visit does not trigger them. */
export function schedulingMessages(appointment: AppointmentDraft | null): SchedulingMessage[] {
  const ready = appointment && appointment.state !== "canceled";
  const reason = ready ? "sender_content_recipient_or_consent_not_approved" : "appointment_not_recorded";
  return [
    { event: "appointment.confirmation", channel: "email", status: "held", send: false, reason },
    { event: "appointment.reminder", channel: "email", status: "held", send: false, reason },
    { event: "appointment.confirmation", channel: "sms", status: "held", send: false, reason },
    { event: "appointment.reminder", channel: "sms", status: "held", send: false, reason },
  ];
}
