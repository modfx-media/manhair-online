import type { Metadata } from "next";
import Link from "next/link";
import { businessIdentity, statementDescriptorSuffix } from "@/lib/membership/business";
import { EXTRA_MAINTENANCE_CENTS, EXTRA_SYSTEM_CENTS, REFUND_POLICY, SCHEDULING, TERMS_VERSION, formatUsd } from "@/lib/membership/offer";

export const metadata: Metadata = {
  title: "Membership terms",
  description: "ManHair membership prices, billing dates, pause, and the consultation refund.",
};

export default function MembershipTermsPage() {
  const business = businessIdentity(process.env);
  const descriptor = statementDescriptorSuffix(process.env);
  return (
    <main className="mx-auto grid max-w-3xl gap-4 px-5 py-16 text-sm leading-7 text-ink-800">
      <h1 className="mh-display text-4xl text-ink-950">Membership terms</h1>
      <p>Version {TERMS_VERSION}.</p>
      <p>Essential is {formatUsd(44900)} a month. Signature is {formatUsd(55900)} a month. Elite is {formatUsd(66900)} a month. Each plan includes 13 studio visits a year. The plans differ by how many of those visits are hair systems.</p>
      <p>The {formatUsd(49500)} setup is charged at signup and goes toward the first system. The first monthly charge is 30 days after signup, then each month. Those 30 days are not unlimited service. A first system typically takes 8–12 weeks, and billing can start before that fitting.</p>
      <p>The minimum term is 3 months, then the plan is month to month. The monthly rate of the plan you join is locked for 24 months. A cancellation from the account page is a request. It does not change billing until the studio reviews it.</p>
      <p>You can request a pause of up to 60 days a year. A request does not pause billing by itself.</p>
      <p>{REFUND_POLICY.summary}</p>
      <p>If a monthly payment fails, there are 14 days before visits and new system orders are held. The membership is not cancelled, and an order already underway is not cancelled. The hold ends when the unpaid monthly invoices are paid.</p>
      <p>An additional fitted system is {formatUsd(EXTRA_SYSTEM_CENTS)}. An extra maintenance visit is {formatUsd(EXTRA_MAINTENANCE_CENTS)}.</p>
      <p>Card charges show on your statement as {descriptor}.</p>
      <p>
        {business.legalName}. {business.publicAddress}. Questions: {business.supportEmail}
        {business.publicPhone ? `. ${business.publicPhone}` : ""}.
      </p>
      <p>{SCHEDULING.summary}</p>
      <p>
        Product returns for stock and custom orders are on the <Link className="underline" href="/refund-policy/#membership">refund policy</Link>.
      </p>
    </main>
  );
}
