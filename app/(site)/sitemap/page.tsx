import type { Metadata } from "next";
import Link from "next/link";
import { Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { SERVICES } from "@/lib/seo/services";
import { CONDITIONS } from "@/lib/seo/conditions";
import { TIER1_CITIES, TIER2_CITIES } from "@/lib/seo/cities";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PATH = "/sitemap/";
const TITLE = "Sitemap | Every ManHair Page | Orange, CA";
const DESCRIPTION =
  "A complete directory of every ManHair page: services, hair-loss conditions, cities we serve, and core Orange County studio pages.";

const SITEMAP_META: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: pageTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: `${SITE.origin}${PATH}` },
  ...socialMetadata({
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE.origin}${PATH}`,
  }),
};

export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PATH, SITEMAP_META);
}

const CORE_PAGES = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about/" },
  { label: "How It Works", href: "/how-it-works/" },
  { label: "Results (Before & After)", href: "/results/" },
  { label: "Reviews", href: "/reviews/" },
  { label: "FAQ", href: "/faq/" },
  { label: "Blog", href: "/blog/" },
  { label: "Locations Hub", href: "/locations/" },
  { label: "Cherry Financing", href: "/payment-plans/" },
  { label: "Products", href: "/products/" },
  { label: "Men's Hair Styles", href: "/mens-hair-styles/" },
  { label: "Franchise", href: "/partner-program/" },
  { label: "Reviews", href: "/reviews/" },
];

const LEGAL_PAGES = [
  { label: "Privacy Policy", href: "/privacy-policy/" },
  { label: "Terms of Service", href: "/terms-of-service/" },
  { label: "Refund Policy", href: "/refund-policy/" },
];

function LinkGrid({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm text-[color:var(--mh-ink-700)] underline-offset-4 hover:text-[color:var(--mh-copper-700)] hover:underline"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PATH,
    title: TITLE,
    description: DESCRIPTION,
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Sitemap" }],
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

  const serviceLinks = SERVICES.map((s) => ({
    label: s.name,
    href: s.slug === "mens-hair-replacement-systems" ? "/mens-hair-replacement-systems/" : `/services/${s.slug}/`,
  }));
  const conditionLinks = CONDITIONS.map((c) => ({
    label: c.name,
    href: `/hair-loss/${c.slug}/`,
  }));
  const cityLinks = TIER1_CITIES.map((c) => ({
    label: c.name,
    href: `/locations/${c.slug}/`,
  }));
  const tier2CityLinks = TIER2_CITIES.map((c) => ({
    label: c.name,
    href: `/locations/${c.slug}/`,
  }));
  const cityServiceGroups = TIER1_CITIES.map((city) => ({
    city,
    links: SERVICES.map((s) => ({
      label: s.name,
      href: `/locations/${city.slug}/${s.slug}/`,
    })),
  }));
  const cityServiceCount = cityServiceGroups.reduce((n, g) => n + g.links.length, 0);

  return (
    <CMSRoute path={"/sitemap/"}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mh-kicker justify-center">Sitemap</p>
              <Display as={1} size="hero" className="mt-5">
                Every page, <Italic>one place</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                A complete directory of ManHair&rsquo;s services, hair-loss
                conditions, locations we serve, and core pages &mdash; all in
                one easy-to-browse list.
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

      {/* SERVICES */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{serviceLinks.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Services
            </Display>
          </Reveal>
          <LinkGrid items={serviceLinks} />
        </div>
      </section>

      {/* HAIR LOSS CONDITIONS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{conditionLinks.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Hair Loss Conditions
            </Display>
          </Reveal>
          <LinkGrid items={conditionLinks} />
        </div>
      </section>

      {/* LOCATIONS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{cityLinks.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Locations We Serve
            </Display>
          </Reveal>
          <LinkGrid items={cityLinks} />
        </div>
      </section>

      {/* TIER 2 LOCATIONS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{tier2CityLinks.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Additional Locations
            </Display>
          </Reveal>
          <LinkGrid items={tier2CityLinks} />
        </div>
      </section>

      {/* CITY x SERVICE PAGES */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{cityServiceCount} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Services By City
            </Display>
          </Reveal>
          <div className="mt-10 space-y-10">
            {cityServiceGroups.map((group) => (
              <div key={group.city.slug}>
                <p className="text-sm font-semibold text-[color:var(--mh-ink-900)]">
                  {group.city.name}
                </p>
                <LinkGrid items={group.links} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORE PAGES */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{CORE_PAGES.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Core Pages
            </Display>
          </Reveal>
          <LinkGrid items={CORE_PAGES} />
        </div>
      </section>

      {/* LEGAL */}
      <section className="bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>{LEGAL_PAGES.length} Pages</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Legal
            </Display>
          </Reveal>
          <LinkGrid items={LEGAL_PAGES} />
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
