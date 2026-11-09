import type { AppEnv } from "./readiness";

/** Owner-confirmed on Nov 8, 2026. Env values override these. Phone has no default. */
export const BUSINESS_DEFAULTS = {
  legalName: "ManHair",
  publicAddress: "20 Heron, Lake Forest, CA 92630",
  supportEmail: "info@manhaironline.com",
  publicPhone: "+1 (904) 526-8500",
  replyTo: "info@manhaironline.com",
  from: "ManHair <info@manhaironline.com>",
  statementDescriptor: "MANHAIR",
} as const;

/** Membership legal identity. Phone stays empty until MEMBERSHIP_PUBLIC_PHONE is set. */
export const BUSINESS_ENV_VARS = {
  legalName: "MEMBERSHIP_LEGAL_NAME",
  publicAddress: "MEMBERSHIP_PUBLIC_ADDRESS",
  publicPhone: "MEMBERSHIP_PUBLIC_PHONE",
  supportEmail: "MEMBERSHIP_SUPPORT_EMAIL",
  statementDescriptor: "MEMBERSHIP_STATEMENT_DESCRIPTOR",
} as const;

export type BusinessIdentity = {
  legalName: string | null;
  publicAddress: string | null;
  publicPhone: string | null;
  supportEmail: string | null;
  missing: string[];
};

function clean(value: string | undefined): string | null {
  const trimmed = value?.replace(/\s+/g, " ").trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

export function businessIdentity(env: AppEnv): BusinessIdentity {
  const legalName = clean(env[BUSINESS_ENV_VARS.legalName]) ?? BUSINESS_DEFAULTS.legalName;
  const publicAddress = clean(env[BUSINESS_ENV_VARS.publicAddress]) ?? BUSINESS_DEFAULTS.publicAddress;
  const publicPhone = clean(env[BUSINESS_ENV_VARS.publicPhone]) ?? BUSINESS_DEFAULTS.publicPhone;
  const supportEmail = clean(env[BUSINESS_ENV_VARS.supportEmail]) ?? BUSINESS_DEFAULTS.supportEmail;
  return { legalName, publicAddress, publicPhone, supportEmail, missing: [] };
}

/** Card-statement suffix. Default MANHAIR. Stripe allows letters, numbers, and spaces, up to 22 characters. */
export function statementDescriptorSuffix(env: AppEnv): string {
  const raw = (clean(env[BUSINESS_ENV_VARS.statementDescriptor]) ?? BUSINESS_DEFAULTS.statementDescriptor).toUpperCase();
  const cleaned = raw.replace(/[^A-Z0-9 ]/g, "").trim().slice(0, 22);
  return /[A-Z]/.test(cleaned) ? cleaned : BUSINESS_DEFAULTS.statementDescriptor;
}

export function memberEmailFrom(env: AppEnv): { from: string; replyTo: string } {
  return {
    from: clean(env.RESEND_FROM) ?? BUSINESS_DEFAULTS.from,
    replyTo: clean(env.MEMBERSHIP_REPLY_TO) ?? clean(env.MEMBERSHIP_SUPPORT_EMAIL) ?? BUSINESS_DEFAULTS.replyTo,
  };
}

export const SMS_CONSENT_VERSION = "2026-11-09-tcpa";

export const SMS_CONSENT_TEXT =
  "Optional. ManHair may text me about my membership, visits, and billing at the mobile number I provide. Message frequency varies. Message and data rates may apply. Reply STOP to cancel and HELP for help. Consent is not required to join, to pay, or to get email. Leave this unchecked for email only.";

export function emailComplianceFooter(input: {
  identity: BusinessIdentity;
  manageUrl: string;
  unsubscribeUrl?: string | null;
}): string {
  const lines = [input.identity.legalName, input.identity.publicAddress, input.identity.publicPhone, input.identity.supportEmail]
    .filter((line): line is string => Boolean(line));
  lines.push(`Manage your membership: ${input.manageUrl}`);
  if (input.unsubscribeUrl) lines.push(`Unsubscribe: ${input.unsubscribeUrl}`);
  return lines.join("\n");
}

export function recoveryUnavailableMessage(env: AppEnv): string {
  const identity = businessIdentity(env);
  const contact = [identity.supportEmail, identity.publicPhone].filter(Boolean).join(" or ");
  const reach = contact
    ? `Contact the studio at ${contact}.`
    : "Contact the studio from the phone and email in the site footer.";
  return `Email sign-in is not configured, so no message was sent. Your membership stays on file and you do not need to pay again. ${reach}`;
}
