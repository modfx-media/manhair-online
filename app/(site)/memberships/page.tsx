import type { Metadata } from "next";
import Link from "next/link";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { billingTimeline, formatStudio } from "@/lib/membership/dates";
import {
  MERCHANT,
  FIRST_SYSTEM_LEAD,
  SCHEDULING,
  SETUP_CENTS,
  TIERS,
  formatUsd,
  type TierId,
} from "@/lib/membership/offer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "ManHair memberships in Orange, CA. $495 setup today. Monthly plans of $449, $559, or $669 begin 30 days later. Thirteen studio visits a year.",
};

const ORDER: TierId[] = ["essential", "signature", "elite"];
const PRIMARY = "Start with Signature";

export default function MembershipsPage() {
  const timeline = billingTimeline(new Date());
  return (
    <div className="bg-ink-50 text-ink-900">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-14 md:px-8 md:py-24">
        <PreviewNotice />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">Orange studio</p>
        <h1 className="mh-display max-w-[16ch] text-balance text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.08] tracking-[-0.02em]">
          A standing plan for the hair you wear.
        </h1>
        <p className="max-w-[65ch] text-pretty text-lg leading-relaxed text-ink-800">
          Thirteen studio visits a year, about every four weeks. Systems and maintenance are spaced on that visit
          cadence, not once a month by the calendar. The design payment is charged today. The monthly membership starts
          30 days later.
        </p>
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link href="/join/?tier=signature" className="mh-btn mh-btn-primary mh-btn-lg min-h-11">
            {PRIMARY}
          </Link>
          <Link href="/consultation/" className="mh-btn mh-btn-ghost min-h-11">
            Request a consultation
          </Link>
        </div>
        <p className="max-w-[65ch] text-sm leading-6 text-ink-700">
          A consultation does not start a membership and does not book a chair. {SCHEDULING.summary}
        </p>
      </section>

      <section className="border-y border-ink-300 bg-ink-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-2 md:px-8 md:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Due today</p>
            <p className="mt-3 font-display text-5xl tabular-nums tracking-[-0.02em]">{formatUsd(SETUP_CENTS)}</p>
            <p className="mt-3 max-w-[42ch] text-pretty text-base leading-7 text-ink-800">
              Custom Design & First Fitting, charged now and credited toward the first system. It is not the monthly membership.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-700">Then monthly</p>
            <p className="mt-3 font-display text-5xl tabular-nums tracking-[-0.02em]">{formatUsd(TIERS.signature.monthlyCents)}</p>
            <p className="mt-3 max-w-[46ch] text-pretty text-base leading-7 text-ink-800">
              Signature is the default. Essential is {formatUsd(TIERS.essential.monthlyCents)} and Elite is{" "}
              {formatUsd(TIERS.elite.monthlyCents)}. The first monthly charge is {formatStudio(timeline.firstRecurringAt)}, then
              each calendar month. The first system typically takes {FIRST_SYSTEM_LEAD}. Billing can begin before that fitting.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-14 md:grid-cols-3 md:px-8 md:py-20">
        {ORDER.map((id) => {
          const tier = TIERS[id];
          return (
            <article
              key={id}
              className={`flex flex-col rounded-md bg-white p-6 md:p-8 ${
                tier.recommended ? "order-first border-2 border-copper-500 md:order-none" : "border border-ink-300"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-700">
                {tier.recommended ? "Default" : tier.name}
              </p>
              <h2 className="mt-3 font-display text-3xl tracking-[-0.02em]">{tier.name}</h2>
              <p className="mt-5 font-display text-5xl tabular-nums tracking-[-0.03em]">{formatUsd(tier.monthlyCents)}</p>
              <p className="text-sm leading-6 text-ink-700">per month after the first 30 days</p>
              <ul className="mt-6 grid gap-2 text-base leading-7">
                <li>{tier.systems} custom systems a year</li>
                <li>{tier.maintenance} maintenance visits a year</li>
                <li>13 visits total, about every 4 weeks</li>
                <li>{tier.priorityBooking ? "Priority scheduling when the studio calendar allows" : "Standard scheduling"}</li>
              </ul>
              <Link href={`/join/?tier=${tier.id}`} className="mh-btn mh-btn-primary mt-8 min-h-11">
                Select {tier.name}
              </Link>
            </article>
          );
        })}
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 md:px-8">
        <h2 className="font-display text-3xl tracking-[-0.02em]">Before you continue</h2>
        <div className="grid max-w-3xl gap-4 text-base leading-7 text-ink-800">
          <p>The price of the tier you join is locked for 24 months. The minimum term is 3 months, then month to month. During the minimum, cancellation is scheduled for the end of the minimum and adds no fee.</p>
          <p>The $295 founding setup is off. It is not part of this checkout.</p>
          <p>This checkout does not add sales tax. {MERCHANT.disclosure}</p>
          <p>This application does not issue refunds. A refund rule has not been approved. A support address for cancellation questions is not published on this page.</p>
        </div>
        <Link href="/join/?tier=signature" className="mh-btn mh-btn-primary mh-btn-lg min-h-11 w-fit">
          {PRIMARY}
        </Link>
      </section>
    </div>
  );
}
