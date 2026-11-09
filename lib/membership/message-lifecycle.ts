/**
 * Held message plans. Template bodies are not approved copy.
 * Nothing in this module sends mail or enrolls a HighLevel workflow.
 */

export const MESSAGE_TEMPLATE_VERSION = "2026-11-08.1";

export type MessageChannel = "transactional" | "marketing";
export type MessagePlanStatus = "held" | "suppressed";

export type MessageTemplate = {
  id: string;
  version: string;
  channel: MessageChannel;
  /** Copy is supplied later under /workspace/manhair-lifecycle/. This app does not invent the body. */
  copyStatus: "awaiting_owner_copy";
  entersOn: string;
  exitsOn: string[];
};

export const MESSAGE_TEMPLATES: readonly MessageTemplate[] = [
  {
    id: "lead.consult.received",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "marketing",
    copyStatus: "awaiting_owner_copy",
    entersOn: "consultation_stored",
    exitsOn: ["converted", "unsubscribed", "dnd", "signup_started"],
  },
  {
    id: "lead.nurture.sequence",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "marketing",
    copyStatus: "awaiting_owner_copy",
    entersOn: "consultation_stored",
    exitsOn: ["converted", "unsubscribed", "dnd", "signup_started"],
  },
  {
    id: "member.setup.confirmed",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "transactional",
    copyStatus: "awaiting_owner_copy",
    entersOn: "stripe_setup_paid",
    exitsOn: [],
  },
  {
    id: "member.recurring.scheduled",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "transactional",
    copyStatus: "awaiting_owner_copy",
    entersOn: "stripe_recurring_timestamp",
    exitsOn: ["unsubscribed_not_applicable"],
  },
  {
    id: "member.payment.failed",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "transactional",
    copyStatus: "awaiting_owner_copy",
    entersOn: "stripe_invoice_failed",
    exitsOn: [],
  },
  {
    id: "member.fitting.milestone",
    version: MESSAGE_TEMPLATE_VERSION,
    channel: "transactional",
    copyStatus: "awaiting_owner_copy",
    entersOn: "staff_verified_fitting_at",
    exitsOn: [],
  },
] as const;

export type LifecycleFact = {
  eventId: string;
  type: "consultation_stored" | "signup_started" | "stripe_setup_paid" | "stripe_invoice_failed" | "stripe_recurring_timestamp" | "staff_verified_fitting_at";
  occurredAt: string | null;
  memberId: string | null;
  email: string;
};

export type Suppression = {
  marketingConsent: boolean;
  marketingSmsConsent?: boolean;
  unsubscribed: boolean;
  dnd: boolean;
  emailDnd?: boolean;
  smsDnd?: boolean;
  smsStop?: boolean;
  emailBounced?: boolean;
  emailComplaint?: boolean;
  converted: boolean;
  signupStarted: boolean;
};

export const CANONICAL_SETUP_PAID = "membership.setup_paid";

/** One internal name for setup payment. The lifecycle alias is not a second welcome. */
export function canonicalEvent(name: string): string {
  return name.replaceAll("membership.setup_payment_verified", CANONICAL_SETUP_PAID);
}

/** Channel DND blocks that channel even when the global DND flag is false. */
export function channelSuppressed(channel: "email" | "sms", suppression: Suppression): string | null {
  if (suppression.dnd) return "dnd";
  if (channel === "email" && (suppression.emailDnd || suppression.emailBounced || suppression.emailComplaint || suppression.unsubscribed)) {
    return "email_dnd";
  }
  if (channel === "sms" && (suppression.smsDnd || suppression.smsStop)) return "sms_dnd";
  if (channel === "sms" && suppression.marketingSmsConsent !== true) return "no_sms_consent";
  return null;
}

export type MessagePlan = {
  dedupeKey: string;
  templateId: string;
  templateVersion: string;
  channel: MessageChannel;
  status: MessagePlanStatus;
  reason: string;
  email: string;
  sourceEventId: string;
  occurredAt: string | null;
  send: false;
};

const TEMPLATE_BY_EVENT: Record<LifecycleFact["type"], string[]> = {
  consultation_stored: ["lead.consult.received", "lead.nurture.sequence"],
  signup_started: [],
  stripe_setup_paid: ["member.setup.confirmed"],
  stripe_invoice_failed: ["member.payment.failed"],
  stripe_recurring_timestamp: ["member.recurring.scheduled"],
  staff_verified_fitting_at: ["member.fitting.milestone"],
};

export function planMessages(fact: LifecycleFact, suppression: Suppression): MessagePlan[] {
  const ids = TEMPLATE_BY_EVENT[fact.type];
  return ids.map((templateId) => {
    const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
    if (!template) {
      return held(fact, templateId, "suppressed", "unknown_template");
    }
    if (template.channel === "transactional" && !fact.occurredAt) {
      return held(fact, template.id, "suppressed", "missing_verified_timestamp");
    }
    if (suppression.emailDnd || suppression.emailBounced || suppression.emailComplaint) {
      return held(fact, template.id, "suppressed", "email_dnd");
    }
    if (template.channel === "marketing") {
      if (suppression.dnd) return held(fact, template.id, "suppressed", "dnd");
      if (suppression.unsubscribed || !suppression.marketingConsent) return held(fact, template.id, "suppressed", "no_marketing_consent");
      if (suppression.converted || suppression.signupStarted) return held(fact, template.id, "suppressed", "converted");
    }
    return held(fact, template.id, "held", "draft_not_approved");
  });
}

function held(fact: LifecycleFact, templateId: string, status: MessagePlanStatus, reason: string): MessagePlan {
  const template = MESSAGE_TEMPLATES.find((item) => item.id === templateId);
  return {
    dedupeKey: `${fact.eventId}:${canonicalEvent(templateId)}:${template?.version ?? MESSAGE_TEMPLATE_VERSION}`,
    templateId,
    templateVersion: template?.version ?? MESSAGE_TEMPLATE_VERSION,
    channel: template?.channel ?? "transactional",
    status,
    reason,
    email: fact.email,
    sourceEventId: fact.eventId,
    occurredAt: fact.occurredAt,
    send: false,
  };
}

/** Same event and template version collapse to one plan. A new version is a different key. */
export function dedupePlans(plans: MessagePlan[]): MessagePlan[] {
  const seen = new Set<string>();
  const next: MessagePlan[] = [];
  for (const plan of plans) {
    if (seen.has(plan.dedupeKey)) continue;
    seen.add(plan.dedupeKey);
    next.push(plan);
  }
  return next;
}
