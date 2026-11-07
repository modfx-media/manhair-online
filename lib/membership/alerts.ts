import type { MemberStatus } from "./billing";
import type { AppEnv } from "./readiness";

export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "charge.refunded",
  "charge.dispute.created",
  "radar.early_fraud_warning.created",
] as const;

export const STRIPE_WEBHOOK_PATH = "/api/membership/webhook/";

export type AlertKind = "setup_paid" | "monthly_paid" | "invoice_failed" | "invoice_recovered" | "webhook_error";
export type AlertAudience = "owner" | "customer";
export type AlertStatus = "held" | "pending" | "sending" | "delivered" | "failed";

export type AlertDraft = {
  dedupeKey: string;
  sourceEventId: string;
  kind: AlertKind;
  audience: AlertAudience;
  memberId: string | null;
  amountCents: number;
  status: AlertStatus;
  nextAttemptAt: string | null;
};

export type AlertRecord = AlertDraft & {
  id: string;
  attempts: number;
  lastError: string | null;
  createdAt: string;
};

const MAX_ATTEMPTS = 6;

export function ownerAlertsReady(env: AppEnv): boolean {
  return (
    env.MEMBERSHIP_OWNER_ALERTS_SEND === "true" &&
    Boolean(env.RESEND_API_KEY?.trim() && env.RESEND_FROM?.trim() && env.MEMBERSHIP_ALERT_TO?.trim())
  );
}

export function customerAlertsReady(env: AppEnv): boolean {
  return (
    env.MEMBERSHIP_CUSTOMER_ALERTS_SEND === "true" &&
    Boolean(env.RESEND_API_KEY?.trim() && env.RESEND_FROM?.trim())
  );
}

export function alertsForPayment(input: {
  eventId: string;
  previousStatus: MemberStatus | null;
  invoice: { kind: string; status: "paid" | "failed"; amountPaid: number } | null;
  webhookFailed: boolean;
  memberId: string | null;
  now: Date;
  env: AppEnv;
}): AlertDraft[] {
  const kinds: Array<{ kind: AlertKind; amountCents: number; customer: boolean }> = [];
  if (input.webhookFailed) kinds.push({ kind: "webhook_error", amountCents: 0, customer: false });
  if (input.invoice?.status === "failed") kinds.push({ kind: "invoice_failed", amountCents: 0, customer: true });
  if (input.invoice?.status === "paid" && input.previousStatus === "past_due") {
    kinds.push({ kind: "invoice_recovered", amountCents: input.invoice.amountPaid, customer: true });
  } else if (input.invoice?.status === "paid" && input.invoice.kind === "setup") {
    kinds.push({ kind: "setup_paid", amountCents: input.invoice.amountPaid, customer: true });
  } else if (input.invoice?.status === "paid" && input.invoice.kind === "recurring") {
    kinds.push({ kind: "monthly_paid", amountCents: input.invoice.amountPaid, customer: true });
  }
  const nowIso = input.now.toISOString();
  const drafts: AlertDraft[] = [];
  for (const item of kinds) {
    const audiences: AlertAudience[] = item.customer ? ["owner", "customer"] : ["owner"];
    for (const audience of audiences) {
      const ready = audience === "owner" ? ownerAlertsReady(input.env) : customerAlertsReady(input.env);
      drafts.push({
        dedupeKey: `${input.eventId}:${item.kind}:${audience}`,
        sourceEventId: input.eventId,
        kind: item.kind,
        audience,
        memberId: input.memberId,
        amountCents: item.amountCents,
        status: ready ? "pending" : "held",
        nextAttemptAt: ready ? nowIso : null,
      });
    }
  }
  return drafts;
}

export function nextAlertAttempt(attempts: number, now: Date): Date {
  const minutes = Math.min(60, 2 ** Math.max(1, attempts));
  return new Date(now.getTime() + minutes * 60 * 1000);
}

export function alertAfterFailure(attempts: number, now: Date): { status: AlertStatus; nextAttemptAt: string | null } {
  if (attempts >= MAX_ATTEMPTS) return { status: "failed", nextAttemptAt: null };
  return { status: "pending", nextAttemptAt: nextAlertAttempt(attempts, now).toISOString() };
}

export function alertLogFields(alert: { id: string; kind: string; audience: string; status: string; attempts: number }) {
  return { id: alert.id, kind: alert.kind, audience: alert.audience, status: alert.status, attempts: alert.attempts };
}

export function ownerAlertText(alert: { kind: AlertKind; memberId: string | null; amountCents: number }): string {
  return `ManHair payment alert ${alert.kind}. Member ${alert.memberId ?? "unmapped"}. Amount cents ${alert.amountCents}.`;
}
