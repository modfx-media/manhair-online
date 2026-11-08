import draftJson from "../../manhair-lifecycle/lifecycle.json";

type DraftEmail = {
  template_id: string;
  event_key: string;
  sequence: string;
  subjects: string[];
  preview_text: string;
  body: string;
  cta: { label: string; internal_placeholder?: string };
  enabled: boolean;
  consent_requirement: string;
  suppression_conditions: string[];
};

type DraftPage = {
  id: string;
  title: string;
  sections: Array<{ heading: string; body: string; cta: string | null }>;
};

export type LifecycleDraft = {
  schema_version: string;
  status: string;
  missing_facts: string[];
  pages: DraftPage[];
  emails: DraftEmail[];
};

export type ReviewedEmail = {
  id: string;
  eventKey: string;
  channel: "marketing" | "transactional";
  enabled: false;
  sendable: false;
  blocks: string[];
};

const TOKEN = /\{\{[A-Z0-9_]+\}\}/;
const FORBIDDEN = [/most guys/i, /most popular/i, /saved progress/i, /uninterrupted service/i, /limited spots/i];

export function reviewLifecycle(draft: LifecycleDraft): { ok: true; emails: ReviewedEmail[]; missingFacts: string[]; publicPageIds: string[] } | { ok: false; error: string } {
  if (draft.schema_version !== "1.0") return { ok: false, error: "schema_version" };
  if (draft.pages.length !== 6) return { ok: false, error: "page_count" };
  if (draft.emails.length !== 19) return { ok: false, error: "email_count" };
  if (draft.emails.some((email) => email.enabled !== false)) return { ok: false, error: "template_enabled" };
  const ids = new Set(draft.emails.map((email) => email.template_id));
  if (ids.size !== draft.emails.length) return { ok: false, error: "duplicate_template" };
  const emails = draft.emails.map(reviewEmail);
  const publicPageIds = draft.pages.filter((page) => page.sections.every((section) => !TOKEN.test(section.body) && !TOKEN.test(section.heading))).map((page) => page.id);
  return { ok: true, emails, missingFacts: draft.missing_facts, publicPageIds };
}

function reviewEmail(email: DraftEmail): ReviewedEmail {
  const blocks = new Set<string>();
  blocks.add("send_not_approved");
  blocks.add("sender_not_configured");
  const facing = `${email.subjects.join("\n")}\n${email.preview_text}\n${email.body}\n${email.cta.label}\n${email.cta.internal_placeholder ?? ""}`;
  const tokens = facing.match(new RegExp(TOKEN.source, "g")) ?? [];
  if (tokens.some((token) => token.includes("NOT_CONFIGURED"))) blocks.add("unresolved_placeholder");
  if (FORBIDDEN.some((pattern) => pattern.test(facing))) blocks.add("unsupported_claim");
  if (email.template_id === "email_payment_confirmation" || email.template_id === "email_membership_welcome") {
    blocks.add("receipt_dedup_unverified");
  }
  if (email.template_id === "email_care_after_fitting") blocks.add("care_guidance_unapproved");
  if (email.template_id === "email_pause_approved" || email.template_id === "email_pause_request_acknowledgement") {
    blocks.add("pause_billing_unresolved");
  }
  if (facing.includes("BOOKING_URL") || facing.includes("BOOKING")) {
    blocks.add("public_booking_link_withheld");
  }
  const channel = email.sequence.includes("nurture") || email.template_id.includes("nurture") || email.template_id.includes("abandoned")
    ? "marketing"
    : "transactional";
  if (channel === "marketing") blocks.add("marketing_held_until_consent");
  return {
    id: email.template_id,
    eventKey: email.event_key,
    channel,
    enabled: false,
    sendable: false,
    blocks: [...blocks],
  };
}

export function reviewedLifecycle() {
  return reviewLifecycle(draftJson as LifecycleDraft);
}
