import assert from "node:assert/strict";
import { test } from "node:test";
import { reviewedLifecycle, reviewLifecycle, type LifecycleDraft } from "../../lib/membership/lifecycle-review";
import draft from "../../manhair-lifecycle/lifecycle.json";

test("lifecycle drafts stay disabled and block unresolved facts", () => {
  const reviewed = reviewLifecycle(draft as LifecycleDraft);
  assert.equal(reviewed.ok, true);
  if (!reviewed.ok) return;
  assert.equal(reviewed.emails.length, 19);
  assert.ok(reviewed.emails.every((email) => email.enabled === false && email.sendable === false));
  assert.ok(reviewed.emails.every((email) => email.blocks.includes("sender_not_configured")));
  const receipt = reviewed.emails.find((email) => email.id === "email_payment_confirmation");
  assert.ok(receipt?.blocks.includes("receipt_dedup_unverified"));
  assert.ok(receipt?.blocks.includes("unresolved_placeholder"));
  const care = reviewed.emails.find((email) => email.id === "email_care_after_fitting");
  assert.ok(care?.blocks.includes("care_guidance_unapproved"));
  const pause = reviewed.emails.find((email) => email.id === "email_pause_approved");
  assert.ok(pause?.blocks.includes("pause_billing_unresolved"));
  assert.ok(reviewed.publicPageIds.includes("plan_selection"));
  assert.equal(reviewed.publicPageIds.includes("signup_review_terms"), false);
  const loaded = reviewedLifecycle();
  assert.equal(loaded.ok, true);
});

test("an enabled template is rejected", () => {
  const copy = structuredClone(draft) as LifecycleDraft;
  copy.emails[0]!.enabled = true;
  assert.deepEqual(reviewLifecycle(copy), { ok: false, error: "template_enabled" });
});
