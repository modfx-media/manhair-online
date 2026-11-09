"use client";

import { useEffect, useState } from "react";
import { formatStudio } from "@/lib/membership/dates";
import { formatUsd, SCHEDULING, TIERS, type TierId } from "@/lib/membership/offer";
import { trackPurchase } from "@/components/membership/track-client";

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
  serviceHold?: boolean;
  visits?: string;
  newSystemOrders?: string;
  payment?: {
    state: "pending" | "paid" | "failed";
    purchase: { transactionId: string; value: number; currency: string; itemId: string; itemName: string } | null;
  };
};

type Invoice = { id: string; kind: string; status: string; amountPaid: number; amountRefunded: number };
type Pause = { id: string; days: number; status: string };
type CancellationRequest = { id: string; createdAt: string };

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
  cancellationRequests = [],
  afterCheckout = false,
}: {
  member: MemberView | null;
  invoices: Invoice[];
  pauses: Pause[];
  cancellationRequests?: CancellationRequest[];
  afterCheckout?: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [live, setLive] = useState(member);
  useEffect(() => {
    if (!afterCheckout || !live || live.payment?.state !== "pending") return;
    let stopped = false;
    const timer = setInterval(() => {
      void fetch("/api/membership/account/", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok || stopped) return;
          const body = (await response.json()) as { member?: MemberView };
          if (body.member) setLive(body.member);
        })
        .catch(() => undefined);
    }, 4000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [afterCheckout, live]);
  useEffect(() => {
    if (live?.payment?.state === "paid" && live.payment.purchase) trackPurchase(live.payment.purchase);
  }, [live]);
  if (!live) {
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
          There is no signed-in member on this browser. Email a one-time sign-in link to the membership address.
          Entering the email does not open the account and does not start another payment.
          {afterCheckout ? " If you just finished checkout, a missing session is not a second charge." : ""}
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
          <h2 className="font-display text-2xl">{live.payment?.state === "paid" ? "Payment confirmed" : live.payment?.state === "failed" ? "Payment not confirmed" : "Confirming your payment"}</h2>
          <p className="mt-2">
            {live.payment?.state === "paid"
              ? "The processor confirmed the setup payment. It is credited toward the first system."
              : live.payment?.state === "failed"
                ? "The processor did not confirm a payment. You do not need to pay again unless you start a new checkout."
                : "Your checkout returned before the payment confirmation arrived. This page checks again every few seconds. You do not need to pay again."}
          </p>
          <p className="mt-2">The first system typically takes 8–12 weeks. The monthly charge can begin before the system is ready. That 30 days is not a promise that the system arrives.</p>
          <p className="mt-2">{SCHEDULING.summary}</p>
        </section>
      ) : null}
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Membership</p>
        <h1 className="mh-display mt-2 text-4xl">{live.tierName}</h1>
        <p className="mt-3 text-sm leading-6 text-ink-700">
          Status: {live.status}. {live.monthly} monthly after the first membership charge
          {live.firstRecurringAt ? ` on ${formatStudio(new Date(live.firstRecurringAt))}` : ""}.
          Setup {live.setup} is {live.setupPaid ? "marked paid by a processor event" : "not confirmed by a processor event yet"}.
        </p>
        {live.serviceHold ? (
          <section role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-900">
            <h2 className="font-semibold">Visits and new system orders are held</h2>
            <p className="mt-1">
              A monthly invoice is still unpaid after 14 days. The membership is not cancelled, and an order already underway is not cancelled.
              Updating the payment method stays available and does not clear this hold. The hold clears only after the processor verifies payment of every unpaid monthly invoice.
            </p>
            <p className="mt-1">Visits: {live.visits}. New system orders: {live.newSystemOrders}.</p>
          </section>
        ) : null}
        {live.attention ? (
          <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            The processor record needs review ({live.attention}). This page will not describe the billing timeline as confirmed.
          </p>
        ) : null}
      </header>
      <section className="grid gap-3 rounded-md border border-ink-300 bg-ink-100 p-4 text-sm leading-6">
        <p>Rate lock through {formatStudio(new Date(live.rateLockEndsAt))}.</p>
        <p>Minimum term through {formatStudio(new Date(live.minimumTermEndsAt))}.</p>
        <p>
          Systems used {live.systemsUsed} of {live.systemsIncluded}. Maintenance used {live.maintenanceUsed} of{" "}
          {live.maintenanceIncluded}. Pause days used {live.pauseDaysUsed} of 60.
        </p>
        <p>{live.paymentMethod}</p>
        <p>
          A failed monthly payment has 14 days before visits and new system orders are held. The membership is not cancelled, and an order already underway is not cancelled. Updating a card does not clear that hold. A verified payment does. Payment method update stays available.
        </p>
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
        <p className="text-sm leading-6 text-ink-700">
          This records a request for staff review. It does not change the processor, the next charge, or the membership status.
        </p>
        <button
          className="mh-btn mh-btn-ghost w-fit"
          type="button"
          onClick={async () => setMessage((await post("cancel", {})).message ?? "Cancellation was not changed.")}
        >
          Request cancellation
        </button>
        {live.cancelAt ? <p className="text-sm">A processor date is on file: {live.cancelAt}. This page does not treat a new request as that date.</p> : null}
        {cancellationRequests.length === 0 ? (
          <p className="text-sm text-ink-700">No cancellation requests.</p>
        ) : (
          <ul className="text-sm">
            {cancellationRequests.map((request) => (
              <li key={request.id}>{request.createdAt} · requested, billing unchanged</li>
            ))}
          </ul>
        )}
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
