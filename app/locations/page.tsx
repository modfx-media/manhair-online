import type { Metadata } from "next";
import Image from "next/image";
import { Button, Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { ArrowRightIcon } from "@/components/icons";
import { SITE, SOCIAL, CONTACT } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { ALL_CITIES } from "@/lib/seo/cities";

const PAGE = getPageMeta("/locations/")!;
export const metadata: Metadata = toMetadata(PAGE);

const LOCATIONS = [
  {
    name: "Man Hair – Orange County, California",
    streetLine1: CONTACT.studio.streetLine1,
    streetLine2: CONTACT.studio.streetLine2,
    phone: CONTACT.studio.phone,
    phoneHref: CONTACT.studio.phoneHref,
    detailsHref: "/orange-county-ca/",
    map: "https://maps.google.com/maps?q=Orange+County%2C+CA&t=m&z=10&output=embed&iwloc=near",
  },
];

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

/** All 124 cities (Tier 1 + Tier 2), grouped by county, preserving spec
 *  order within each group, for the "Areas We Serve" section below. */
const CITIES_BY_COUNTY = ALL_CITIES.reduce<Record<string, typeof ALL_CITIES>>(
  (groups, city) => {
    (groups[city.county] ??= []).push(city);
    return groups;
  },
  {}
);

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Locations" },
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
       * HERO — EyebrowTag + DisplayHeading
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">Locations</p>
              <Display as={1} size="hero" className="mt-5">
                One studio. <Italic>One promise.</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Serving men across Orange County, CA with
                non-surgical hair replacement. We partner with salons
                throughout the area, all backed by our Orange, CA studio.
                Find the studio nearest you.
              </p>
              <div className="mt-8 flex justify-center">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * LOCATION CARDS — map embed + NAP + phone
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <RevealGrid className="mx-auto grid max-w-xl gap-6" gap={0.1}>
            {LOCATIONS.map((loc) => (
              <article
                key={loc.name}
                className="mh-price-panel flex flex-col overflow-hidden p-0"
              >
                <div className="aspect-[16/10] w-full overflow-hidden border-b border-[color:var(--mh-border)]">
                  <iframe
                    src={loc.map}
                    title={`${loc.streetLine1}, ${loc.streetLine2}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="h-full w-full grayscale-[0.35]"
                    style={{ border: 0 }}
                  />
                </div>
                <div className="flex flex-1 flex-col gap-5 p-8 md:p-10">
                  <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                    <span className="mh-pin" />
                    Studio location
                  </p>
                  <h2 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)] md:text-3xl">
                    {loc.name}
                  </h2>
                  <address className="not-italic leading-relaxed text-[color:var(--mh-ink-800)]">
                    {loc.streetLine1}
                    <br />
                    {loc.streetLine2}
                  </address>
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    <Button href={loc.detailsHref} variant="ghost" size="md">
                      Contact Us
                    </Button>
                    <a
                      href={loc.phoneHref}
                      className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-copper-300)] hover:underline"
                    >
                      Or Call {loc.phone}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * THE MANHAIR EXPERIENCE — FeaturePanel rows
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <AuroraBlobs className="opacity-[0.22]" />
        <div className="mh-container relative z-10">
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
       * WORKING HOURS + LOCATIONS — info cards
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <RevealGrid className="mx-auto grid max-w-2xl gap-4 md:grid-cols-2" gap={0.1}>
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
            </article>

            <article className="mh-index-card">
              <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                <span className="mh-pin" />
                Orange County, CA
              </p>
              <p className="mt-3 text-[color:var(--mh-ink-800)]">
                {CONTACT.studio.streetLine1}
                <br />
                {CONTACT.studio.streetLine2}
              </p>
              <a
                href={CONTACT.studio.phoneHref}
                className="mt-2 inline-block font-semibold text-[color:var(--mh-copper-300)] hover:underline"
              >
                {CONTACT.studio.phone}
              </a>
            </article>
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * AREAS WE SERVE — links to all 124 city pages (35 Tier 1 + 89
       * Tier 2), grouped by county as a beautiful card grid (mirrors
       * the design system's .mh-index-card pattern used above in
       * "The ManHair experience").
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mh-kicker justify-center">Areas We Serve</p>
              <Display as={2} size="xl" className="mt-4">
                Serving all of <Italic>Orange County</Italic> &mdash; and beyond
              </Display>
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-[color:var(--mh-ink-800)]">
                Every visit starts with a free virtual consultation, no
                matter where you&rsquo;re calling from. When you&rsquo;re
                ready, your fitting happens at our Orange, CA studio &mdash;
                {" "}
                {ALL_CITIES.length} communities served across{" "}
                {Object.keys(CITIES_BY_COUNTY).length} counties.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 space-y-14">
            {Object.entries(CITIES_BY_COUNTY).map(([county, cities]) => (
              <div key={county}>
                <Reveal>
                  <p className="flex items-center gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--mh-copper-600)]">
                    <span className="mh-pin" />
                    {county}
                    <span className="font-normal normal-case tracking-normal text-[color:var(--mh-ink-600)]">
                      &middot; {cities.length} {cities.length === 1 ? "city" : "cities"}
                    </span>
                  </p>
                </Reveal>
                <RevealGrid
                  className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  gap={0.04}
                >
                  {cities.map((city) => (
                    <a
                      key={city.slug}
                      href={`/locations/${city.slug}/`}
                      className="mh-index-card group/city !gap-2 !p-5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-[color:var(--mh-ink-950)]">
                          {city.name}
                        </h3>
                        <ArrowRightIcon
                          size={15}
                          className="shrink-0 -translate-x-1 text-[color:var(--mh-copper-500)] opacity-0 transition-all duration-300 group-hover/city:translate-x-0 group-hover/city:opacity-100"
                        />
                      </div>
                      {city.driveTimeFromSalon ? (
                        <p className="text-xs font-medium uppercase tracking-[0.1em] text-[color:var(--mh-copper-600)]">
                          {city.slug === "orange"
                            ? city.driveTimeFromSalon
                            : `${city.driveTimeFromSalon} from Orange`}
                        </p>
                      ) : null}
                      {city.landmarks?.[0] ? (
                        <p className="text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                          Near {city.landmarks[0]}
                        </p>
                      ) : null}
                    </a>
                  ))}
                </RevealGrid>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * CTA — free virtual consultation + Book My Appointment
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <div className="mh-cinema mx-auto max-w-4xl p-10 text-center md:p-16">
            <p className="mh-kicker justify-center">Let&rsquo;s work together</p>
            <Display as={2} size="xl" className="mt-4">
              Find the perfect <Italic>hairstyle for you.</Italic>
            </Display>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              We start every relationship with a free virtual consultation,
              wherever you are. There is no need to feel afraid or embarrassed
              &ndash; your fitting happens at our Orange, CA studio.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
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
