import { GHL_MEMBERSHIP_TAGS, type MembershipGhlPayload } from "./ghl-profile";
import { resolveGhlTarget } from "./manhair-ghl";
import { smsWindowOpen } from "./sms-window";
import type { AppEnv } from "./readiness";

const REJECTED_LOCATIONS = new Set(["", "default", "0", "null", "undefined", "manhair", "test"]);

export type GhlMode = "off" | "contacts" | "contacts_and_opportunities";

export function ghlMode(env: AppEnv): GhlMode {
  return resolveGhlTarget(env).ok ? "contacts_and_opportunities" : "off";
}

export function assertGhlLocation(
  configured: string | undefined,
  received: string | undefined,
): { ok: true; locationId: string } | { ok: false; reason: "not_configured" | "missing_location" | "location_mismatch" } {
  const location = configured?.trim() ?? "";
  if (!location || REJECTED_LOCATIONS.has(location.toLowerCase())) return { ok: false, reason: "not_configured" };
  if (!received?.trim()) return { ok: false, reason: "missing_location" };
  if (received.trim() !== location) return { ok: false, reason: "location_mismatch" };
  return { ok: true, locationId: location };
}

export type GhlContact = { id: string; locationId?: string; email?: string };

export function chooseContact(
  configuredLocation: string,
  contacts: GhlContact[],
  email: string,
): { action: "use"; id: string } | { action: "create" } | { action: "ambiguous" } | { action: "reject" } {
  const check = assertGhlLocation(configuredLocation, configuredLocation);
  if (!check.ok) return { action: "reject" };
  const normalized = email.trim().toLowerCase();
  const matches = contacts.filter((contact) => {
    if (contact.locationId && contact.locationId !== configuredLocation) return false;
    return contact.email?.trim().toLowerCase() === normalized;
  });
  if (matches.length > 1) return { action: "ambiguous" };
  if (matches.length === 1) return { action: "use", id: matches[0]!.id };
  return { action: "create" };
}

export function stageMap(env: AppEnv): Record<string, string> | null {
  const target = resolveGhlTarget(env);
  return target.ok ? target.stageMap : null;
}

const PROSPECT_STAGES = new Set([
  "New Leads",
  "Hot Leads",
  "Proposal Sent",
  "Phone Consult",
  "Video Consultation",
  "No show/Cancelled",
  "No Buy/Nurture",
  "DND",
]);

/** A paid membership stays Active Clients. Appointment and prospect stages do not replace it. */
export function paidMemberStageChange(paid: boolean, nextStage: string): "allow" | "keep_active_client" {
  if (!paid) return "allow";
  if (nextStage === "Active Clients") return "allow";
  if (PROSPECT_STAGES.has(nextStage)) return "keep_active_client";
  return "allow";
}

/** Workflow API 403 is location availability, not a bad token. Do not retry or bypass it. */
export function ghlErrorDisposition(status: number, code: string | null): "retry" | "stop_availability" | "stop" {
  if (status === 403 && code === "WORKFLOW_API_NOT_ENABLED_FOR_LOCATION") return "stop_availability";
  if (status === 429 || status >= 500) return "retry";
  return "stop";
}

