import type { AlertAudience, AlertKind, AlertRecord } from "./alerts";
import { memberEmailFrom } from "./business";
import { messageTransport } from "./message-holds";
import { renderLifecycleTemplate, templateMaySend } from "./lifecycle-render";
import { dueLifecycleSends } from "./lifecycle-schedule";
import { memberMergeVars } from "./lifecycle-vars";
import { smsWindowOpen } from "./sms-window";
import { sendLocationSms } from "./ghl";
import type { AppEnv } from "./readiness";
import type { LifecycleMessage, MembershipStore } from "./types";
import { newId } from "./tokens";

const ALERT_TEMPLATES: Partial<Record<AlertKind, Partial<Record<AlertAudience, string>>>> = {
  setup_paid: { customer: "membership_welcome_email", owner: "staff_new_member_email" },
  monthly_paid: { customer: "monthly_receipt_email", owner: "staff_monthly_paid_email" },
  invoice_failed: { customer: "payment_failed_day0_email", owner: "staff_payment_failed_email" },
  invoice_recovered: { customer: "payment_recovered_email", owner: "staff_payment_recovered_email" },
  webhook_error: { owner: "staff_system_error_email" },
  consultation_requested: { owner: "staff_new_lead_email" },
  pause_requested: { owner: "staff_pause_requested_email" },
  cancellation_requested: { owner: "staff_cancel_requested_email" },
  refund_requested: { owner: "staff_refund_requested_email" },
  dispute: { owner: "staff_dispute_email" },
  fraud_warning: { owner: "staff_fraud_warning_email" },
};

export function alertTemplateId(kind: AlertKind, audience: AlertAudience): string | null {
  return ALERT_TEMPLATES[kind]?.[audience] ?? null;
}

/** Customer mail for a Stripe cancellation that is actually scheduled or finished. */
export const SUBSCRIPTION_LIFECYCLE_TEMPLATES = {
  cancel_scheduled: ["cancellation_scheduled_email", "cancellation_scheduled_sms"],
  ended: ["membership_ended_email"],
} as const;

export type SendDeps = {
  env: AppEnv;
  store: MembershipStore;
  now: () => Date;
  fetchImpl?: typeof fetch;
};

export async function sendCatalogMessage(
  deps: SendDeps,
  input: {
    templateId: string;
    memberId: string | null;
    cycleKey: string;
    to: string | string[];
    purpose: "welcome" | "operational" | "lifecycle";
    vars: Record<string, string>;
    contactId?: string | null;
    smsConsent?: boolean;
  },
): Promise<"sent" | "held" | "duplicate" | "skipped" | "fake"> {
  if (input.templateId === "monthly_receipt_email" && deps.env.MEMBERSHIP_STRIPE_RECEIPTS === "true") return "skipped";
  if (!templateMaySend(input.templateId, deps.env, input.purpose)) return "held";
  const rendered = renderLifecycleTemplate(input.templateId, input.vars, deps.env);
  if (!rendered.ok) return "held";
  const channel = input.templateId.endsWith("_sms") ? "sms" : "email";
  const dedupeKey = input.cycleKey;
  const existing = await deps.store.findLifecycleMessage(dedupeKey);
  if (existing && (existing.status === "sent" || existing.status === "fake" || existing.status === "skipped")) return "duplicate";
  const recipient = testRecipient(deps.env, input.to);
  const row: LifecycleMessage = {
    id: existing?.id ?? newId(),
    dedupeKey,
    memberId: input.memberId,
    templateId: input.templateId,
    channel,
    cycleKey: input.cycleKey,
    status: "queued",
    recipient: Array.isArray(recipient) ? recipient.join(",") : recipient,
    subject: deps.env.MEMBERSHIP_TEST_RECIPIENT ? `[sandbox] ${rendered.message.subject}` : rendered.message.subject,
    textBody: channel === "sms" ? (rendered.message.sms || rendered.message.text) : rendered.message.text,
    htmlBody: rendered.message.html,
    error: null,
    createdAt: deps.now().toISOString(),
  };
  if (!existing) {
    const inserted = await deps.store.recordLifecycleMessage(row);
    if (inserted === "duplicate") return "duplicate";
  }
  if (channel === "sms") {
    if (!smsWindowOpen(deps.now())) {
      await deps.store.updateLifecycleMessage(row.id, { status: "queued", error: "quiet_hours" });
      return "held";
    }
    const sms = await sendLocationSms(deps.env, input.contactId ?? null, rendered.message.sms || rendered.message.text, deps.fetchImpl ?? fetch, Boolean(input.smsConsent), deps.now());
    await deps.store.updateLifecycleMessage(row.id, { status: sms.sent ? "sent" : "held", error: sms.sent ? null : sms.reason });
    return sms.sent ? "sent" : "held";
  }
  const transport = messageTransport(deps.env);
  if (transport === "fake") {
    await deps.store.updateLifecycleMessage(row.id, { status: "fake", error: null });
    return "fake";
  }
  if (transport !== "live") {
    await deps.store.updateLifecycleMessage(row.id, { status: "held", error: "transport_not_live" });
    return "held";
  }
  const sent = await postMembershipEmail(deps.env, deps.fetchImpl ?? fetch, {
    to: recipient,
    subject: row.subject,
    text: rendered.message.text,
    html: rendered.message.html,
  });
  await deps.store.updateLifecycleMessage(row.id, { status: sent ? "sent" : "failed", error: sent ? null : "provider_rejected" });
  return sent ? "sent" : "held";
}

