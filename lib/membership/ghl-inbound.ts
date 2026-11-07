import { createPublicKey, verify } from "node:crypto";
import { ghlMode, type GhlMode } from "./ghl";
import type { AppEnv } from "./readiness";
import type { DealRecord } from "./types";

/** Published HighLevel Ed25519 key for X-GHL-Signature. Current contract after 2026-09-01. */
export const GHL_ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAi2HR1srL4o18O8BRa7gVJY7G7bupbN3H9AwJrHCDiOg=
-----END PUBLIC KEY-----`;

const MAX_WEBHOOK_AGE_MS = 10 * 60 * 1000;

export function verifyGhlSignature(
  rawBody: string,
  signature: string | null,
  publicKeyPem = GHL_ED25519_PUBLIC_KEY,
): boolean {
  if (!signature || signature === "N/A") return false;
  try {
    const key = createPublicKey(publicKeyPem);
    return verify(null, Buffer.from(rawBody, "utf8"), key, Buffer.from(signature, "base64"));
  } catch {
    return false;
  }
}

export type InboundLead = {
  webhookId: string;
  type: string;
  timestamp: string;
  locationId: string;
  contactId: string | null;
  opportunityId: string | null;
  email: string;
  name: string;
  phone: string | null;
  updatedAt: string;
};

export function parseInbound(body: Record<string, unknown>): InboundLead | null {
  const type = typeof body.type === "string" ? body.type : "";
  const webhookId = typeof body.webhookId === "string" ? body.webhookId : "";
  const timestamp = typeof body.timestamp === "string" ? body.timestamp : "";
  const data = body.data && typeof body.data === "object" ? (body.data as Record<string, unknown>) : body;
  const locationId = stringField(body.locationId) ?? stringField(data.locationId);
  const email = (stringField(data.email) ?? stringField(body.email) ?? "").trim().toLowerCase();
  if (!type || !webhookId || !timestamp || !locationId) return null;
  const first = stringField(data.firstName) ?? "";
  const last = stringField(data.lastName) ?? "";
  const name = (stringField(data.name) ?? `${first} ${last}`).trim();
  return {
    webhookId,
    type,
    timestamp,
    locationId,
    contactId: stringField(data.contactId) ?? stringField(data.id) ?? stringField(body.contactId),
    opportunityId: stringField(data.opportunityId) ?? (type.toLowerCase().includes("opportunity") ? stringField(data.id) : null),
    email,
    name: name || email || "HighLevel lead",
    phone: stringField(data.phone),
    updatedAt: stringField(data.dateUpdated) ?? stringField(data.updatedAt) ?? timestamp,
  };
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function webhookTimestampFresh(timestamp: string, now: Date): boolean {
  const at = new Date(timestamp).getTime();
  if (Number.isNaN(at)) return false;
  const age = now.getTime() - at;
  return age >= -60_000 && age <= MAX_WEBHOOK_AGE_MS;
}

export type MergeResult =
  | { action: "skip_location" | "ambiguous" | "unchanged" }
  | { action: "import" | "update" | "conflict"; deal: DealRecord; activity: string };

export function mergeInboundLead(input: {
  configuredLocation: string;
  remote: InboundLead;
  deals: DealRecord[];
  now: Date;
}): MergeResult {
  if (input.remote.locationId !== input.configuredLocation) return { action: "skip_location" };
  const byContact = input.remote.contactId
    ? input.deals.filter((deal) => deal.ghlContactId === input.remote.contactId && deal.locationId === input.configuredLocation)
    : [];
  const byEmail = input.remote.email
    ? input.deals.filter(
        (deal) => deal.email.trim().toLowerCase() === input.remote.email && deal.locationId === input.configuredLocation,
      )
    : [];
  const matches = byContact.length ? byContact : byEmail;
  if (matches.length > 1) return { action: "ambiguous" };
  const local = matches[0] ?? null;
  if (!local) {
    const deal: DealRecord = {
      id: `ghl_${input.remote.contactId ?? input.remote.webhookId}`,
      memberId: null,
      name: input.remote.name,
      email: input.remote.email || "unknown@invalid.local",
      phone: input.remote.phone,
      stage: "new",
      assignee: "",
      nextFollowUp: null,
      ghlContactId: input.remote.contactId,
      ghlOpportunityId: input.remote.opportunityId,
      syncStatus: "imported",
      syncHash: inboundHash(input.remote),
      locationId: input.configuredLocation,
      remoteUpdatedAt: input.remote.updatedAt,
      staffEditedAt: null,
    };
    return { action: "import", deal, activity: `Imported ${input.remote.type} from HighLevel.` };
  }
  if (local.remoteUpdatedAt === input.remote.updatedAt && local.syncHash === inboundHash(input.remote)) {
    return { action: "unchanged" };
  }
  const staffOwnsWorkflow = Boolean(local.staffEditedAt);
  const deal: DealRecord = {
    ...local,
    name: input.remote.name || local.name,
    email: input.remote.email || local.email,
    phone: input.remote.phone ?? local.phone,
    ghlContactId: input.remote.contactId ?? local.ghlContactId,
    ghlOpportunityId: input.remote.opportunityId ?? local.ghlOpportunityId,
    locationId: input.configuredLocation,
    remoteUpdatedAt: input.remote.updatedAt,
    syncHash: inboundHash(input.remote),
    syncStatus: staffOwnsWorkflow ? "conflict" : "updated",
    stage: staffOwnsWorkflow ? local.stage : local.stage,
    assignee: staffOwnsWorkflow ? local.assignee : local.assignee,
    nextFollowUp: staffOwnsWorkflow ? local.nextFollowUp : local.nextFollowUp,
  };
  return {
    action: staffOwnsWorkflow ? "conflict" : "update",
    deal,
    activity: staffOwnsWorkflow
      ? "HighLevel changed this lead. Staff stage, assignee, and follow-up were kept."
      : `Updated from HighLevel ${input.remote.type}.`,
  };
}

function inboundHash(remote: InboundLead): string {
  return `${remote.contactId ?? ""}|${remote.opportunityId ?? ""}|${remote.email}|${remote.name}|${remote.updatedAt}`;
}

export type RemotePage = {
  contacts: InboundLead[];
  opportunities: InboundLead[];
  nextContactCursor: string | null;
  nextOpportunityPage: number | null;
};

export function readContactPage(body: unknown, locationId: string): { leads: InboundLead[]; nextCursor: string | null } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const contacts = Array.isArray(record.contacts) ? record.contacts : [];
  const meta = record.meta && typeof record.meta === "object" ? (record.meta as Record<string, unknown>) : {};
  const leads = contacts.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const contact = item as Record<string, unknown>;
    const id = stringField(contact.id);
    const email = (stringField(contact.email) ?? "").toLowerCase();
    const foundLocation = stringField(contact.locationId) ?? locationId;
    if (!id || foundLocation !== locationId) return [];
    const parsed = parseInbound({
      type: "ContactImport",
      webhookId: `import_${id}`,
      timestamp: stringField(contact.dateUpdated) ?? new Date(0).toISOString(),
      locationId: foundLocation,
      data: { ...contact, contactId: id, email },
    });
    return parsed ? [parsed] : [];
  });
  const nextCursor = stringField(meta.startAfterId) ?? stringField(meta.nextStartAfterId);
  return { leads, nextCursor };
}

export function readOpportunityPage(body: unknown, locationId: string): { leads: InboundLead[]; nextPage: number | null } {
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const opportunities = Array.isArray(record.opportunities) ? record.opportunities : [];
  const leads = opportunities.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const opportunity = item as Record<string, unknown>;
    const id = stringField(opportunity.id);
    const foundLocation = stringField(opportunity.locationId) ?? locationId;
    if (!id || foundLocation !== locationId) return [];
    const contact = opportunity.contact && typeof opportunity.contact === "object" ? (opportunity.contact as Record<string, unknown>) : {};
    const parsed = parseInbound({
      type: "OpportunityImport",
      webhookId: `import_opp_${id}`,
      timestamp: stringField(opportunity.updatedAt) ?? new Date(0).toISOString(),
      locationId: foundLocation,
      data: {
        opportunityId: id,
        contactId: stringField(opportunity.contactId) ?? stringField(contact.id),
        email: stringField(contact.email) ?? stringField(opportunity.email) ?? "",
        name: stringField(opportunity.name) ?? "",
        phone: stringField(contact.phone),
      },
    });
    return parsed ? [parsed] : [];
  });
  const meta = record.meta && typeof record.meta === "object" ? (record.meta as Record<string, unknown>) : {};
  const next = typeof meta.nextPage === "number" ? meta.nextPage : null;
  return { leads, nextPage: next };
}

export async function pullHighLevel(input: {
  env: AppEnv;
  fetchImpl: typeof fetch;
  contactCursor: string | null;
  opportunityPage: number;
}): Promise<
  | { ok: false; status: "not_connected" }
  | {
      ok: true;
      contacts: InboundLead[];
      opportunities: InboundLead[];
      nextContactCursor: string | null;
      nextOpportunityPage: number | null;
    }
> {
  if (ghlMode(input.env) === "off") return { ok: false, status: "not_connected" };
  const locationId = input.env.GHL_LOCATION_ID!.trim();
  const headers = { Authorization: `Bearer ${input.env.GHL_API_TOKEN}`, Version: "2021-07-28", Accept: "application/json" };
  const contactUrl = new URL("https://services.leadconnectorhq.com/contacts/");
  contactUrl.searchParams.set("locationId", locationId);
  contactUrl.searchParams.set("limit", "100");
  if (input.contactCursor) contactUrl.searchParams.set("startAfterId", input.contactCursor);
  const contactResponse = await fetchRetry(input.fetchImpl, contactUrl, { headers });
  if (!contactResponse?.ok) throw new Error("contact_pull_failed");
  const contacts = readContactPage(await contactResponse.json(), locationId);
  const opportunityResponse = await fetchRetry(input.fetchImpl, "https://services.leadconnectorhq.com/opportunities/search", {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, limit: 100, page: input.opportunityPage }),
  });
  const opportunities = opportunityResponse?.ok
    ? readOpportunityPage(await opportunityResponse.json(), locationId)
    : { leads: [] as InboundLead[], nextPage: null };
  return {
    ok: true,
    contacts: contacts.leads,
    opportunities: opportunities.leads,
    nextContactCursor: contacts.nextCursor,
    nextOpportunityPage: opportunities.nextPage,
  };
}

async function fetchRetry(fetchImpl: typeof fetch, url: string | URL, init: RequestInit): Promise<Response | null> {
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

export function ghlFreshness(state: { pulledAt: string | null; status: string } | null, mode: GhlMode): string {
  if (mode === "off") return "HighLevel is not connected. No location is confirmed, so no leads are pulled or accepted.";
  if (!state?.pulledAt) return "No HighLevel pull has completed. Webhooks apply only after a signed event. This is not a live socket.";
  return `Last HighLevel pull ${state.pulledAt}. Status ${state.status}. New leads also arrive from signed webhooks. This view is not a continuous socket.`;
}
