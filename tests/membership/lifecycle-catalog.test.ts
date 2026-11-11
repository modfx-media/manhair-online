import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { phase1Templates, renderLifecycleTemplate, templateMaySend } from "../../lib/membership/lifecycle-render";
import { dueLifecycleSends } from "../../lib/membership/lifecycle-schedule";
import { billingPortalUrl, memberMergeVars } from "../../lib/membership/lifecycle-vars";
import { smsWindowOpen } from "../../lib/membership/sms-window";
import type { MemberRecord } from "../../lib/membership/types";

const FIXTURE: Record<string, string> = {
  first_name: "Alex",
  plan_name: "Signature",
  monthly_amount: "$559",
  setup_amount: "$495",
  first_charge_date: "Dec 8, 2026",
  next_charge_date: "Jan 8, 2027",
  minimum_term_end_date: "Feb 8, 2027",
  statement_descriptor: "MANHAIR",
  account_url: "https://www.manhaironline.com/account/",
  sign_in_url: "https://www.manhaironline.com/api/membership/recover/?token=one",
  staff_sign_in_url: "https://www.manhaironline.com/api/membership/hub/enter/?token=one",
  hub_url: "https://www.manhaironline.com/hub/",
  support_email: "info@manhaironline.com",
  support_phone: "+1 (714) 604-6001",
  business_address: "20 Heron, Lake Forest, CA 92630",
  member_full_name: "Alex Rivera",
  member_email: "alex@example.com",
  member_phone: "+1 (904) 555-0100",
  payment_amount: "$559",
  event_time: "Nov 9, 2026, 10:00 AM PST",
  pause_days_requested: "30",
  pause_days_used: "30",
  refund_amount: "$495",
  staff_email: "justin@modfxmedia.com",
  plan_systems_per_year: "2",
  plan_maintenance_per_year: "4",
  extra_system_price: "$849",
  extra_visit_price: "$225",
  event_id: "evt_123",
  memberships_url: "https://www.manhaironline.com/memberships/",
  booking_url: "https://www.manhaironline.com/book/",
  join_url: "https://www.manhaironline.com/join/",
  billing_portal_url: "https://www.manhaironline.com/account/billing/",
  appointment_date_time: "Tue, Nov 17 at 2:30 PM PST",
  hold_date: "Nov 23, 2026",
  grace_started_date: "Nov 9, 2026",
  failed_amount: "$559",
  failed_payment_date: "Nov 9, 2026",
  payment_date: "Nov 9, 2026",
  invoice_url: "https://invoice.stripe.com/i/test",
  card_last4: "4242",
  refund_total: "$495",
  refund_date: "Nov 9, 2026",
  pause_start_date: "Nov 9, 2026",
  pause_resume_date: "Dec 9, 2026",
  pause_decline_reason: "The requested dates overlap a fitting.",
  cancel_effective_date: "Feb 8, 2027",
  lead_message: "Looking for a consultation.",
  lead_preferred_contact: "Text",
  stripe_dashboard_url: "https://dashboard.stripe.com/payments/ch_123",
  dispute_amount: "$559",
  dispute_reason: "product unacceptable",
  dispute_evidence_due_date: "Nov 20, 2026",
  ghl_error: "push_failed",
  minimum_term_passed: "true",
  in_minimum: "true",
};

