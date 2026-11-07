import { addDays, addMonths } from "./dates";
import type { MemberStatus } from "./billing";
import { MAX_PAUSE_DAYS, PAUSE_POLICY_VERSION, TIERS, type TierId } from "./offer";

export type UsageKind = "system" | "maintenance";

export type UsageMember = {
  id: string;
  status: MemberStatus;
  tier: TierId;
  systemsUsed: number;
  maintenanceUsed: number;
  pauseCollection: boolean;
  entitlementYearEndsAt: string;
};

export function allowance(tier: TierId, kind: UsageKind): number {
  return kind === "system" ? TIERS[tier].systems : TIERS[tier].maintenance;
}

export function planUsage(
  member: UsageMember,
  kind: UsageKind,
  quantity: number,
): { ok: true } | { ok: false; reason: "paused" | "inactive" | "quantity" | "exceeds" } {
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, reason: "quantity" };
  if (member.pauseCollection || member.status === "paused") return { ok: false, reason: "paused" };
  if (!["trialing", "active", "past_due", "cancel_scheduled"].includes(member.status)) {
    return { ok: false, reason: "inactive" };
  }
  const used = kind === "system" ? member.systemsUsed : member.maintenanceUsed;
  if (used + quantity > allowance(member.tier, kind)) return { ok: false, reason: "exceeds" };
  return { ok: true };
}

export function rollEntitlementYear<T extends UsageMember>(member: T, now: Date): T & { rolled: boolean } {
  if (new Date(member.entitlementYearEndsAt).getTime() > now.getTime()) {
    return { ...member, rolled: false };
  }
  if (member.pauseCollection || member.status === "paused") return { ...member, rolled: false };
  const end = addMonths(new Date(member.entitlementYearEndsAt), 12);
  return {
    ...member,
    systemsUsed: 0,
    maintenanceUsed: 0,
    entitlementYearEndsAt: end.toISOString(),
    rolled: true,
  };
}

export type CancelPlan =
  | { mode: "at_minimum_term"; cancelAt: Date }
  | { mode: "period_end" };

export function planCancel(minimumTermEndsAt: string, now: Date): CancelPlan {
  const end = new Date(minimumTermEndsAt);
  if (now.getTime() < end.getTime()) return { mode: "at_minimum_term", cancelAt: end };
  return { mode: "period_end" };
}

export function cancelStripeParams(plan: CancelPlan): Record<string, unknown> {
  if (plan.mode === "period_end") return { cancel_at_period_end: true };
  return { cancel_at: Math.floor(plan.cancelAt.getTime() / 1000) };
}

export type PauseApply = {
  policyVersion: string;
  days: number;
  resumesAt: Date;
  minimumTermEndsAt: Date;
  rateLockEndsAt: Date;
  entitlementYearEndsAt: Date;
  pauseDaysUsed: number;
  stripe: {
    pause_collection: { behavior: "void"; resumes_at: number };
  };
};

export function planPauseApply(
  member: {
    pauseDaysUsed: number;
    minimumTermEndsAt: string;
    rateLockEndsAt: string;
    entitlementYearEndsAt: string;
  },
  days: number,
  now: Date,
): { ok: true; apply: PauseApply } | { ok: false; reason: "days" | "cap" } {
  if (!Number.isInteger(days) || days < 1) return { ok: false, reason: "days" };
  if (member.pauseDaysUsed + days > MAX_PAUSE_DAYS) return { ok: false, reason: "cap" };
  const resumesAt = addDays(now, days);
  return {
    ok: true,
    apply: {
      policyVersion: PAUSE_POLICY_VERSION,
      days,
      resumesAt,
      minimumTermEndsAt: addDays(new Date(member.minimumTermEndsAt), days),
      rateLockEndsAt: addDays(new Date(member.rateLockEndsAt), days),
      entitlementYearEndsAt: addDays(new Date(member.entitlementYearEndsAt), days),
      pauseDaysUsed: member.pauseDaysUsed + days,
      stripe: {
        pause_collection: {
          behavior: "void",
          resumes_at: Math.floor(resumesAt.getTime() / 1000),
        },
      },
    },
  };
}

export function tierChangeParams(subscriptionItemId: string, priceId: string): Record<string, unknown> {
  return {
    proration_behavior: "create_prorations",
    items: [{ id: subscriptionItemId, price: priceId }],
  };
}

export type RevenueInvoice = {
  status: "paid" | "failed";
  kind: "setup" | "recurring" | "proration" | "other";
  amountPaid: number;
  amountRefunded: number;
};

export type RevenueMember = {
  status: MemberStatus;
  monthlyCents: number;
};

export type RevenueReport = {
  cashCollectedCents: number;
  setupCollectedCents: number;
  recurringCollectedCents: number;
  refundedCents: number;
  netCashCents: number;
  activeMonthlyRateCents: number;
  trialingMonthlyRateCents: number;
  note: string;
};

export function revenueReport(invoices: RevenueInvoice[], members: RevenueMember[]): RevenueReport {
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  const cashCollectedCents = paid.reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const setupCollectedCents = paid
    .filter((invoice) => invoice.kind === "setup")
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const recurringCollectedCents = paid
    .filter((invoice) => invoice.kind === "recurring")
    .reduce((sum, invoice) => sum + invoice.amountPaid, 0);
  const refundedCents = invoices.reduce((sum, invoice) => sum + invoice.amountRefunded, 0);
  const activeMonthlyRateCents = members
    .filter((member) => ["active", "past_due", "cancel_scheduled"].includes(member.status))
    .reduce((sum, member) => sum + member.monthlyCents, 0);
  const trialingMonthlyRateCents = members
    .filter((member) => member.status === "trialing")
    .reduce((sum, member) => sum + member.monthlyCents, 0);
  return {
    cashCollectedCents,
    setupCollectedCents,
    recurringCollectedCents,
    refundedCents,
    netCashCents: cashCollectedCents - refundedCents,
    activeMonthlyRateCents,
    trialingMonthlyRateCents,
    note: "Recorded payments and current monthly rates. Not a forecast.",
  };
}
