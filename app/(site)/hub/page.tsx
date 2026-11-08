import type { Metadata } from "next";
import Link from "next/link";
import { HubConsole } from "@/components/membership/HubConsole";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { staffRole } from "@/lib/membership/access";
import { handleHub } from "@/lib/membership/handlers";
import { currentStaffEmail, runtimeDeps } from "@/lib/membership/runtime";
import { reviewedLifecycle } from "@/lib/membership/lifecycle-review";
import { SCHEDULING } from "@/lib/membership/offer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio hub",
  robots: { index: false, follow: false },
};

function DraftList() {
  const reviewed = reviewedLifecycle();
  if (!reviewed.ok) return <p role="alert">Message drafts failed validation ({reviewed.error}). Nothing is sent.</p>;
  return (
    <section className="mt-6">
      <h2 className="font-display text-2xl">Message drafts</h2>
      <p className="mt-2 text-sm leading-6 text-ink-700">All {reviewed.emails.length} drafts are disabled. Unresolved booking, sender, support, care, and pause-billing facts block the messages that need them. Stripe receipt settings are not confirmed, so payment confirmations stay blocked.</p>
      <ul className="mt-3 divide-y divide-ink-300 text-sm">
        {reviewed.emails.map((email) => (
          <li key={email.id} className="py-2">
            <span className="font-semibold">{email.id}</span>
            <span className="mt-1 block text-ink-700">{email.blocks.join(", ")}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function HubPage() {
  const staff = await currentStaffEmail();
  const role = staffRole(staff.email, process.env);
  if (!role) {
    return (
      <main className="mx-auto grid max-w-xl gap-4 px-5 py-16">
        <PreviewNotice />
        <h1 className="mh-display text-4xl">Studio hub</h1>
        <p className="text-sm leading-7 text-ink-800">
          This page is for the owner and the studio coordinator. A hidden address is not access. Sign in with your own
          Payload account, and that email has to be on the server allowlist.
        </p>
        {staff.authError ? <p className="mt-3 text-sm text-red-800">{staff.authError}</p> : null}
        <Link className="mh-btn mh-btn-primary mt-6" href="/admin/">
          Staff sign-in
        </Link>
        <p className="mt-6 text-sm leading-7 text-ink-700">{SCHEDULING.summary}</p>
      </main>
    );
  }
  const response = await handleHub(new Request("https://www.manhaironline.com/api/membership/hub/"), runtimeDeps(staff.email));
  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="mh-display text-4xl">Studio hub</h1>
        <PreviewNotice />
        <p className="mt-4 text-sm leading-7">{body.error === "database_not_configured" ? "Membership storage is not connected on this preview, so leads cannot be loaded or changed here. This is not a synced HighLevel board." : "The hub could not be loaded."}</p>
        <DraftList />
      </main>
    );
  }
  const snapshot = await response.json();
  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-5 py-12">
      <PreviewNotice />
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">{role}</p>
      <h1 className="mh-display mt-2 text-4xl">Lead hub</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-700">
        Griselda follows and coordinates ManHair leads here. Stages, assignee, notes, and follow-up are stored for the
        studio. Nothing on this page confirms an appointment.
      </p>
      <div className="mt-8">
        <HubConsole initial={snapshot} />
      </div>
    </main>
  );
}