export async function postMembershipEmail(
  env: AppEnv,
  fetchImpl: typeof fetch,
  message: { to: string | string[]; subject: string; text: string; html: string },
): Promise<boolean> {
  const sender = memberEmailFrom(env);
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: sender.from,
      reply_to: sender.replyTo,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });
  return response.ok;
}

export async function renderAlertCatalog(
  deps: SendDeps,
  alert: AlertRecord,
  vars: Record<string, string>,
): Promise<{ ok: true; subject: string; text: string; html: string; templateId: string } | { ok: false; reason: string }> {
  const audience = alert.audience === "customer" ? "customer" : "owner";
  const templateId = alertTemplateId(alert.kind, audience);
  if (!templateId) return { ok: false, reason: "no_template" };
  const purpose = alert.kind === "setup_paid" && audience === "customer" ? "welcome" : audience === "owner" ? "operational" : "lifecycle";
  if (templateId === "monthly_receipt_email" && deps.env.MEMBERSHIP_STRIPE_RECEIPTS === "true") return { ok: false, reason: "stripe_receipts_on" };
  if (!templateMaySend(templateId, deps.env, purpose)) return { ok: false, reason: "lifecycle_send_disabled" };
  const rendered = renderLifecycleTemplate(templateId, vars, deps.env);
  if (!rendered.ok) return { ok: false, reason: `unresolved:${rendered.missing.join(",")}` };
  const subject = deps.env.MEMBERSHIP_TEST_RECIPIENT ? `[sandbox] ${rendered.message.subject}` : rendered.message.subject;
  return { ok: true, subject, text: rendered.message.text, html: rendered.message.html, templateId };
}

export async function runDueLifecycle(deps: SendDeps): Promise<{ considered: number; sent: number; held: number }> {
  if (deps.store.kind === "unavailable") return { considered: 0, sent: 0, held: 0 };
  const members = await deps.store.listMembers();
  const appointments = (await Promise.all(members.map((member) => deps.store.listAppointments(member.id)))).flat();
  const due = dueLifecycleSends({ now: deps.now(), members, appointments });
  let sent = 0;
  let held = 0;
  for (const item of due) {
    const member = members.find((row) => row.id === item.memberId);
    if (!member) continue;
    if (item.templateId.startsWith("appointment_reminder")) {
      const appointment = appointments.find((row) => item.cycleKey.includes(row.id));
      if (!appointment || appointment.state === "canceled" || new Date(appointment.startsAt).getTime() <= deps.now().getTime()) continue;
    }
    if (item.templateId.startsWith("payment_") && member.status !== "past_due") continue;
    const invoices = await deps.store.listInvoices(member.id);
    const pauses = await deps.store.listPauseRequests(member.id);
    const refunds = await deps.store.listRefundRequests(member.id);
    const appointment = appointments.find((row) => item.cycleKey.includes(row.id)) ?? null;
    const consented = (await deps.store.listConsents(member.id)).some((consent) => consent.smsConsent);
    const deals = await deps.store.listDeals();
    const contactId = deals.find((deal) => deal.memberId === member.id)?.ghlContactId ?? null;
    const vars = memberMergeVars({ env: deps.env, member, invoices, pauses, refunds, appointment, now: deps.now() });
    const result = await sendCatalogMessage(deps, {
      templateId: item.templateId,
      memberId: member.id,
      cycleKey: item.cycleKey,
      to: member.email,
      purpose: "lifecycle",
      vars,
      contactId,
      smsConsent: consented,
    });
    if (result === "sent" || result === "fake") sent += 1;
    else if (result === "held") held += 1;
  }
  const queued = (await deps.store.listLifecycleMessages()).filter((row) => row.status === "queued" && row.error === "quiet_hours" && row.channel === "sms");
  for (const row of queued) {
    if (!smsWindowOpen(deps.now())) continue;
    const member = row.memberId ? await deps.store.findMemberById(row.memberId) : null;
    if (!member) continue;
    const consented = (await deps.store.listConsents(member.id)).some((consent) => consent.smsConsent);
    const deals = await deps.store.listDeals();
    const contactId = deals.find((deal) => deal.memberId === member.id)?.ghlContactId ?? null;
    const sms = await sendLocationSms(deps.env, contactId, row.textBody, deps.fetchImpl ?? fetch, consented, deps.now());
    await deps.store.updateLifecycleMessage(row.id, { status: sms.sent ? "sent" : "held", error: sms.sent ? null : sms.reason });
    if (sms.sent) sent += 1;
  }
  return { considered: due.length, sent, held };
}

function testRecipient(env: AppEnv, to: string | string[]): string | string[] {
  const override = env.MEMBERSHIP_TEST_RECIPIENT?.trim();
  if (override && override.includes("@")) return override;
  return to;
}
