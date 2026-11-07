"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUsd } from "@/lib/membership/offer";
import { SCHEDULING } from "@/lib/membership/offer";
import type { DealRecord, DealStage } from "@/lib/membership/types";

type Snapshot = {
  ok: true;
  ghl: string;
  scheduling: { summary: string };
  messaging: string;
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
    note: string;
  };
  deals: DealRecord[];
};

async function post(action: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/membership/hub/?action=${action}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return response.json() as Promise<{ ok?: boolean; message?: string; error?: string }>;
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

  return (
    <div className="grid gap-8">
      <section className="grid gap-2 rounded-md border border-ink-300 bg-ink-100 p-4 text-sm leading-6">
        <p>GoHighLevel: {data.ghl === "off" ? "not connected. Deals stay in this app and are not sent to a CRM." : data.ghl}.</p>
        <p>{SCHEDULING.summary}</p>
        <p>Messaging is {data.messaging}. Drafts can be saved. Nothing is sent.</p>
        <button className="mh-btn mh-btn-ghost w-fit" type="button" onClick={() => void refresh()}>
          Refresh
        </button>
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
            <dt className="text-xs uppercase tracking-[0.14em] text-ink-600">Active monthly rate</dt>
            <dd className="mt-1 text-2xl">{formatUsd(data.revenue.activeMonthlyRateCents)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-sm text-ink-700">
          Setup collected {formatUsd(data.revenue.setupCollectedCents)}. Refunds recorded {formatUsd(data.revenue.refundedCents)}.
          Trialing monthly rate not yet charged {formatUsd(data.revenue.trialingMonthlyRateCents)}. {data.revenue.note}
        </p>
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
              <p className="text-xs uppercase tracking-[0.14em] text-ink-600">{deal.syncStatus}</p>
            </div>
            <p className="text-sm text-ink-700">{deal.email}</p>
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
              <label className="text-sm">
                Stage
                <select name="stage" defaultValue={deal.stage} className="mh-input mt-1">
                  {data.stages.map((item) => (
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
              <label className="text-sm">
                Next follow-up
                <input name="nextFollowUp" type="date" defaultValue={deal.nextFollowUp ?? ""} className="mh-input mt-1" />
              </label>
              <button className="mh-btn mh-btn-ghost sm:col-span-3 w-fit" type="submit">
                Save deal
              </button>
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
