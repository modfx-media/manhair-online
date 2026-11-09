/**
 * Delivery holds for customer email and text.
 * These plans are not sent. Scheduling is not connected, and no SMS sender is approved.
 */

export type MessageHold = {
  channel: "email" | "sms";
  event: string;
  status: "held";
  reason: string;
};

export function messageHolds(): MessageHold[] {
  return [
    { channel: "email", event: "consultation", status: "held", reason: "marketing_consent_and_copy_unreviewed" },
    { channel: "email", event: "order_payment", status: "held", reason: "receipt_dedup_unverified" },
    { channel: "email", event: "service_scheduling", status: "held", reason: "manual_appointment_or_send_not_approved" },
    { channel: "sms", event: "consultation", status: "held", reason: "sms_source_unverified" },
    { channel: "sms", event: "order_payment", status: "held", reason: "sms_source_unverified" },
    { channel: "sms", event: "service_scheduling", status: "held", reason: "manual_appointment_or_send_not_approved" },
  ];
}

export type MessageTransport = "off" | "fake" | "live";

export function messageTransport(env: Record<string, string | undefined>): MessageTransport {
  if (env.MEMBERSHIP_MESSAGE_TRANSPORT === "live") return "live";
  if (env.MEMBERSHIP_MESSAGE_TRANSPORT === "fake") return "fake";
  return "off";
}