test("every phase-1 template renders with no unresolved variables", () => {
  const templates = phase1Templates();
  assert.equal(templates.length, 68);
  const dir = path.join(process.env.MEMBERSHIP_ARTIFACT_DIR || path.join(tmpdir(), "manhair-membership-artifacts"), "lifecycle");
  mkdirSync(dir, { recursive: true });
  for (const template of templates) {
    const rendered = renderLifecycleTemplate(template.id, FIXTURE, {});
    assert.equal(rendered.ok, true, template.id);
    if (!rendered.ok) continue;
    const blob = `${rendered.message.subject}\n${rendered.message.text}\n${rendered.message.html}\n${rendered.message.sms ?? ""}`;
    assert.doesNotMatch(blob, /\{\{[a-z0-9_]+\}\}/, template.id);
    assert.doesNotMatch(blob, /\[\[IF/, template.id);
    if (template.channel === "email") {
      assert.match(rendered.message.html, /ManHair/);
      assert.match(rendered.message.text, /20 Heron, Lake Forest, CA 92630/);
      assert.doesNotMatch(rendered.message.html, /<script/i);
      writeFileSync(`${dir}/${template.id}.html`, rendered.message.html);
      writeFileSync(`${dir}/${template.id}.txt`, rendered.message.text);
    }
  }
});

test("optional lines disappear instead of rendering blank", () => {
  const rendered = renderLifecycleTemplate("monthly_receipt_email", { ...FIXTURE, card_last4: "", invoice_url: "" }, {});
  assert.equal(rendered.ok, true);
  if (!rendered.ok) return;
  assert.doesNotMatch(rendered.message.text, /card ending/);
  assert.doesNotMatch(rendered.message.text, /View invoice/);
  assert.doesNotMatch(rendered.message.text, /\{\{/);
});

test("phase 2 stays off and phase 1 waits for the owner switch", () => {
  assert.equal(templateMaySend("winback_day30_email", { MEMBERSHIP_LIFECYCLE_SEND: "true", MEMBERSHIP_LIFECYCLE_PHASE1: "true" }, "lifecycle"), false);
  assert.equal(templateMaySend("payment_failed_day3_email", { MEMBERSHIP_LIFECYCLE_SEND: "true" }, "lifecycle"), false);
  assert.equal(templateMaySend("payment_failed_day3_email", { MEMBERSHIP_LIFECYCLE_SEND: "true", MEMBERSHIP_LIFECYCLE_PHASE1: "true" }, "lifecycle"), true);
  assert.equal(templateMaySend("membership_welcome_email", {}, "welcome"), true);
});

test("billing portal url is the stable account route", () => {
  assert.equal(billingPortalUrl({ NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com" }), "https://www.manhaironline.com/account/billing/");
  const vars = memberMergeVars({ env: { NEXT_PUBLIC_SITE_URL: "https://www.manhaironline.com" }, now: new Date("2026-11-09T18:00:00.000Z") });
  assert.equal(vars.billing_portal_url, "https://www.manhaironline.com/account/billing/");
  assert.doesNotMatch(vars.billing_portal_url, /billing\.stripe\.com/);
});

test("scheduled sends use the grace cycle, the visit, and a morning window", () => {
  const member = {
    id: "mem_1",
    setupPaid: true,
    status: "past_due",
    chargeAtSource: "stripe",
    recurringStartAt: "2026-12-11T20:00:00.000Z",
    paymentGraceStartedAt: "2026-11-06T18:00:00.000Z",
    pauseResumeAt: null,
    createdAt: "2026-10-10T18:00:00.000Z",
    cancelAt: null,
  } as MemberRecord;
  const morning = new Date("2026-11-09T18:00:00.000Z");
  const due = dueLifecycleSends({
    now: morning,
    members: [member],
    appointments: [{
      id: "apt_1",
      memberId: "mem_1",
      staffEmail: "studio@manhaironline.com",
      startsAt: "2026-11-10T18:00:00.000Z",
      timeZone: "America/Los_Angeles",
      state: "scheduled",
      note: "",
      createdAt: morning.toISOString(),
      updatedAt: morning.toISOString(),
    }],
  });
  const ids = due.map((item) => item.templateId);
  assert.ok(ids.includes("payment_failed_day3_email"));
  assert.ok(ids.includes("appointment_reminder_email"));
  const again = dueLifecycleSends({ now: morning, members: [member], appointments: [] });
  assert.equal(again.filter((item) => item.templateId === "payment_failed_day3_email").length, 1);
  assert.equal(smsWindowOpen(morning), true);
  assert.equal(smsWindowOpen(new Date("2026-11-10T06:00:00.000Z")), false);
});
