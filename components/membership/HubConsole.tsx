"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUsd } from "@/lib/membership/offer";
import { SCHEDULING } from "@/lib/membership/offer";
import type { DealRecord, DealStage } from "@/lib/membership/types";

type DealCard = DealRecord & { notes?: { id: string; body: string }[] };

type Snapshot = {
  ok: true;
  ghl: string;
  scheduling: { summary: string };
  messaging: string;
  messageTemplates?: Array<{ id: string; channel: string; enabled: false; sendable: false; blocks: string[] }>;
  freshness?: string;
  alerts?: Array<{ id: string; kind: string; audience: string; status: string; attempts: number; amountCents: number; memberId: string | null }>;
  cancellationRequests?: Array<{ id: string; memberId: string | null; createdAt: string }>;
  pauseRequests?: Array<{ id: string; memberId: string; days: number; status: string; createdAt: string }>;
  refundRequests?: Array<{ id: string; memberId: string; amountCents: number; status: string; createdAt: string }>;
  assignees: string[];
  stages: DealStage[];
  stageCounts: Record<string, number>;
  revenue: {
    cashCollectedCents: number;
    setupCollectedCents: number;
    recurringCollectedCents: number;
    refundedCents: number;
    netCashCents: number;
    activeMonthlyRateCents: number;
    trialingMonthlyRateCents: number;
    trialingUnpaidMonthlyCents: number;
    projectedMrrCents: number;
    note: string;
  };
  deals: DealCard[];
};

async function post(action: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/membership/hub/?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<{ ok?: boolean; message?: string; error?: string; freshness?: string }>;
}

