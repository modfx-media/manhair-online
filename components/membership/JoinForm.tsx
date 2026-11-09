"use client";

import Link from "next/link";
import { useState } from "react";
import { SMS_CONSENT_TEXT } from "@/lib/membership/business";
import { TERMS_VERSION, type TierId } from "@/lib/membership/offer";
import { trackBeginCheckout } from "@/components/membership/track-client";

export function JoinForm({
  tier,
  tierName,
  setupCents,
  paymentsReady,
  foundingOpen,
  blockedMessage,
  setupConsent,
  monthlyConsent,
  preview,
}: {
  tier: TierId;
  tierName: string;
  setupCents: number;
  paymentsReady: boolean;
  foundingOpen: boolean;
  blockedMessage: string | null;
  setupConsent: string;
  monthlyConsent: string;
  preview: boolean;
}) {
  const [message, setMessage] = useState<string | null>(blockedMessage);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!paymentsReady) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/membership/checkout/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tier,
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
        termsAccepted: form.get("termsAccepted") === "on",
        autorenewAccepted: form.get("autorenewAccepted") === "on",
        founding: form.get("founding") === "on",
        marketingConsent: form.get("marketingConsent") === "on",
        smsConsent: form.get("smsConsent") === "on",
      }),
    });
    const body = (await response.json()) as { ok?: boolean; url?: string; message?: string; error?: string };
    setPending(false);
    if (body.ok && body.url) {
      trackBeginCheckout({ tier, tierName, value: setupCents / 100 });
      window.location.assign(body.url);
      return;
    }
    setMessage(body.error === "already_member" ? "already_member" : body.message ?? "Checkout did not start. No payment was taken.");
  }

  return (
    <form id="join-checkout" onSubmit={onSubmit} className="grid gap-4 pb-24 md:pb-0" noValidate={false}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold text-ink-900">
          First name
          <input name="firstName" required autoComplete="given-name" className="mh-input min-h-11 text-base" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-ink-900">
          Last name
          <input name="lastName" required autoComplete="family-name" className="mh-input min-h-11 text-base" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold text-ink-900">
        Email
        <input name="email" type="email" required autoComplete="email" className="mh-input min-h-11 text-base" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-ink-900">
        Phone <span className="font-normal text-ink-600">(optional)</span>
        <input name="phone" type="tel" autoComplete="tel" className="mh-input min-h-11 text-base" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="termsAccepted" type="checkbox" required className="mt-1 h-11 w-11 shrink-0" />
        <span>
          I accept the membership terms, version {TERMS_VERSION}, including this charge today: {setupConsent}{" "}
          <Link className="underline" href="/membership-terms/">
            Read the terms
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="autorenewAccepted" type="checkbox" required className="mt-1 h-11 w-11 shrink-0" />
        <span>{monthlyConsent}</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="smsConsent" type="checkbox" className="mt-1 h-11 w-11 shrink-0" />
        <span>{SMS_CONSENT_TEXT}</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="marketingConsent" type="checkbox" className="mt-1 h-11 w-11 shrink-0" />
        <span>Optional studio marketing. Leave this unchecked and no marketing sequence is planned. Payment and membership notices are separate, and none are sent until the owner approves the message.</span>
      </label>
      {foundingOpen ? (
        <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
          <input name="founding" type="checkbox" className="mt-1" />
          <span>Request the founding setup price if a spot is still open. Current-client priority is not connected.</span>
        </label>
      ) : null}
      <ul className="grid gap-2 rounded-md border border-copper-500 bg-ink-100 p-4 text-sm leading-6 text-ink-800">
        <li>Secure payment on Stripe. Card details stay on Stripe’s page.</li>
        <li>3-month minimum, then month to month. Cancellation from your account is a request until the studio confirms it.</li>
        <li>If the consultation finds the membership unsuitable, the setup and membership charges are refunded in full.</li>
      </ul>
      <button className="mh-btn mh-btn-primary mh-btn-lg min-h-11" type="submit" disabled={!paymentsReady || pending} aria-disabled={!paymentsReady || pending}>
        {pending ? "Opening secure checkout" : preview ? "Preview only — checkout is not a real charge" : "Continue to secure checkout"}
      </button>
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-300 bg-ink-50/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm md:hidden">
        <button className="mh-btn mh-btn-primary min-h-11 w-full" type="submit" form="join-checkout" disabled={!paymentsReady || pending}>
          {pending ? "Opening secure checkout" : "Continue to secure checkout"}
        </button>
      </div>
      <p className="text-sm leading-6 text-ink-700">
        Card details are entered on the payment processor’s page, not on ManHair. This button does not confirm a payment.
        {preview ? " This preview cannot open a live charge." : ""}
      </p>
      {message === "already_member" ? (
        <p role="alert" className="rounded-md border border-copper-500 bg-ink-100 px-3 py-2 text-sm leading-6">
          This email already has an active membership. <Link className="underline" href="/account/">Sign in to your account</Link> to manage it. No second membership was started.
        </p>
      ) : message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
