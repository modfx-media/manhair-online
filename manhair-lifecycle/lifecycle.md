# ManHair signup and lifecycle copy
DRAFT ONLY: not approved for sending or activation.

## Brand
```json
{
  "name": "ManHair",
  "fonts": {
    "primary": "Manrope",
    "secondary": "Outfit"
  },
  "colors": {
    "copper": "#c9a24a",
    "cream": "#faf7f1",
    "ink": "#1a130e"
  },
  "voice": "Human, direct, conservative. No fake proof, no manufactured scarcity, no treatment guarantees, no fabricated appointments or availability. One idea and one call-to-action per email."
}
```

## Locked Terms
```json
{
  "plans": {
    "essential": {
      "display_name": "Essential",
      "monthly_price_usd": 449,
      "systems_per_year": 4,
      "maintenance_visits_per_year": 9,
      "total_visits_per_year": 13,
      "cadence": "13 visits/year on a 4-week cadence, not monthly calendar visits"
    },
    "signature": {
      "display_name": "Signature",
      "monthly_price_usd": 559,
      "systems_per_year": 6,
      "maintenance_visits_per_year": 7,
      "total_visits_per_year": 13,
      "cadence": "13 visits/year on a 4-week cadence, not monthly calendar visits",
      "default_selection": true
    },
    "elite": {
      "display_name": "Elite",
      "monthly_price_usd": 669,
      "systems_per_year": 8,
      "maintenance_visits_per_year": 5,
      "total_visits_per_year": 13,
      "cadence": "13 visits/year on a 4-week cadence, not monthly calendar visits",
      "priority_scheduling": true
    }
  },
  "setup_fee": {
    "amount_usd": 495,
    "credited_to": "cost of first system",
    "charge_timing": "charged immediately at signup"
  },
  "billing_schedule": {
    "first_recurring_charge": "exactly 30 days after signup",
    "subsequent_cadence": "calendar-month cycle thereafter"
  },
  "system_lead_time": "8 to 12 weeks for first system; billing can begin before the first fitting occurs",
  "minimum_term": "3 months minimum, then month-to-month",
  "rate_lock_months": 24,
  "pause_policy": {
    "max_days_per_year": 60,
    "approval": "requires a request and manual review; not automatic"
  },
  "founding_offer_status": "OFF — no founding, charter, or early-bird pricing/framing may appear anywhere",
  "tax": "No tax is currently collected; copy must never claim a tax exemption",
  "statement_descriptor": "MODFXMEDIA LLC — must be disclosed to the member before payment is submitted",
  "receipt_policy": "If Stripe's automatic receipt emails are enabled for the account, the internal payment confirmation email must be suppressed (no duplicate receipt)"
}
```

## Global Safety
```json
{
  "no_fake_proof": "No testimonials, reviews, counters, or client photos may be used unless real and rights-cleared; none exist in this draft.",
  "no_scarcity_language": "No countdowns, 'limited spots,' 'only X left,' or urgency framing anywhere in pages or emails.",
  "no_treatment_guarantees": "No language implying guaranteed results, guaranteed timelines, or guaranteed appointment availability.",
  "no_fabricated_appointments_or_dates": "Any date, time, or appointment referenced in copy must come from a real, server-confirmed record via a placeholder token, never invented.",
  "one_idea_one_cta_per_email": "Every email in this draft contains exactly one message and one call-to-action.",
  "no_claims_of_successful_deployment_or_send": "This entire document is an unreviewed draft. Nothing in it has been built, connected, deployed, sent, or tested. No claim of successful delivery, sync, or automation is made or implied.",
  "placeholder_discipline": "Any fact not explicitly provided (URLs, amounts, dates, sender identities, recipients) is represented with an explicit {{PLACEHOLDER_NOT_CONFIGURED}} token — never guessed or invented.",
  "payment_status_verification": "A member is only shown or told they are 'paid' or 'active' after a server-confirmed Stripe event (e.g., a verified webhook). A checkout-page redirect alone is never sufficient.",
  "consent_separation": "Terms-of-service consent (required) and marketing consent (optional, default unchecked) are always presented, recorded, and revocable as two separate choices.",
  "placeholder_rendering": "Block unresolved tokens; booking CTA disabled until real approved URL exists. Never show internal placeholders publicly.",
  "payment_copy_scope": "Verify dedicated ManHair account/customer/membership metadata; deduplicate event plus business transition. No account-wide payment messages.",
  "activation": "All templates enabled=false. Exact send approval, consent, approved sender/recipients and legal/business review required."
}
```

## Missing Facts
```json
[
  "Live booking/scheduling URL for consultations and fittings (currently {{BOOKING_URL_NOT_CONFIGURED}})",
  "Sender name and reply-to address; manhaironline.com is already verified in Resend",
  "Owner and Griselda internal alert recipients for signup, payment failure, and pause-request notifications",
  "Provider-reviewed, approved care guidance copy for the post-fitting email (current draft intentionally generic pending approval)",
  "Legal review and sign-off on terms checkbox wording and billing disclosure copy",
  "Confirmation of whether Stripe's automatic receipt emails are enabled on the account (required to set the receipt-dedup gate correctly)",
  "Support contact (email and/or phone) for billing, cancellation, and pause inquiries",
  "Cancellation process details and any proration rules — not specified by the business and therefore not invented here",
  "Griselda Hub local authentication method/provider (spec says 'local, not a GHL user' but no mechanism was supplied)",
  "Dedicated GHL app Private Integration token; ManHair MCP is connected but distinct from app runtime",
  "Definitions for each 'service readiness' status shown on the dashboard beyond the general 8–12 week lead-time language",
  "Whether an approved pause affects billing (skipped charge, deferred charge, or no billing change) — not specified by the business",
  "Company legal/mailing address required for email footer compliance",
  "Explicit confirmation that no draft in this document should be activated, scheduled, or sent without separate, later approval"
]
```

