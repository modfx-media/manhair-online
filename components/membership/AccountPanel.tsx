"use client";

import { useState } from "react";
import { formatStudio } from "@/lib/membership/dates";
import { formatUsd, SCHEDULING, TIERS, type TierId } from "@/lib/membership/offer";

type MemberView = {
  id: string;
  firstName: string;
  tier: TierId;
  tierName: string;
  status: string;
  monthly: string;
  setup: string;
  setupPaid: boolean;
  attention: string | null;
  systemsUsed: number;
  systemsIncluded: number;
  maintenanceUsed: number;
  maintenanceIncluded: number;
  pauseDaysUsed: number;
  cancelAt: string | null;
  pauseCollection: boolean;
  firstRecurringAt: string | null;
  minimumTermEndsAt: string;
  rateLockEndsAt: string;
  paymentMethod: string;
};

type Invoice = { id: string; kind: string; status: string; amountPaid: number; amountRefunded: number };
type Pause = { id: string; days: number; status: string };

async function post(action: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/membership/account/?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await response.json()) as { ok?: boolean; message?: string; url?: string; error?: string };
}

export function AccountPanel({
  member,
  invoices,
  pauses,
  afterCheckout = false,
}: {
  member: MemberView | null;
  invoices: Invoice[];
  pauses: Pause[];
  afterCheckout?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  if (!member) {
    return (
      <form
        className="grid max-w-md gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await post("recover", { email: String(new FormData(event.currentTarget).get("email") ?? "") });
          setMessage(result.message ?? "Sign-in email was not sent.");
        }}
      >
        <h1 className="mh-display text-4xl">Your membership</h1>
        <p className="text-sm leading-6 text-ink-700">
          There is no signed-in member on this browser. A later visit uses a one-time link sent to the membership email.
          Entering the email does not open the account and does not start another payment.
        </p>
        <label className="grid gap-1 text-sm font-semibold">
          Email
          <input name="email" type="email" required className="mh-input" />
        </label>
        <button className="mh-btn mh-btn-ghost" type="submit">
          Email a sign-in link
        </button>
        {message ? (
          <p role="status" className="text-sm text-ink-800">
            {message}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <div className="grid gap-8">
      {afterCheckout ? (
        <section role="status" className="rounded-md border border-copper-500 bg-ink-100 p-4 text-sm leading-6">
          <h2 className="font-display text-2xl">Next steps</h2>
          <p className="mt-2">Returning from checkout does not confirm a charge. The processor webhook is what marks setup as paid.</p>
          <p className="mt-2">The first system typically takes 8–12 weeks. The monthly charge can begin before the system is ready. That 30 days is not a promise that the system arrives.</p>
          <p className="mt-2">{SCHEDULING.summary}</p>
        </section>
      ) : null}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Membership</p>
        <h1 className="mh-display mt-2 text-4xl">{member.tierName}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          Status: {member.status}. {member.monthly} monthly after the first membership charge
          {member.firstRecurringAt ? ` on ${formatStudio(new Date(member.firstRecurringAt))}` : ""}.
          Setup {member.setup} is {member.setupPaid ? "marked paid by a processor event" : "not confirmed by a processor event yet"}.
        </p>
        {member.attention ? (
          <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            The processor record needs review ({member.attention}). This page will not describe the billing timeline as confirmed.
          </p>
        ) : null}
      </header>
      <section className="grid gap-3 rounded-md border border-ink-300 bg-ink-100 p-4 text-sm leading-6">
        <p>Rate lock through {formatStudio(new Date(member.rateLockEndsAt))}.</p>
        <p>Minimum term through {formatStudio(new Date(member.minimumTermEndsAt))}.</p>
        <p>
          Systems used {member.systemsUsed} of {member.systemsIncluded}. Maintenance used {member.maintenanceUsed} of{" "}
          {member.maintenanceIncluded}. Pause days used {member.pauseDaysUsed} of 60.
        </p>
        <p>{member.paymentMethod}</p>
        <p>{SCHEDULING.summary}</p>
      </section>
      <section>
        <h2 className="font-display text-2xl">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-ink-700">No processor invoices have been recorded.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink-300 border-y border-ink-300">
            {invoices.map((invoice) => (
              <li key={invoice.id} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  {invoice.kind} · {invoice.status}
                </span>
                <span>{formatUsd(invoice.amountPaid)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Cancellation</h2>
        <button
          className="mh-btn mh-btn-ghost w-fit"
          type="button"
          onClick={async () => setMessage((await post("cancel", {})).message ?? "Cancellation was not changed.")}
        >
          Schedule cancellation
        </button>
        {member.cancelAt ? <p className="text-sm">Scheduled for {member.cancelAt}.</p> : null}
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Pause request</h2>
        <p className="text-sm leading-6 text-ink-700">
          Sending this form only records a request. It does not pause billing, collection, or studio access.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            const days = Number(new FormData(event.currentTarget).get("days"));
            setMessage((await post("pause", { days })).message ?? "Pause was not changed.");
          }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Days
            <input name="days" type="number" min={1} max={60} defaultValue={14} className="mh-input w-28" />
          </label>
          <button className="mh-btn mh-btn-ghost" type="submit">
            Record pause request
          </button>
        </form>
        {pauses.length === 0 ? <p className="text-sm text-ink-700">No pause requests.</p> : null}
        <ul className="text-sm">
          {pauses.map((pause) => (
            <li key={pause.id}>
              {pause.days} days · {pause.status === "requested" ? "requested, billing unchanged" : pause.status}
            </li>
          ))}
        </ul>
      </section>
      <section className="grid gap-3">
        <h2 className="font-display text-2xl">Change tier</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TIERS) as TierId[]).map((tier) => (
            <button
              key={tier}
              className="mh-btn mh-btn-ghost"
              type="button"
              onClick={async () => setMessage((await post("tier", { tier })).message ?? "Tier was not changed.")}
            >
              {TIERS[tier].name}
            </button>
          ))}
        </div>
      </section>
      <button
        className="mh-btn mh-btn-primary w-fit"
        type="button"
        onClick={async () => {
          const result = await post("portal", {});
          if (result.ok && result.url) window.location.assign(result.url);
          else setMessage(result.message ?? "Payment method update is not available.");
        }}
      >
        Update payment method
      </button>
      <button className="mh-btn mh-btn-ghost w-fit" type="button" onClick={async () => setMessage((await post("logout", {})).ok ? "Signed out." : "Still signed in.")}>
        Sign out
      </button>
      {message ? (
        <p role="status" className="text-sm leading-6 text-ink-800">
          {message}
        </p>
      ) : null}
    </div>
  );
}
