import type { Metadata } from "next";
import Link from "next/link";
import { Display } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { billingTimeline, formatStudio } from "@/lib/membership/dates";
import {
  ADDON_POLICY,
  FIRST_SYSTEM_LEAD,
  REFUND_POLICY,
  SCHEDULING,
  SETUP_CENTS,
  TIERS,
  formatUsd,
  type TierId,
} from "@/lib/membership/offer";
import { foundingConfig } from "@/lib/membership/readiness";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Memberships",
  description:
    "ManHair monthly memberships for custom human-hair systems and studio maintenance in Orange, CA. Setup is charged today. The first membership charge is 30 days later.",
};

const ORDER: TierId[] = ["essential", "signature", "elite"];

export default function MembershipsPage() {
  const now = new Date();
  const timeline = billingTimeline(now);
  const founding = foundingConfig(process.env);
  return (
    <div className="bg-ink-50 text-ink-900">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:px-8 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-700">Orange studio membership</p>
        <Display as={1} size="hero">
          A standing plan for <em>the hair you actually wear.</em>
        </Display>
        <p className="max-w-2xl text-lg leading-8 text-ink-800">
          Thirteen studio visits a year, about every four weeks. One hundred percent human hair, cut and styled each
          visit. The design fee is charged today. The monthly membership starts 30 days later.
        </p>
        <div className="max-w-3xl rounded-md border border-copper-300 bg-ink-100 p-5 text-sm leading-7 text-ink-800">
          <p>
            {formatUsd(founding.enabled ? founding.setupCents : SETUP_CENTS)} Custom Design & First Fitting is charged
            today and goes toward the first system. It is not a separate initiation fee. The first monthly charge for
            the tier you choose is {formatStudio(timeline.firstRecurringAt)}, then monthly. The 30 days before that
            charge are not unlimited free service. The first system typically takes {FIRST_SYSTEM_LEAD} and is not
            promised within 30 days.
          </p>
          <p className="mt-3">
            The price of the tier you join is locked for 24 months. The minimum term is 3 months, then month to month.
            Online cancellation adds no fee. During the minimum, cancellation is scheduled for the end of the minimum.
            This application does not issue refunds. A refund rule has not been approved.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 md:grid-cols-3 md:px-8">
        {ORDER.map((id) => {
          const tier = TIERS[id];
          return (
            <article
              key={id}
              className={`flex flex-col rounded-md border bg-white p-6 ${tier.recommended ? "border-copper-500 shadow-[0_18px_50px_-28px_rgba(26,19,14,0.45)]" : "border-ink-300"}`}
            >
              {tier.badge ? (
                <p className="w-fit rounded-full bg-copper-500 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-ink-950">
                  {tier.badge}
                </p>
              ) : (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">{tier.fit}</p>
              )}
              <h2 className="mt-4 font-display text-3xl">{tier.name}</h2>
              <p className="mt-2 text-4xl font-semibold tracking-tight">{formatUsd(tier.monthlyCents)}</p>
              <p className="text-sm text-ink-600">per month after the first 30 days</p>
              <ul className="mt-6 grid flex-1 gap-2 text-sm leading-6">
                <li>{tier.systems} custom systems a year</li>
                <li>{tier.maintenance} maintenance visits a year</li>
                <li>13 visits total, about every 4 weeks</li>
                <li>{tier.priorityBooking ? "Priority booking when the studio schedule allows" : "Standard studio booking"}</li>
              </ul>
              <p className="mt-4 text-sm leading-6 text-ink-700">{tier.recommended ? tier.fit : tier.fit}</p>
              <Link href={`/join/?tier=${tier.id}`} className="mh-btn mh-btn-primary mt-6">
                Start now
              </Link>
            </article>
          );
        })}
      </section>
      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-20 md:grid-cols-2 md:px-8">
        <div>
          <h2 className="font-display text-3xl">Founding setup</h2>
          {founding.enabled ? (
            <p className="mt-3 text-sm leading-7 text-ink-800">
              Founding setup is {formatUsd(founding.setupCents)} for the first {founding.cap} checkouts that the
              database can still hold. No end date is published. Current clients were meant to go first, and this site
              has no current-client list, so that priority is not enforced.
            </p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-ink-800">
              The $295 founding setup for the first 25 members is switched off. It is not part of checkout, and this
              page does not count remaining spots.
            </p>
          )}
        </div>
        <div>
          <h2 className="font-display text-3xl">Published add-on prices</h2>
          <p className="mt-3 text-sm leading-7 text-ink-800">{ADDON_POLICY.summary}</p>
          <p className="mt-3 text-sm leading-7 text-ink-800">{REFUND_POLICY.summary}</p>
          <p className="mt-3 text-sm leading-7 text-ink-800">{SCHEDULING.summary}</p>
          <div className="mt-5">
            <BookingButton variant="ghost">Book a private consultation</BookingButton>
          </div>
        </div>
      </section>
    </div>
  );
}
