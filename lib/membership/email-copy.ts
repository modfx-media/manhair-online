import { businessIdentity, emailComplianceFooter, statementDescriptorSuffix, type BusinessIdentity } from "./business";
import { APP_TIMEZONE } from "./dates";
import type { AlertKind } from "./alerts";
import { TIERS, formatUsd, type TierId } from "./offer";
import type { AppEnv } from "./readiness";

export type ConfirmationMember = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  tier: TierId;
  setupCents: number;
  monthlyCents: number;
  recurringStartAt: string | null;
  chargeAtSource?: "estimate" | "stripe" | null;
  minimumTermEndsAt: string;
};

export type MailMessage = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatStudioDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatStudioTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

/** Public site, never a vercel.app host that asks for a login. */
export function publicSiteOrigin(env: AppEnv): string {
  const configured = (env.NEXT_PUBLIC_SITE_URL || "https://www.manhaironline.com").replace(/\/$/, "");
  if (configured.includes(".vercel.app")) return "https://www.manhaironline.com";
  return configured;
}

export function confirmationMessage(member: ConfirmationMember, env: AppEnv, accountUrl: string): MailMessage {
  const plan = TIERS[member.tier].name;
  const setup = formatUsd(member.setupCents);
  const monthly = formatUsd(member.monthlyCents);
  const confirmedCharge = member.chargeAtSource === "stripe" && member.recurringStartAt
    ? formatStudioDay(new Date(member.recurringStartAt))
    : null;
  const firstCharge = confirmedCharge ?? "the trial end Stripe schedules, about 30 days after payment";
  const minimumEnd = formatStudioDay(new Date(member.minimumTermEndsAt));
  const descriptor = statementDescriptorSuffix(env);
  const identity = businessIdentity(env);
  const footer = emailComplianceFooter({ identity, manageUrl: accountUrl });
  const refund = "If a consultation finds the membership unsuitable, the setup payment and any membership charges are refunded and future billing is cancelled.";
  const next = "Griselda will contact you to schedule your consultation. Visits are arranged manually. There is no booking link.";
  const subject = "Your ManHair membership is confirmed";
  const text = [
    `Hi ${member.firstName},`,
    "",
    `Your ${plan} membership is confirmed.`,
    `${setup} setup was paid today and applies toward your first system.`,
    `${monthly} a month. The first monthly charge is ${firstCharge}.`,
    `The 3-month minimum runs through ${minimumEnd}, then the plan is month to month.`,
    next,
    `Card charges appear on your statement as ${descriptor}.`,
    refund,
    "",
    `Your account: ${accountUrl}`,
    "",
    footer,
  ].join("\n");
  const html = confirmationHtml({
    firstName: member.firstName,
    plan,
    setup,
    monthly,
    firstCharge,
    minimumEnd,
    descriptor,
    next,
    refund,
    accountUrl,
    identity,
  });
  return { subject, text, html };
}

