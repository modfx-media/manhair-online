import type { Metadata } from "next";
import Link from "next/link";
import { HubConsole } from "@/components/membership/HubConsole";
import { staffRole } from "@/lib/membership/access";
import { handleHub } from "@/lib/membership/handlers";
import { currentStaffEmail, runtimeDeps } from "@/lib/membership/runtime";
import { SCHEDULING } from "@/lib/membership/offer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Studio hub",
  robots: { index: false, follow: false },
};

export default async function HubPage() {
  const staff = await currentStaffEmail();
  const role = staffRole(staff.email, process.env);
  if (!role) {
    return (
      <main className="mx-auto max-w-xl px-5 py-16">
        <h1 className="mh-display text-4xl">Studio hub</h1>
        <p className="mt-4 text-sm leading-7 text-ink-800">
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
        <p className="mt-4 text-sm">{body.error === "database_not_configured" ? "Membership storage is not configured." : "The hub could not be loaded."}</p>
      </main>
    );
  }
  const snapshot = await response.json();
  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
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
