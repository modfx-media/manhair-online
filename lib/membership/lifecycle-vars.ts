import { businessIdentity, statementDescriptorSuffix } from "./business";
import { APP_TIMEZONE, addDays } from "./dates";
import { EXTRA_MAINTENANCE_CENTS, EXTRA_SYSTEM_CENTS, TIERS, formatUsd } from "./offer";
import { PAYMENT_GRACE_DAYS } from "./payment-grace";
import { formatStudioDay, publicSiteOrigin } from "./email-copy";
import type { AppEnv } from "./readiness";
import type { AppointmentRecord, InvoiceRecord, MemberRecord, PauseRequestRecord, RefundRequestRecord } from "./types";

export function billingPortalUrl(env: AppEnv): string {
  return `${publicSiteOrigin(env)}/account/billing/`;
}

export function formatAppointmentWhen(startsAt: string, timeZone: string): string {
  const date = new Date(startsAt);
  const zone = timeZone || APP_TIMEZONE;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short" }).format(date);
  const month = new Intl.DateTimeFormat("en-US", { timeZone: zone, month: "short" }).format(date);
  const day = new Intl.DateTimeFormat("en-US", { timeZone: zone, day: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(date);
  const tzName = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value ?? "";
  return `${weekday}, ${month} ${day} at ${time} ${tzName}`.replace(/\s+/g, " ").trim();
}

export function memberMergeVars(input: {
  env: AppEnv;
  member?: MemberRecord | null;
  lead?: { firstName: string; email?: string; phone?: string | null; message?: string | null; preferredContact?: string | null } | null;
  invoices?: InvoiceRecord[];
  pauses?: PauseRequestRecord[];
  refunds?: RefundRequestRecord[];
  appointment?: AppointmentRecord | null;
  extras?: Record<string, string | null | undefined>;
  now?: Date;
}): Record<string, string> {
  const now = input.now ?? new Date();
  const origin = publicSiteOrigin(input.env);
  const identity = businessIdentity(input.env);
  const member = input.member;
  const tier = member ? TIERS[member.tier] : null;
  const grace = member?.paymentGraceStartedAt ? new Date(member.paymentGraceStartedAt) : null;
  const openFailed = (input.invoices ?? []).filter((invoice) => invoice.kind === "recurring" && invoice.status === "failed");
  const failedAmount = openFailed.reduce((sum, invoice) => sum + (invoice.amountDue ?? 0), 0);
  const latestFailed = [...openFailed].sort((a, b) => (a.failedAt ?? "").localeCompare(b.failedAt ?? ""))[0];
  const latestPaid = [...(input.invoices ?? [])].filter((invoice) => invoice.status === "paid" && invoice.kind === "recurring").at(-1);
  const appliedPause = [...(input.pauses ?? [])].reverse().find((pause) => pause.status === "applied");
  const latestPause = [...(input.pauses ?? [])].at(-1);
  const refundTotal = (input.refunds ?? []).reduce((sum, refund) => sum + refund.amountCents, 0);
  const latestRefund = [...(input.refunds ?? [])].at(-1);
  const phone = member?.phone?.trim() || input.lead?.phone?.trim() || "";
  const firstName = member?.firstName || input.lead?.firstName || "";
  const fullName = member ? `${member.firstName} ${member.lastName}`.trim() : input.lead?.firstName || "";
  const minimumPassed = member ? new Date(member.minimumTermEndsAt).getTime() <= now.getTime() : false;
  const base: Record<string, string> = {
    first_name: firstName,
    plan_name: tier?.name ?? "",
    monthly_amount: member ? formatUsd(member.monthlyCents) : "",
    setup_amount: member ? formatUsd(member.setupCents) : "",
    first_charge_date: member?.recurringStartAt ? formatStudioDay(new Date(member.recurringStartAt)) : "",
    next_charge_date: member?.nextChargeAt ? formatStudioDay(new Date(member.nextChargeAt)) : "",
    minimum_term_end_date: member ? formatStudioDay(new Date(member.minimumTermEndsAt)) : "",
    statement_descriptor: statementDescriptorSuffix(input.env),
    account_url: `${origin}/account/`,
    sign_in_url: "",
    staff_sign_in_url: "",
    hub_url: `${origin}/hub/`,
    support_email: identity.supportEmail ?? "",
    support_phone: identity.publicPhone ?? "",
    business_address: identity.publicAddress ?? "",
    member_full_name: fullName,
    member_email: member?.email ?? input.lead?.email ?? "",
    member_phone: phone || "not provided",
    payment_amount: latestPaid ? formatUsd(latestPaid.amountPaid) : "",
    event_time: "",
    pause_days_requested: latestPause ? String(latestPause.days) : "",
    pause_days_used: member ? String(member.pauseDaysUsed) : "",
    refund_amount: latestRefund ? formatUsd(latestRefund.amountCents) : "",
    staff_email: "",
    plan_systems_per_year: tier ? String(tier.systems) : "",
    plan_maintenance_per_year: tier ? String(tier.maintenance) : "",
    extra_system_price: formatUsd(EXTRA_SYSTEM_CENTS),
    extra_visit_price: formatUsd(EXTRA_MAINTENANCE_CENTS),
    event_id: "",
    memberships_url: `${origin}/memberships/`,
    booking_url: `${origin}/book/`,
    join_url: `${origin}/join/`,
    billing_portal_url: billingPortalUrl(input.env),
    appointment_date_time: input.appointment ? formatAppointmentWhen(input.appointment.startsAt, input.appointment.timeZone) : "",
    hold_date: grace ? formatStudioDay(addDays(grace, PAYMENT_GRACE_DAYS)) : "",
    grace_started_date: grace ? formatStudioDay(grace) : "",
    failed_amount: failedAmount > 0 ? formatUsd(failedAmount) : "",
    failed_payment_date: latestFailed?.failedAt ? formatStudioDay(new Date(latestFailed.failedAt)) : "",
    payment_date: latestPaid?.paidAt ? formatStudioDay(new Date(latestPaid.paidAt)) : "",
    invoice_url: latestPaid?.hostedInvoiceUrl ?? "",
    card_last4: latestPaid?.cardLast4 || latestFailed?.cardLast4 || "",
    refund_total: refundTotal > 0 ? formatUsd(refundTotal) : "",
    refund_date: "",
    pause_start_date: appliedPause ? formatStudioDay(new Date(appliedPause.createdAt)) : "",
    pause_resume_date: member?.pauseResumeAt ? formatStudioDay(new Date(member.pauseResumeAt)) : appliedPause?.resumeAt ? formatStudioDay(new Date(appliedPause.resumeAt)) : "",
    pause_decline_reason: latestPause?.declineReason?.trim() ?? "",
    cancel_effective_date: member?.cancelAt ? formatStudioDay(new Date(member.cancelAt)) : "",
    lead_message: input.lead?.message?.trim() ?? "",
    lead_preferred_contact: input.lead?.preferredContact?.trim() ?? "",
    stripe_dashboard_url: "",
    dispute_amount: "",
    dispute_reason: "",
    dispute_evidence_due_date: "",
    ghl_error: "",
    review_url: "",
    unsubscribe_url: "",
    minimum_term_passed: minimumPassed ? "true" : "false",
    in_minimum: member && new Date(member.minimumTermEndsAt).getTime() > now.getTime() ? "true" : "false",
  };
  for (const [key, value] of Object.entries(input.extras ?? {})) {
    if (value === undefined || value === null) continue;
    base[key] = value;
  }
  return base;
}
