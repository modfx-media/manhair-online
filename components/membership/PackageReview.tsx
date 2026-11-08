import { packageFact } from "@/lib/membership/packages";
import { formatUsd } from "@/lib/membership/offer";
import type { TierId } from "@/lib/membership/offer";

export function PackageReview({ id }: { id: TierId }) {
  const plan = packageFact(id);
  return (
    <div className="rounded-md border border-ink-300 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">This plan includes</p>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-ink-700">Hair systems</dt>
          <dd className="mt-1 font-display text-4xl tabular-nums">{plan.systems}</dd>
          <dd className="text-sm leading-6">a year</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-700">Maintenance visits</dt>
          <dd className="mt-1 font-display text-4xl tabular-nums">{plan.maintenance}</dd>
          <dd className="text-sm leading-6">a year</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-700">Scheduled visits</dt>
          <dd className="mt-1 font-display text-4xl tabular-nums">{plan.visits}</dd>
          <dd className="text-sm leading-6">a year</dd>
        </div>
      </dl>
      <p className="mt-4 text-base leading-7">{plan.choiceHeadline}</p>
      <p className="mt-2 text-base leading-7">{plan.mixLabel}.</p>
      <p className="mt-2 text-base font-semibold leading-7">{plan.sumLabel}.</p>
      <p className="mt-2 text-base leading-7">{plan.difference}</p>
      <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">Why this one</h3>
      <ul className="mt-2 grid gap-2 text-base leading-7">
        {plan.whyChoose.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">Best for</h3>
      <p className="mt-2 text-base leading-7">{plan.bestFor}</p>
      <p className="mt-2 text-sm leading-6 text-ink-700">
        Monthly price {formatUsd(plan.monthlyCents)}. {plan.annualNote}
      </p>
    </div>
  );
}
