import type { AppEnv } from "./readiness";

export type StaffRole = "owner" | "coordinator";

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function staffRole(email: string | null | undefined, env: AppEnv): StaffRole | null {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized || normalized.includes("*")) return null;
  if (parseList(env.MEMBERSHIP_OWNER_EMAILS).includes(normalized)) return "owner";
  if (parseList(env.MEMBERSHIP_COORDINATOR_EMAILS).includes(normalized)) return "coordinator";
  return null;
}

export function memberCanRead(sessionMemberId: string | null, resourceMemberId: string): boolean {
  return Boolean(sessionMemberId) && sessionMemberId === resourceMemberId;
}

export function assignableStaff(env: AppEnv): string[] {
  return [...new Set([...parseList(env.MEMBERSHIP_OWNER_EMAILS), ...parseList(env.MEMBERSHIP_COORDINATOR_EMAILS)])];
}