export async function pushOpportunityStage(
  env: AppEnv,
  opportunityId: string | null,
  stage: string,
  fetchImpl: typeof fetch,
): Promise<"not_connected" | "stage_map_missing" | "pushed" | "push_failed"> {
  const target = resolveGhlTarget(env);
  if (!target.ok) return "not_connected";
  const mapped = target.stageMap[stage as keyof typeof target.stageMap];
  if (!opportunityId || !mapped) return "stage_map_missing";
  const response = await fetchWithRetry(fetchImpl, `https://services.leadconnectorhq.com/opportunities/${encodeURIComponent(opportunityId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${target.token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ locationId: target.locationId, pipelineId: target.pipelineId, pipelineStageId: mapped }),
  });
  if (!response?.ok) return "push_failed";
  const body = (await response.json().catch(() => ({}))) as { opportunity?: { locationId?: string; pipelineId?: string } };
  if (body.opportunity?.locationId && body.opportunity.locationId !== target.locationId) return "push_failed";
  if (body.opportunity?.pipelineId && body.opportunity.pipelineId !== target.pipelineId) return "push_failed";
  return "pushed";
}

export function syncHash(input: { stage: string; assignee: string; followUp: string }): string {
  return `${input.stage}|${input.assignee}|${input.followUp}`;
}

export function planSync(localHash: string, remoteHash: string, origin: "local" | "ghl"): "skip_loop" | "push" | "pull" {
  if (localHash === remoteHash) return "skip_loop";
  return origin === "ghl" ? "pull" : "push";
}

export type LeadDraft = {
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  dealId: string;
  contactId?: string | null;
  opportunityId?: string | null;
  profile?: MembershipGhlPayload;
};

async function ghlResponseCode(response: Response): Promise<string | null> {
  const header = response.headers.get("x-ghl-error-code");
  if (header && /^[A-Z0-9_]+$/.test(header)) return header;
  if (response.ok) return null;
  const body = (await response.clone().json().catch(() => null)) as { code?: unknown } | null;
  return typeof body?.code === "string" && /^[A-Z0-9_]+$/.test(body.code) ? body.code : null;
}

async function fetchWithRetry(fetchImpl: typeof fetch, url: string | URL, init: RequestInit): Promise<Response | null> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      const code = await ghlResponseCode(response);
      if (ghlErrorDisposition(response.status, code) !== "retry") return response;
      last = response;
    } catch {
      last = null;
    }
  }
  return last;
}

export async function syncLead(
  env: AppEnv,
  lead: LeadDraft,
  fetchImpl: typeof fetch,
): Promise<{ status: "not_connected" | "ambiguous" | "pushed" | "push_failed" | "location_mismatch"; contactId: string | null; opportunityId: string | null }> {
  const target = resolveGhlTarget(env);
  if (!target.ok) return { status: "not_connected", contactId: null, opportunityId: null };
  const locationId = target.locationId;
  const headers = {
    Authorization: `Bearer ${target.token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
  const searchUrl = new URL("https://services.leadconnectorhq.com/contacts/");
  searchUrl.searchParams.set("locationId", locationId);
  searchUrl.searchParams.set("query", lead.email);
  const searched = await fetchWithRetry(fetchImpl, searchUrl, { headers });
  if (!searched?.ok) return { status: "push_failed", contactId: lead.contactId ?? null, opportunityId: lead.opportunityId ?? null };
  const body = (await searched.json()) as { contacts?: GhlContact[] };
  const contacts = body.contacts ?? [];
  if (contacts.some((contact) => contact.locationId && contact.locationId !== locationId)) {
    return { status: "location_mismatch", contactId: null, opportunityId: null };
  }
  const choice = lead.contactId ? { action: "use" as const, id: lead.contactId } : chooseContact(locationId, contacts, lead.email);
  if (choice.action === "ambiguous" || choice.action === "reject") {
    return { status: "ambiguous", contactId: null, opportunityId: null };
  }
  let contactId = choice.action === "use" ? choice.id : null;
  if (!contactId) {
    const created = await fetchWithRetry(fetchImpl, "https://services.leadconnectorhq.com/contacts/", {
      method: "POST",
      headers,
      body: JSON.stringify({
        locationId,
        email: lead.email,
        phone: lead.phone,
        firstName: lead.firstName,
        lastName: lead.lastName,
        source: "ManHair membership",
        ...(lead.profile ? { tags: lead.profile.tags, customFields: lead.profile.customFields } : {}),
      }),
    });
    if (!created?.ok) {
      const again = await fetchWithRetry(fetchImpl, searchUrl, { headers });
      const againBody = again?.ok ? ((await again.json()) as { contacts?: GhlContact[] }) : { contacts: [] };
      const recovered = chooseContact(locationId, againBody.contacts ?? [], lead.email);
      if (recovered.action !== "use") return { status: "push_failed", contactId: null, opportunityId: null };
      contactId = recovered.id;
    } else {
      const createdBody = (await created.json()) as { contact?: { id?: string; locationId?: string } };
      if (createdBody.contact?.locationId && createdBody.contact.locationId !== locationId) {
        return { status: "location_mismatch", contactId: null, opportunityId: null };
      }
      contactId = createdBody.contact?.id ?? null;
    }
  }
  if (!contactId) return { status: "push_failed", contactId: null, opportunityId: null };
  if (lead.profile) {
    const profilePush = await pushMembershipProfile(env, contactId, lead.profile, fetchImpl);
    if (profilePush === "push_failed") return { status: "push_failed", contactId, opportunityId: lead.opportunityId ?? null };
  }
  if (lead.opportunityId) {
    return { status: "pushed", contactId, opportunityId: lead.opportunityId };
  }
  const opportunity = await fetchWithRetry(fetchImpl, "https://services.leadconnectorhq.com/opportunities/", {
    method: "POST",
    headers,
    body: JSON.stringify({
      locationId,
      pipelineId: target.pipelineId,
      pipelineStageId: target.stageMap["New Leads"],
      contactId,
      name: `${lead.firstName} ${lead.lastName}`.trim(),
      status: "open",
    }),
  });
  if (!opportunity?.ok) return { status: "pushed", contactId, opportunityId: null };
  const opportunityBody = (await opportunity.json()) as { opportunity?: { id?: string } };
  return { status: "pushed", contactId, opportunityId: opportunityBody.opportunity?.id ?? null };
}

/**
 * Writes the membership tag set and custom fields.
 * Does not call HighLevel when the location is not authorized or the contact id is missing.
 * A workflow 403 is not retried.
 */
export async function pushMembershipProfile(
  env: AppEnv,
  contactId: string | null,
  payload: MembershipGhlPayload,
  fetchImpl: typeof fetch,
): Promise<"not_connected" | "no_contact" | "pushed" | "push_failed"> {
  const target = resolveGhlTarget(env);
  if (!target.ok) return "not_connected";
  if (!contactId) return "no_contact";
  const headers = {
    Authorization: `Bearer ${target.token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
  const contactUrl = `https://services.leadconnectorhq.com/contacts/${encodeURIComponent(contactId)}`;
  const updated = await fetchWithRetry(fetchImpl, contactUrl, {
    method: "PUT",
    headers,
    body: JSON.stringify({ customFields: payload.customFields }),
  });
  if (!updated?.ok) return "push_failed";
  if (payload.tags.length > 0) {
    const added = await fetchWithRetry(fetchImpl, `${contactUrl}/tags`, {
      method: "POST",
      headers,
      body: JSON.stringify({ tags: payload.tags }),
    });
    if (!added?.ok) return "push_failed";
  }
  const remove = GHL_MEMBERSHIP_TAGS.filter((tag) => !payload.tags.includes(tag));
  if (remove.length > 0) {
    const removed = await fetchWithRetry(fetchImpl, `${contactUrl}/tags`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ tags: remove }),
    });
    if (!removed?.ok) return "push_failed";
  }
  return "pushed";
}

