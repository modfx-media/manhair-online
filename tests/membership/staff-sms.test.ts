import assert from "node:assert/strict";
import { test } from "node:test";
import { sendLocationSms } from "../../lib/membership/ghl";
import { lifecycleTemplate, templateMaySend } from "../../lib/membership/lifecycle-render";
import { createMemoryStore } from "../../lib/membership/memory-store";
import { smsWindowOpen } from "../../lib/membership/sms-window";
import { dispatchStaffSms, staffAlertSmsText } from "../../lib/membership/staff-sms";
import { MANHAIR_GHL_LOCATION_ID } from "../../lib/membership/manhair-ghl";

const QUIET = new Date("2026-11-08T08:00:00.000Z");
const STAFF = "+19045550199";
const MEMBER_CONTACT = "member_contact_should_not_receive";

test("staff texts name the plan and phone, skip consent and quiet hours, and do not use the member contact", async () => {
  assert.equal(smsWindowOpen(QUIET), false);
  const calls: Array<{ url: string; method: string; body: string }> = [];
  const store = createMemoryStore();
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = String(init?.body ?? "");
    calls.push({ url, method, body });
    if (url.includes("/conversations/messages")) return Response.json({ messageId: "msg_1" });
    if (method === "POST") {
      return Response.json({ contact: { id: "staff_contact", locationId: MANHAIR_GHL_LOCATION_ID } });
    }
    return Response.json({
      contacts: [{ id: MEMBER_CONTACT, phone: "+19045550100", locationId: MANHAIR_GHL_LOCATION_ID, email: "member@example.com" }],
    });
  };
  const env = {
    GHL_API_TOKEN: "token",
    MEMBERSHIP_SMS_SEND: "true",
    STAFF_ALERT_SMS_NUMBERS: `${STAFF}, not-a-number, ${STAFF}`,
  };
  await dispatchStaffSms({
    env,
    store,
    now: () => QUIET,
    fetchImpl,
  }, {
    kind: "setup_paid",
    sourceId: "mem_1",
    name: "Alex Rivera",
    phone: "+1 (904) 555-0100",
    plan: "Signature",
  });
  const sms = calls.filter((call) => call.url.includes("/conversations/messages"));
  assert.equal(sms.length, 1);
  const payload = JSON.parse(sms[0]!.body) as { contactId: string; message: string; fromNumber: string };
  assert.equal(payload.contactId, "staff_contact");
  assert.notEqual(payload.contactId, MEMBER_CONTACT);
  assert.equal(payload.fromNumber, "+19045268500");
  assert.match(payload.message, /Alex Rivera/);
  assert.match(payload.message, /Signature/);
  assert.match(payload.message, /\+1 \(904\) 555-0100/);
  assert.doesNotMatch(payload.message, /member_contact|smsConsent|bypass/);
  const created = calls.find((call) => call.method === "POST" && call.url.endsWith("/contacts/"));
  assert.match(created?.body ?? "", new RegExp(STAFF.replace("+", "\\+")));
  assert.doesNotMatch(created?.body ?? "", /member@example.com/);
  assert.equal((await store.listLifecycleMessages()).some((row) => row.templateId === "staff_new_member_sms"), false);
  assert.equal((await store.listLifecycleMessages()).some((row) => row.templateId === "staff_ops_sms" && row.memberId === null && row.status === "sent"), true);

  await dispatchStaffSms({
    env,
    store,
    now: () => QUIET,
    fetchImpl,
  }, {
    kind: "setup_paid",
    sourceId: "mem_1",
    name: "Alex Rivera",
    phone: "+1 (904) 555-0100",
    plan: "Signature",
  });
  assert.equal(calls.filter((call) => call.url.includes("/conversations/messages")).length, 1);
});

test("a consultation text includes the interest and stays off unless SMS sending is enabled", async () => {
  const text = staffAlertSmsText({
    kind: "consultation_requested",
    sourceId: "deal_1",
    name: "Ari Cole",
    phone: null,
    interest: "Video consult",
  });
  assert.match(text, /Ari Cole/);
  assert.match(text, /not provided/);
  assert.match(text, /Video consult/);
  let called = false;
  await dispatchStaffSms({
    env: { STAFF_ALERT_SMS_NUMBERS: STAFF, GHL_API_TOKEN: "token" },
    store: createMemoryStore(),
    now: () => QUIET,
    fetchImpl: async () => {
      called = true;
      return Response.json({});
    },
  }, {
    kind: "consultation_requested",
    sourceId: "deal_1",
    name: "Ari Cole",
    phone: "9045550100",
    interest: "Video consult",
  });
  assert.equal(called, false);
});

test("member texts still require consent even when staff texts do not", async () => {
  let called = false;
  const result = await sendLocationSms(
    { GHL_API_TOKEN: "token", MEMBERSHIP_SMS_SEND: "true" },
    MEMBER_CONTACT,
    "should not send",
    async () => {
      called = true;
      return Response.json({});
    },
    false,
    QUIET,
  );
  assert.equal(result.reason, "no_sms_consent");
  assert.equal(called, false);
  const template = lifecycleTemplate("staff_new_member_sms");
  assert.equal(template?.enabled, false);
  assert.equal(template?.enabled_phase, 2);
  assert.equal(templateMaySend("staff_new_member_sms", {
    MEMBERSHIP_SMS_SEND: "true",
    MEMBERSHIP_LIFECYCLE_SEND: "true",
    MEMBERSHIP_LIFECYCLE_PHASE1: "true",
  }, "operational"), false);
});
