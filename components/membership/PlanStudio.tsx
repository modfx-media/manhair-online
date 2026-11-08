"use client";

import { useState } from "react";
import Link from "next/link";
import { formatUsd } from "@/lib/membership/offer";
import type { PackageFact } from "@/lib/membership/packages";

export function PlanStudio({ plans }: { plans: PackageFact[] }) {
  const initial = plans.find((plan) => plan.isDefault)?.id ?? plans[0]?.id ?? "signature";
  const [selected, setSelected] = useState(initial);
  const current = plans.find((plan) => plan.id === selected) ?? plans[0]!;

  function choose(id: PackageFact["id"]) {
    setSelected(id);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`plan-${id}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  return (
    <div>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mh-scroll-bar {
            transform-origin: left center;
            animation: mh-scroll-bar linear both;
            animation-timeline: scroll(root block);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mh-scroll-bar { display: none; }
        }
        @keyframes mh-scroll-bar {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
      <div aria-hidden="true" className="mh-scroll-bar pointer-events-none fixed inset-x-0 top-0 z-30 hidden h-0.5 bg-copper-500 motion-safe:block" />
      <fieldset className="mx-auto max-w-6xl px-5 md:px-8">
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Choose a plan</legend>
        <div role="presentation" className="mt-3 grid grid-cols-3 gap-2">
          {plans.map((plan) => (
            <label
              key={plan.id}
              className={`flex min-h-11 cursor-pointer flex-col justify-center rounded-full border px-2 py-2 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-copper-500 has-[:checked]:border-copper-500 has-[:checked]:bg-white ${
                plan.id === selected ? "border-copper-500 bg-white" : "border-ink-300 bg-ink-100"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="membership-plan"
                value={plan.id}
                checked={plan.id === selected}
                onChange={() => choose(plan.id)}
              />
              <span className="text-sm font-semibold leading-5">{plan.name}</span>
              <span className="text-sm tabular-nums leading-5">{formatUsd(plan.monthlyCents)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mx-auto mt-6 grid max-w-6xl gap-5 px-5 md:grid-cols-3 md:px-8">
        {plans.map((plan) => (
          <article
            id={`plan-${plan.id}`}
            key={plan.id}
            className={`scroll-mt-24 flex flex-col rounded-md bg-white p-6 md:p-8 ${
              plan.isDefault ? "order-first border-2 border-copper-500 md:order-none" : "border border-ink-300"
            } ${plan.id === selected ? "ring-2 ring-copper-500" : ""}`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">{plan.isDefault ? "Default" : "Plan"}</p>
            <h2 className="mt-2 font-display text-4xl tracking-[-0.02em]">{plan.name}</h2>
            <p className="mt-2 text-base leading-7">{plan.choiceHeadline}</p>
            <p className="mt-6 font-display text-[clamp(2.75rem,12vw,3.75rem)] tabular-nums leading-none tracking-[-0.03em]">{formatUsd(plan.monthlyCents)}</p>
            <p className="mt-2 text-base leading-6 text-ink-800">per month, first charged 30 days after signup</p>
            <dl className="mt-8 grid grid-cols-2 gap-4 border-y border-ink-300 py-5">
              <div>
                <dt className="text-sm leading-5 text-ink-700">Hair systems</dt>
                <dd className="mt-1 font-display text-5xl tabular-nums">{plan.systems}</dd>
                <dd className="text-sm">a year</dd>
              </div>
              <div>
                <dt className="text-sm leading-5 text-ink-700">Maintenance visits</dt>
                <dd className="mt-1 font-display text-5xl tabular-nums">{plan.maintenance}</dd>
                <dd className="text-sm">a year</dd>
              </div>
            </dl>
            <p className="mt-5 text-base font-semibold leading-7">{plan.sumLabel}.</p>
            <h3 className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">Why this one</h3>
            <ul className="mt-2 grid gap-2 text-base leading-7">
              {plan.whyChoose.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">Best for</h3>
            <p className="mt-2 text-base leading-7">{plan.bestFor}</p>
            <p className="mt-3 text-sm leading-6 text-ink-700">{plan.annualNote}</p>
            <Link
              href={`/join/?tier=${plan.id}`}
              className="mh-btn mh-btn-primary mt-8 min-h-11 motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96]"
            >
              {plan.selectLabel}
            </Link>
          </article>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink-300 bg-ink-50/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:hidden">
        <Link
          href={`/join/?tier=${current.id}`}
          className="mh-btn mh-btn-primary min-h-11 w-full motion-safe:transition-transform motion-safe:duration-150 motion-safe:ease-out motion-safe:active:scale-[0.96]"
        >
          {current.selectLabel}
        </Link>
      </div>
    </div>
  );
}
