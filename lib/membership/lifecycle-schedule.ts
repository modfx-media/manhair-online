import { addDays, studioDateKey, studioHour } from "./dates";
import { PAYMENT_GRACE_DAYS, paymentServiceHold } from "./payment-grace";
import type { AppointmentRecord, MemberRecord } from "./types";

export type DueSend = {
  templateId: string;
  memberId: string;
  cycleKey: string;
  channel: "email" | "sms";
};

const OPEN = new Set(["trialing", "active", "past_due", "paused", "cancel_scheduled"]);

/** Scheduled phase-1 sends. Day-0 failure mail is immediate, not listed here. */
export function dueLifecycleSends(input: {
  now: Date;
  members: MemberRecord[];
  appointments: AppointmentRecord[];
}): DueSend[] {
  const due: DueSend[] = [];
  const today = studioDateKey(input.now);
  const afterMorning = studioHour(input.now) >= 10;
  for (const member of input.members) {
    if (!member.setupPaid || member.status === "canceled" || member.status === "checkout_open") continue;
    if (afterMorning && member.chargeAtSource === "stripe" && member.recurringStartAt && OPEN.has(member.status)) {
      const first = new Date(member.recurringStartAt);
      const reminderDay = studioDateKey(addDays(first, -3));
      if (today === reminderDay && first.getTime() > input.now.getTime()) {
        due.push(send(member.id, "first_charge_upcoming_email", member.recurringStartAt));
        due.push(send(member.id, "first_charge_upcoming_sms", member.recurringStartAt, "sms"));
      }
    }
    if (member.paymentGraceStartedAt && member.status === "past_due") {
      const grace = new Date(member.paymentGraceStartedAt);
      for (const day of [3, 7, 12]) {
        if (afterMorning && today === studioDateKey(addDays(grace, day))) {
          due.push(send(member.id, `payment_failed_day${day}_email`, member.paymentGraceStartedAt));
          if (day !== 3) due.push(send(member.id, `payment_failed_day${day}_sms`, member.paymentGraceStartedAt, "sms"));
        }
      }
      if (paymentServiceHold(member.paymentGraceStartedAt, input.now) === "held") {
        due.push(send(member.id, "payment_hold_started_email", member.paymentGraceStartedAt));
        due.push(send(member.id, "payment_hold_started_sms", member.paymentGraceStartedAt, "sms"));
      }
    }
    if (member.pauseResumeAt && member.status === "paused") {
      const resume = new Date(member.pauseResumeAt);
      if (afterMorning && today === studioDateKey(addDays(resume, -7))) {
        due.push(send(member.id, "pause_ending_soon_email", member.pauseResumeAt));
        due.push(send(member.id, "pause_ending_soon_sms", member.pauseResumeAt, "sms"));
      }
    }
    if (member.pauseResumeAt && member.status !== "paused" && today === studioDateKey(new Date(member.pauseResumeAt)) && afterMorning) {
      due.push(send(member.id, "pause_resumed_email", member.pauseResumeAt));
      due.push(send(member.id, "pause_resumed_sms", member.pauseResumeAt, "sms"));
    }
    if (afterMorning && (member.status === "trialing" || member.status === "active")) {
      const started = new Date(member.createdAt);
      if (today === studioDateKey(addDays(started, 30))) due.push(send(member.id, "checkin_day30_email", studioDateKey(started)));
      if (today === studioDateKey(addDays(started, 90))) due.push(send(member.id, "checkin_day90_email", studioDateKey(started)));
    }
  }
  for (const appointment of input.appointments) {
    if (appointment.state === "canceled") continue;
    const start = new Date(appointment.startsAt).getTime();
    const reminderAt = start - 24 * 60 * 60 * 1000;
    if (input.now.getTime() >= reminderAt && input.now.getTime() < start) {
      due.push(send(appointment.memberId, "appointment_reminder_email", `${appointment.id}:${appointment.startsAt}`));
      due.push(send(appointment.memberId, "appointment_reminder_sms", `${appointment.id}:${appointment.startsAt}`, "sms"));
    }
  }
  return due;
}

function send(memberId: string, templateId: string, cycle: string, channel: "email" | "sms" = "email"): DueSend {
  return { templateId, memberId, cycleKey: `${memberId}:${templateId}:${cycle}`, channel };
}
