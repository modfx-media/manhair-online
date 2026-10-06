import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Card, Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph, buildServiceSchema } from "@/components/JsonLd";
import { ClockIcon, ScissorsIcon } from "@/components/icons";
import { FullPhoto } from "@/components/FullPhoto";
import { SITE, SOCIAL } from "@/lib/site";
import { SERVICES, getService } from "@/lib/seo/services";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { TIER1_CITIES, getCity } from "@/lib/seo/cities";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

/**
 * Phase 2 — City x Service matrix (spec Section 5.4).
 * 35 Tier 1 cities x 8 services = 280 pages at /locations/[city]/[service]/.
 * Tier 2 cities do NOT get this cross (spec: "would add 712 thin pages for
 * negligible return") — generateStaticParams is scoped to TIER1_CITIES only,
 * and dynamicParams=false makes any other combination 404 instead of
 * silently rendering a doorway page.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return TIER1_CITIES.flatMap((city) =>
    SERVICES.map((service) => ({ city: city.slug, service: service.slug }))
  );
}

type Params = { city: string; service: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city: citySlug, service: serviceSlug } = await params;
  const city = getCity(citySlug);
  const service = getService(serviceSlug);
  if (!city || !service || city.tier !== 1) return {};

  const title = `${service.name} in ${city.name}, CA | ManHair`;
  const description = `${service.name} in ${city.name}, CA. Fitted at our Orange studio for ${city.county} clients. Book a free virtual consultation.`;
  const path = `/locations/${city.slug}/${service.slug}/`;
  const url = `${SITE.origin}${path}`;

  return cmsGenerateMetadata(path, {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    ...socialMetadata({ title, description, url, image: service.image }),
  });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { city: citySlug, service: serviceSlug } = await params;
  const city = getCity(citySlug);
  const service = getService(serviceSlug);
  if (!city || !service || city.tier !== 1) notFound();

  const path = `/locations/${city.slug}/${service.slug}/`;
  const otherServices = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 3);

  const graph = buildPageGraph({
    origin: SITE.origin,
    path,
    title: `${service.name} in ${city.name}, CA | ManHair`,
    description: service.whatItIs,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations/" },
      { name: city.name, path: `/locations/${city.slug}/` },
      { name: service.name },
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

  // Service schema only — never LocalBusiness (spec 7.2: one physical
  // location, the Orange salon; do not assert a location in every city).
  const serviceSchema = buildServiceSchema({
    origin: SITE.origin,
    path,
    name: `${service.name} in ${city.name}, CA`,
    description: service.whatItIs,
    providerName: SITE.orgName,
    areaServed: `${city.name}, ${city.county}`,
  });

  return (
    <CMSRoute path={path}>
    <div className="mh-light">
      <JsonLd data={[graph, serviceSchema]} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">
                {service.primaryKeyword} &middot; {city.name}, CA
              </p>
              <Display as={1} size="hero" className="mt-5">
                {service.name} in <Italic>{city.name}</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                {service.whatItIs}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
                {city.intro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
                <Button href={`/locations/${city.slug}/`} variant="ghost" size="lg">
                  All {city.name} Services
                </Button>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <FullPhoto
                src={service.image}
                alt={`${service.name} in ${city.name}`}
                priority
                size="hero"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* DISTANCE / ACCESS */}
      {city.slug !== "orange" && (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12">
          <div className="mh-container">
            <Card padding="md" accent="left">
              <div className="flex items-start gap-3">
                <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
                <p className="text-sm text-[color:var(--mh-ink-700)]">
                  <span className="font-semibold text-[color:var(--mh-ink-900)]">
                    {city.driveTimeFromSalon}
                  </span>{" "}
                  from {city.name} to our Orange, CA studio, where every
                  fitting and cut-in happens.
                </p>
              </div>
            </Card>
          </div>
        </section>
      )}

      {/* WHO IT'S FOR + MATERIALS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionLabel>Who It's For</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Is this <Italic>right</Italic> for you?
            </Display>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              {service.whoItsFor}
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.1}>
            <SectionLabel>Materials & Options</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Built to your <Italic>spec</Italic>
            </Display>
            <ul className="mt-5 space-y-3">
              {service.materials.map((m) => (
                <li
                  key={m}
                  className="flex items-start gap-3 text-base text-[color:var(--mh-ink-700)]"
                >
                  <ScissorsIcon className="mt-1 h-4 w-4 shrink-0 text-[color:var(--mh-copper-700)]" />
                  {m}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container max-w-3xl">
          <Reveal>
            <SectionLabel>How This Compares</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Not sure this is the <Italic>right</Italic> term?
            </Display>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              {service.comparison}
            </p>
          </Reveal>
        </div>
      </section>

      {/* LINK UP: parent city + parent service + other services */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>Explore More</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              More in <Italic>{city.name}</Italic>
            </Display>
          </Reveal>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`/locations/${city.slug}/`} variant="ghost" size="sm">
              All services in {city.name}
            </Button>
            <Button
              href={
                service.slug === "mens-hair-replacement-systems"
                  ? "/mens-hair-replacement-systems/"
                  : `/services/${service.slug}/`
              }
              variant="ghost"
              size="sm"
            >
              {service.name} overview
            </Button>
          </div>
          <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {otherServices.map((s) => (
              <Card
                key={s.slug}
                href={`/locations/${city.slug}/${s.slug}/`}
                padding="md"
              >
                <p className="font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                  {s.name} in {city.name}
                </p>
              </Card>
            ))}
          </RevealGrid>
        </div>
      </section>

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
