import { normalizeEmail } from "./tokens";
import type { AlertRecord } from "./alerts";
import type { AuthAuditRecord, RecoveryRecord, SyncState } from "./types";
import type {
  ActivityRecord,
  CheckoutRecord,
  ConsentRecord,
  DealRecord,
  DraftRecord,
  EventClaim,
  InvoiceRecord,
  MemberRecord,
  MembershipStore,
  NoteRecord,
  PauseRequestRecord,
  SessionRecord,
  UsageResult,
} from "./types";

type Founding = { id: string; memberId: string; status: "held" | "converted" | "released"; expiresAt: string };
type EventRow = { id: string; type: string; status: "processing" | "processed" | "failed" };
type Ledger = { key: string; memberId: string };

export function createMemoryStore(): MembershipStore {
  const members = new Map<string, MemberRecord>();
  const checkouts = new Map<string, CheckoutRecord>();
  const founding: Founding[] = [];
  const events = new Map<string, EventRow>();
  const invoices = new Map<string, InvoiceRecord>();
  const sessions = new Map<string, SessionRecord>();
  const deals = new Map<string, DealRecord>();
  const notes: NoteRecord[] = [];
  const activity: ActivityRecord[] = [];
  const pauses: PauseRequestRecord[] = [];
  const drafts: DraftRecord[] = [];
  const recoveries = new Map<string, RecoveryRecord>();
  const audits: AuthAuditRecord[] = [];
  const alerts = new Map<string, AlertRecord>();
  let syncState: SyncState | null = null;
  const ledger: Ledger[] = [];
  const rates = new Map<string, { hits: number; started: number }>();
  const consents: ConsentRecord[] = [];

  return {
    kind: "memory",
    async listMembersByEmail(email) {
      const normalized = normalizeEmail(email);
      return [...members.values()].filter((member) => normalizeEmail(member.email) === normalized);
    },
    async findMemberByEmail(email) {
      const normalized = normalizeEmail(email);
      return [...members.values()].find((member) => normalizeEmail(member.email) === normalized) ?? null;
    },
    async findMemberById(id) {
      return members.get(id) ?? null;
    },
    async findMemberByCustomer(customerId) {
      return [...members.values()].find((member) => member.stripeCustomerId === customerId) ?? null;
    },
    async findMemberBySubscription(subscriptionId) {
      return [...members.values()].find((member) => member.stripeSubscriptionId === subscriptionId) ?? null;
    },
    async listMembers() {
      return [...members.values()];
    },
    async saveMember(member) {
      members.set(member.id, { ...member });
    },
    async compareAndSave(member, expectedVersion) {
      const current = members.get(member.id);
      if (current && current.version !== expectedVersion) return "conflict";
      members.set(member.id, { ...member, version: expectedVersion + 1 });
      return "ok";
    },
    async addConsent(consent) {
      consents.push(consent);
    },
    async reserveFounding(input) {
      const now = Date.now();
      const active = founding.filter(
        (row) => row.status === "converted" || (row.status === "held" && new Date(row.expiresAt).getTime() > now),
      ).length;
      if (active >= input.cap) return "cap";
      founding.push({ id: input.id, memberId: input.memberId, status: "held", expiresAt: input.expiresAt });
      return "reserved";
    },
    async setFoundingStatus(id, status) {
      const row = founding.find((item) => item.id === id);
      if (row) row.status = status;
    },
    async getCheckout(key) {
      return checkouts.get(key) ?? null;
    },
    async saveCheckout(row) {
      checkouts.set(row.idempotencyKey, row);
    },
    async claimEvent(id, type): Promise<EventClaim> {
      const existing = events.get(id);
      if (!existing) {
        events.set(id, { id, type, status: "processing" });
        return "claimed";
      }
      if (existing.status === "failed") {
        existing.status = "processing";
        return "retry";
      }
      return "duplicate";
    },
    async finishEvent(id, status) {
      const existing = events.get(id);
      if (existing) existing.status = status;
    },
    async seenEvent(id) {
      const existing = events.get(id);
      return existing?.status === "processed";
    },
    async upsertInvoice(row) {
      const current = invoices.get(row.id);
      invoices.set(row.id, current ? { ...current, ...row, amountRefunded: current.amountRefunded } : row);
    },
    async addRefund(_invoiceId, cents) {
      const first = [...invoices.values()][0];
      if (first) first.amountRefunded += cents;
    },
    async listInvoices(memberId) {
      return [...invoices.values()].filter((invoice) => !memberId || invoice.memberId === memberId);
    },
    async consumeRate(bucket, now, limit, windowMs) {
      const current = rates.get(bucket);
      if (!current || now.getTime() - current.started >= windowMs) {
        rates.set(bucket, { hits: 1, started: now.getTime() });
        return true;
      }
      if (current.hits >= limit) return false;
      current.hits += 1;
      return true;
    },
    async createSession(row) {
      sessions.set(row.id, row);
    },
    async findSession(id) {
      return sessions.get(id) ?? null;
    },
    async findSessionByHash(tokenHash) {
      if (!tokenHash) return null;
      return [...sessions.values()].find((row) => row.tokenHash === tokenHash && row.active) ?? null;
    },
    async activateSession(id, tokenHash, expiresAt) {
      const row = sessions.get(id);
      if (!row || row.returnUsed) return;
      row.tokenHash = tokenHash;
      row.expiresAt = expiresAt;
      row.active = true;
      row.returnUsed = true;
    },
    async deleteSessionByHash(tokenHash) {
      for (const [id, row] of sessions) if (row.tokenHash === tokenHash) sessions.delete(id);
    },
    async saveRecovery(row) {
      recoveries.set(row.tokenHash, row);
    },
    async consumeRecovery(tokenHash, now) {
      const row = recoveries.get(tokenHash);
      if (!row || row.used || new Date(row.expiresAt).getTime() <= now.getTime()) return null;
      row.used = true;
      return row.memberId;
    },
    async getSyncState() {
      return syncState;
    },
    async saveSyncState(row) {
      syncState = row;
    },
    async addAuthAudit(row) {
      audits.push(row);
    },
    async enqueueAlert(row) {
      if ([...alerts.values()].some((item) => item.dedupeKey === row.dedupeKey)) return "duplicate";
      alerts.set(row.id, row);
      return "created";
    },
    async listAlerts() {
      return [...alerts.values()];
    },
    async claimDueAlerts(now, limit) {
      const due = [...alerts.values()]
        .filter((item) => item.status === "pending" && item.nextAttemptAt && new Date(item.nextAttemptAt).getTime() <= now.getTime())
        .slice(0, limit);
      for (const item of due) {
        item.status = "sending";
        item.attempts += 1;
      }
      return due.map((item) => ({ ...item }));
    },
    async updateAlert(id, patch) {
      const current = alerts.get(id);
      if (current) Object.assign(current, patch);
    },
    async listDeals() {
      return [...deals.values()];
    },
    async saveDeal(row) {
      deals.set(row.id, row);
    },
    async deleteDeal(id) {
      deals.delete(id);
      for (let index = notes.length - 1; index >= 0; index -= 1) if (notes[index]?.dealId === id) notes.splice(index, 1);
      for (let index = activity.length - 1; index >= 0; index -= 1) if (activity[index]?.dealId === id) activity.splice(index, 1);
      for (let index = drafts.length - 1; index >= 0; index -= 1) if (drafts[index]?.dealId === id) drafts.splice(index, 1);
    },
    async addNote(row) {
      notes.push(row);
    },
    async listNotes(dealId) {
      return notes.filter((note) => note.dealId === dealId);
    },
    async addActivity(row) {
      activity.push(row);
    },
    async listActivity(dealId) {
      return activity.filter((item) => item.dealId === dealId);
    },
    async savePauseRequest(row) {
      const index = pauses.findIndex((item) => item.id === row.id);
      if (index >= 0) pauses[index] = row;
      else pauses.push(row);
    },
    async listPauseRequests(memberId) {
      return pauses.filter((item) => !memberId || item.memberId === memberId);
    },
    async recordUsage(input): Promise<UsageResult> {
      if (ledger.some((item) => item.key === input.idempotencyKey)) return "replay";
      const member = members.get(input.memberId);
      if (!member || member.pauseCollection) return "rejected";
      const used = input.kind === "system" ? member.systemsUsed : member.maintenanceUsed;
      if (used + input.quantity > input.allowance) return "rejected";
      if (input.kind === "system") member.systemsUsed += input.quantity;
      else member.maintenanceUsed += input.quantity;
      ledger.push({ key: input.idempotencyKey, memberId: input.memberId });
      return "applied";
    },
    async saveDraft(row) {
      const index = drafts.findIndex((item) => item.id === row.id);
      if (index >= 0) drafts[index] = row;
      else drafts.push(row);
    },
    async listDrafts(dealId) {
      return drafts.filter((item) => item.dealId === dealId);
    },
  };
}
