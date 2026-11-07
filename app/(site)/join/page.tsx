import type { Metadata } from "next";
import Link from "next/link";
import { JoinForm } from "@/components/membership/JoinForm";
import { billingDisclosure, billingTimeline, formatStudio } from "@/lib/membership/dates";
import { SETUP_CENTS, TIERS, formatUsd, isTierId } from "@/lib/membership/offer";
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
  const tier = isTierId(query.tier) ? query.tier : null;
  const now = new Date();
  const blockers = paymentBlockers(process.env);
  const founding = foundingConfig(process.env);
  if (!tier) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="mh-display text-4xl">Choose a membership</h1>
        <p className="mt-4 text-sm leading-7">Checkout needs a tier from the membership page.</p>
        <Link className="mh-btn mh-btn-primary mt-6" href="/memberships/">
          View memberships
        </Link>
      </main>
    );
  }
  const offer = TIERS[tier];
  const setup = setupCentsFor(process.env, false);
  const timeline = billingTimeline(now);
  return (
    <main className="mx-auto grid max-w-3xl gap-8 px-5 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Secure checkout</p>
        <h1 className="mh-display mt-2 text-4xl">{offer.name}</h1>
        <p className="mt-3 text-sm leading-7 text-ink-800">
          {formatUsd(setup)} setup today. {formatUsd(offer.monthlyCents)} starting {formatStudio(timeline.firstRecurringAt)}, then monthly.
          Standard setup is {formatUsd(SETUP_CENTS)} unless founding is open and you request it.
        </p>
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
      <JoinForm
        tier={tier}
        paymentsReady={blockers.length === 0}
        foundingOpen={founding.enabled}
        blockedMessage={blockers[0]?.publicMessage ?? null}
      />
    </main>
  );
}
