import type { Metadata } from "next";
import Image from "next/image";
import { Button, Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL, CONTACT } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/orange-county-ca/")!;
export const metadata: Metadata = toMetadata(PAGE);

const HERO_IMG = "/images/homepage-images/the-london-hair-clinic-17.jpg";
const MAP =
  "https://maps.google.com/maps?q=Orange+County%2C+CA&t=m&z=10&output=embed&iwloc=near";

const EXPERIENCE = [
  {
    title: "consultation",
    body: "Schedule a free consultation with a hair expert.",
    img: "/images/how-it-works/start-600x597.png",
  },
  {
    title: "selection",
    body: "Selection process of the best hair for your lifestyle.",
    img: "/images/how-it-works/preparehead-600x597.png",
  },
  {
    title: "fitting",
    body: "Applying your new thick and beautiful manhair system.",
    img: "/images/how-it-works/applysystem-600x597.png",
  },
  {
    title: "servicing",
    body: "We will handle the maintenance on your unit.",
    img: "/images/how-it-works/final-600x597.png",
  },
];

const CTA_TICKER = [
  "Orange County, CA",
  "Mon\u2013Fri 10:30 AM \u2013 6:00 PM",
  "Free Virtual Consultation",
  "NO COST Consultations",
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
      { name: "Orange County CA" },
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

      {/* ============================================================
       * HERO — EyebrowTag + DisplayHeading + Why Man Hair Online?
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Orange County, CA</p>
              <Display as={1} size="hero" className="mt-5">
                Man Hair <Italic>Orange County,</Italic> California
              </Display>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[color:var(--mh-copper-300)]">
                Why Man Hair Online?
              </p>
              <div className="mt-4 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  We believe that every guy has the right to have the full head
                  of hair he deserves. Many men begin to lose their hair long
                  before they should, and this isn&rsquo;t fair. This is the
                  reason why we have spent years researching to find the best
                  solution to this condition to help restore your confidence and
                  help you take back control of your life.
                </p>
                <p>
                  We know that having a full head of hair will bring back your
                  confidence, self-esteem and help you regain control of your
                  life. It&rsquo;s time for a change. Take charge of your
                  potential and get the look you once had, or have always wanted.
                  Let&rsquo;s be real here &ndash; looks do matter for personal
                  reasons as well, such as finding a significant other, getting
                  promoted at work, and finding the motivation to be a better you.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={HERO_IMG}
                  alt="7 Stages Of Male Pattern Balding"
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * BRANCH ADDRESS — map + NAP info cards
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">Branch Address</p>
            <Display as={2} size="lg" className="mt-4">
              Visit us in <Italic>Orange County.</Italic>
            </Display>
          </Reveal>
          <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <Reveal>
              <div className="mh-price-panel h-full overflow-hidden p-0">
                <div className="aspect-[16/11] w-full overflow-hidden">
                  <iframe
                    src={MAP}
                    title="Orange County, CA"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full grayscale-[0.35]"
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </Reveal>
            <RevealGrid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1" gap={0.08}>
              <article className="mh-index-card">
                <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                  <span className="mh-pin" />
                  Address
                </p>
                <p className="mt-3 leading-relaxed text-[color:var(--mh-ink-800)]">
                  {CONTACT.studio.streetLine1}
                  <br />
                  {CONTACT.studio.streetLine2}
                </p>
              </article>
              <article className="mh-index-card">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                  Phone
                </p>
                <a
                  href={CONTACT.studio.phoneHref}
                  className="mt-3 inline-block font-display text-2xl font-semibold text-[color:var(--mh-copper-300)] hover:underline"
                >
                  {CONTACT.studio.phone}
                </a>
              </article>
              <article className="mh-index-card sm:col-span-2 lg:col-span-1">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                  Mail
                </p>
                <a
                  href={CONTACT.emailHref}
                  className="mt-3 inline-block font-semibold lowercase text-[color:var(--mh-copper-300)] hover:underline"
                >
                  {CONTACT.email}
                </a>
              </article>
            </RevealGrid>
          </div>
        </div>
      </section>

      {/* ============================================================
       * LOCATION DETAILS — descriptive copy
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <AuroraBlobs className="opacity-[0.2]" />
        <div className="mh-container relative z-10">
          <div className="mh-cinema mx-auto max-w-4xl p-10 text-center md:p-16">
            <p className="mh-kicker justify-center">Location Details</p>
            <blockquote className="mt-6 font-display text-2xl font-light leading-snug text-[color:var(--mh-ink-950)] md:text-3xl">
              We believe that every guy has the right to have the full head of
              hair he deserves. Many men begin to lose their hair long before
              they should, and this isn&rsquo;t fair. This is the reason why we
              have spent years researching to find the best solution to this
              condition to help restore your confidence and help you take back
              control of your life.
            </blockquote>
          </div>
        </div>
      </section>

      {/* ============================================================
       * THE MANHAIR EXPERIENCE — FeaturePanel rows
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mh-kicker justify-center">The ManHair experience</p>
              <Display as={2} size="xl" className="mt-4">
                We keep it <Italic>simple.</Italic>
              </Display>
            </div>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            gap={0.08}
          >
            {EXPERIENCE.map((step, i) => (
              <a
                key={step.title}
                href="/how-it-works/"
                className="mh-index-card group flex flex-col"
              >
                <span className="mh-index-num">{`0${i + 1}`}</span>
                <div className="mt-4 flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--mh-border)] bg-[color:var(--mh-surface-elevated)] p-3">
                  <Image
                    src={step.img}
                    alt="mens hair restoration"
                    width={48}
                    height={48}
                    className="h-full w-full object-contain"
                  />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold capitalize text-[color:var(--mh-ink-950)]">
                  {step.title}
                </h3>
                <p className="mt-2 leading-relaxed text-[color:var(--mh-ink-800)]">
                  {step.body}
                </p>
              </a>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * WORKING HOURS + CTA
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-5">
              <article className="mh-index-card">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                  Working Hours
                </p>
                <p className="mt-3 font-display text-2xl text-[color:var(--mh-ink-950)]">
                  Monday to Friday
                </p>
                <p className="text-[color:var(--mh-ink-800)]">
                  10:30 AM &ndash; 6:00 PM
                </p>
                <p className="mt-4 text-sm text-[color:var(--mh-ink-800)]">
                  Address: {CONTACT.studio.streetLine1},{" "}
                  {CONTACT.studio.streetLine2}
                </p>
              </article>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-7">
              <p className="mh-kicker">Let&rsquo;s work together</p>
              <Display as={2} size="xl" className="mt-4">
                Find the hairstyle <Italic>for you.</Italic>
              </Display>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                We start every relationship with a free virtual consultation,
                wherever you are. There is no need to feel afraid or
                embarrassed &ndash; your fitting happens at our Orange, CA studio.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
                <Button href="/locations/" variant="ghost" size="lg">
                  All Locations
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * TICKER BAND
       * ============================================================ */}
      <section aria-hidden="true" className="mh-ticker">
        <div className="mh-marquee">
          <div
            className="mh-marquee-track"
            style={{ ["--mh-marquee-duration" as string]: "30s" } as React.CSSProperties}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="mh-marquee-group">
                {CTA_TICKER.map((t) => (
                  <span key={t + dup} className="inline-flex items-center gap-6">
                    <span className="mh-ticker-item">
                      <span>{t}</span>
                    </span>
                    <span className="mh-ticker-star">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
