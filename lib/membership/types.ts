import type { AlertRecord } from "./alerts";
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
  paymentGraceStartedAt?: string | null;
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
  chargeId?: string | null;
  failedAt?: string | null;
  statusEventCreated?: number | null;
};

export type SuitabilityCaseRecord = {
  id: string;
  memberId: string;
  staffEmail: string;
  staffRole: "owner" | "coordinator";
  note: string;
  policyVersion: string;
  minimumTermWaived: true;
  cancelStatus: "not_sent" | "processor_pending" | "processor_canceled" | "processor_failed";
  createdAt: string;
};

export type AppointmentRecord = {
  id: string;
  memberId: string;
  staffEmail: string;
  startsAt: string;
  timeZone: string;
  state: "scheduled" | "updated" | "canceled";
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type RefundRequestRecord = {
  id: string;
  caseId: string;
  memberId: string;
  invoiceId: string;
  kind: string;
  amountCents: number;
  chargeId: string | null;
  status: "requested" | "processor_pending" | "processor_succeeded" | "processor_failed";
  stripeRefundId: string | null;
  createdAt: string;
};

export const SALES_STAGES = [
  "New Leads",
  "Hot Leads",
  "Proposal Sent",
  "Phone Consult",
  "Video Consultation",
  "No show/Cancelled",
  "Active Clients",
  "No Buy/Nurture",
  "DND",
] as const;

export type SalesStage = (typeof SALES_STAGES)[number];
export type DealStage = SalesStage | `unmapped:${string}`;
export const DEAL_STAGES: readonly SalesStage[] = SALES_STAGES;

export function isSalesStage(value: string): value is SalesStage {
  return (SALES_STAGES as readonly string[]).includes(value);
}

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
  remoteUpdatedAt: string | null;
  staffEditedAt: string | null;
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
export type SessionRecord = {
  id: string;
  memberId: string;
  tokenHash: string;
  expiresAt: string;
  active: boolean;
  returnUsed: boolean;
};

export type RecoveryRecord = {
  tokenHash: string;
  memberId: string;
  expiresAt: string;
  used: boolean;
};

export type SyncState = {
  locationId: string;
  contactCursor: string | null;
  opportunityPage: number;
  pulledAt: string | null;
  status: string;
  error: string | null;
};

export type AuthAuditRecord = { id: string; memberId: string | null; action: string; createdAt: string };
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
  saveSuitabilityCase(row: SuitabilityCaseRecord): Promise<void>;
  findSuitabilityCase(memberId: string): Promise<SuitabilityCaseRecord | null>;
  updateSuitabilityCancel(id: string, cancelStatus: SuitabilityCaseRecord["cancelStatus"]): Promise<void>;
  saveRefundRequest(row: RefundRequestRecord): Promise<void>;
  listRefundRequests(memberId: string): Promise<RefundRequestRecord[]>;
  updateRefundRequest(id: string, patch: Pick<RefundRequestRecord, "status" | "stripeRefundId">): Promise<void>;
  saveAppointment(row: AppointmentRecord): Promise<void>;
  listAppointments(memberId: string): Promise<AppointmentRecord[]>;
  consumeRate(bucket: string, now: Date, limit: number, windowMs: number): Promise<boolean>;
  createSession(row: SessionRecord): Promise<void>;
  findSession(id: string): Promise<SessionRecord | null>;
  findSessionByHash(tokenHash: string): Promise<SessionRecord | null>;
  activateSession(id: string, tokenHash: string, expiresAt: string): Promise<void>;
  deleteSessionByHash(tokenHash: string): Promise<void>;
  saveRecovery(row: RecoveryRecord): Promise<void>;
  consumeRecovery(tokenHash: string, now: Date): Promise<string | null>;
  getSyncState(): Promise<SyncState | null>;
  saveSyncState(row: SyncState): Promise<void>;
  addAuthAudit(row: AuthAuditRecord): Promise<void>;
  enqueueAlert(row: AlertRecord): Promise<"created" | "duplicate">;
  listAlerts(): Promise<AlertRecord[]>;
  claimDueAlerts(now: Date, limit: number): Promise<AlertRecord[]>;
  updateAlert(id: string, patch: Partial<Pick<AlertRecord, "status" | "attempts" | "nextAttemptAt" | "lastError">>): Promise<void>;
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
