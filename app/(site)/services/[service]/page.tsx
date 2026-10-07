import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph, buildServiceSchema } from "@/components/JsonLd";
import {
  ArrowRightIcon,
  HelpCircleIcon,
  ScissorsIcon,
  SparklesIcon,
} from "@/components/icons";
import { FullPhoto } from "@/components/FullPhoto";
import { SITE, SOCIAL } from "@/lib/site";
import { SERVICES, getService } from "@/lib/seo/services";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { TIER1_CITIES } from "@/lib/seo/cities";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

// The pillar service ("Men's Hair Replacement Systems") lives at the
// top-level route `/mens-hair-replacement-systems/`, not under
// `/services/`. This dynamic route only covers the other 7.
const ROUTED_SERVICES = SERVICES.filter((s) => s.slug !== "mens-hair-replacement-systems");

export const dynamicParams = false;

export function generateStaticParams() {
  return ROUTED_SERVICES.map((s) => ({ service: s.slug }));
}

type Params = { service: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { service: slug } = await params;
  const service = getService(slug);
  if (!service || slug === "mens-hair-replacement-systems") return {};

  const title = `${service.name} | Orange, CA | ManHair`;
  const description = service.metaDescription;
  const path = `/services/${service.slug}/`;
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
  const { service: slug } = await params;
  const service = getService(slug);
  if (!service || slug === "mens-hair-replacement-systems") notFound();

  const path = `/services/${service.slug}/`;
  const otherServices = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);
  const nearbyCities = TIER1_CITIES.slice(0, 8);
  const shots = service.gallery ?? [];

  const graph = buildPageGraph({
    origin: SITE.origin,
    path,
    title: `${service.name} | ManHair`,
    description: service.whatItIs,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Men's Hair Replacement Systems", path: "/mens-hair-replacement-systems/" },
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

  const serviceSchema = buildServiceSchema({
    origin: SITE.origin,
    path,
    name: service.name,
    description: service.whatItIs,
    providerName: SITE.orgName,
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
              <p className="mh-kicker">{service.primaryKeyword}</p>
              <Display as={1} size="hero" className="mt-5">
                {service.name} in <Italic>Orange County</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                {service.whatItIs}
              </p>
              <p className="mt-4 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[color:var(--mh-ink-600)]">
                <span className="font-semibold uppercase tracking-[0.1em] text-[color:var(--mh-copper-700)]">
                  Also searched as:
                </span>
                {service.relatedSearches.join(" \u00b7 ")}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
                <Button href="/mens-hair-replacement-systems/" variant="ghost" size="lg">
                  All Services
                </Button>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <FullPhoto src={service.image} alt={service.name} priority size="hero" />
            </Reveal>
          </div>
        </div>
      </section>

      {/* OVERVIEW */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container">
          <div className={`grid gap-12 ${shots[0] ? "lg:grid-cols-12 lg:items-center" : ""}`}>
            <Reveal className={shots[0] ? "lg:col-span-7" : "max-w-3xl"}>
              <SectionLabel>Overview</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                How it <Italic>works</Italic>
              </Display>
              <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
                {service.overview[0]}
              </p>
              <p className="mt-4 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
                {service.overview[1]}
              </p>
            </Reveal>
            {shots[0] && (
              <Reveal direction="left" className="lg:col-span-5">
                <FullPhoto src={shots[0].src} alt={shots[0].alt} />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          {shots[1] ? (
            <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
              <div className="space-y-12 lg:col-span-7">
                <Reveal>
                  <SectionLabel>Who It's For</SectionLabel>
                  <Display as={2} size="lg" className="mt-3">
                    Is this <Italic>right</Italic> for you?
                  </Display>
                  <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
                    {service.whoItsFor}
                  </p>
                </Reveal>
                <Reveal delay={0.08}>
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
              <Reveal direction="left" className="lg:col-span-5 lg:sticky lg:top-32">
                <FullPhoto src={shots[1].src} alt={shots[1].alt} />
              </Reveal>
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-12">
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
          )}
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

      {/* BENEFITS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionLabel>Why This Approach</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              What you <Italic>get</Italic>
            </Display>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={0.1}>
            <ul className="space-y-4">
              {service.benefits.map((b) => (
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

      {/* CANDIDACY */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container max-w-3xl">
          <Reveal>
            <SectionLabel>Is This You?</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Good signs you&rsquo;re a <Italic>fit</Italic>
            </Display>
            <ul className="mt-6 space-y-3">
              {service.signs.map((s) => (
                <li
                  key={s}
                  className="flex items-start gap-3 text-base text-[color:var(--mh-ink-700)]"
                >
                  <ArrowRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--mh-copper-700)]" />
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* CARE & MAINTENANCE */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <div className={`grid gap-12 ${shots[2] ? "lg:grid-cols-12 lg:items-center" : ""}`}>
            <Reveal className={shots[2] ? "lg:col-span-7" : "max-w-3xl"}>
              <SectionLabel>Care & Maintenance</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                Keeping it looking like <Italic>day one</Italic>
              </Display>
              <ul className="mt-6 space-y-3">
                {service.careTips.map((tip) => (
                  <li
                    key={tip}
                    className="flex items-start gap-3 text-base text-[color:var(--mh-ink-700)]"
                  >
                    <ScissorsIcon className="mt-1 h-4 w-4 shrink-0 text-[color:var(--mh-copper-700)]" />
                    {tip}
                  </li>
                ))}
              </ul>
              {service.slug !== "hair-system-maintenance" && (
                <p className="mt-6 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                  Need a hand between fittings?{" "}
                  <Link href="/services/hair-system-maintenance/" className="underline">
                    See our maintenance & reattachment service
                  </Link>
                  .
                </p>
              )}
            </Reveal>
            {shots[2] && (
              <Reveal direction="left" className="lg:col-span-5">
                <FullPhoto src={shots[2].src} alt={shots[2].alt} />
              </Reveal>
            )}
          </div>
        </div>
      </section>

      {/* FAQ (visible content only — no FAQPage schema; reserved for /faq/) */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container max-w-3xl">
          <Reveal>
            <SectionLabel>Common Questions</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              {service.name} <Italic>FAQ</Italic>
            </Display>
          </Reveal>
          <div className="mt-10 space-y-6">
            {service.faqs.map((f, i) => (
              <Reveal key={f.question} delay={i * 0.05}>
                <Card padding="md" accent="left">
                  <div className="flex items-start gap-3">
                    <HelpCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
                    <div>
                      <p className="font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                        {f.question}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                        {f.answer}
                      </p>
                    </div>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SERVING ORANGE COUNTY — internal links to city x service combo pages */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>Serving Orange County</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              {service.name} <Italic>near you</Italic>
            </Display>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              Every fitting happens at our Orange, CA studio, but we serve
              clients from these communities and beyond. Start with a free
              virtual consultation from wherever you are.
            </p>
          </Reveal>
          <RevealGrid className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.05}>
            {nearbyCities.map((city) => (
              <Link
                key={city.slug}
                href={`/locations/${city.slug}/${service.slug}/`}
                className="mh-index-card !gap-2 !p-5"
              >
                <p className="font-display text-base font-semibold text-[color:var(--mh-ink-950)]">
                  {city.name}
                </p>
                <p className="flex items-center gap-1 text-sm text-[color:var(--mh-copper-700)]">
                  {service.name} <ArrowRightIcon className="h-3 w-3" />
                </p>
              </Link>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* CONSULTATION */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container max-w-3xl text-center">
          <Reveal>
            <Display as={2} size="lg" className="mt-4">
              Start with a <Italic>private consultation</Italic>
            </Display>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              Book a free consultation and we will walk through the system,
              process, and options that fit you.
            </p>
            <div className="mt-6">
              <BookingButton size="md">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* OTHER SERVICES */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>Explore More</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Other <Italic>services</Italic>
            </Display>
          </Reveal>
          <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {otherServices.map((s) => (
              <Card
                key={s.slug}
                href={
                  s.slug === "mens-hair-replacement-systems"
                    ? "/mens-hair-replacement-systems/"
                    : `/services/${s.slug}/`
                }
                padding="none"
                className="overflow-hidden"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={s.image}
                    alt={s.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <p className="font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                    {s.name}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-[color:var(--mh-copper-700)]">
                    Learn more <ArrowRightIcon className="h-3 w-3" />
                  </p>
                </div>
              </Card>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[color:var(--mh-surface)] py-16 md:py-24">
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
