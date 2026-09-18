import type { Metadata } from "next";
import { Display, Italic, SectionLabel } from "@/components/ui";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import {
  ClockIcon,
  MailIcon,
  PhoneIcon,
  SparklesIcon,
  VideoIcon,
} from "@/components/icons";
import BookingEmbed from "@/components/BookingEmbed";
import { CONTACT, SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/video-call/")!;
export const metadata: Metadata = toMetadata(PAGE);

const VIDEO_CALENDAR_SRC =
  "https://api.leadconnectorhq.com/widget/booking/I6Y3roPnfTBqGqYyrB1E";
const VIDEO_CALENDAR_ID = "I6Y3roPnfTBqGqYyrB1E_1775";

const CHIPS = ["45 minutes", "Private video call", "From anywhere"];

const PREP = [
  {
    n: "01",
    title: "Join from a quiet room",
    body: "A laptop or phone is fine. Good light on your face and hairline helps us see the real picture.",
  },
  {
    n: "02",
    title: "Show us what you see",
    body: "We’ll walk through your hairline, density, and lifestyle, then map a system that fits you.",
  },
  {
    n: "03",
    title: "Leave with a plan",
    body: "No pressure. If it feels right, we schedule your Orange, CA fitting when you’re ready.",
  },
];

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Video Consultation" },
    ],
    organization: {
      name: SITE.orgName,
      url: `${SITE.origin}/`,
      logo: {
        url: `${SITE.origin}${SITE.logo.url}`,
        width: SITE.logo.width,
        height: SITE.logo.height,
        caption: SITE.logo.caption,
      },
      sameAs: SOCIAL.map((s) => s.href),
    },
    siteName: SITE.siteName,
    siteDescription: SITE.tagline,
  });

  return (
    <div className="mh-light">
      <JsonLd data={graph} />

      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-10 pt-[5.5rem] md:pb-14 md:pt-28 lg:pt-32">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="mh-kicker justify-center">
                <VideoIcon size={12} className="mr-1.5" />
                45-minute video consultation
              </p>
              <Display as={1} size="lg" className="mt-3 md:mt-4">
                Face to face, from <Italic>anywhere.</Italic>
              </Display>
              <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[color:var(--mh-ink-800)] md:mt-4">
                A private 45-minute video call with a ManHair specialist. Pick a
                time below. We&rsquo;ll send the link to join.
              </p>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-2 md:mt-5">
                {CHIPS.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] px-3.5 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-800)]"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="mx-auto mt-8 max-w-[1200px] md:mt-10">
            <div className="overflow-hidden rounded-[1.25rem] bg-white shadow-[0_24px_64px_-24px_rgba(26,19,14,0.28)] ring-1 ring-[color:var(--mh-border)] md:rounded-[1.5rem]">
              <div
                aria-hidden="true"
                className="h-1 w-full bg-gradient-to-r from-[color:var(--mh-red-600)] via-[color:var(--mh-copper-500)] to-[color:var(--mh-copper-300)]"
              />
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--mh-border)] px-4 py-3 sm:px-6">
                <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-700)]">
                  <VideoIcon size={14} />
                  MH Video Consultation
                </p>
                <p className="hidden text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)] sm:block">
                  45 min · camera on
                </p>
              </div>
              <h2 className="sr-only">Select a day and time for your video call</h2>
              <BookingEmbed
                src={VIDEO_CALENDAR_SRC}
                id={VIDEO_CALENDAR_ID}
                title="MH Video Consultation"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-20">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>Before you join</SectionLabel>
            <Display as={2} size="md" className="mt-3 max-w-xl">
              How the <Italic>video</Italic> call works
            </Display>
          </Reveal>

          <ol className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {PREP.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] p-5"
              >
                <p className="font-mono text-[0.68rem] tracking-[0.14em] text-[color:var(--mh-copper-700)]">
                  {s.n}
                </p>
                <p className="mt-1 font-display text-xl font-semibold text-[color:var(--mh-ink-950)]">
                  {s.title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-5 rounded-2xl border border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] p-5 md:flex md:items-center md:justify-between md:gap-8 md:p-6">
            <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-700)]">
              <SparklesIcon size={14} />
              Prefer to call?
            </p>
            <div className="mt-3 flex flex-col gap-2 md:mt-0 md:flex-row md:flex-wrap md:items-center md:gap-x-8 md:gap-y-2">
              <a
                href={CONTACT.studio.phoneHref}
                className="flex items-center gap-2 font-display text-xl font-semibold text-[color:var(--mh-ink-950)] hover:text-[color:var(--mh-copper-700)] md:text-2xl"
              >
                <PhoneIcon size={18} />
                {CONTACT.studio.phone}
              </a>
              <p className="flex items-center gap-2 text-sm text-[color:var(--mh-ink-700)]">
                <ClockIcon size={14} />
                {CONTACT.hoursShort}
              </p>
              <a
                href={CONTACT.emailHref}
                className="flex items-center gap-2 text-sm text-[color:var(--mh-ink-800)] underline-offset-4 hover:text-[color:var(--mh-copper-700)] hover:underline"
              >
                <MailIcon size={14} />
                {CONTACT.email}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
