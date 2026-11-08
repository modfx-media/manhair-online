import { readFileSync } from "node:fs";
import path from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { AlertRecord } from "./alerts";
import type { Attention, InvoiceKind, MemberStatus } from "./billing";
import type { TierId } from "./offer";
import type { AppEnv } from "./readiness";
import type {
  DealRecord,
  DealStage,
  EventClaim,
  InvoiceRecord,
  MemberRecord,
  MembershipStore,
  PauseRequestRecord,
  SessionRecord,
  UsageResult,
} from "./types";

type Sql = NeonQueryFunction<false, false>;
type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function requiredText(value: unknown): string {
  return text(value) ?? "";
}

function bool(value: unknown): boolean {
  return value === true || value === "t" || value === "true";
}

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function mapMember(row: Row): MemberRecord {
  return {
    id: requiredText(row.id),
    email: requiredText(row.email),
    phone: text(row.phone),
    firstName: requiredText(row.first_name),
    lastName: requiredText(row.last_name),
    tier: requiredText(row.tier) as TierId,
    status: requiredText(row.status) as MemberStatus,
    stripeCustomerId: text(row.stripe_customer_id),
    stripeSubscriptionId: text(row.stripe_subscription_id),
    stripeSubscriptionItemId: text(row.stripe_subscription_item_id),
    monthlyCents: num(row.monthly_cents),
    setupCents: num(row.setup_cents),
    setupPaid: bool(row.setup_paid),
    recurringStartAt: text(row.recurring_start_at),
    minimumTermEndsAt: requiredText(row.minimum_term_ends_at),
    rateLockEndsAt: requiredText(row.rate_lock_ends_at),
    entitlementYearEndsAt: requiredText(row.entitlement_year_ends_at),
    systemsUsed: num(row.systems_used),
    maintenanceUsed: num(row.maintenance_used),
    pauseDaysUsed: num(row.pause_days_used),
    cancelAt: text(row.cancel_at),
    pauseCollection: bool(row.pause_collection),
    attention: (text(row.attention) as Attention) ?? null,
    paymentGraceStartedAt: text(row.payment_grace_started_at),
    termsVersion: requiredText(row.terms_version),
    lastStatusEventCreated: num(row.last_status_event_created),
    version: num(row.version),
    createdAt: requiredText(row.created_at),
  };
}

export const FOUNDING_RESERVE_SQL = `
WITH active AS (
  SELECT COUNT(*)::int AS n
  FROM membership_founding_reservations
  WHERE status = 'converted'
     OR (status = 'held' AND expires_at > now())
),
ins AS (
  INSERT INTO membership_founding_reservations (id, member_id, status, expires_at)
  SELECT $1, $2, 'held', $3::timestamptz
  WHERE (SELECT n FROM active) < $4::int
  RETURNING id
)
SELECT id FROM ins
`;

export const USAGE_SQL = `
WITH existing AS (
  SELECT idempotency_key FROM membership_ledger WHERE idempotency_key = $1
),
ins AS (
  INSERT INTO membership_ledger (id, member_id, kind, quantity, idempotency_key)
  SELECT $2, $3, $4, $5::int, $1
  WHERE NOT EXISTS (SELECT 1 FROM existing)
    AND EXISTS (
      SELECT 1 FROM membership_members
      WHERE id = $3
        AND pause_collection = false
        AND (
          ($4 = 'system' AND systems_used + $5::int <= $6::int)
          OR ($4 = 'maintenance' AND maintenance_used + $5::int <= $6::int)
        )
    )
  RETURNING idempotency_key
),
upd AS (
  UPDATE membership_members
  SET systems_used = CASE WHEN $4 = 'system' THEN systems_used + $5::int ELSE systems_used END,
      maintenance_used = CASE WHEN $4 = 'maintenance' THEN maintenance_used + $5::int ELSE maintenance_used END
  WHERE id = $3
    AND EXISTS (SELECT 1 FROM ins)
  RETURNING id
)
SELECT
  (SELECT COUNT(*)::int FROM existing) AS already,
  (SELECT COUNT(*)::int FROM ins) AS inserted
`;

