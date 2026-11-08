import type { Metadata } from "next";
import Link from "next/link";
import { ConsultForm } from "@/components/membership/ConsultForm";
import { PreviewNotice } from "@/components/membership/PreviewNotice";
import { SCHEDULING } from "@/lib/membership/offer";

export const metadata: Metadata = {
  title: "Consultation",
  robots: { index: false, follow: false },
};

export default function ConsultationPage() {
  return (
    <main className="mx-auto grid max-w-xl gap-6 px-5 py-12 md:py-16">
      <PreviewNotice />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-600">Not a membership</p>
        <h1 className="mh-display mt-2 text-4xl">Request a consultation</h1>
        <p className="mt-3 text-sm leading-7 text-ink-800">
          This asks the Orange studio to follow up. It does not charge the $495 setup, start a monthly plan, reserve a chair, or decide whether a membership is suitable. You can join and pay without this request. {SCHEDULING.summary}
        </p>
      </div>
      <ConsultForm />
      <Link className="text-sm underline" href="/memberships/">
        Compare memberships instead
      </Link>
    </main>
  );
}
