"use client";

import { useState } from "react";

export function ConsultForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/membership/consultation/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        firstName: form.get("firstName"),
        lastName: form.get("lastName"),
        email: form.get("email"),
        phone: form.get("phone"),
        marketingConsent: form.get("marketingConsent") === "on",
      }),
    });
    const body = (await response.json()) as { ok?: boolean; message?: string; synced?: boolean };
    setPending(false);
    if (!response.ok || !body.ok) {
      setMessage(body.message ?? "The request was not stored. Nothing was sent.");
      return;
    }
    setDone(true);
    setMessage(body.message ?? "Stored for the studio. Not sent and not marked synced.");
  }

  if (done) {
    return (
      <p role="status" className="rounded-md border border-ink-300 bg-white px-4 py-4 text-sm leading-6">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          First name
          <input name="firstName" required autoComplete="given-name" className="mh-input min-h-11" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Last name
          <input name="lastName" required autoComplete="family-name" className="mh-input min-h-11" />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Email
        <input name="email" type="email" required autoComplete="email" className="mh-input min-h-11" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Phone <span className="font-normal text-ink-600">(optional)</span>
        <input name="phone" type="tel" autoComplete="tel" className="mh-input min-h-11" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input name="marketingConsent" type="checkbox" className="mt-1 size-4" />
        <span>Studio updates about consultations are optional. Leave this unchecked and we will not plan marketing messages. This is not the membership checkout.</span>
      </label>
      <button className="mh-btn mh-btn-primary min-h-11" type="submit" disabled={pending}>
        {pending ? "Saving" : "Request a consultation"}
      </button>
      <p className="text-sm leading-6 text-ink-700">This does not start a payment, book a visit, or send an email.</p>
      {message ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {message}
        </p>
      ) : null}
    </form>
  );
}
