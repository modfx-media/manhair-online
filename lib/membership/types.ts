import type { Attention, InvoiceKind, MemberStatus } from "./billing";
import type { TierId } from "./offer";

export type MemberRecord = {
  id: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  tier: TierId;
  status: MemberStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionItemId: string | null;
  monthlyCents: number;
  setupCents: number;
  setupPaid: boolean;
  recurringStartAt: string | null;
  minimumTermEndsAt: string;
  rateLockEndsAt: string;
  entitlementYearEndsAt: string;
  systemsUsed: number;
  maintenanceUsed: number;
  pauseDaysUsed: number;
  cancelAt: string | null;
  pauseCollection: boolean;
  attention: Attention;
  termsVersion: string;
  lastStatusEventCreated: number;
  version: number;
  createdAt: string;
};

export type CheckoutRecord = {
  idempotencyKey: string;
  memberId: string;
  sessionId: string | null;
  url: string | null;
  reservationId: string | null;
  createdAt: string;
};

export type InvoiceRecord = {
  id: string;
  memberId: string | null;
  kind: InvoiceKind;
  status: "paid" | "failed";
  amountPaid: number;
  amountRefunded: number;
};

export type DealStage =
  | "new"
  | "checkout"
  | "consult"
  | "design"
  | "fitting"
  | "active"
  | "pause_requested"
  | "cancel_scheduled"
  | "closed";

export const DEAL_STAGES: DealStage[] = [
  "new",
  "checkout",
  "consult",
  "design",
  "fitting",
  "active",
  "pause_requested",
  "cancel_scheduled",
  "closed",
];

export type DealRecord = {
  id: string;
  memberId: string | null;
  name: string;
  email: string;
  phone: string | null;
  stage: DealStage;
  assignee: string;
  nextFollowUp: string | null;
  ghlContactId: string | null;
  ghlOpportunityId: string | null;
  syncStatus: string;
  syncHash: string;
  locationId: string | null;
};

export type NoteRecord = { id: string; dealId: string; author: string; body: string; createdAt: string };
export type ActivityRecord = { id: string; dealId: string; actor: string; action: string; createdAt: string };
export type PauseRequestRecord = {
  id: string;
  memberId: string;
  days: number;
  status: "requested" | "applied" | "rejected";
  policyVersion: string;
  createdAt: string;
};
export type SessionRecord = { id: string; memberId: string; expiresAt: string; active: boolean };
export type DraftRecord = { id: string; dealId: string; body: string; updatedAt: string };
export type ConsentRecord = {
  id: string;
  memberId: string;
  termsVersion: string;
  termsAcceptedAt: string;
  autorenewAcceptedAt: string;
};

export type UsageResult = "applied" | "replay" | "rejected";
export type EventClaim = "claimed" | "duplicate" | "retry";

export interface MembershipStore {
  kind: "memory" | "sql" | "unavailable";
  findMemberByEmail(email: string): Promise<MemberRecord | null>;
  listMembersByEmail(email: string): Promise<MemberRecord[]>;
  deleteDeal(id: string): Promise<void>;
  findMemberById(id: string): Promise<MemberRecord | null>;
  findMemberByCustomer(customerId: string): Promise<MemberRecord | null>;
  findMemberBySubscription(subscriptionId: string): Promise<MemberRecord | null>;
  listMembers(): Promise<MemberRecord[]>;
  saveMember(member: MemberRecord): Promise<void>;
  compareAndSave(member: MemberRecord, expectedVersion: number): Promise<"ok" | "conflict">;
  addConsent(consent: ConsentRecord): Promise<void>;
  reserveFounding(input: { id: string; memberId: string; expiresAt: string; cap: number }): Promise<"reserved" | "cap">;
  setFoundingStatus(id: string, status: "converted" | "released"): Promise<void>;
  getCheckout(key: string): Promise<CheckoutRecord | null>;
  saveCheckout(row: CheckoutRecord): Promise<void>;
  claimEvent(id: string, type: string): Promise<EventClaim>;
  finishEvent(id: string, status: "processed" | "failed"): Promise<void>;
  seenEvent(id: string): Promise<boolean>;
  upsertInvoice(row: InvoiceRecord): Promise<void>;
  addRefund(invoiceId: string | null, cents: number): Promise<void>;
  listInvoices(memberId?: string): Promise<InvoiceRecord[]>;
  consumeRate(bucket: string, now: Date, limit: number, windowMs: number): Promise<boolean>;
  createSession(row: SessionRecord): Promise<void>;
  findSession(id: string): Promise<SessionRecord | null>;
  activateSession(id: string): Promise<void>;
  deleteSession(id: string): Promise<void>;
  listDeals(): Promise<DealRecord[]>;
  saveDeal(row: DealRecord): Promise<void>;
  addNote(row: NoteRecord): Promise<void>;
  listNotes(dealId: string): Promise<NoteRecord[]>;
  addActivity(row: ActivityRecord): Promise<void>;
  listActivity(dealId: string): Promise<ActivityRecord[]>;
  savePauseRequest(row: PauseRequestRecord): Promise<void>;
  listPauseRequests(memberId?: string): Promise<PauseRequestRecord[]>;
  recordUsage(input: {
    memberId: string;
    kind: "system" | "maintenance";
    quantity: number;
    idempotencyKey: string;
    allowance: number;
  }): Promise<UsageResult>;
  saveDraft(row: DraftRecord): Promise<void>;
  listDrafts(dealId: string): Promise<DraftRecord[]>;
}
