import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton } from "@/components/BookingButton";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
      <div className="mh-container flex min-h-[60vh] flex-col justify-center py-24">
        <p className="mh-eyebrow">404</p>
        <h1 className="mt-6 mh-display text-[clamp(2.4rem,4vw+1rem,4.4rem)] max-w-3xl">
          This page doesn&rsquo;t seem to exist{" "}
          <span className="mh-italic">&mdash; but your hair still can.</span>
        </h1>
        <span className="mh-rule mt-8" aria-hidden="true" />
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
          It looks like the link pointing here was faulty. Head back home or
          book a free consultation and one of our hair specialists will follow
          up with you.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="mh-btn mh-btn-primary">
            Back to Home
          </Link>
          <BookingButton size="md" variant="ghost">
            Book a Private Consultation
          </BookingButton>
        </div>
      </div>
    </section>
  );
}
