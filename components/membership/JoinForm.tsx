"use client";

import Link from "next/link";
import { useState } from "react";
import { TERMS_VERSION, type TierId } from "@/lib/membership/offer";

export function JoinForm({
  tier,
  paymentsReady,
  foundingOpen,
  blockedMessage,
  setupConsent,
  monthlyConsent,
  preview,
}: {
  tier: TierId;
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
      }),
    });
    const body = (await response.json()) as { ok?: boolean; url?: string; message?: string; error?: string };
    setPending(false);
    if (body.ok && body.url) {
      window.location.assign(body.url);
      return;
    }
    setMessage(body.message ?? "Checkout did not start. No payment was taken.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate={false}>
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
        <input name="termsAccepted" type="checkbox" required className="mt-1" />
        <span>
          I accept the membership terms, version {TERMS_VERSION}, including this charge today: {setupConsent}{" "}
          <Link className="underline" href="/membership-terms/">
            Read the terms
          </Link>
          .
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="autorenewAccepted" type="checkbox" required className="mt-1 size-4" />
        <span>{monthlyConsent}</span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
        <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
        <span>Optional studio marketing. Leave this unchecked and no marketing sequence is planned. Payment and membership notices are separate, and none are sent until the owner approves the message.</span>
      </label>
      {foundingOpen ? (
        <label className="flex items-start gap-3 text-sm leading-6 text-ink-800">
          <input name="founding" type="checkbox" className="mt-1" />
          <span>Request the founding setup price if a spot is still open. Current-client priority is not connected.</span>
        </label>
      ) : null}
      <button className="mh-btn mh-btn-primary mh-btn-lg min-h-11" type="submit" disabled={!paymentsReady || pending} aria-disabled={!paymentsReady || pending}>
        {pending ? "Opening secure checkout" : preview ? "Preview only — checkout is not a real charge" : "Continue to secure checkout"}
      </button>
      <p className="text-sm leading-6 text-ink-700">
        Card details are entered on the payment processor’s page, not on ManHair. This button does not confirm a payment.
        {preview ? " This preview cannot open a live charge." : ""}
      </p>
      {message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
