import { APP_TIMEZONE } from "./dates";
import type { TierId } from "./offer";

/** Tags that already exist on the ManHair HighLevel location. */
export const GHL_MEMBERSHIP_TAGS = [
  "mh-v1-lead",
  "mh-v1-setup-paid",
  "mh-v1-plan-essential",
  "mh-v1-plan-signature",
  "mh-v1-plan-elite",
  "mh-v1-consult-pending",
  "mh-v1-suitable",
  "mh-v1-unsuitable",
  "mh-v1-order-pending",
  "mh-v1-system-ready",
  "mh-v1-billing-grace",
  "mh-v1-service-hold",
  "mh-v1-refund-pending",
  "mh-v1-refunded",
  "mh-v1-pause-requested",
  "mh-v1-cancel-requested",
] as const;

export type GhlMembershipTag = (typeof GHL_MEMBERSHIP_TAGS)[number];

/** Custom field keys that already exist on the ManHair HighLevel location. */
export const GHL_FIELD_KEYS = {
  internalCustomerId: "contact.mh_internal_customer_id",
  membershipId: "mh_membership_id",
  plan: "mh_plan",
  billingState: "mh_billing_state",
  serviceHold: "mh_service_hold",
  suitability: "mh_suitability",
  fulfillmentState: "mh_fulfillment_state",
  orderReference: "mh_order_reference",
  nextAppointmentAt: "mh_next_appointment_at",
  appointmentTimezone: "mh_appointment_timezone",
  marketingEmailConsent: "mh_marketing_email_consent",
  marketingSmsConsent: "mh_marketing_sms_consent",
  consentEvidenceReference: "mh_consent_evidence_reference",
  firstRecurringAt: "mh_first_recurring_at",
  graceStartedAt: "mh_grace_started_at",
  syncVersion: "mh_sync_version",
} as const;

export type GhlCustomField = { key: string; field_value: string | number };

export type MembershipGhlInput = {
  lead?: boolean;
  memberId?: string | null;
  stripeCustomerId?: string | null;
  plan?: TierId | null;
  billingState?: string | null;
  setupPaid?: boolean;
  serviceHold?: boolean;
  billingGrace?: boolean;
  suitability?: "pending" | "suitable" | "unsuitable" | null;
  fulfillment?: "order-pending" | "system-ready" | null;
  orderReference?: string | null;
  nextAppointmentAt?: string | null;
  appointmentTimezone?: string | null;
  marketingEmailConsent?: boolean | null;
  marketingSmsConsent?: boolean | null;
  consentEvidenceReference?: string | null;
  firstRecurringAt?: string | null;
  graceStartedAt?: string | null;
  syncVersion?: number | null;
  consultPending?: boolean;
  pauseRequested?: boolean;
  cancelRequested?: boolean;
  refundPending?: boolean;
  refunded?: boolean;
};

export type MembershipGhlPayload = {
  tags: GhlMembershipTag[];
  customFields: GhlCustomField[];
};

const PLAN_TAG: Record<TierId, GhlMembershipTag> = {
  essential: "mh-v1-plan-essential",
  signature: "mh-v1-plan-signature",
  elite: "mh-v1-plan-elite",
};

export function studioDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function membershipGhlPayload(input: MembershipGhlInput): MembershipGhlPayload {
  const tags = new Set<GhlMembershipTag>();
  if (input.lead !== false) tags.add("mh-v1-lead");
  if (input.setupPaid) tags.add("mh-v1-setup-paid");
  if (input.plan) tags.add(PLAN_TAG[input.plan]);
  if (input.consultPending) tags.add("mh-v1-consult-pending");
  if (input.suitability === "suitable") tags.add("mh-v1-suitable");
  if (input.suitability === "unsuitable") tags.add("mh-v1-unsuitable");
  if (input.fulfillment === "order-pending") tags.add("mh-v1-order-pending");
  if (input.fulfillment === "system-ready") tags.add("mh-v1-system-ready");
  if (input.billingGrace && !input.serviceHold) tags.add("mh-v1-billing-grace");
  if (input.serviceHold) tags.add("mh-v1-service-hold");
  if (input.refundPending && !input.refunded) tags.add("mh-v1-refund-pending");
  if (input.refunded) tags.add("mh-v1-refunded");
  if (input.pauseRequested) tags.add("mh-v1-pause-requested");
  if (input.cancelRequested) tags.add("mh-v1-cancel-requested");

  const customFields: GhlCustomField[] = [];
  const text = (key: string, value: string | null | undefined) => {
    if (value) customFields.push({ key, field_value: value });
  };
  text(GHL_FIELD_KEYS.internalCustomerId, input.stripeCustomerId);
  text(GHL_FIELD_KEYS.membershipId, input.memberId);
  text(GHL_FIELD_KEYS.plan, input.plan);
  text(GHL_FIELD_KEYS.billingState, input.billingState);
  if (typeof input.serviceHold === "boolean") {
    customFields.push({ key: GHL_FIELD_KEYS.serviceHold, field_value: input.serviceHold ? "true" : "false" });
  }
  text(GHL_FIELD_KEYS.suitability, input.suitability);
  text(GHL_FIELD_KEYS.fulfillmentState, input.fulfillment);
  text(GHL_FIELD_KEYS.orderReference, input.orderReference);
  text(GHL_FIELD_KEYS.nextAppointmentAt, input.nextAppointmentAt);
  text(GHL_FIELD_KEYS.appointmentTimezone, input.appointmentTimezone);
  if (typeof input.marketingEmailConsent === "boolean") {
    customFields.push({ key: GHL_FIELD_KEYS.marketingEmailConsent, field_value: input.marketingEmailConsent ? "true" : "false" });
  }
  if (typeof input.marketingSmsConsent === "boolean") {
    customFields.push({ key: GHL_FIELD_KEYS.marketingSmsConsent, field_value: input.marketingSmsConsent ? "true" : "false" });
  }
  text(GHL_FIELD_KEYS.consentEvidenceReference, input.consentEvidenceReference);
  text(GHL_FIELD_KEYS.firstRecurringAt, input.firstRecurringAt);
  if (input.graceStartedAt) customFields.push({ key: GHL_FIELD_KEYS.graceStartedAt, field_value: studioDate(input.graceStartedAt) });
  if (typeof input.syncVersion === "number") {
    customFields.push({ key: GHL_FIELD_KEYS.syncVersion, field_value: input.syncVersion });
  }
  return { tags: [...tags], customFields };
}
