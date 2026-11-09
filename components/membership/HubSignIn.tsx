"use client";

import { useState } from "react";

export function HubSignIn({ linkExpired = false }: { linkExpired?: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid max-w-md gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        const email = String(new FormData(event.currentTarget).get("email") ?? "");
        const response = await fetch("/api/membership/hub/sign-in/", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const body = (await response.json()) as { message?: string };
        setPending(false);
        setMessage(body.message ?? "The sign-in link was not sent.");
      }}
    >
      {linkExpired ? (
        <p role="status" className="rounded-md border border-copper-500 bg-ink-100 px-3 py-2 text-sm leading-6">
          That hub link has expired or was already used. Request a new one. It works once and lasts 20 minutes.
        </p>
      ) : null}
      <p className="text-sm leading-7 text-ink-800">
        The studio hub uses a one-time email link. It is separate from the website admin, and it does not use a password.
      </p>
      <label className="grid gap-1 text-sm font-semibold">
        Work email
        <input name="email" type="email" required autoComplete="email" className="mh-input min-h-11" />
      </label>
      <button className="mh-btn mh-btn-primary min-h-11" type="submit" disabled={pending}>
        {pending ? "Sending" : "Email a sign-in link"}
      </button>
      {message ? <p role="status" className="text-sm leading-6">{message}</p> : null}
    </form>
  );
}