function confirmationHtml(input: {
  firstName: string;
  plan: string;
  setup: string;
  monthly: string;
  firstCharge: string;
  minimumEnd: string;
  descriptor: string;
  next: string;
  refund: string;
  accountUrl: string;
  identity: BusinessIdentity;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:8px 0;color:#6b5c4a;font-size:14px;">${label}</td><td style="padding:8px 0;text-align:right;font-size:14px;">${escapeHtml(value)}</td></tr>`;
  const address = [input.identity.legalName, input.identity.publicAddress, input.identity.publicPhone, input.identity.supportEmail]
    .filter((line): line is string => Boolean(line))
    .map((line) => escapeHtml(line))
    .join("<br>");
  return `<!DOCTYPE html><html><body style="margin:0;background:#faf7f1;color:#1a130e;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;font-family:Georgia,'Times New Roman',serif;">
    <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#8a6a32;">ManHair</p>
    <h1 style="font-weight:normal;font-size:32px;margin:12px 0 8px;">You're in, ${escapeHtml(input.firstName)}</h1>
    <p style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;">Your ${escapeHtml(input.plan)} membership is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;border-top:1px solid #e4d7c3;">
      ${row("Paid today", `${input.setup} setup`)}
      ${row("Applies toward", "Your first system")}
      ${row("Monthly price", input.monthly)}
      ${row("First monthly charge", input.firstCharge)}
      ${row("Minimum term through", input.minimumEnd)}
    </table>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;">${escapeHtml(input.next)}</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;">Card charges appear on your statement as ${escapeHtml(input.descriptor)}.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;">${escapeHtml(input.refund)}</p>
    <p style="margin:24px 0;"><a href="${escapeHtml(input.accountUrl)}" style="background:#1a130e;color:#faf7f1;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;padding:12px 18px;display:inline-block;">Open your account</a></p>
    <p style="font-family:Arial,sans-serif;font-size:12px;line-height:1.5;color:#6b5c4a;">${address}<br>Manage your membership: <a href="${escapeHtml(input.accountUrl)}">${escapeHtml(input.accountUrl)}</a></p>
  </div>
</body></html>`;
}

const STAFF_SUBJECT: Partial<Record<AlertKind, (name: string, plan: string) => string>> = {
  setup_paid: (name, plan) => `New ManHair member: ${name} – ${plan}`,
  invoice_failed: (name, plan) => `Payment failed: ${name} – ${plan}`,
  pause_requested: (name) => `Pause requested: ${name}`,
  cancellation_requested: (name) => `Cancellation requested: ${name}`,
  refund_requested: (name) => `Refund requested: ${name}`,
  dispute: (name) => `Dispute: ${name}`,
  consultation_requested: (name) => `Consultation requested: ${name}`,
  monthly_paid: (name, plan) => `Monthly payment received: ${name} – ${plan}`,
  invoice_recovered: (name, plan) => `Payment recovered: ${name} – ${plan}`,
  webhook_error: (name) => `Membership alert needs review: ${name}`,
};

export function staffAlertMessage(input: {
  kind: AlertKind;
  name: string;
  email: string;
  phone: string | null;
  plan: string | null;
  amountCents: number;
  occurredAt: Date;
  hubUrl: string;
}): MailMessage {
  const plan = input.plan || "No plan yet";
  const subject = (STAFF_SUBJECT[input.kind] ?? ((name: string) => `ManHair ${input.kind.replaceAll("_", " ")}: ${name}`))(input.name || "Unknown", plan);
  const phone = input.phone?.trim() ? input.phone.trim() : "not provided";
  const lines = [
    subject,
    "",
    `Name: ${input.name || "Unknown"}`,
    `Email: ${input.email || "Unknown"}`,
    `Phone: ${phone}`,
    `Plan: ${plan}`,
    `Amount: ${formatUsd(input.amountCents)}`,
    `Event: ${input.kind.replaceAll("_", " ")}`,
    `Time: ${formatStudioTime(input.occurredAt)}`,
    "",
    `Hub: ${input.hubUrl}`,
  ];
  const text = lines.join("\n");
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a130e;background:#fff;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <p style="letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#8a6a32;">ManHair studio</p>
      <h1 style="font-size:22px;">${escapeHtml(subject)}</h1>
      <p>Name: ${escapeHtml(input.name || "Unknown")}<br>Email: ${escapeHtml(input.email || "Unknown")}<br>Phone: ${escapeHtml(phone)}<br>Plan: ${escapeHtml(plan)}<br>Amount: ${escapeHtml(formatUsd(input.amountCents))}<br>Event: ${escapeHtml(input.kind.replaceAll("_", " "))}<br>Time: ${escapeHtml(formatStudioTime(input.occurredAt))}</p>
      <p><a href="${escapeHtml(input.hubUrl)}">Open the studio hub</a></p>
    </div>
  </body></html>`;
  return { subject, text, html };
}

export function customerStatusLabel(
  member: {
    status: string;
    setupPaid: boolean;
    recurringStartAt: string | null;
    chargeAtSource?: "estimate" | "stripe" | null;
  },
  now = new Date(),
): string {
  const confirmed = member.chargeAtSource === "stripe" ? member.recurringStartAt : null;
  const first = confirmed ? formatStudioDay(new Date(confirmed)) : null;
  const futureCharge = confirmed ? new Date(confirmed).getTime() > now.getTime() : false;
  if (member.status === "past_due") return "Payment past due";
  if (member.status === "paused") return "Paused";
  if (member.status === "cancel_scheduled") return futureCharge && first ? `Active – first monthly payment ${first}` : "Active until the scheduled cancellation";
  if (member.status === "canceled") return "Cancelled";
  if (member.status === "checkout_failed") return "Payment not confirmed";
  if (member.status === "checkout_open") return "Signup not finished";
  if (member.status === "needs_review") return "We need to review this membership";
  if (member.setupPaid && first && (member.status === "trialing" || futureCharge)) return `Active – first monthly payment ${first}`;
  if (member.setupPaid && !first && (member.status === "trialing" || member.status === "active")) {
    return "Active – first monthly charge follows the subscription trial end";
  }
  if (member.setupPaid) return "Active";
  return "Payment not confirmed";
}

