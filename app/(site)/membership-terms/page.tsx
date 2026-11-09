import type { Metadata } from "next";
import { TERMS_VERSION, PAUSE_POLICY_VERSION, REFUND_POLICY, ADDON_POLICY } from "@/lib/membership/offer";

export const metadata: Metadata = {
  title: "Membership terms",
  description: "Commercial rules the ManHair membership application enforces. Attorney review is still pending.",
};

export default function MembershipTermsPage() {
  return (
    <main className="mx-auto grid max-w-3xl gap-4 px-5 py-16 text-sm leading-7 text-ink-800">
      <h1 className="mh-display text-4xl text-ink-950">Membership terms</h1>
      <p>Version {TERMS_VERSION}. These are the rules the application enforces. They are not a statement that a lawyer has approved them.</p>
      <p>Setup is charged at checkout and goes toward the first system. The first monthly membership charge is 30 days later, then monthly. Those 30 days are not unlimited free service. A first system typically takes 8–12 weeks and is not promised inside 30 days.</p>
      <p>The tier price is locked for 24 months from signup. A move to another tier uses that tier’s published price, is prorated by the processor, adds no change fee, and does not restart the 3-month minimum.</p>
      <p>After three months the plan is month to month. Online cancellation is a request for staff review and does not change billing by itself. {REFUND_POLICY.summary}</p>
      <p>Pause policy {PAUSE_POLICY_VERSION}: up to 60 days in an entitlement year. A request does not change billing by itself. An applied pause tells the processor to void invoices until the resume time, suspends studio use, and moves the minimum-term end and rate-lock end forward by the paused days. Attorney review of that term effect is pending.</p>
      <p>Visit and system balances follow an entitlement year, separate from the monthly bill. {ADDON_POLICY.summary}</p>
      <p>Studio scheduling is not connected to this application.</p>
    </main>
  );
}