/** Texts go out through HighLevel Conversations from the studio number. Off unless MEMBERSHIP_SMS_SEND=true. */
export const GHL_SMS_FROM = "+19045268500";

async function postConversationSms(
  env: AppEnv,
  contactId: string | null,
  message: string,
  fetchImpl: typeof fetch,
): Promise<{ sent: boolean; reason: string }> {
  if (env.MEMBERSHIP_SMS_SEND !== "true") return { sent: false, reason: "sms_disabled" };
  const target = resolveGhlTarget(env);
  if (!target.ok) return { sent: false, reason: "not_connected" };
  if (!contactId) return { sent: false, reason: "no_contact" };
  const response = await fetchWithRetry(fetchImpl, "https://services.leadconnectorhq.com/conversations/messages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${target.token}`,
      Version: "2021-07-28",
      "Content-Type": "application/json",
      LocationId: target.locationId,
    },
    body: JSON.stringify({ type: "SMS", contactId, message, fromNumber: GHL_SMS_FROM }),
  });
  if (!response?.ok) return { sent: false, reason: "push_failed" };
  return { sent: true, reason: "sent" };
}

export async function sendLocationSms(
  env: AppEnv,
  contactId: string | null,
  message: string,
  fetchImpl: typeof fetch,
  consented: boolean,
  now: Date = new Date(),
): Promise<{ sent: boolean; reason: string }> {
  if (!consented) return { sent: false, reason: "no_sms_consent" };
  if (env.MEMBERSHIP_SMS_SEND !== "true") return { sent: false, reason: "sms_disabled" };
  if (!smsWindowOpen(now)) return { sent: false, reason: "quiet_hours" };
  return postConversationSms(env, contactId, message, fetchImpl);
}

