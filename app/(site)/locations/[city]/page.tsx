import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Card, Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildLocalBusinessSchema, buildPageGraph } from "@/components/JsonLd";
import { ClockIcon, MapPinIcon, SparklesIcon } from "@/components/icons";
import { CONTACT, SITE, SOCIAL } from "@/lib/site";
import { SERVICES, getService } from "@/lib/seo/services";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { ALL_CITIES, getCity } from "@/lib/seo/cities";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

export const dynamicParams = false;

export function generateStaticParams() {
  return ALL_CITIES.map((c) => ({ city: c.slug }));
}

const PROCESS_STEPS = [
  { step: "01", title: "Free virtual consultation", body: "Tell us about your hair loss and goals from anywhere, no drive required." },
  { step: "02", title: "Custom order", body: "We build your system to your exact color, density, and hairline." },
  { step: "03", title: "Fitting", body: "You come in to our Orange, CA studio for your first fitting." },
  { step: "04", title: "Cut-in", body: "Your system is cut and blended to match your natural style." },
  { step: "05", title: "Maintenance", body: "Regular visits keep it looking like day one." },
];

type Params = { city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) return {};

  const title = `Hair Replacement Systems for Men in ${city.name}, CA | ManHair`;
  const description = `Custom men's hair replacement for ${city.name}, ${city.county}. Fitted at our Orange, CA studio. Start with a free virtual consultation.`;
  const path = `/locations/${city.slug}/`;
  const url = `${SITE.origin}${path}`;

  return cmsGenerateMetadata(path, {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    ...socialMetadata({ title, description, url }),
  });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { city: slug } = await params;
  const city = getCity(slug);
  if (!city) notFound();

  const path = `/locations/${city.slug}/`;
  const isSalonCity = city.slug === "orange";
  const isTier1 = city.tier === 1;
  const nearby = (city.nearbyCities ?? [])
    .map((s) => getCity(s))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const featuredServices = SERVICES.slice(0, isTier1 ? 8 : 4);
  const pillarBenefits = getService("mens-hair-replacement-systems")!.benefits;
  const relatedSearches = [
    `hair replacement in ${city.name}`,
    `hair systems near ${city.name}`,
    `mens hair system ${city.name}`,
    `non surgical hair replacement ${city.name}`,
    `hair replacement systems ${city.name} ca`,
  ];
  const overviewParagraph = isSalonCity
    ? `Our studio is right here in ${city.name}, in the heart of Old Towne. Every fitting, cut-in, and maintenance visit happens on-site, no drive required.`
    : `Men in ${city.name}, ${city.county} looking for a custom hair replacement system typically start the same way: a free virtual consultation from home, then a single trip to our Orange, CA studio${city.driveTimeFromSalon ? ` (about ${city.driveTimeFromSalon} away)` : ""} for the fitting itself.${
        city.landmarks && city.landmarks.length > 0
          ? ` Whether you're closer to ${city.landmarks[0]} or on the other side of town, the process and the craftsmanship stay exactly the same.`
          : ""
      }`;

  const graph = buildPageGraph({
    origin: SITE.origin,
    path,
    title: `Hair Replacement in ${city.name}, CA | ManHair`,
    description: city.intro,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations/" },
      { name: city.name },
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

  // LocalBusiness schema ONLY on the Orange studio page — never on the
  // other 34 city pages (spec Section 7.2: single most common
  // programmatic-SEO schema mistake).
  const localBusiness = isSalonCity
    ? buildLocalBusinessSchema({
        origin: SITE.origin,
        name: SITE.orgName,
        telephone: CONTACT.studio.phone,
        streetAddress: CONTACT.studio.streetAddress,
        addressLocality: CONTACT.studio.addressLocality,
        addressRegion: CONTACT.studio.addressRegion,
        postalCode: CONTACT.studio.postalCode,
        url: `${SITE.origin}/`,
        logoUrl: `${SITE.origin}${SITE.logo.url}`,
        sameAs: SOCIAL.map((s) => s.href),
      })
    : null;

  return (
    <CMSRoute path={path}>
    <div className="mh-light">
      <JsonLd data={localBusiness ? [graph, localBusiness] : graph} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal className="max-w-3xl">
            <p className="mh-kicker">
              {city.name}, {city.county}
            </p>
            <Display as={1} size="hero" className="mt-5">
              Men&rsquo;s Hair Replacement Serving <Italic>{city.name}</Italic>
            </Display>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              {city.intro}
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
      </section>

      {/* DISTANCE / ACCESS */}
      {!isSalonCity && (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12">
          <div className="mh-container">
            <Card padding="md" accent="left">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
                  <p className="text-sm text-[color:var(--mh-ink-700)]">
                    <span className="font-semibold text-[color:var(--mh-ink-900)]">
                      {city.driveTimeFromSalon}
                    </span>{" "}
                    from {city.name} to our Orange, CA studio
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
                  <p className="text-sm text-[color:var(--mh-ink-700)]">
                    <span className="font-semibold text-[color:var(--mh-ink-900)]">
                      {city.distanceMiles} miles
                    </span>{" "}
                    door-to-door, virtual consultation available first
                  </p>
                </div>
              </div>
              {city.landmarks && city.landmarks.length > 0 && (
                <p className="mt-4 text-sm text-[color:var(--mh-ink-600)]">
                  Near {city.landmarks.join(", ")}.
                </p>
              )}
            </Card>
          </div>
        </section>
      )}

      {/* SERVICES */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>What We Offer</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Services for <Italic>{city.name}</Italic> clients
            </Display>
          </Reveal>
          <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredServices.map((s) => (
              <Card
                key={s.slug}
                href={
                  s.slug === "mens-hair-replacement-systems"
                    ? "/mens-hair-replacement-systems/"
                    : isTier1
                      ? `/locations/${city.slug}/${s.slug}/`
                      : `/services/${s.slug}/`
                }
                padding="md"
              >
                <p className="font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                  {s.name}
                </p>
              </Card>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* OVERVIEW + WHY THIS CITY CHOOSES US */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionLabel>{city.name} Overview</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Hair replacement in <Italic>{city.name}</Italic>
            </Display>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              {overviewParagraph}
            </p>
            <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[color:var(--mh-ink-600)]">
              <span className="font-semibold uppercase tracking-[0.1em] text-[color:var(--mh-copper-700)]">
                Also searched as:
              </span>
              {relatedSearches.join(" \u00b7 ")}
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.1}>
            <SectionLabel>Why {city.name}</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Chooses <Italic>ManHair</Italic>
            </Display>
            <ul className="mt-5 space-y-3">
              {pillarBenefits.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-3 text-base text-[color:var(--mh-ink-700)]"
                >
                  <SparklesIcon className="mt-1 h-4 w-4 shrink-0 text-[color:var(--mh-copper-700)]" />
                  {b}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>How It Works</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              From consultation to <Italic>cut-in</Italic>
            </Display>
          </Reveal>
          <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS_STEPS.map((p) => (
              <Card key={p.step} padding="md">
                <p className="font-mono text-xs text-[color:var(--mh-copper-700)]">{p.step}</p>
                <p className="mt-2 font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                  {p.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">{p.body}</p>
              </Card>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* FAQ (plain content only — no FAQPage schema on city pages, per spec 7.2) */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container max-w-3xl">
          <Reveal>
            <SectionLabel>FAQ</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              {city.name} client questions
            </Display>
          </Reveal>
          <div className="mh-accordion mt-8">
            <details open>
              <summary>Do you have a location in {city.name}?</summary>
              <p>
                No. Man Hair has one physical studio, in Orange, CA. We serve{" "}
                {city.name} clients with a free virtual consultation first,
                then a fitting at our Orange studio.
              </p>
            </details>
            <details>
              <summary>How much does a hair system cost?</summary>
              <p>
                Pricing depends on the service and system you choose. Book a
                free private consultation and we will walk through options
                that fit your goals.
              </p>
            </details>
            <details>
              <summary>How long does the whole process take?</summary>
              <p>
                Most clients complete their free virtual consultation within a
                day, then schedule a fitting at our Orange studio once their
                custom system is ready.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* NEARBY CITIES */}
      {nearby.length > 0 && (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
          <div className="mh-container">
            <Reveal>
              <SectionLabel>Nearby</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                We also serve
              </Display>
            </Reveal>
            <div className="mt-8 flex flex-wrap gap-3">
              {nearby.map((c) => (
                <Button key={c.slug} href={`/locations/${c.slug}/`} variant="ghost" size="sm">
                  {c.name}
                </Button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container max-w-2xl text-center">
          <Reveal>
            <Display as={2} size="lg">
              Start with a <Italic>free virtual consultation</Italic>
            </Display>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              No cost, no pressure. We&rsquo;ll walk through your options from
              anywhere, then schedule your fitting at our Orange, CA studio.
            </p>
            <div className="mt-8">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