export function createSqlStore(connectionString: string): MembershipStore {
  const sql = neon(connectionString) as Sql;

  return {
    kind: "sql",
    async listMembersByEmail(email) {
      const rows = await sql`SELECT * FROM membership_members WHERE lower(email) = lower(${email}) ORDER BY created_at DESC`;
      return rows.map((row) => mapMember(row as Row));
    },
    async findMemberByEmail(email) {
      const rows = await sql`SELECT * FROM membership_members WHERE lower(email) = lower(${email}) ORDER BY created_at DESC LIMIT 1`;
      return rows[0] ? mapMember(rows[0] as Row) : null;
    },
    async findMemberById(id) {
      const rows = await sql`SELECT * FROM membership_members WHERE id = ${id} LIMIT 1`;
      return rows[0] ? mapMember(rows[0] as Row) : null;
    },
    async findMemberByCustomer(customerId) {
      const rows = await sql`SELECT * FROM membership_members WHERE stripe_customer_id = ${customerId} LIMIT 1`;
      return rows[0] ? mapMember(rows[0] as Row) : null;
    },
    async findMemberBySubscription(subscriptionId) {
      const rows = await sql`SELECT * FROM membership_members WHERE stripe_subscription_id = ${subscriptionId} LIMIT 1`;
      return rows[0] ? mapMember(rows[0] as Row) : null;
    },
    async listMembers() {
      const rows = await sql`SELECT * FROM membership_members ORDER BY created_at DESC`;
      return rows.map((row) => mapMember(row as Row));
    },
    async saveMember(member) {
      await sql`
        INSERT INTO membership_members (
          id, email, phone, first_name, last_name, tier, status, stripe_customer_id,
          stripe_subscription_id, stripe_subscription_item_id, monthly_cents, setup_cents,
          setup_paid, recurring_start_at, minimum_term_ends_at, rate_lock_ends_at,
          entitlement_year_ends_at, systems_used, maintenance_used, pause_days_used,
          cancel_at, pause_collection, attention, payment_grace_started_at, terms_version, last_status_event_created, version, created_at
        ) VALUES (
          ${member.id}, ${member.email}, ${member.phone}, ${member.firstName}, ${member.lastName},
          ${member.tier}, ${member.status}, ${member.stripeCustomerId}, ${member.stripeSubscriptionId},
          ${member.stripeSubscriptionItemId}, ${member.monthlyCents}, ${member.setupCents},
          ${member.setupPaid}, ${member.recurringStartAt}, ${member.minimumTermEndsAt},
          ${member.rateLockEndsAt}, ${member.entitlementYearEndsAt}, ${member.systemsUsed},
          ${member.maintenanceUsed}, ${member.pauseDaysUsed}, ${member.cancelAt},
          ${member.pauseCollection}, ${member.attention}, ${member.paymentGraceStartedAt ?? null}, ${member.termsVersion}, ${member.lastStatusEventCreated},
          ${member.version}, ${member.createdAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          tier = EXCLUDED.tier,
          status = EXCLUDED.status,
          stripe_customer_id = EXCLUDED.stripe_customer_id,
          stripe_subscription_id = EXCLUDED.stripe_subscription_id,
          stripe_subscription_item_id = EXCLUDED.stripe_subscription_item_id,
          monthly_cents = EXCLUDED.monthly_cents,
          setup_cents = EXCLUDED.setup_cents,
          setup_paid = EXCLUDED.setup_paid,
          recurring_start_at = EXCLUDED.recurring_start_at,
          minimum_term_ends_at = EXCLUDED.minimum_term_ends_at,
          rate_lock_ends_at = EXCLUDED.rate_lock_ends_at,
          entitlement_year_ends_at = EXCLUDED.entitlement_year_ends_at,
          systems_used = EXCLUDED.systems_used,
          maintenance_used = EXCLUDED.maintenance_used,
          pause_days_used = EXCLUDED.pause_days_used,
          cancel_at = EXCLUDED.cancel_at,
          pause_collection = EXCLUDED.pause_collection,
          attention = EXCLUDED.attention,
          payment_grace_started_at = EXCLUDED.payment_grace_started_at,
          terms_version = EXCLUDED.terms_version,
          last_status_event_created = EXCLUDED.last_status_event_created,
          version = EXCLUDED.version
      `;
    },
    async compareAndSave(member, expectedVersion) {
      const rows = await sql`
        UPDATE membership_members SET
          status = ${member.status},
          stripe_customer_id = ${member.stripeCustomerId},
          stripe_subscription_id = ${member.stripeSubscriptionId},
          stripe_subscription_item_id = ${member.stripeSubscriptionItemId},
          tier = ${member.tier},
          monthly_cents = ${member.monthlyCents},
          setup_paid = ${member.setupPaid},
          recurring_start_at = ${member.recurringStartAt},
          minimum_term_ends_at = ${member.minimumTermEndsAt},
          rate_lock_ends_at = ${member.rateLockEndsAt},
          entitlement_year_ends_at = ${member.entitlementYearEndsAt},
          pause_days_used = ${member.pauseDaysUsed},
          cancel_at = ${member.cancelAt},
          pause_collection = ${member.pauseCollection},
          attention = ${member.attention},
          last_status_event_created = ${member.lastStatusEventCreated},
          version = ${expectedVersion + 1}
        WHERE id = ${member.id} AND version = ${expectedVersion}
        RETURNING id
      `;
      return rows.length === 1 ? "ok" : "conflict";
    },
    async addConsent(consent) {
      await sql`
        INSERT INTO membership_consents (id, member_id, terms_version, terms_accepted_at, autorenew_accepted_at)
        VALUES (${consent.id}, ${consent.memberId}, ${consent.termsVersion}, ${consent.termsAcceptedAt}, ${consent.autorenewAcceptedAt})
        ON CONFLICT (id) DO NOTHING
      `;
    },
    async reserveFounding(input) {
      const rows = await sql.query(FOUNDING_RESERVE_SQL, [input.id, input.memberId, input.expiresAt, input.cap]);
      return rows.length === 1 ? "reserved" : "cap";
    },
    async setFoundingStatus(id, status) {
      await sql`UPDATE membership_founding_reservations SET status = ${status} WHERE id = ${id}`;
    },
    async getCheckout(key) {
      const rows = await sql`SELECT * FROM membership_checkouts WHERE idempotency_key = ${key} LIMIT 1`;
      const row = rows[0] as Row | undefined;
      if (!row) return null;
      return {
        idempotencyKey: requiredText(row.idempotency_key),
        memberId: requiredText(row.member_id),
        sessionId: text(row.session_id),
        url: text(row.url),
        reservationId: text(row.reservation_id),
        createdAt: requiredText(row.created_at),
      };
    },
    async saveCheckout(row) {
      await sql`
        INSERT INTO membership_checkouts (idempotency_key, member_id, session_id, url, reservation_id, created_at)
        VALUES (${row.idempotencyKey}, ${row.memberId}, ${row.sessionId}, ${row.url}, ${row.reservationId}, ${row.createdAt})
        ON CONFLICT (idempotency_key) DO UPDATE SET
          session_id = EXCLUDED.session_id,
          url = EXCLUDED.url,
          reservation_id = EXCLUDED.reservation_id
      `;
    },
    async claimEvent(id, type): Promise<EventClaim> {
      const inserted = await sql`
        INSERT INTO membership_webhook_events (id, type, status)
        VALUES (${id}, ${type}, 'processing')
        ON CONFLICT (id) DO NOTHING
        RETURNING id
      `;
      if (inserted.length === 1) return "claimed";
      const rows = await sql`SELECT status FROM membership_webhook_events WHERE id = ${id}`;
      const status = text((rows[0] as Row | undefined)?.status);
      if (status === "failed") {
        await sql`UPDATE membership_webhook_events SET status = 'processing' WHERE id = ${id} AND status = 'failed'`;
        return "retry";
      }
      return "duplicate";
    },
    async finishEvent(id, status) {
      await sql`UPDATE membership_webhook_events SET status = ${status} WHERE id = ${id}`;
    },
    async seenEvent(id) {
      const rows = await sql`SELECT status FROM membership_webhook_events WHERE id = ${id} AND status = 'processed'`;
      return rows.length === 1;
    },
    async upsertInvoice(row) {
      await sql`
        INSERT INTO membership_invoices (
          id, member_id, kind, status, amount_paid, amount_refunded, charge_id, failed_at, status_event_created
        ) VALUES (
          ${row.id}, ${row.memberId}, ${row.kind}, ${row.status}, ${row.amountPaid}, ${row.amountRefunded},
          ${row.chargeId ?? null}, ${row.failedAt ?? null}, ${row.statusEventCreated ?? null}
        )
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          amount_paid = EXCLUDED.amount_paid,
          kind = EXCLUDED.kind,
          charge_id = COALESCE(EXCLUDED.charge_id, membership_invoices.charge_id),
          failed_at = COALESCE(membership_invoices.failed_at, EXCLUDED.failed_at),
          status_event_created = EXCLUDED.status_event_created
      `;
    },
    async addRefund(_invoiceId, cents) {
      await sql`
        UPDATE membership_invoices
        SET amount_refunded = amount_refunded + ${cents}
        WHERE id = (
          SELECT id FROM membership_invoices ORDER BY id LIMIT 1
        )
      `;
    },
    async saveSuitabilityCase(row) {
      await sql`
        INSERT INTO membership_suitability_cases (
          id, member_id, staff_email, staff_role, note, policy_version, minimum_term_waived, cancel_status, created_at
        ) VALUES (
          ${row.id}, ${row.memberId}, ${row.staffEmail}, ${row.staffRole}, ${row.note},
          ${row.policyVersion}, ${row.minimumTermWaived}, ${row.cancelStatus}, ${row.createdAt}
        )
        ON CONFLICT (member_id) DO NOTHING
      `;
    },
    async findSuitabilityCase(memberId) {
      const rows = await sql`SELECT * FROM membership_suitability_cases WHERE member_id = ${memberId} LIMIT 1`;
      const record = rows[0] as Row | undefined;
      if (!record) return null;
      return {
        id: requiredText(record.id),
        memberId: requiredText(record.member_id),
        staffEmail: requiredText(record.staff_email),
        staffRole: requiredText(record.staff_role) as "owner" | "coordinator",
        note: requiredText(record.note),
        policyVersion: requiredText(record.policy_version),
        minimumTermWaived: true as const,
        cancelStatus: requiredText(record.cancel_status) as "not_sent" | "processor_pending" | "processor_canceled" | "processor_failed",
        createdAt: requiredText(record.created_at),
      };
    },
    async updateSuitabilityCancel(id, cancelStatus) {
      await sql`UPDATE membership_suitability_cases SET cancel_status = ${cancelStatus} WHERE id = ${id}`;
    },
    async saveRefundRequest(row) {
      await sql`
        INSERT INTO membership_refund_requests (
          id, case_id, member_id, invoice_id, kind, amount_cents, charge_id, status, stripe_refund_id, created_at
        ) VALUES (
          ${row.id}, ${row.caseId}, ${row.memberId}, ${row.invoiceId}, ${row.kind}, ${row.amountCents},
          ${row.chargeId}, ${row.status}, ${row.stripeRefundId}, ${row.createdAt}
        )
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, stripe_refund_id = EXCLUDED.stripe_refund_id
      `;
    },
    async listRefundRequests(memberId) {
      const rows = await sql`SELECT * FROM membership_refund_requests WHERE member_id = ${memberId} ORDER BY created_at`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          caseId: requiredText(record.case_id),
          memberId: requiredText(record.member_id),
          invoiceId: requiredText(record.invoice_id),
          kind: requiredText(record.kind),
          amountCents: num(record.amount_cents),
          chargeId: text(record.charge_id),
          status: requiredText(record.status) as "requested" | "processor_pending" | "processor_succeeded" | "processor_failed",
          stripeRefundId: text(record.stripe_refund_id),
          createdAt: requiredText(record.created_at),
        };
      });
    },
    async updateRefundRequest(id, patch) {
      await sql`
        UPDATE membership_refund_requests
        SET status = ${patch.status}, stripe_refund_id = ${patch.stripeRefundId}
        WHERE id = ${id}
      `;
    },
    async saveAppointment(row) {
      await sql`
        INSERT INTO membership_appointments (
          id, member_id, staff_email, starts_at, time_zone, state, note, created_at, updated_at
        ) VALUES (
          ${row.id}, ${row.memberId}, ${row.staffEmail}, ${row.startsAt}, ${row.timeZone},
          ${row.state}, ${row.note}, ${row.createdAt}, ${row.updatedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          starts_at = EXCLUDED.starts_at,
          time_zone = EXCLUDED.time_zone,
          state = EXCLUDED.state,
          note = EXCLUDED.note,
          updated_at = EXCLUDED.updated_at
      `;
    },
    async listAppointments(memberId) {
      const rows = await sql`SELECT * FROM membership_appointments WHERE member_id = ${memberId} ORDER BY starts_at`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          memberId: requiredText(record.member_id),
          staffEmail: requiredText(record.staff_email),
          startsAt: requiredText(record.starts_at),
          timeZone: requiredText(record.time_zone),
          state: requiredText(record.state) as "scheduled" | "updated" | "canceled",
          note: text(record.note) ?? "",
          createdAt: requiredText(record.created_at),
          updatedAt: requiredText(record.updated_at),
        };
      });
    },
    async listInvoices(memberId) {
      const rows = memberId
        ? await sql`SELECT * FROM membership_invoices WHERE member_id = ${memberId}`
        : await sql`SELECT * FROM membership_invoices`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          memberId: text(record.member_id),
          kind: requiredText(record.kind) as InvoiceKind,
          status: requiredText(record.status) as InvoiceRecord["status"],
          amountPaid: num(record.amount_paid),
          amountRefunded: num(record.amount_refunded),
          chargeId: text(record.charge_id),
          failedAt: text(record.failed_at),
          statusEventCreated: record.status_event_created == null ? null : num(record.status_event_created),
        };
      });
    },
    async consumeRate(bucket, now, limit, windowMs) {
      const rows = await sql`
        INSERT INTO membership_rate_limits (bucket, hits, window_started_at)
        VALUES (${bucket}, 1, ${now.toISOString()})
        ON CONFLICT (bucket) DO UPDATE SET
          hits = CASE
            WHEN membership_rate_limits.window_started_at < ${new Date(now.getTime() - windowMs).toISOString()}::timestamptz THEN 1
            ELSE membership_rate_limits.hits + 1
          END,
          window_started_at = CASE
            WHEN membership_rate_limits.window_started_at < ${new Date(now.getTime() - windowMs).toISOString()}::timestamptz THEN ${now.toISOString()}::timestamptz
            ELSE membership_rate_limits.window_started_at
          END
        RETURNING hits
      `;
      return num((rows[0] as Row | undefined)?.hits) <= limit;
    },
    async createSession(row) {
      await sql`
        INSERT INTO membership_sessions (id, member_id, token_hash, expires_at, active, return_used)
        VALUES (${row.id}, ${row.memberId}, ${row.tokenHash}, ${row.expiresAt}, ${row.active}, ${row.returnUsed})
        ON CONFLICT (id) DO NOTHING
      `;
    },
    async findSession(id) {
      const rows = await sql`SELECT * FROM membership_sessions WHERE id = ${id} LIMIT 1`;
      return rows[0] ? mapSession(rows[0] as Row) : null;
    },
    async findSessionByHash(tokenHash) {
      if (!tokenHash) return null;
      const rows = await sql`SELECT * FROM membership_sessions WHERE token_hash = ${tokenHash} AND active = true LIMIT 1`;
      return rows[0] ? mapSession(rows[0] as Row) : null;
    },
    async activateSession(id, tokenHash, expiresAt) {
      await sql`
        UPDATE membership_sessions
        SET token_hash = ${tokenHash}, expires_at = ${expiresAt}, active = true, return_used = true
        WHERE id = ${id} AND return_used = false
      `;
    },
    async deleteSessionByHash(tokenHash) {
      await sql`DELETE FROM membership_sessions WHERE token_hash = ${tokenHash}`;
    },
    async saveRecovery(row) {
      await sql`
        INSERT INTO membership_recovery_tokens (token_hash, member_id, expires_at, used)
        VALUES (${row.tokenHash}, ${row.memberId}, ${row.expiresAt}, ${row.used})
        ON CONFLICT (token_hash) DO NOTHING
      `;
    },
    async consumeRecovery(tokenHash, now) {
      const rows = await sql`
        UPDATE membership_recovery_tokens
        SET used = true
        WHERE token_hash = ${tokenHash} AND used = false AND expires_at > ${now.toISOString()}::timestamptz
        RETURNING member_id
      `;
      return text((rows[0] as Row | undefined)?.member_id);
    },
    async getSyncState() {
      const rows = await sql`SELECT * FROM membership_sync_state ORDER BY pulled_at DESC NULLS LAST LIMIT 1`;
      const row = rows[0] as Row | undefined;
      if (!row) return null;
      return {
        locationId: requiredText(row.location_id),
        contactCursor: text(row.contact_cursor),
        opportunityPage: num(row.opportunity_page),
        pulledAt: text(row.pulled_at),
        status: requiredText(row.status),
        error: text(row.error),
      };
    },
    async saveSyncState(row) {
      await sql`
        INSERT INTO membership_sync_state (location_id, contact_cursor, opportunity_page, pulled_at, status, error)
        VALUES (${row.locationId}, ${row.contactCursor}, ${row.opportunityPage}, ${row.pulledAt}, ${row.status}, ${row.error})
        ON CONFLICT (location_id) DO UPDATE SET
          contact_cursor = EXCLUDED.contact_cursor,
          opportunity_page = EXCLUDED.opportunity_page,
          pulled_at = EXCLUDED.pulled_at,
          status = EXCLUDED.status,
          error = EXCLUDED.error
      `;
    },
    async addAuthAudit(row) {
      await sql`
        INSERT INTO membership_auth_audit (id, member_id, action, created_at)
        VALUES (${row.id}, ${row.memberId}, ${row.action}, ${row.createdAt})
      `;
    },
    async listAuthAudits(memberId) {
      const rows = memberId
        ? await sql`SELECT id, member_id, action, created_at FROM membership_auth_audit WHERE member_id = ${memberId} ORDER BY created_at DESC`
        : await sql`SELECT id, member_id, action, created_at FROM membership_auth_audit ORDER BY created_at DESC LIMIT 100`;
      return rows.map((row) => ({
        id: requiredText(row.id),
        memberId: text(row.member_id),
        action: requiredText(row.action),
        createdAt: requiredText(row.created_at),
      }));
    },
    async enqueueAlert(row) {
      const inserted = await sql`
        INSERT INTO membership_alert_outbox (
          id, dedupe_key, source_event_id, kind, audience, member_id, amount_cents, status, attempts, next_attempt_at, last_error, created_at
        ) VALUES (
          ${row.id}, ${row.dedupeKey}, ${row.sourceEventId}, ${row.kind}, ${row.audience}, ${row.memberId},
          ${row.amountCents}, ${row.status}, ${row.attempts}, ${row.nextAttemptAt}, ${row.lastError}, ${row.createdAt}
        )
        ON CONFLICT (dedupe_key) DO NOTHING
        RETURNING id
      `;
      return inserted.length === 1 ? "created" : "duplicate";
    },
    async listAlerts() {
      const rows = await sql`SELECT * FROM membership_alert_outbox ORDER BY created_at DESC`;
      return rows.map((row) => mapAlert(row as Row));
    },
    async claimDueAlerts(now, limit) {
      const rows = await sql`
        UPDATE membership_alert_outbox
        SET status = 'sending', attempts = attempts + 1
        WHERE id IN (
          SELECT id FROM membership_alert_outbox
          WHERE status = 'pending' AND next_attempt_at <= ${now.toISOString()}::timestamptz
          ORDER BY created_at
          LIMIT ${limit}
        )
        RETURNING *
      `;
      return rows.map((row) => mapAlert(row as Row));
    },
    async updateAlert(id, patch) {
      await sql`
        UPDATE membership_alert_outbox
        SET status = COALESCE(${patch.status ?? null}, status),
            attempts = COALESCE(${patch.attempts ?? null}, attempts),
            next_attempt_at = COALESCE(${patch.nextAttemptAt ?? null}, next_attempt_at),
            last_error = COALESCE(${patch.lastError ?? null}, last_error)
        WHERE id = ${id}
      `;
    },
    async listDeals() {
      const rows = await sql`SELECT * FROM membership_deals ORDER BY name`;
      return rows.map((row) => mapDeal(row as Row));
    },
    async deleteDeal(id) {
      await sql.transaction([
        sql`DELETE FROM membership_notes WHERE deal_id = ${id}`,
        sql`DELETE FROM membership_activity WHERE deal_id = ${id}`,
        sql`DELETE FROM membership_drafts WHERE deal_id = ${id}`,
        sql`DELETE FROM membership_deals WHERE id = ${id}`,
      ]);
    },
    async saveDeal(row) {
      await sql`
        INSERT INTO membership_deals (
          id, member_id, name, email, phone, stage, assignee, next_follow_up,
          ghl_contact_id, ghl_opportunity_id, sync_status, sync_hash, location_id,
          remote_updated_at, staff_edited_at
        ) VALUES (
          ${row.id}, ${row.memberId}, ${row.name}, ${row.email}, ${row.phone}, ${row.stage},
          ${row.assignee}, ${row.nextFollowUp}, ${row.ghlContactId}, ${row.ghlOpportunityId},
          ${row.syncStatus}, ${row.syncHash}, ${row.locationId}, ${row.remoteUpdatedAt}, ${row.staffEditedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          stage = EXCLUDED.stage,
          assignee = EXCLUDED.assignee,
          next_follow_up = EXCLUDED.next_follow_up,
          ghl_contact_id = EXCLUDED.ghl_contact_id,
          ghl_opportunity_id = EXCLUDED.ghl_opportunity_id,
          sync_status = EXCLUDED.sync_status,
          sync_hash = EXCLUDED.sync_hash,
          location_id = EXCLUDED.location_id,
          remote_updated_at = EXCLUDED.remote_updated_at,
          staff_edited_at = EXCLUDED.staff_edited_at,
          name = EXCLUDED.name,
          phone = EXCLUDED.phone
      `;
    },
    async addNote(row) {
      await sql`
        INSERT INTO membership_notes (id, deal_id, author, body, created_at)
        VALUES (${row.id}, ${row.dealId}, ${row.author}, ${row.body}, ${row.createdAt})
      `;
    },
    async listNotes(dealId) {
      const rows = await sql`SELECT * FROM membership_notes WHERE deal_id = ${dealId} ORDER BY created_at`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          dealId: requiredText(record.deal_id),
          author: requiredText(record.author),
          body: requiredText(record.body),
          createdAt: requiredText(record.created_at),
        };
      });
    },
    async addActivity(row) {
      await sql`
        INSERT INTO membership_activity (id, deal_id, actor, action, created_at)
        VALUES (${row.id}, ${row.dealId}, ${row.actor}, ${row.action}, ${row.createdAt})
      `;
    },
    async listActivity(dealId) {
      const rows = await sql`SELECT * FROM membership_activity WHERE deal_id = ${dealId} ORDER BY created_at`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          dealId: requiredText(record.deal_id),
          actor: requiredText(record.actor),
          action: requiredText(record.action),
          createdAt: requiredText(record.created_at),
        };
      });
    },
    async savePauseRequest(row) {
      await sql`
        INSERT INTO membership_pause_requests (id, member_id, days, status, policy_version, created_at)
        VALUES (${row.id}, ${row.memberId}, ${row.days}, ${row.status}, ${row.policyVersion}, ${row.createdAt})
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status
      `;
    },
    async listPauseRequests(memberId) {
      const rows = memberId
        ? await sql`SELECT * FROM membership_pause_requests WHERE member_id = ${memberId} ORDER BY created_at`
        : await sql`SELECT * FROM membership_pause_requests ORDER BY created_at`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          memberId: requiredText(record.member_id),
          days: num(record.days),
          status: requiredText(record.status) as PauseRequestRecord["status"],
          policyVersion: requiredText(record.policy_version),
          createdAt: requiredText(record.created_at),
        };
      });
    },
    async recordUsage(input): Promise<UsageResult> {
      const rows = await sql.query(USAGE_SQL, [
        input.idempotencyKey,
        input.idempotencyKey,
        input.memberId,
        input.kind,
        input.quantity,
        input.allowance,
      ]);
      const row = rows[0] as Row | undefined;
      if (num(row?.already) > 0) return "replay";
      if (num(row?.inserted) === 1) return "applied";
      return "rejected";
    },
    async saveDraft(row) {
      await sql`
        INSERT INTO membership_drafts (id, deal_id, body, updated_at)
        VALUES (${row.id}, ${row.dealId}, ${row.body}, ${row.updatedAt})
        ON CONFLICT (id) DO UPDATE SET body = EXCLUDED.body, updated_at = EXCLUDED.updated_at
      `;
    },
    async listDrafts(dealId) {
      const rows = await sql`SELECT * FROM membership_drafts WHERE deal_id = ${dealId}`;
      return rows.map((row) => {
        const record = row as Row;
        return {
          id: requiredText(record.id),
          dealId: requiredText(record.deal_id),
          body: requiredText(record.body),
          updatedAt: requiredText(record.updated_at),
        };
      });
    },
  };
}