## Page: Choose Your ManHair Membership
ID: plan_selection
```json
{
  "id": "plan_selection",
  "title": "Choose Your ManHair Membership",
  "sections": [
    {
      "heading": "Three membership options",
      "body": "ManHair memberships run on a 13-visit annual cadence — systems and maintenance visits spaced every 4 weeks, not once a month by the calendar. Pick the plan that matches the number of systems included each year; all three include the same visit frequency.",
      "cta": null
    },
    {
      "heading": "Essential — $449/month",
      "body": "4 systems and 9 maintenance visits per year, for a total of 13 visits on a 4-week cadence. A straightforward option if you want fewer system replacements and more maintenance visits in between.",
      "cta": "Select Essential"
    },
    {
      "heading": "Signature — $559/month",
      "body": "6 systems and 7 maintenance visits per year, for a total of 13 visits on a 4-week cadence. Signature is pre-selected by default; choose the plan that suits you.",
      "cta": "Select Signature"
    },
    {
      "heading": "Elite — $669/month",
      "body": "8 systems and 5 maintenance visits per year, for a total of 13 visits on a 4-week cadence, with priority scheduling for your appointments.",
      "cta": "Select Elite"
    },
    {
      "heading": "How billing works",
      "body": "Every plan requires a $495 setup payment, charged immediately and credited in full toward the cost of your first system. Your first recurring monthly charge happens exactly 30 days after signup; after that, billing runs on a calendar-month cycle. Systems typically take 8 to 12 weeks of system lead time; your fitting date must be confirmed separately — billing can begin before that first fitting takes place. Membership requires a 3-month minimum commitment, after which it continues month-to-month, with your monthly rate locked for 24 months.",
      "cta": "Continue to signup"
    }
  ]
}
```

## Page: Review & Confirm Your Membership
ID: signup_review_terms
```json
{
  "id": "signup_review_terms",
  "title": "Review & Confirm Your Membership",
  "sections": [
    {
      "heading": "Your selected plan",
      "body": "You've selected the {{SELECTED_PLAN_NAME}} plan at {{SELECTED_PLAN_MONTHLY_PRICE}}/month, including {{SELECTED_PLAN_SYSTEMS}} systems and {{SELECTED_PLAN_MAINTENANCE_VISITS}} maintenance visits per year, for 13 total visits on a 4-week cadence.",
      "cta": null
    },
    {
      "heading": "What you're paying today",
      "body": "$495.00 is due now and will be charged to your card today. This amount is credited in full toward the cost of your first system — it is not an additional fee on top of your system cost.",
      "cta": null
    },
    {
      "heading": "What you'll pay going forward",
      "body": "Your first recurring charge of {{SELECTED_PLAN_MONTHLY_PRICE}} will be billed exactly 30 days from today, on {{FIRST_RECURRING_CHARGE_DATE}}. After that, you'll be billed {{SELECTED_PLAN_MONTHLY_PRICE}} on a calendar-month cycle. Your system typically takes 8 to 12 weeks of system lead time; your fitting date must be confirmed separately; this billing schedule can begin before that fitting happens.",
      "cta": null
    },
    {
      "heading": "Membership terms",
      "body": "Your membership requires a 3-month minimum commitment, after which it continues on a month-to-month basis. Your monthly rate is locked for 24 months from signup. You may request a pause of up to 60 days per year; pause requests are reviewed and are not automatically approved. Charges on your statement will appear under the descriptor MODFXMEDIA LLC. No sales tax is currently being collected on this purchase. For questions about cancellation or changes to your membership, contact {{SUPPORT_CONTACT_NOT_CONFIGURED}}.",
      "cta": null
    },
    {
      "heading": "Required: Terms consent",
      "body": "I have read and agree to the ManHair Membership Terms, including the $495 setup payment credited toward my first system, the billing schedule shown above, the 3-month minimum commitment followed by month-to-month billing, and the 24-month rate lock. This consent is required to continue. (Checkbox, unchecked by default, must be checked to proceed.)",
      "cta": null
    },
    {
      "heading": "Optional: marketing consent",
      "body": "Send me optional marketing emails from ManHair about services, plans, and updates. This is not required, is unchecked by default, and will not affect my membership, billing, or service in any way. (Checkbox, unchecked by default.)",
      "cta": null
    },
    {
      "heading": "Submit",
      "body": "By submitting, you authorize a charge of $495.00 today under the statement descriptor MODFXMEDIA LLC, and authorize future recurring charges of {{SELECTED_PLAN_MONTHLY_PRICE}} beginning {{FIRST_RECURRING_CHARGE_DATE}} per the terms above.",
      "cta": "Submit and Pay $495 Now"
    }
  ]
}
```

## Page: Processing Your Payment
ID: pending_payment_confirmation
```json
{
  "id": "pending_payment_confirmation",
  "title": "Processing Your Payment",
  "sections": [
    {
      "heading": "We're confirming your payment",
      "body": "Your submission was received and we're waiting for confirmation from our payment processor. This usually takes only a few moments. Please do not submit another payment while this one is being checked.",
      "cta": null
    },
    {
      "heading": "What happens next",
      "body": "Once your payment is verified, you'll be taken to a confirmation screen and sent a welcome email. If verification takes longer than expected or doesn't succeed, this page will update to tell you exactly what to do next — we will not show you as a paid member until payment is actually confirmed.",
      "cta": "Check status"
    }
  ]
}
```

