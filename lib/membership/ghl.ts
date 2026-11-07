import type { AppEnv } from "./readiness";

const REJECTED_LOCATIONS = new Set(["", "default", "0", "null", "undefined", "manhair", "test"]);

export type GhlMode = "off" | "contacts" | "contacts_and_opportunities";

export function ghlMode(env: AppEnv): GhlMode {
  const location = env.GHL_LOCATION_ID?.trim().toLowerCase() ?? "";
  const token = env.GHL_API_TOKEN?.trim();
  if (!token || REJECTED_LOCATIONS.has(location)) return "off";
  if (!env.GHL_PIPELINE_ID?.trim() || !env.GHL_PIPELINE_STAGE_ID?.trim()) return "contacts";
  return "contacts_and_opportunities";
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
};

async function fetchWithRetry(fetchImpl: typeof fetch, url: string | URL, init: RequestInit): Promise<Response | null> {
  let last: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetchImpl(url, init);
      if (response.ok || (response.status < 500 && response.status !== 429)) return response;
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
  const mode = ghlMode(env);
  if (mode === "off") return { status: "not_connected", contactId: null, opportunityId: null };
  const locationId = env.GHL_LOCATION_ID!.trim();
  const headers = {
    Authorization: `Bearer ${env.GHL_API_TOKEN}`,
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
  if (mode !== "contacts_and_opportunities" || lead.opportunityId) {
    return { status: "pushed", contactId, opportunityId: lead.opportunityId ?? null };
  }
  const opportunity = await fetchWithRetry(fetchImpl, "https://services.leadconnectorhq.com/opportunities/", {
    method: "POST",
    headers,
    body: JSON.stringify({
      locationId,
      pipelineId: env.GHL_PIPELINE_ID,
      pipelineStageId: env.GHL_PIPELINE_STAGE_ID,
      contactId,
      name: `${lead.firstName} ${lead.lastName}`.trim(),
      status: "open",
    }),
  });
  if (!opportunity?.ok) return { status: "pushed", contactId, opportunityId: null };
  const opportunityBody = (await opportunity.json()) as { opportunity?: { id?: string } };
  return { status: "pushed", contactId, opportunityId: opportunityBody.opportunity?.id ?? null };
}
