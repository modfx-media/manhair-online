import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "@/components/membership/JoinForm";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { billingDisclosure, billingTimeline, formatStudio } from "@/lib/membership/dates";
import { PackageReview } from "@/components/membership/PackageReview";
import { TIERS, formatUsd, isTierId } from "@/lib/membership/offer";
import { foundingConfig, paymentBlockers, setupCentsFor } from "@/lib/membership/readiness";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Join",
  robots: { index: false, follow: false },
};

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; checkout?: string }>;
}) {
  const query = await searchParams;
  const tier = isTierId(query.tier) ? query.tier : "signature";
  const now = new Date();
  const blockers = paymentBlockers(process.env);
  const founding = foundingConfig(process.env);
  const offer = TIERS[tier];
  const setup = setupCentsFor(process.env, false);
  const timeline = billingTimeline(now);
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-5 py-12 md:py-16">
      <PreviewNotice />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Review before checkout</p>
        <h1 className="mh-display mt-2 text-4xl">{offer.name}</h1>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-copper-500 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Due today</dt>
            <dd className="mt-1 text-3xl font-semibold">{formatUsd(setup)}</dd>
            <dd className="mt-1 text-sm leading-6 text-ink-700">Custom Design & First Fitting. Charged now. Not the monthly membership.</dd>
          </div>
          <div className="rounded-md border border-ink-300 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">First monthly charge</dt>
            <dd className="mt-1 text-3xl font-semibold">{formatUsd(offer.monthlyCents)}</dd>
            <dd className="mt-1 text-sm leading-6 text-ink-700">Scheduled {formatStudio(timeline.firstRecurringAt)}, then each calendar month. The first system typically takes 8–12 weeks and is not promised in those 30 days.</dd>
          </div>
        </dl>
        <div className="mt-5">
          <PackageReview id={tier} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["essential", "signature", "elite"] as const).map((id) => (
            <Link key={id} href={`/join/?tier=${id}`} className={`rounded-full border px-3 py-2 ${id === tier ? "border-copper-500 bg-ink-100" : "border-ink-300"}`} aria-current={id === tier ? "page" : undefined}>
              {TIERS[id].name}
            </Link>
          ))}
        </div>
      </div>
      {query.checkout === "cancelled" ? (
        <p role="status" className="rounded-md border border-ink-300 bg-ink-100 px-4 py-3 text-sm">
          Checkout was cancelled. No charge was confirmed.
        </p>
      ) : null}
      <p className="text-sm leading-7 text-ink-800">{billingDisclosure(now, offer.monthlyCents, setup)}</p>
      {blockers.length > 0 ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {blockers[0]?.publicMessage} Checkout cannot start.
        </p>
      ) : null}
      <section className="rounded-md border border-ink-300 bg-ink-100 p-5 text-base leading-7">
        <h2 className="font-display text-2xl tracking-[-0.02em]">After checkout</h2>
        <p className="mt-3">You can pay before a consultation. A consultation request is not required, and it does not approve or block this checkout. Returning from the processor does not confirm a payment. A charge is recorded only after a verified processor event. The first system typically takes 8–12 weeks, and billing can begin before that fitting. Griselda arranges the visit manually after payment. There is no booking link here and no promised reply time. If staff later confirm the membership is unsuitable, the setup and collected membership charges are refunded and future billing is cancelled. The 3-month minimum does not block that case. This page does not make that decision, and it does not show a refund as complete before the processor confirms it.</p>
      </section>
      <JoinForm
        tier={tier}
        paymentsReady={blockers.length === 0}
        foundingOpen={founding.enabled}
        blockedMessage={blockers[0]?.publicMessage ?? null}
        preview={process.env.VERCEL_ENV === "preview"}
        setupConsent={`${formatUsd(setup)} is charged today for Custom Design & First Fitting.`}
        monthlyConsent={`I agree the first monthly charge of ${formatUsd(offer.monthlyCents)} is scheduled for ${formatStudio(timeline.firstRecurringAt)}, then each calendar month. The rate locks for 24 months. The minimum term is 3 months. A cancellation from the account page is a request and does not change billing until staff review it.`}
      />
    </main>
  );
}