## Page: You're a ManHair Member
ID: verified_paid_confirmation
```json
{
  "id": "verified_paid_confirmation",
  "title": "You're a ManHair Member",
  "sections": [
    {
      "heading": "Payment confirmed",
      "body": "Your $495.00 setup payment has been verified and will be credited toward your first system. Welcome to ManHair. This page is only shown after your payment processor has confirmed the charge — not based on simply reaching this page.",
      "cta": null
    },
    {
      "heading": "What's next",
      "body": "Your system typically takes 8 to 12 weeks of system lead time; your fitting date must be confirmed separately. We'll keep you updated by email along the way. When it's time to schedule, you'll do so at {{BOOKING_URL_NOT_CONFIGURED}}.",
      "cta": null
    },
    {
      "heading": "Your billing schedule",
      "body": "Your next charge of {{SELECTED_PLAN_MONTHLY_PRICE}} is scheduled for {{FIRST_RECURRING_CHARGE_DATE}}, and will continue on a calendar-month cycle after that.",
      "cta": null
    },
    {
      "heading": "Go to your account",
      "body": "You can review your plan, billing, and visit cadence anytime from your dashboard.",
      "cta": "Go to your dashboard"
    }
  ]
}
```

## Page: Your ManHair Account
ID: account_dashboard
```json
{
  "id": "account_dashboard",
  "title": "Your ManHair Account",
  "sections": [
    {
      "heading": "Next bill",
      "body": "Your next charge is {{NEXT_INVOICE_AMOUNT}} on {{NEXT_INVOICE_DATE}}, sourced directly from your active subscription record.",
      "cta": null
    },
    {
      "heading": "Your visit cadence",
      "body": "Your plan includes 13 visits per year, scheduled at a 4-week cadence — not once per calendar month. {{VISITS_COMPLETED_COUNT}} of 13 visits completed this membership year.",
      "cta": null
    },
    {
      "heading": "Service readiness",
      "body": "System lead time is typically 8 to 12 weeks. Current status: {{SERVICE_READINESS_STATUS_NOT_CONFIGURED}}.",
      "cta": null
    },
    {
      "heading": "Pause your membership",
      "body": "You can request a pause of up to 60 days per year. Submitting a request does not pause your membership automatically — requests are reviewed before approval.",
      "cta": "Request a pause"
    },
    {
      "heading": "Billing & payment history",
      "body": "View past charges, update your payment method, or review your billing history. This section reflects your billing account separately from your membership and visit status above.",
      "cta": "Manage billing"
    }
  ]
}
```

## Page: Griselda Deal Hub
ID: griselda_deal_hub
```json
{
  "id": "griselda_deal_hub",
  "title": "Griselda Deal Hub",
  "sections": [
    {
      "heading": "Sign in",
      "body": "Sign in with your Griselda Hub account. This login is local to the Hub and is separate from any GoHighLevel/GHL user account — a Griselda login does not imply GHL access, and vice versa.",
      "cta": "Sign in"
    },
    {
      "heading": "Pipeline board",
      "body": "View and manage deals across the pipeline stages: New Leads, Hot Leads, Proposal Sent, Phone Consult, Video Consultation, No show/Cancelled, Active Clients, No Buy/Nurture, DND. Move a deal using the stage dropdown on its card, or drag it directly to a new stage column.",
      "cta": "Move stage"
    },
    {
      "heading": "GHL sync status",
      "body": "Each deal shows its real sync state with GHL: 'Synced' (last confirmed sync time shown), 'Pending sync' (change queued, not yet confirmed), or 'Sync failed — {{SYNC_ERROR_DETAIL}}' (with a retry option). No deal is ever labeled 'Synced' without a confirmed successful API response.",
      "cta": "Retry sync"
    },
    {
      "heading": "Save a stage change",
      "body": "Confirm a stage move. The change is saved locally immediately and queued for GHL sync; the sync status above will update once GHL confirms or rejects the update.",
      "cta": "Save stage change"
    }
  ]
}
```

## email_membership_welcome
Event: membership.setup_payment_verified
Timing: Immediately after verified setup payment event

### Subject options
1. Welcome to ManHair — your membership is set up
2. You're in: your ManHair membership starts now
3. Your ManHair membership is confirmed

Preview: Your setup payment is confirmed. Here's what happens before your first fitting.

### Body
Hi {{FIRST_NAME}},

Your $495 setup payment is confirmed and will be credited toward your first system. You're now on the {{SELECTED_PLAN_NAME}} plan: {{SELECTED_PLAN_SYSTEMS}} systems and {{SELECTED_PLAN_MAINTENANCE_VISITS}} maintenance visits each year, for 13 total visits on a 4-week cadence.

Systems typically take 8 to 12 weeks of system lead time; your fitting date must be confirmed separately. We'll email you as that progresses. Your next charge of {{SELECTED_PLAN_MONTHLY_PRICE}} is scheduled for {{FIRST_RECURRING_CHARGE_DATE}}, and billing continues on a calendar-month cycle after that.

You can review your plan, cadence, and billing anytime from your dashboard.