function mapAlert(row: Row): AlertRecord {
  return {
    id: requiredText(row.id),
    dedupeKey: requiredText(row.dedupe_key),
    sourceEventId: requiredText(row.source_event_id),
    kind: requiredText(row.kind) as AlertRecord["kind"],
    audience: requiredText(row.audience) as AlertRecord["audience"],
    memberId: text(row.member_id),
    amountCents: num(row.amount_cents),
    status: requiredText(row.status) as AlertRecord["status"],
    nextAttemptAt: text(row.next_attempt_at),
    attempts: num(row.attempts),
    lastError: text(row.last_error),
    createdAt: requiredText(row.created_at),
  };
}

function mapSession(row: Row): SessionRecord {
  return {
    id: requiredText(row.id),
    memberId: requiredText(row.member_id),
    tokenHash: requiredText(row.token_hash),
    expiresAt: requiredText(row.expires_at),
    active: bool(row.active),
    returnUsed: bool(row.return_used),
  };
}

function mapDeal(row: Row): DealRecord {
  return {
    id: requiredText(row.id),
    memberId: text(row.member_id),
    name: requiredText(row.name),
    email: requiredText(row.email),
    phone: text(row.phone),
    stage: requiredText(row.stage) as DealStage,
    assignee: requiredText(row.assignee),
    nextFollowUp: text(row.next_follow_up),
    ghlContactId: text(row.ghl_contact_id),
    ghlOpportunityId: text(row.ghl_opportunity_id),
    syncStatus: requiredText(row.sync_status),
    syncHash: requiredText(row.sync_hash),
    locationId: text(row.location_id),
    remoteUpdatedAt: text(row.remote_updated_at),
    staffEditedAt: text(row.staff_edited_at),
  };
}

