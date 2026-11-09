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
  const disclosure = billingDisclosure(now, offer.monthlyCents, setup);
  return (
    <main data-membership-join="" className="mx-auto grid max-w-3xl gap-6 px-5 py-8 pb-28 md:py-16 md:pb-16">
      <PreviewNotice />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Choose a plan</p>
        <h1 className="mh-display mt-2 text-4xl">{offer.name}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(["essential", "signature", "elite"] as const).map((id) => (
            <Link key={id} href={`/join/?tier=${id}`} className={`min-h-11 rounded-full border px-3 py-2 ${id === tier ? "border-copper-500 bg-ink-100" : "border-ink-300"}`} aria-current={id === tier ? "page" : undefined}>
              {TIERS[id].name} · {formatUsd(TIERS[id].monthlyCents)}/mo
            </Link>
          ))}
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border border-copper-500 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">Due today</dt>
            <dd className="mt-1 text-3xl font-semibold">{formatUsd(setup)}</dd>
            <dd className="mt-1 text-sm leading-6 text-ink-700">Setup, credited toward the first system. Not the monthly membership.</dd>
          </div>
          <div className="rounded-md border border-ink-300 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-600">First monthly charge</dt>
            <dd className="mt-1 text-3xl font-semibold">{formatUsd(offer.monthlyCents)}</dd>
            <dd className="mt-1 text-sm leading-6 text-ink-700">On {formatStudio(timeline.firstRecurringAt)}, then each month. The first system typically takes 8–12 weeks.</dd>
          </div>
        </dl>
      </div>
      {query.checkout === "cancelled" ? (
        <p role="status" className="rounded-md border border-ink-300 bg-ink-100 px-4 py-3 text-sm">
          Checkout was cancelled. No charge was confirmed.
        </p>
      ) : null}
      {blockers.length > 0 ? (
        <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {blockers[0]?.publicMessage} Checkout cannot start.
        </p>
      ) : null}
      <JoinForm
        tier={tier}
        tierName={offer.name}
        setupCents={setup}
        paymentsReady={blockers.length === 0}
        foundingOpen={founding.enabled}
        blockedMessage={blockers[0]?.publicMessage ?? null}
        preview={process.env.VERCEL_ENV === "preview"}
        setupConsent={`${formatUsd(setup)} is charged today and goes toward the first system.`}
        monthlyConsent={`I agree the first monthly charge of ${formatUsd(offer.monthlyCents)} is on ${formatStudio(timeline.firstRecurringAt)}, then each month. The rate locks for 24 months. The minimum term is 3 months, then month to month. A cancellation from the account page is a request and does not change billing until the studio reviews it.`}
      />
      <details className="rounded-md border border-ink-300 bg-white p-4 text-sm leading-6">
        <summary className="min-h-11 cursor-pointer font-semibold">Billing, refund, and scheduling details</summary>
        <p className="mt-3 text-ink-800">{disclosure}</p>
        <div className="mt-4">
          <PackageReview id={tier} />
        </div>
        <p className="mt-4">
          Full terms: <Link className="underline" href="/membership-terms/">membership terms</Link>. Refunds: <Link className="underline" href="/refund-policy/#membership">refund policy</Link>.
        </p>
      </details>
    </main>
  );
}