### Automation gates
```json
{
  "template_id": "email_membership_welcome",
  "event_key": "membership.setup_payment_verified",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "Immediately after verified setup payment event",
  "entry_conditions": [
    "setup_payment.verified = true via server-confirmed Stripe event",
    "membership record created"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — based on membership account relationship, not marketing opt-in",
  "suppression_conditions": [
    "Do not send until setup payment verification event is received",
    "Suppress duplicate sends for the same event id (idempotency key)"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_payment_confirmation
Event: payment_intent.succeeded
Timing: Immediately after verified payment event, gated by receipt-dedup check

### Subject options
1. Your ManHair payment receipt
2. Payment received: {{CHARGE_AMOUNT}}
3. Here's your ManHair payment confirmation

Preview: A confirmed record of your {{CHARGE_AMOUNT}} charge on {{CHARGE_DATE}}.

### Body
Hi {{FIRST_NAME}},

This confirms a successful charge of {{CHARGE_AMOUNT}} on {{CHARGE_DATE}}, to the card ending in {{PAYMENT_METHOD_LAST4}}. This charge appears on your statement as MODFXMEDIA LLC.

Receipt reference: {{RECEIPT_ID}}.

Keep this email for your records.

### Automation gates
```json
{
  "template_id": "email_payment_confirmation",
  "event_key": "payment_intent.succeeded",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "Immediately after verified payment event, gated by receipt-dedup check",
  "entry_conditions": [
    "payment event verified via Stripe webhook",
    "amount and date fields present on verified event payload",
    "Stripe automatic receipt emails confirmed OFF for this account"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — required to confirm a financial transaction, not marketing",
  "suppression_conditions": [
    "Suppress entirely if Stripe automatic receipt emails are enabled for the account (receipt dedup gate)",
    "Suppress if verified amount/date are missing from the event payload"
  ],
  "cta": {
    "label": "View billing details",
    "internal_placeholder": "{{BILLING_PORTAL_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_fitting_prep
Event: appointment.confirmed AND service.ready
Timing: Immediately after both a confirmed appointment and a service-ready event exist

### Subject options
1. Getting ready for your fitting on {{APPOINTMENT_DATE}}
2. Your ManHair fitting is confirmed for {{APPOINTMENT_DATE}}
3. What to expect at your upcoming fitting

Preview: Your system is ready and your fitting is confirmed for {{APPOINTMENT_DATE}}.

### Body
Hi {{FIRST_NAME}},

Your system is ready, and your fitting is confirmed for {{APPOINTMENT_DATE}} at {{APPOINTMENT_TIME}}, at {{APPOINTMENT_LOCATION}}.

Please arrive a few minutes early. If you need to reschedule, use the link below.

### Automation gates
```json
{
  "template_id": "email_fitting_prep",
  "event_key": "appointment.confirmed AND service.ready",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "Immediately after both a confirmed appointment and a service-ready event exist",
  "entry_conditions": [
    "appointment_confirmed event received with an actual date/time",
    "service_ready event received for the member's system"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — required logistics for a confirmed appointment",
  "suppression_conditions": [
    "Do not send based on a proposed or estimated appointment slot",
    "Suppress and send a cancellation notice instead if the appointment is later rescheduled or cancelled"
  ],
  "cta": {
    "label": "Manage your appointment",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_leadtime_expectation_week2
Event: membership.setup_payment_verified + 14 days
Timing: ~14 days (week 2) after verified setup payment

### Subject options
1. What to expect while your system is prepared
2. Your 8–12 week timeline, explained
3. A quick note on your system's timeline

Preview: Here's what's typical during the lead time on your first system.

### Body
Hi {{FIRST_NAME}},

It's been about two weeks since your membership started. Systems typically take 8 to 12 weeks of system lead time; your fitting date must be confirmed separately. We don't yet have a confirmed appointment date for you, and we won't promise one until it's actually scheduled — but we'll keep you posted with real status updates along the way.

No action is needed from you right now.

### Automation gates
```json
{
  "template_id": "email_leadtime_expectation_week2",
  "event_key": "membership.setup_payment_verified + 14 days",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "~14 days (week 2) after verified setup payment",
  "entry_conditions": [
    "membership active",
    "no appointment confirmed yet",
    "Suppress if fitting already confirmed or completed; use actual service state."
  ],
  "exit_conditions": [
    "appointment_confirmed event received (exits this expectation-setting track)"
  ],
  "consent_requirement": "Transactional — order/service status update",
  "suppression_conditions": [
    "Suppress if an appointment has already been confirmed before this is due to send"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_status_update_week8
Event: membership.setup_payment_verified + 56 days
Timing: ~56 days (week 8) after verified setup payment

### Subject options
1. Your system status update (week 8)
2. Where things stand with your system
3. Your week 8 status update from ManHair

Preview: A real update on your system's status — no promised dates.

### Body
Hi {{FIRST_NAME}},

It's been about 8 weeks since your membership started. Current status: {{SYSTEM_STATUS_WEEK8_NOT_CONFIGURED}}.

Our typical lead time is 8 to 12 weeks, so you may still be within that window. We'll send another update at week 12, and reach out as soon as your appointment can be confirmed.

### Automation gates
```json
{
  "template_id": "email_status_update_week8",
  "event_key": "membership.setup_payment_verified + 56 days",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "~56 days (week 8) after verified setup payment",
  "entry_conditions": [
    "membership active",
    "actual status available from fulfillment record"
  ],
  "exit_conditions": [
    "appointment_confirmed event received"
  ],
  "consent_requirement": "Transactional — order/service status update",
  "suppression_conditions": [
    "Suppress if appointment is already confirmed by send time"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_status_update_week12
Event: membership.setup_payment_verified + 84 days
Timing: ~84 days (week 12) after verified setup payment

### Subject options
1. Your system status update (week 12)
2. An update as you reach the end of our typical timeline
3. Where your system stands at week 12

Preview: You're near the end of our typical 8–12 week window — here's the real status.

### Body
Hi {{FIRST_NAME}},

It's been about 12 weeks since your membership started, which is the far end of our typical 8 to 12 week lead time. Current status: {{SYSTEM_STATUS_WEEK12_NOT_CONFIGURED}}.

If your system isn't ready yet, that can happen, and we'd rather tell you plainly than guess at a date. If you have questions, reach out at {{SUPPORT_CONTACT_NOT_CONFIGURED}}.

### Automation gates
```json
{
  "template_id": "email_status_update_week12",
  "event_key": "membership.setup_payment_verified + 84 days",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "~84 days (week 12) after verified setup payment",
  "entry_conditions": [
    "membership active",
    "actual status available from fulfillment record"
  ],
  "exit_conditions": [
    "appointment_confirmed event received"
  ],
  "consent_requirement": "Transactional — order/service status update",
  "suppression_conditions": [
    "Suppress if appointment is already confirmed by send time"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_care_after_fitting
Event: appointment.completed.fitting
Timing: Immediately after a fitting appointment is marked completed

### Subject options
1. Caring for your system after today's fitting
2. Your after-fitting notes from ManHair
3. A few notes following your fitting

Preview: A few notes following today's fitting.

### Body
Hi {{FIRST_NAME}},

Thanks for coming in today. {{APPROVED_CARE_GUIDANCE_NOT_CONFIGURED}}

If anything feels off before your next visit, follow the guidance your provider gave you in person, or reach out at {{SUPPORT_CONTACT_NOT_CONFIGURED}}.

### Automation gates
```json
{
  "template_id": "email_care_after_fitting",
  "event_key": "appointment.completed.fitting",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "Immediately after a fitting appointment is marked completed",
  "entry_conditions": [
    "fitting appointment marked completed by provider/staff record"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — follow-up to a completed service",
  "suppression_conditions": [
    "Do not send until the fitting is marked completed by staff, not merely scheduled",
    "Do not send until approved care guidance copy exists ({{APPROVED_CARE_GUIDANCE_NOT_CONFIGURED}})"
  ],
  "cta": {
    "label": "View your visit schedule",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_checkin_after_visit
Event: visit.completed
Timing: Shortly after any of the 13 scheduled visits is marked completed

### Subject options
1. How did your visit go?
2. Quick check-in after your recent visit
3. A quick question about your visit

Preview: Two minutes to tell us how your recent visit went.

### Body
Hi {{FIRST_NAME}},

You had a visit on {{VISIT_DATE}}. We'd like to know how it went — anything you'd flag for next time?

This helps us keep your care consistent across all 13 visits this year.

### Automation gates
```json
{
  "template_id": "email_checkin_after_visit",
  "event_key": "visit.completed",
  "sequence": "membership_lifecycle_transactional",
  "relative_timing": "Shortly after any of the 13 scheduled visits is marked completed",
  "entry_conditions": [
    "visit marked completed in appointment record"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — follow-up to a completed service",
  "suppression_conditions": [
    "Do not send until the visit is marked completed, not merely scheduled"
  ],
  "cta": {
    "label": "Share feedback",
    "internal_placeholder": "{{FEEDBACK_FORM_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_recurring_charge_reminder
Event: stripe.invoice.upcoming
Timing: 3 days before the actual next invoice date on the Stripe subscription record

### Subject options
1. Upcoming charge: {{NEXT_INVOICE_AMOUNT}} on {{NEXT_INVOICE_DATE}}
2. Your next ManHair charge is coming up
3. Reminder: {{NEXT_INVOICE_AMOUNT}} will process on {{NEXT_INVOICE_DATE}}

Preview: A heads-up before your next charge of {{NEXT_INVOICE_AMOUNT}}.

### Body
Hi {{FIRST_NAME}},

Just a heads-up: {{NEXT_INVOICE_AMOUNT}} will be charged to your card on file on {{NEXT_INVOICE_DATE}}, as part of your {{SELECTED_PLAN_NAME}} membership.

No action is needed unless you'd like to update your payment method.

### Automation gates
```json
{
  "template_id": "email_recurring_charge_reminder",
  "event_key": "stripe.invoice.upcoming",
  "sequence": "membership_billing",
  "relative_timing": "3 days before the actual next invoice date on the Stripe subscription record",
  "entry_conditions": [
    "invoice.upcoming or confirmed next_payment_date present on subscription record",
    "Schedule from actual subscription date; invoice.upcoming alone does not guarantee 3days notice. Recompute on changes."
  ],
  "exit_conditions": [
    "N/A — recurring per billing cycle, re-triggered each cycle"
  ],
  "consent_requirement": "Transactional — billing notice tied to active subscription",
  "suppression_conditions": [
    "Suppress if an unresolved invoice.payment_failed exists for this upcoming charge",
    "Suppress if an approved pause covers this billing date"
  ],
  "cta": {
    "label": "Update payment method",
    "internal_placeholder": "{{BILLING_PORTAL_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_payment_failed
Event: invoice.payment_failed
Timing: Immediately after a verified invoice.payment_failed webhook

### Subject options
1. We couldn't process your recent payment
2. Action needed: payment issue on your account
3. Your ManHair payment didn't go through

Preview: Your recent charge of {{FAILED_INVOICE_AMOUNT}} didn't go through.

### Body
Hi {{FIRST_NAME}},

We tried to charge {{FAILED_INVOICE_AMOUNT}} to your card on file on {{FAILED_INVOICE_DATE}}, and it didn't go through. Please review your payment details and update your payment method. Your account shows your current membership status.

### Automation gates
```json
{
  "template_id": "email_payment_failed",
  "event_key": "invoice.payment_failed",
  "sequence": "membership_billing_recovery",
  "relative_timing": "Immediately after a verified invoice.payment_failed webhook",
  "entry_conditions": [
    "invoice.payment_failed event verified via Stripe webhook"
  ],
  "exit_conditions": [
    "invoice.paid received for the same invoice (moves member into recovery track)"
  ],
  "consent_requirement": "Transactional — required billing notice",
  "suppression_conditions": [
    "Suppress duplicate sends for the same failed invoice/attempt id"
  ],
  "cta": {
    "label": "Update payment method",
    "internal_placeholder": "{{BILLING_PORTAL_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_payment_recovered
Event: invoice.paid
Timing: Immediately after a verified invoice.paid event where a prior invoice.payment_failed exists for the same invoice

### Subject options
1. You're all set — payment received
2. Payment successfully processed
3. Thanks — your payment issue is resolved

Preview: Your payment of {{RECOVERED_INVOICE_AMOUNT}} went through.

### Body
Hi {{FIRST_NAME}},

Good news — your payment of {{RECOVERED_INVOICE_AMOUNT}} on {{RECOVERED_INVOICE_DATE}} was successfully processed. You can review your current membership status in your account.

### Automation gates
```json
{
  "template_id": "email_payment_recovered",
  "event_key": "invoice.paid",
  "sequence": "membership_billing_recovery",
  "relative_timing": "Immediately after a verified invoice.paid event where a prior invoice.payment_failed exists for the same invoice",
  "entry_conditions": [
    "invoice.paid event verified via Stripe webhook",
    "a prior invoice.payment_failed exists for the same invoice id"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — required billing notice",
  "suppression_conditions": [
    "Sending this email suppresses any further payment_failed or recurring_charge_reminder sends tied to this same invoice"
  ],
  "cta": {
    "label": "View billing details",
    "internal_placeholder": "{{BILLING_PORTAL_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_pause_request_acknowledgement
Event: pause_request.submitted
Timing: Immediately after a pause request is submitted

### Subject options
1. We received your pause request
2. Your pause request is being reviewed
3. Confirming receipt of your pause request

Preview: Your request for {{REQUESTED_PAUSE_START}} to {{REQUESTED_PAUSE_END}} is under review.

### Body
Hi {{FIRST_NAME}},

We received your request to pause your membership from {{REQUESTED_PAUSE_START}} to {{REQUESTED_PAUSE_END}}. This is not yet approved — pause requests are reviewed manually, up to a maximum of 60 days per year. We'll follow up once a decision is made.

### Automation gates
```json
{
  "template_id": "email_pause_request_acknowledgement",
  "event_key": "pause_request.submitted",
  "sequence": "membership_pause_management",
  "relative_timing": "Immediately after a pause request is submitted",
  "entry_conditions": [
    "pause_request.submitted event recorded"
  ],
  "exit_conditions": [
    "pause_request.approved or pause_request.denied event received"
  ],
  "consent_requirement": "Transactional — confirmation of a member-initiated request",
  "suppression_conditions": [
    "N/A"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_pause_approved
Event: pause_request.approved
Timing: Immediately after a pause request is approved

### Subject options
1. Your pause request is approved
2. Confirmed: your membership pause
3. Your pause is now in effect

Preview: Your pause from {{APPROVED_PAUSE_START}} to {{APPROVED_PAUSE_END}} is confirmed.

### Body
Hi {{FIRST_NAME}},

Your pause request has been approved for {{APPROVED_PAUSE_START}} through {{APPROVED_PAUSE_END}}. For questions about how this affects your billing or visit schedule, contact {{SUPPORT_CONTACT_NOT_CONFIGURED}}.

### Automation gates
```json
{
  "template_id": "email_pause_approved",
  "event_key": "pause_request.approved",
  "sequence": "membership_pause_management",
  "relative_timing": "Immediately after a pause request is approved",
  "entry_conditions": [
    "pause_request.approved event recorded"
  ],
  "exit_conditions": [
    "N/A — single-send transactional email"
  ],
  "consent_requirement": "Transactional — confirmation of an approved request",
  "suppression_conditions": [
    "Do not send until an explicit approval event exists; acknowledgement email alone does not trigger this"
  ],
  "cta": {
    "label": "View your dashboard",
    "internal_placeholder": "{{DASHBOARD_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_nurture_day0
Event: lead.consultation_interest
Timing: Day 0 — immediately after explicit marketing opt-in is captured

### Subject options
1. Thanks for your interest in ManHair
2. A few things worth knowing about ManHair
3. Your ManHair questions, answered

Preview: Here's what membership actually includes — no pressure, just the facts.

### Body
Hi {{FIRST_NAME}},

Thanks for your interest in ManHair. Memberships include 13 visits per year on a 4-week cadence, split between system placements and maintenance, across three plans: Essential, Signature, and Elite. A $495 setup payment is credited toward your first system.

If you'd like to talk it through, you can book a consultation whenever it's convenient.

### Automation gates
```json
{
  "template_id": "email_nurture_day0",
  "event_key": "lead.consultation_interest",
  "sequence": "consultation_nurture",
  "relative_timing": "Day 0 — immediately after explicit marketing opt-in is captured",
  "entry_conditions": [
    "explicit marketing consent = true",
    "lead recorded with consultation interest"
  ],
  "exit_conditions": [
    "membership signup completed",
    "consult/booking completed",
    "DND flag set",
    "unsubscribe received",
    "bounce or spam complaint received"
  ],
  "consent_requirement": "Marketing — requires explicit opt-in consent, never assumed",
  "suppression_conditions": [
    "Suppress if consent is withdrawn before send",
    "Suppress if any exit condition is already met"
  ],
  "cta": {
    "label": "Book a consultation",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_nurture_day3
Event: lead.consultation_interest
Timing: Day 3 after explicit marketing opt-in

### Subject options
1. Essential, Signature, or Elite — how they differ
2. Which ManHair plan fits you?
3. Comparing the three ManHair plans

Preview: Same 13 visits a year — the difference is how many are system placements.

### Body
Hi {{FIRST_NAME}},

All three ManHair plans include 13 visits a year on a 4-week cadence. The difference is the mix: Essential includes 4 systems and 9 maintenance visits, Signature includes 6 systems and 7 maintenance visits, and Elite includes 8 systems and 5 maintenance visits with priority scheduling.

If you want help picking, a consultation is a good next step.

### Automation gates
```json
{
  "template_id": "email_nurture_day3",
  "event_key": "lead.consultation_interest",
  "sequence": "consultation_nurture",
  "relative_timing": "Day 3 after explicit marketing opt-in",
  "entry_conditions": [
    "explicit marketing consent = true",
    "no exit condition met since day 0"
  ],
  "exit_conditions": [
    "membership signup completed",
    "consult/booking completed",
    "DND flag set",
    "unsubscribe received",
    "bounce or spam complaint received"
  ],
  "consent_requirement": "Marketing — requires explicit opt-in consent, never assumed",
  "suppression_conditions": [
    "Suppress if consent is withdrawn before send",
    "Suppress if any exit condition is already met"
  ],
  "cta": {
    "label": "Book a consultation",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_nurture_day6
Event: lead.consultation_interest
Timing: Day 6 after explicit marketing opt-in

### Subject options
1. How billing actually works at ManHair
2. The straightforward version of our billing
3. What you'd actually pay, explained

Preview: A $495 setup payment credited toward your first system, then a flat monthly rate.

### Body
Hi {{FIRST_NAME}},

Here's how billing works if you join: a $495 setup payment is charged right away and credited in full toward your first system. Your first monthly charge happens 30 days after signup, then continues on a calendar-month cycle. Your rate is locked for 24 months from signup. Membership has a 3-month minimum commitment, then continues month-to-month.

Happy to answer specific questions on a call.

### Automation gates
```json
{
  "template_id": "email_nurture_day6",
  "event_key": "lead.consultation_interest",
  "sequence": "consultation_nurture",
  "relative_timing": "Day 6 after explicit marketing opt-in",
  "entry_conditions": [
    "explicit marketing consent = true",
    "no exit condition met since day 3"
  ],
  "exit_conditions": [
    "membership signup completed",
    "consult/booking completed",
    "DND flag set",
    "unsubscribe received",
    "bounce or spam complaint received"
  ],
  "consent_requirement": "Marketing — requires explicit opt-in consent, never assumed",
  "suppression_conditions": [
    "Suppress if consent is withdrawn before send",
    "Suppress if any exit condition is already met"
  ],
  "cta": {
    "label": "Book a consultation",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_nurture_day10
Event: lead.consultation_interest
Timing: Day 10 after explicit marketing opt-in

### Subject options
1. Still deciding? Here's what people usually ask
2. Common questions before joining ManHair
3. What usually holds people back — and the honest answer

Preview: No guesswork — here's what we can and can't promise.

### Body
Hi {{FIRST_NAME}},

If you're still weighing it, here is the timing to plan for: systems typically take 8 to 12 weeks of system lead time; your fitting date must be confirmed separately, and we don't guarantee a date earlier than that. Billing can start before your first fitting.

If that timeline works for you, a short consultation is the easiest way to get specifics for your situation.

### Automation gates
```json
{
  "template_id": "email_nurture_day10",
  "event_key": "lead.consultation_interest",
  "sequence": "consultation_nurture",
  "relative_timing": "Day 10 after explicit marketing opt-in",
  "entry_conditions": [
    "explicit marketing consent = true",
    "no exit condition met since day 6"
  ],
  "exit_conditions": [
    "membership signup completed",
    "consult/booking completed",
    "DND flag set",
    "unsubscribe received",
    "bounce or spam complaint received"
  ],
  "consent_requirement": "Marketing — requires explicit opt-in consent, never assumed",
  "suppression_conditions": [
    "Suppress if consent is withdrawn before send",
    "Suppress if any exit condition is already met"
  ],
  "cta": {
    "label": "Book a consultation",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_nurture_day14
Event: lead.consultation_interest
Timing: Day 14 after explicit marketing opt-in

### Subject options
1. Whenever you're ready, we're here
2. No pressure — just an open door
3. Last note from us on this: happy to talk anytime

Preview: This is our last check-in for now — reach out whenever works for you.

### Body
Hi {{FIRST_NAME}},

This is the last email in this series. If ManHair isn't the right fit right now, that's completely fine. If you'd still like to talk it through, a consultation is a low-commitment way to get your questions answered directly.

### Automation gates
```json
{
  "template_id": "email_nurture_day14",
  "event_key": "lead.consultation_interest",
  "sequence": "consultation_nurture",
  "relative_timing": "Day 14 after explicit marketing opt-in",
  "entry_conditions": [
    "explicit marketing consent = true",
    "no exit condition met since day 10"
  ],
  "exit_conditions": [
    "membership signup completed",
    "consult/booking completed",
    "DND flag set",
    "unsubscribe received",
    "bounce or spam complaint received"
  ],
  "consent_requirement": "Marketing — requires explicit opt-in consent, never assumed",
  "suppression_conditions": [
    "Suppress if consent is withdrawn before send",
    "Suppress if any exit condition is already met",
    "This is the final email in this nurture sequence"
  ],
  "cta": {
    "label": "Book a consultation",
    "internal_placeholder": "{{BOOKING_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## email_abandoned_signup_reminder
Event: signup.abandoned
Timing: Single send, shortly after an abandoned signup attempt

### Subject options
1. Picking up where you left off
2. Your ManHair signup is still saved
3. Need anything to finish signing up?

Preview: Your selected plan is saved if you'd like to pick back up.

### Body
Hi {{FIRST_NAME}},

If you would still like to join ManHair, you can review the plans and start again. This reminder is not a payment confirmation. If you have questions before continuing, you can reach us at {{SUPPORT_CONTACT_NOT_CONFIGURED}}.

### Automation gates
```json
{
  "template_id": "email_abandoned_signup_reminder",
  "event_key": "signup.abandoned",
  "sequence": "abandoned_signup_recovery",
  "relative_timing": "Single send, shortly after an abandoned signup attempt",
  "entry_conditions": [
    "explicit appropriate follow-up consent captured at the point of abandonment",
    "no completed/verified payment exists for this signup attempt",
    "Immediately before send reconcile local signup and Stripe checkout/payment status; suppress successful, pending or unresolved setup payments. Do not assume saved progress."
  ],
  "exit_conditions": [
    "signup completed successfully",
    "explicit opt-out received"
  ],
  "consent_requirement": "Marketing/transactional follow-up — requires explicit opt-in for abandoned-signup follow-up; never inferred from merely typing an email address",
  "suppression_conditions": [
    "Suppress entirely if explicit follow-up consent was not captured",
    "Suppress if the signup later completes successfully before send",
    "Do not imply any charge or checkout step has already succeeded"
  ],
  "cta": {
    "label": "Resume signup",
    "internal_placeholder": "{{SIGNUP_RESUME_URL_NOT_CONFIGURED}}"
  },
  "enabled": false
}
```

## Acceptance Checks
```json
[
  "No page or email is enabled, scheduled, or sent as a result of this document; all remain disabled drafts pending review.",
  "Every 'paid'/'active' status shown to a member is gated on a server-confirmed Stripe webhook event, never on a checkout redirect alone.",
  "The internal payment confirmation email is suppressed whenever Stripe's automatic receipt emails are confirmed enabled on the account.",
  "Webhook-driven emails (payment_failed, payment_recovered, pause approvals, status updates) process events using idempotency keys to prevent duplicate sends.",
  "The terms checkbox is required and blocks submission; the marketing checkbox is optional, unchecked by default, and never pre-checked or bundled with terms.",
  "The signup page displays both the $495 charge-now amount and the selected plan's future monthly amount/date clearly before the final submit action.",
  "No cancellation deadline, proration rule, guarantee, included-but-unspecified service, or booking URL is hard-coded anywhere; all use explicit {{...NOT_CONFIGURED}} placeholders until confirmed.",
  "No founding/early-bird/charter pricing or framing appears anywhere, per FoundingOFF.",
  "Tax line items show $0 collected and never claim a tax exemption.",
  "The MODFXMEDIA LLC statement descriptor is disclosed to the member before payment is submitted.",
  "Lead-time emails (week 2, 8, 12) never state a guaranteed or promised delivery/fitting date.",
  "The care-after-fitting email is not activated until provider-approved care guidance copy replaces {{APPROVED_CARE_GUIDANCE_NOT_CONFIGURED}}.",
  "Consultation nurture emails only enroll leads with explicit, recorded marketing opt-in, and exit immediately on signup, booking, DND, unsubscribe, bounce, or complaint.",
  "The abandoned-signup email only sends where explicit follow-up consent was captured; it is never triggered by an email address alone, and never implies a card was charged.",
  "Pause acknowledgement and pause-approved emails are distinct templates tied to distinct events; approval is never implied by submission alone.",
  "The recurring charge reminder timing is derived from the real Stripe next-invoice date (T‑3 days), never a fabricated or estimated date.",
  "Griselda Hub authentication is verified to be a separate system from GHL user accounts before go-live.",
  "GHL sync status on the deal board reflects actual API responses (Synced/Pending/Failed with detail) and never defaults to 'Synced' optimistically.",
  "No workflow, automation, or lead enrollment in GHL is activated as a byproduct of this document; all mappings below are design references only.",
  "Before activation, sender domain authentication (SPF/DKIM/DMARC), reply-to address, and all internal alert recipients are configured and confirmed."
]
```
## Ghl Mapping
```json
{
  "tenant_id": "jv4grExvok7omWurc4PE",
  "pipeline_id": "arkMXixdGM81H9FjL2gc",
  "stages": [
    "New Leads",
    "Hot Leads",
    "Proposal Sent",
    "Phone Consult",
    "Video Consultation",
    "No show/Cancelled",
    "Active Clients",
    "No Buy/Nurture",
    "DND"
  ],
  "event_to_stage_semantic_mapping": [
    {
      "event": "lead.consultation_interest",
      "suggested_stage": "New Leads",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "lead.engaged/responded",
      "suggested_stage": "Hot Leads",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "proposal.sent",
      "suggested_stage": "Proposal Sent",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "appointment_type.phone_consult_scheduled",
      "suggested_stage": "Phone Consult",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "appointment_type.video_consult_scheduled",
      "suggested_stage": "Video Consultation",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "appointment.no_show_or_cancelled",
      "suggested_stage": "No show/Cancelled",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "membership.setup_payment_verified",
      "suggested_stage": "Active Clients",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "lead.declined_or_not_ready",
      "suggested_stage": "No Buy/Nurture",
      "automation_status": "manual move only — not enabled"
    },
    {
      "event": "contact.unsubscribe_or_dnd_request",
      "suggested_stage": "DND",
      "automation_status": "manual move only — not enabled"
    }
  ],
  "billing_state_separation": "Membership billing state (plan, invoice status, pause status) is tracked in the billing/subscription system, not as a CRM pipeline stage. A contact moving to 'Active Clients' reflects sales/CRM status only and must not be read as a live billing status.",
  "griselda_auth_note": "The Griselda Deal Hub uses its own local authentication. A Griselda Hub login does not create, require, or imply a GoHighLevel user account, and the two systems must be treated as independently authenticated.",
  "automation_status": "All mappings above are semantic design references only. No GHL workflow, trigger, automation, or lead enrollment has been created, enabled, or deployed as part of this document."
}
```
