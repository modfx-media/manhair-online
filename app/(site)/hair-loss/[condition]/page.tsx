import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { ActivityIcon, ArrowRightIcon, HelpCircleIcon } from "@/components/icons";
import { SITE, SOCIAL } from "@/lib/site";
import { FullPhoto } from "@/components/FullPhoto";
import { CONDITIONS, MEDICAL_NOTE, getCondition } from "@/lib/seo/conditions";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { getService } from "@/lib/seo/services";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

export const dynamicParams = false;

export function generateStaticParams() {
  return CONDITIONS.filter((c) => c.slug !== "male-pattern-baldness").map(
    (c) => ({ condition: c.slug })
  );
}

type Params = { condition: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { condition: slug } = await params;
  const condition = getCondition(slug);
  if (!condition) return {};

  const title = `${condition.name}: Hair Replacement Options | ManHair`;
  const description = `See how a custom hair system covers ${condition.name.toLowerCase()} at ManHair in Orange, CA. Cosmetic coverage only. Free virtual consultation.`;
  const path = `/hair-loss/${condition.slug}/`;
  const url = `${SITE.origin}${path}`;

  return cmsGenerateMetadata(path, {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    ...socialMetadata({
      title,
      description,
      url,
      image: condition.image?.src,
    }),
  });
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { condition: slug } = await params;
  const condition = getCondition(slug);
  if (!condition) notFound();

  const path = `/hair-loss/${condition.slug}/`;
  const recommended = condition.recommendedServiceSlugs
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const graph = buildPageGraph({
    origin: SITE.origin,
    path,
    title: `${condition.name} | ManHair`,
    description: condition.whatItIs,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: condition.name },
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
    <CMSRoute path={path}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div
            className={
              condition.image
                ? "grid gap-12 lg:grid-cols-12 lg:items-center"
                : undefined
            }
          >
            <Reveal className={condition.image ? "lg:col-span-6" : "max-w-3xl"}>
              <p className="mh-kicker">{condition.primaryKeyword}</p>
              <Display as={1} size="hero" className="mt-5">
                {condition.name}: <Italic>Hair Replacement Options</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                {condition.whatItIs}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
            {condition.image ? (
              <Reveal direction="left" className="lg:col-span-6">
                <FullPhoto
                  src={condition.image.src}
                  alt={condition.image.alt}
                  priority
                  size="hero"
                />
              </Reveal>
            ) : null}
          </div>
        </div>
      </section>

      {/* HOW IT PRESENTS + SOLUTION */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
        <div className="mh-container grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <SectionLabel>What To Expect</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              How it <Italic>presents</Italic>
            </Display>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              {condition.howItPresents}
            </p>
          </Reveal>
          <Reveal className="lg:col-span-6" delay={0.1}>
            <SectionLabel>Our Approach</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              How a system <Italic>covers it</Italic>
            </Display>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              {condition.howASystemCoversIt}
            </p>
          </Reveal>
        </div>
      </section>

      {/* MEDICAL DISCLAIMER — render verbatim, do not edit or remove */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-10">
        <div className="mh-container max-w-3xl">
          <Card padding="md" accent="left">
            <div className="flex items-start gap-3">
              <HelpCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
              <p className="text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                {MEDICAL_NOTE}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* RECOMMENDED SERVICES */}
      {recommended.length > 0 && (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
          <div className="mh-container">
            <Reveal>
              <SectionLabel>Recommended</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                Services that <Italic>help</Italic>
              </Display>
            </Reveal>
            <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((s) => (
                <Card
                  key={s.slug}
                  href={
                    s.slug === "mens-hair-replacement-systems"
                      ? "/mens-hair-replacement-systems/"
                      : `/services/${s.slug}/`
                  }
                  padding="md"
                >
                  <ActivityIcon className="h-5 w-5 text-[color:var(--mh-copper-700)]" />
                  <p className="mt-3 font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                    {s.name}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-[color:var(--mh-copper-700)]">
                    Learn more <ArrowRightIcon className="h-3 w-3" />
                  </p>
                </Card>
              ))}
            </RevealGrid>
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
