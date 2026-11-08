import { createPublicKey, verify } from "node:crypto";
import type { GhlMode } from "./ghl";
import { MANHAIR_LEGACY_PIPELINE_ID, MANHAIR_MARKETING_PIPELINE_ID, resolveGhlTarget } from "./manhair-ghl";
import type { AppEnv } from "./readiness";
import { isSalesStage, type DealRecord, type DealStage } from "./types";

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
  pipelineId: string | null;
  pipelineStageId: string | null;
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
    pipelineId: stringField(data.pipelineId),
    pipelineStageId: stringField(data.pipelineStageId),
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

export function stageIdToLocal(map: Record<string, string> | null, stageId: string | null): DealStage | null {
  if (!map || !stageId) return null;
  const match = Object.entries(map).find(([, id]) => id === stageId);
  if (!match || !isSalesStage(match[0])) return null;
  return match[0];
}

export function mergeInboundLead(input: {
  configuredLocation: string;
  remote: InboundLead;
  deals: DealRecord[];
  now: Date;
  stageMap?: Record<string, string> | null;
}): MergeResult {
  if (input.remote.locationId !== input.configuredLocation) return { action: "skip_location" };
  if (input.remote.pipelineId === MANHAIR_LEGACY_PIPELINE_ID) return { action: "unchanged" };
  if (input.remote.pipelineId && input.remote.pipelineId !== MANHAIR_MARKETING_PIPELINE_ID) return { action: "unchanged" };
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
      stage: mappedImportStage(input),
      assignee: "",
      nextFollowUp: null,
      ghlContactId: input.remote.contactId,
      ghlOpportunityId: input.remote.opportunityId,
      syncStatus: importStatus(input),
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
  const staffIsNewer = Boolean(local.staffEditedAt) && new Date(local.staffEditedAt!).getTime() >= new Date(input.remote.updatedAt).getTime();
  const mappedStage = stageIdToLocal(input.stageMap ?? null, input.remote.pipelineStageId);
  const unknownStage = Boolean(input.remote.pipelineStageId) && !mappedStage;
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
    syncStatus: staffIsNewer ? "conflict" : unknownStage ? "unknown_stage" : mappedStage ? "updated" : "contact_updated",
    stage: staffIsNewer ? local.stage : unknownStage ? (`unmapped:${input.remote.pipelineStageId}` as DealStage) : mappedStage ?? local.stage,
    assignee: local.assignee,
    nextFollowUp: local.nextFollowUp,
  };
  return {
    action: staffIsNewer ? "conflict" : "update",
    deal,
    activity: staffIsNewer
      ? "HighLevel changed this lead. The newer staff stage, assignee, and follow-up were kept."
      : unknownStage
        ? `HighLevel stage ${input.remote.pipelineStageId} is not one of the nine marketing stages. It was kept and not marked synced.`
        : mappedStage
          ? `Stage updated from HighLevel to ${mappedStage}.`
          : "HighLevel contact updated. The local stage was kept.",
  };
}

function mappedImportStage(input: { remote: InboundLead; stageMap?: Record<string, string> | null }): DealStage {
  const mapped = stageIdToLocal(input.stageMap ?? null, input.remote.pipelineStageId);
  if (mapped) return mapped;
  if (input.remote.pipelineStageId) return `unmapped:${input.remote.pipelineStageId}`;
  return "New Leads";
}

function importStatus(input: { remote: InboundLead; stageMap?: Record<string, string> | null }): string {
  if (input.remote.pipelineStageId && !stageIdToLocal(input.stageMap ?? null, input.remote.pipelineStageId)) return "unknown_stage";
  return "imported";
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
      data: { ...contact, contactId: id, email, pipelineStageId: stringField(contact.pipelineStageId) },
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
    const pipelineId = stringField(opportunity.pipelineId);
    if (!id || foundLocation !== locationId) return [];
    if (pipelineId === MANHAIR_LEGACY_PIPELINE_ID) return [];
    if (pipelineId && pipelineId !== MANHAIR_MARKETING_PIPELINE_ID) return [];
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
        pipelineId,
        pipelineStageId: stringField(opportunity.pipelineStageId),
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
  const target = resolveGhlTarget(input.env);
  if (!target.ok) return { ok: false, status: "not_connected" };
  const locationId = target.locationId;
  const headers = { Authorization: `Bearer ${target.token}`, Version: "2021-07-28", Accept: "application/json" };
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
    body: JSON.stringify({ locationId, pipelineId: target.pipelineId, limit: 100, page: input.opportunityPage }),
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
  if (mode === "off") {
    return "HighLevel is not connected. The private API token is missing, or the location, pipeline, or stage map does not match the ManHair marketing pipeline. Stage changes stay in this hub and are not marked synced. This page refreshes about every 15 seconds. That is not a live socket.";
  }
  if (!state?.pulledAt) {
    return "No HighLevel pull has completed. Signed webhooks can still add leads. Each lead shows pending, error, or last status. This page refreshes about every 15 seconds. That is not a live socket.";
  }
  return `Last HighLevel pull ${state.pulledAt}. Status ${state.status}. Signed webhooks and the 15-second refresh update this board. Each lead shows its own sync status. This is not a live socket.`;
}