export function HubConsole({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState(initial);
  const [stage, setStage] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [usageKey] = useState(() => `usage_${Math.random().toString(36).slice(2, 12)}`);

  async function refresh() {
    const response = await fetch("/api/membership/hub/", { cache: "no-store" });
    if (!response.ok) return;
    setData((await response.json()) as Snapshot);
  }

  useEffect(() => {
    const timer = setInterval(() => {
      void fetch("/api/membership/hub/", { cache: "no-store" })
        .then(async (response) => {
          if (response.ok) setData((await response.json()) as Snapshot);
        })
        .catch(() => undefined);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const deals = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return data.deals.filter((deal) => {
      if (stage !== "all" && deal.stage !== stage) return false;
      if (assignee !== "all" && deal.assignee !== assignee) return false;
      if (overdueOnly && (!deal.nextFollowUp || deal.nextFollowUp >= today)) return false;
      return true;
    });
  }, [assignee, data.deals, overdueOnly, stage]);

  const heldAlerts = (data.alerts ?? []).filter((alert) => alert.status === "held");
  return (
    <div className="grid gap-8">
      <section role="status" className="grid gap-2 rounded-md border border-ink-300 bg-white p-4 text-sm leading-6">
        <h2 className="font-display text-2xl">Held staff alerts ({heldAlerts.length})</h2>
        <p>These are saved and were not sent. They stay held until staff recipients and the email transport are configured. Nothing in this list is discarded.</p>
        {heldAlerts.length === 0 ? <p>No held alerts.</p> : (
          <ul>
            {heldAlerts.map((alert) => (
              <li key={alert.id}>{alert.kind} · {alert.audience} · held · member {alert.memberId ?? "unmapped"}</li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-2 rounded-md border border-ink-300 bg-ink-100 p-4 text-sm leading-6">
        <p>{data.freshness}</p>
        <p>Stage and follow-up changes stay in this hub. They reach HighLevel only after the ManHair location is authorized. Another agency location is not used.</p>
        <button
          className="mh-btn mh-btn-ghost w-fit"
          type="button"
          onClick={async () => {
            const result = await post("ghl-pull", {});
            setNotice(typeof result.freshness === "string" ? result.freshness : "Pull did not run.");
            await refresh();
          }}
        >
          Pull HighLevel now
        </button>
        <p>{SCHEDULING.summary}</p>
        <div>
          <p className="font-semibold">Pause requests</p>
          {(data.pauseRequests ?? []).length === 0 ? <p>None recorded. A member request does not change billing.</p> : (
            <ul>
              {(data.pauseRequests ?? []).map((request) => (
                <li key={request.id}>{request.createdAt} · member {request.memberId} · {request.days} days · {request.status}</li>
              ))}
            </ul>
          )}
          <p className="font-semibold">Cancellation requests</p>
          {(data.cancellationRequests ?? []).length === 0 ? (
            <p>None recorded. A member request does not change billing.</p>
          ) : (
            <ul>
              {(data.cancellationRequests ?? []).map((request) => (
                <li key={request.id}>{request.createdAt} · member {request.memberId ?? "unknown"} · billing unchanged</li>
              ))}
            </ul>
          )}
          <p className="font-semibold">Refund requests</p>
          {(data.refundRequests ?? []).length === 0 ? <p>None recorded. A request is not a completed refund.</p> : (
            <ul>
              {(data.refundRequests ?? []).map((request) => (
                <li key={request.id}>{request.createdAt} · member {request.memberId} · {formatUsd(request.amountCents)} · {request.status}</li>
              ))}
            </ul>
          )}
        </div>
        <form
          className="mt-2 grid gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await post("appointment", {
              memberId: form.get("memberId"),
              startsAt: form.get("startsAt"),
              timeZone: form.get("timeZone"),
              state: form.get("state"),
              note: form.get("note"),
            });
            setNotice(result.message ?? result.error ?? "The visit was not recorded.");
            await refresh();
          }}
        >
          <p className="font-semibold">Record a visit Griselda arranged</p>
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="memberId" placeholder="Member id" required />
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="startsAt" type="datetime-local" required />
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="timeZone" defaultValue="America/Los_Angeles" required />
          <select className="min-h-11 rounded-md border border-ink-300 px-3" name="state" defaultValue="scheduled">
            <option value="scheduled">Scheduled</option>
            <option value="updated">Updated</option>
            <option value="canceled">Canceled</option>
          </select>
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="note" placeholder="What was arranged" />
          <button className="mh-btn mh-btn-ghost w-fit" type="submit">Save visit</button>
        </form>
        <form
          className="mt-2 grid gap-2"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await post("suitability-failure", {
              memberId: form.get("memberId"),
              confirmation: form.get("confirmation"),
              note: form.get("note"),
            });
            setNotice(result.message ?? result.error ?? "The suitability request was not recorded.");
            await refresh();
          }}
        >
          <p className="font-semibold">Unsuitability request</p>
          <p>This asks for a refund of collected charges and an end to future billing. It stays a request until the processor confirms each part. It is not a receipt.</p>
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="memberId" placeholder="Member id" required />
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="confirmation" defaultValue="refund-and-cancel" required />
          <input className="min-h-11 rounded-md border border-ink-300 px-3" name="note" placeholder="What staff confirmed" required minLength={8} />
          <button className="mh-btn mh-btn-ghost w-fit" type="submit">Record suitability request</button>
        </form>
        <p>Messaging: {data.messaging}. Draft templates below are not approved copy.</p>
        <button className="mh-btn mh-btn-ghost w-fit" type="button" onClick={() => void refresh()}>
          Refresh
        </button>
      </section>
      <section>
        <h2 className="font-display text-2xl">Message drafts</h2>
        <p className="mt-2 text-sm leading-6 text-ink-700">
          These ids are waiting for owner copy. Marketing stops after signup, unsubscribe, or do-not-disturb. A fitting message is not planned without a staff-verified date. Stripe receipts are separate and are not duplicated here.
        </p>
        <ul className="mt-3 divide-y divide-ink-300 text-sm">
          {(data.messageTemplates ?? []).map((template) => (
            <li key={template.id} className="grid gap-1 py-2">
              <span className="font-semibold">{template.id}</span>
              <span className="text-ink-700">{template.channel} · disabled · not sendable · {template.blocks.join(", ")}</span>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="font-display text-2xl">Recorded money</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-ink-300 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink-600">Net cash</dt>
            <dd className="mt-1 text-2xl">{formatUsd(data.revenue.netCashCents)}</dd>
          </div>
          <div className="rounded-md border border-ink-300 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink-600">Recurring collected</dt>
            <dd className="mt-1 text-2xl">{formatUsd(data.revenue.recurringCollectedCents)}</dd>
          </div>
          <div className="rounded-md border border-ink-300 p-3">
            <dt className="text-xs uppercase tracking-[0.14em] text-ink-600">Projected MRR</dt>
            <dd className="mt-1 text-2xl">{formatUsd(data.revenue.projectedMrrCents)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-ink-700">
          Setup collected {formatUsd(data.revenue.setupCollectedCents)}. Recurring collected {formatUsd(data.revenue.recurringCollectedCents)}.
          Unpaid trial monthly rate {formatUsd(data.revenue.trialingUnpaidMonthlyCents)}. {data.revenue.note}
        </p>
      </section>
      <section>
        <h2 className="font-display text-2xl">Payment alerts</h2>
        <p className="mt-2 text-sm text-ink-700">
          Held alerts are recorded and not sent. Sending stays off until the owner recipient and sender are configured.
        </p>
        {(data.alerts ?? []).length === 0 ? <p className="mt-2 text-sm">No payment alerts recorded.</p> : null}
        <ul className="mt-3 divide-y divide-ink-300 text-sm">
          {(data.alerts ?? []).map((alert) => (
            <li key={alert.id} className="flex flex-wrap justify-between gap-2 py-2">
              <span>{alert.kind} · {alert.audience} · {alert.status} · tries {alert.attempts}</span>
              <span>{formatUsd(alert.amountCents)} · {alert.memberId ?? "unmapped"}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-wrap gap-3 text-sm">
        <label>
          Stage{" "}
          <select className="mh-input" value={stage} onChange={(event) => setStage(event.target.value)}>
            <option value="all">All</option>
            {data.stages.map((item) => (
              <option key={item} value={item}>
                {item} ({data.stageCounts[item] ?? 0})
              </option>
            ))}
          </select>
        </label>
        <label>
          Assignee{" "}
          <select className="mh-input" value={assignee} onChange={(event) => setAssignee(event.target.value)}>
            <option value="all">All</option>
            {data.assignees.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={overdueOnly} onChange={(event) => setOverdueOnly(event.target.checked)} />
          Follow-up due
        </label>
      </section>
      {deals.length === 0 ? <p className="text-sm text-ink-700">No deals match these filters.</p> : null}
      <ul className="grid gap-4">
        {deals.map((deal) => (
          <li key={deal.id} className="rounded-md border border-ink-300 bg-white p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl">{deal.name}</h3>
              <p className="text-xs uppercase tracking-[0.14em] text-ink-600">
                {deal.syncStatus}
                {deal.remoteUpdatedAt ? ` · remote ${deal.remoteUpdatedAt}` : " · no remote update"}
              </p>
            </div>
            <p className="text-sm text-ink-700">{deal.email}</p>
            {deal.stage.startsWith("unmapped:") ? (
              <p className="mt-1 text-sm text-ink-700">
                HighLevel sent stage {deal.stage.slice("unmapped:".length)}. It is not one of the nine marketing stages, so this card is not marked synced.
              </p>
            ) : null}
            {deal.notes && deal.notes.length > 0 ? (
              <ul className="mt-2 text-sm text-ink-700">
                {deal.notes.map((note) => (
                  <li key={note.id}>{note.body}</li>
                ))}
              </ul>
            ) : null}
            <form
              className="mt-3 grid gap-3 sm:grid-cols-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = await post("deal", {
                  id: deal.id,
                  name: deal.name,
                  email: deal.email,
                  stage: form.get("stage"),
                  assignee: form.get("assignee"),
                  nextFollowUp: form.get("nextFollowUp"),
                });
                setNotice(result.ok ? "Deal saved." : (result.message ?? result.error ?? "Deal was not saved."));
                await refresh();
              }}
            >
              <label className="text-sm sm:col-span-3">
                Stage
                <select name="stage" defaultValue={deal.stage} className="mh-input mt-1 min-h-11 text-base">
                  {(data.stages.includes(deal.stage) ? data.stages : [deal.stage, ...data.stages]).map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Assignee
                <select name="assignee" defaultValue={deal.assignee} className="mh-input mt-1">
                  <option value="">Unassigned</option>
                  {data.assignees.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm sm:col-span-3">
                Next follow-up
                <input name="nextFollowUp" type="date" defaultValue={deal.nextFollowUp ?? ""} className="mh-input mt-1 min-h-11 text-base" />
              </label>
              <div className="flex flex-wrap gap-2 sm:col-span-3">
                <button className="mh-btn mh-btn-primary min-h-11 w-full sm:w-fit" type="submit">
                  Save stage and follow-up
                </button>
                <button
                  className="mh-btn mh-btn-ghost w-fit"
                  type="button"
                  onClick={async () => {
                    const result = await post("delete-deal", { id: deal.id });
                    setNotice(result.message ?? "Lead was not removed.");
                    await refresh();
                  }}
                >
                  Remove local lead
                </button>
              </div>
            </form>
            <form
              className="mt-3 grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const note = String(new FormData(event.currentTarget).get("body") ?? "");
                const result = await post("note", { dealId: deal.id, body: note });
                setNotice(result.ok ? "Note saved." : "Note was not saved.");
                event.currentTarget.reset();
              }}
            >
              <label className="text-sm">
                Note
                <textarea name="body" required className="mh-input mt-1 min-h-20" />
              </label>
              <button className="mh-btn mh-btn-ghost w-fit" type="submit">
                Add note
              </button>
            </form>
            <form
              className="mt-3 grid gap-2"
              onSubmit={async (event) => {
                event.preventDefault();
                const result = await post("draft", { dealId: deal.id, body: String(new FormData(event.currentTarget).get("body") ?? "") });
                setNotice(result.message ?? "Draft saved. Nothing was sent.");
              }}
            >
              <label className="text-sm">
                Message draft
                <textarea name="body" className="mh-input mt-1 min-h-20" />
              </label>
              <div className="flex flex-wrap gap-2">
                <button className="mh-btn mh-btn-ghost" type="submit">
                  Save draft
                </button>
                <button className="mh-btn mh-btn-ghost" type="button" onClick={async () => setNotice((await post("send", { dealId: deal.id })).message ?? "Nothing was sent.")}>
                  Send (disabled)
                </button>
              </div>
            </form>
          </li>
        ))}
      </ul>
      <section className="rounded-md border border-ink-300 p-4">
        <h2 className="font-display text-2xl">Record a visit or system</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const result = await post("usage", {
              memberId: form.get("memberId"),
              kind: form.get("kind"),
              quantity: Number(form.get("quantity")),
              idempotencyKey: usageKey,
            });
            setNotice(result.ok ? `Usage ${"result" in result ? String(result.result) : "recorded"}.` : (result.error ?? "Usage was not recorded."));
          }}
        >
          <label className="text-sm sm:col-span-2">
            Member id
            <input name="memberId" required className="mh-input mt-1" />
          </label>
          <label className="text-sm">
            Kind
            <select name="kind" className="mh-input mt-1">
              <option value="maintenance">maintenance</option>
              <option value="system">system</option>
            </select>
          </label>
          <label className="text-sm">
            Quantity
            <input name="quantity" type="number" min={1} defaultValue={1} className="mh-input mt-1" />
          </label>
          <button className="mh-btn mh-btn-primary sm:col-span-4 w-fit" type="submit">
            Record use
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-600">Retry key for this page load: {usageKey}</p>
      </section>
      {notice ? (
        <p role="status" className="text-sm text-ink-800">
          {notice}
        </p>
      ) : null}
    </div>
  );
}
