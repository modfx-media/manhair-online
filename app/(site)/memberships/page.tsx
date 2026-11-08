import type { Metadata } from "next";
import Link from "next/link";
import { PlanStudio } from "@/components/membership/PlanStudio";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { billingTimeline, formatStudio } from "@/lib/membership/dates";
import { MERCHANT, SCHEDULING, formatUsd } from "@/lib/membership/offer";
import { PACKAGE_PAGE, packageFacts, SHARED_PACKAGE, SYSTEM_VS_MAINTENANCE, VISIT_CADENCE } from "@/lib/membership/packages";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "Compare ManHair memberships. Essential, Signature, and Elite each include 13 studio visits a year. They differ by how many of those visits are hair systems.",
};

export default function MembershipsPage() {
  const plans = packageFacts();
  const firstMonthly = formatStudio(billingTimeline(new Date()).firstRecurringAt);
  return (
    <div className="bg-ink-50 pb-28 text-ink-900 sm:pb-0">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:px-8 md:py-20">
        <PreviewNotice />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">Orange studio</p>
        <h1 className="mh-display max-w-[14ch] text-balance text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.08] tracking-[-0.02em]">
          {PACKAGE_PAGE.headline}
        </h1>
        <p className="max-w-[65ch] text-pretty text-lg leading-relaxed text-ink-800">{PACKAGE_PAGE.subhead}</p>
        <p className="max-w-[65ch] text-pretty text-lg leading-relaxed text-ink-800">{SYSTEM_VS_MAINTENANCE}</p>
        <p className="max-w-[65ch] text-pretty text-lg leading-relaxed text-ink-800">{VISIT_CADENCE}</p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link href="/join/?tier=signature" className="mh-btn mh-btn-primary mh-btn-lg min-h-11">
            {PACKAGE_PAGE.primaryCta}
          </Link>
          <Link href="/consultation/" className="mh-btn mh-btn-ghost min-h-11">
            Request a consultation
          </Link>
        </div>
      </section>

      <PlanStudio plans={plans} />

      <section className="border-y border-ink-300 bg-ink-100" aria-labelledby="mix-heading">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:px-8">
          <h2 id="mix-heading" className="font-display text-3xl tracking-[-0.02em]">The mix, side by side</h2>
          <div className="grid gap-4">
            {[
              { label: "Monthly price", values: plans.map((plan) => formatUsd(plan.monthlyCents)) },
              { label: "Hair systems a year", values: plans.map((plan) => String(plan.systems)) },
              { label: "Maintenance visits a year", values: plans.map((plan) => String(plan.maintenance)) },
              { label: "Scheduled visits a year", values: plans.map((plan) => String(plan.visits)) },
              { label: "Priority booking", values: plans.map((plan) => (plan.priorityBooking ? "Yes" : "No")) },
            ].map((row) => (
              <div key={row.label} className="rounded-md bg-white p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-ink-700">{row.label}</h3>
                <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                  {plans.map((plan, index) => (
                    <div key={plan.id}>
                      <dt className="text-sm text-ink-700">{plan.name}</dt>
                      <dd className="font-display text-3xl tabular-nums">{row.values[index]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-20">
        <div>
          <h2 className="font-display text-3xl tracking-[-0.02em]">What you pay, and when</h2>
          <dl className="mt-6 grid gap-5 text-base leading-7">
            <div>
              <dt className="font-semibold">Today</dt>
              <dd>{formatUsd(SHARED_PACKAGE.setupCents)} {SHARED_PACKAGE.setupName}. Charged now and credited toward the first system. It is not a separate initiation fee, and it is not the monthly membership.</dd>
            </div>
            <div>
              <dt className="font-semibold">In {SHARED_PACKAGE.trialDays} days, on {firstMonthly}</dt>
              <dd>The first monthly charge for the plan you chose, then each calendar month. The 30 days are not unlimited service.</dd>
            </div>
            <div>
              <dt className="font-semibold">First system</dt>
              <dd>Typically {SHARED_PACKAGE.leadTime}. Monthly billing can start before that fitting. The fitting date is not booked here.</dd>
            </div>
            <div>
              <dt className="font-semibold">Term</dt>
              <dd>{SHARED_PACKAGE.minimumMonths}-month minimum, then month to month. The monthly rate you join at is locked for {SHARED_PACKAGE.rateLockMonths} months. During the minimum, cancellation is scheduled for the end of the minimum and adds no fee.</dd>
            </div>
            <div>
              <dt className="font-semibold">Pause</dt>
              <dd>You can request a pause of up to {SHARED_PACKAGE.pauseDays} days a year. A request is not an automatic suspension.</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-md border border-ink-300 bg-white p-6">
          <h2 className="font-display text-3xl tracking-[-0.02em]">Not in the monthly price</h2>
          <ul className="mt-4 grid gap-3 text-base leading-7">
            <li>An additional fitted system is {formatUsd(SHARED_PACKAGE.extraSystemCents)}. An extra maintenance visit is {formatUsd(SHARED_PACKAGE.extraMaintenanceCents)}. Checkout does not sell either one.</li>
            <li>The $295 founding setup is off.</li>
            <li>This checkout does not add sales tax. That is the current practice, not a claim of a legal exemption. {MERCHANT.disclosure}</li>
            <li>This application does not issue refunds. A refund rule has not been approved.</li>
            <li>{SCHEDULING.summary}</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-3xl gap-4 px-5 pb-16 md:px-8">
        <h2 className="font-display text-3xl tracking-[-0.02em]">Questions</h2>
        <details className="rounded-md border border-ink-300 bg-white p-4">
          <summary className="min-h-11 cursor-pointer text-base font-semibold">Are all 13 visits maintenance?</summary>
          <p className="mt-2 text-base leading-7">{SYSTEM_VS_MAINTENANCE}</p>
        </details>
        <details className="rounded-md border border-ink-300 bg-white p-4">
          <summary className="min-h-11 cursor-pointer text-base font-semibold">Do I pay the monthly amount today?</summary>
          <p className="mt-2 text-base leading-7">No. Today is the {formatUsd(SHARED_PACKAGE.setupCents)} setup. The monthly amount starts 30 days later.</p>
        </details>
        <details className="rounded-md border border-ink-300 bg-white p-4">
          <summary className="min-h-11 cursor-pointer text-base font-semibold">Is the yearly figure a prepaid plan?</summary>
          <p className="mt-2 text-base leading-7">No. It is twelve monthly charges added together, and it leaves out the setup. There is no annual discount.</p>
        </details>
        <Link href="/join/?tier=signature" className="mh-btn mh-btn-primary mh-btn-lg mt-4 min-h-11 w-fit">
          {PACKAGE_PAGE.primaryCta}
        </Link>
        <p className="text-sm leading-6 text-ink-700">
          Not ready to join? <Link className="underline" href="/consultation/">Request a consultation</Link>. That request does not start a payment or book a time.
        </p>
      </section>
    </div>
  );
}
