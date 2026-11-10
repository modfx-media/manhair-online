import { createHash } from "node:crypto";
import { contactIdForStaffNumber, sendStaffSms } from "./ghl";
import { newId } from "./tokens";
import type { AppEnv } from "./readiness";
import type { LifecycleMessage, MembershipStore } from "./types";

export type StaffSmsKind = "setup_paid" | "consultation_requested";

export type StaffSmsNotice = {
  kind: StaffSmsKind;
  sourceId: string;
  name: string;
  phone: string | null;
  plan?: string | null;
  interest?: string | null;
};

type StaffSmsDeps = {
  env: AppEnv;
  store: MembershipStore;
  now: () => Date;
  fetchImpl?: typeof fetch;
};

/** Comma-separated E.164 numbers. Anything else is ignored. */
export function staffAlertNumbers(env: AppEnv): string[] {
  const seen = new Set<string>();
  for (const part of (env.STAFF_ALERT_SMS_NUMBERS ?? "").split(",")) {
    const value = part.trim();
    if (/^\+[1-9]\d{7,14}$/.test(value)) seen.add(value);
  }
  return [...seen];
}

export function staffAlertSmsText(notice: StaffSmsNotice): string {
  const name = clip(notice.name, 80) || "Unknown";
  const phone = clip(notice.phone ?? "", 24) || "not provided";
  if (notice.kind === "setup_paid") {
    const plan = clip(notice.plan ?? "", 40) || "No plan yet";
    return clip(`ManHair: New paid member ${name}. Plan ${plan}. Phone ${phone}.`, 320);
  }
  const interest = clip(notice.interest ?? "", 80) || "consultation";
  return clip(`ManHair: Consultation requested. ${name}. Phone ${phone}. Interest: ${interest}.`, 320);
}

/**
 * Texts the staff numbers in STAFF_ALERT_SMS_NUMBERS.
 * Does not read member smsConsent, does not use the member's GoHighLevel contact, and does not use the catalog template staff_new_member_sms.
 * Quiet hours do not apply. MEMBERSHIP_SMS_SEND must be true.
 */
export async function dispatchStaffSms(deps: StaffSmsDeps, notice: StaffSmsNotice): Promise<void> {
  try {
    if (deps.env.MEMBERSHIP_SMS_SEND !== "true") return;
    const numbers = staffAlertNumbers(deps.env);
    if (numbers.length === 0) {
      console.info(JSON.stringify({ scope: "membership", event: "staff_sms", kind: notice.kind, reason: "no_staff_numbers" }));
      return;
    }
    const message = staffAlertSmsText(notice);
    const fetchImpl = deps.fetchImpl ?? fetch;
    const results: string[] = [];
    let sent = 0;
    for (const number of numbers) {
      const outcome = await sendOne(deps, notice, number, message, fetchImpl);
      results.push(outcome);
      if (outcome === "sent") sent += 1;
    }
    console.info(JSON.stringify({
      scope: "membership",
      event: "staff_sms",
      kind: notice.kind,
      attempted: numbers.length,
      sent,
      results,
    }));
  } catch {
    console.info(JSON.stringify({ scope: "membership", event: "staff_sms", kind: notice.kind, reason: "failed" }));
  }
}

async function sendOne(
  deps: StaffSmsDeps,
  notice: StaffSmsNotice,
  number: string,
  message: string,
  fetchImpl: typeof fetch,
): Promise<string> {
  const dedupeKey = `staff-sms:${notice.kind}:${notice.sourceId}:${phoneKey(number)}`;
  let rowId: string | null = null;
  try {
    const existing = await deps.store.findLifecycleMessage(dedupeKey);
    if (existing) return "duplicate";
    rowId = newId();
    const row: LifecycleMessage = {
      id: rowId,
      dedupeKey,
      memberId: null,
      templateId: "staff_ops_sms",
      channel: "sms",
      cycleKey: dedupeKey,
      status: "queued",
      recipient: number,
      subject: "",
      textBody: message,
      htmlBody: "",
      error: "staff_sms",
      createdAt: deps.now().toISOString(),
    };
    const inserted = await deps.store.recordLifecycleMessage(row);
    if (inserted === "duplicate") return "duplicate";
  } catch {
    rowId = null;
  }
  const located = await contactIdForStaffNumber(deps.env, number, fetchImpl);
  if (!located.contactId) {
    if (rowId) await deps.store.updateLifecycleMessage(rowId, { status: "failed", error: located.reason }).catch(() => undefined);
    return located.reason;
  }
  const sms = await sendStaffSms(deps.env, located.contactId, message, fetchImpl);
  if (rowId) {
    await deps.store.updateLifecycleMessage(rowId, {
      status: sms.sent ? "sent" : "failed",
      error: sms.sent ? null : sms.reason,
    }).catch(() => undefined);
  }
  return sms.sent ? "sent" : sms.reason;
}

function phoneKey(phone: string): string {
  return createHash("sha256").update(phone).digest("hex").slice(0, 12);
}

function clip(value: string, max: number): string {
  const clean = value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}