/**
 * Internal staff text. Ignores member consent and quiet hours.
 * Still requires MEMBERSHIP_SMS_SEND=true. The contact id must already be the staff number's contact.
 */
export async function sendStaffSms(
  env: AppEnv,
  contactId: string | null,
  message: string,
  fetchImpl: typeof fetch,
): Promise<{ sent: boolean; reason: string }> {
  return postConversationSms(env, contactId, message, fetchImpl);
}

function phoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function samePhone(left: string, right: string): boolean {
  const a = phoneDigits(left);
  const b = phoneDigits(right);
  if (a.length < 10 || b.length < 10) return false;
  return a === b || (Math.abs(a.length - b.length) <= 3 && (a.endsWith(b) || b.endsWith(a)));
}

/** Find or create the GoHighLevel contact for a staff phone. Never selects a contact by email. */
export async function contactIdForStaffNumber(
  env: AppEnv,
  phone: string,
  fetchImpl: typeof fetch,
): Promise<{ contactId: string | null; reason: string }> {
  const target = resolveGhlTarget(env);
  if (!target.ok) return { contactId: null, reason: "not_connected" };
  const headers = {
    Authorization: `Bearer ${target.token}`,
    Version: "2021-07-28",
    "Content-Type": "application/json",
  };
  const searchUrl = new URL("https://services.leadconnectorhq.com/contacts/");
  searchUrl.searchParams.set("locationId", target.locationId);
  searchUrl.searchParams.set("query", phone);
  const searched = await fetchWithRetry(fetchImpl, searchUrl, { headers });
  if (!searched?.ok) return { contactId: null, reason: "lookup_failed" };
  const body = (await searched.json()) as { contacts?: Array<GhlContact & { phone?: string }> };
  const matches = (body.contacts ?? []).filter((contact) => {
    if (contact.locationId && contact.locationId !== target.locationId) return false;
    return typeof contact.phone === "string" && samePhone(contact.phone, phone);
  });
  if (matches[0]?.id) return { contactId: matches[0].id, reason: "matched" };
  const created = await fetchWithRetry(fetchImpl, "https://services.leadconnectorhq.com/contacts/", {
    method: "POST",
    headers,
    body: JSON.stringify({
      locationId: target.locationId,
      phone,
      firstName: "ManHair",
      lastName: "Staff",
      source: "ManHair staff alert",
    }),
  });
  if (!created?.ok) return { contactId: null, reason: "create_failed" };
  const createdBody = (await created.json()) as { contact?: { id?: string; locationId?: string } };
  if (createdBody.contact?.locationId && createdBody.contact.locationId !== target.locationId) {
    return { contactId: null, reason: "location_mismatch" };
  }
  return createdBody.contact?.id
    ? { contactId: createdBody.contact.id, reason: "created" }
    : { contactId: null, reason: "create_failed" };
}