export function loadMembershipSchema(): string {
  return readFileSync(path.join(process.cwd(), "db/membership/001_init.sql"), "utf8");
}

export function unavailableStore(): MembershipStore {
  const fail = async () => {
    throw new Error("database_not_configured");
  };
  return {
    kind: "unavailable",
    findMemberByEmail: async () => null,
    listMembersByEmail: async () => [],
    deleteDeal: fail,
    findMemberById: async () => null,
    findMemberByCustomer: async () => null,
    findMemberBySubscription: async () => null,
    listMembers: async () => [],
    saveMember: fail,
    compareAndSave: fail,
    addConsent: fail,
    reserveFounding: fail,
    setFoundingStatus: fail,
    getCheckout: async () => null,
    saveCheckout: fail,
    claimEvent: fail,
    finishEvent: fail,
    seenEvent: async () => false,
    upsertInvoice: fail,
    addRefund: fail,
    listInvoices: async () => [],
    saveSuitabilityCase: fail,
    findSuitabilityCase: async () => null,
    updateSuitabilityCancel: fail,
    saveRefundRequest: fail,
    listRefundRequests: async () => [],
    updateRefundRequest: fail,
    saveAppointment: fail,
    listAppointments: async () => [],
    consumeRate: async () => false,
    createSession: fail,
    findSession: async () => null,
    findSessionByHash: async () => null,
    activateSession: fail,
    deleteSessionByHash: fail,
    saveRecovery: fail,
    consumeRecovery: async () => null,
    getSyncState: async () => null,
    saveSyncState: fail,
    addAuthAudit: fail,
    listAuthAudits: async () => [],
    enqueueAlert: fail,
    listAlerts: async () => [],
    claimDueAlerts: async () => [],
    updateAlert: fail,
    listDeals: async () => [],
    saveDeal: fail,
    addNote: fail,
    listNotes: async () => [],
    addActivity: fail,
    listActivity: async () => [],
    savePauseRequest: fail,
    listPauseRequests: async () => [],
    recordUsage: async () => "rejected",
    saveDraft: fail,
    listDrafts: async () => [],
  };
}

/** True when the membership tables have not been created yet. Payload tables are unrelated. */
export function isMembershipSchemaMissing(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "42P01" || code === "42703") return true;
  const message = error instanceof Error ? error.message : "";
  return /membership_/i.test(message) && /does not exist/i.test(message);
}

export function getMembershipStore(env: AppEnv = process.env): MembershipStore {
  const url = env.DATABASE_URL?.trim();
  if (!url) return unavailableStore();
  return createSqlStore(url);
}
