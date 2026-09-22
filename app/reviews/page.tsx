import type { Metadata } from "next";
import { Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { GoogleGIcon } from "@/components/icons";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { getDisplayedGoogleReviews } from "@/lib/google-reviews";
import { isFiveStarReview, toTestimonialCard } from "@/lib/reviews";
import { TestimonialCard } from "@/components/TestimonialCard";

const PAGE = getPageMeta("/reviews/")!;
export const metadata: Metadata = toMetadata(PAGE);

export default async function Page() {
  const google = await getDisplayedGoogleReviews();
  const fiveStarCards = google.reviews
    .filter(isFiveStarReview)
    .map(toTestimonialCard);

  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    breadcrumbs: [{ name: "Home", path: "/" }, { name: "Reviews" }],
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

      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-3xl text-center">
              <p className="mh-kicker justify-center">Client Reviews</p>
              <Display as={1} size="hero" className="mt-5">
                Real words from <Italic>real clients</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                We&rsquo;re proud of the trust our clients place in us. Here is
                what they say about ManHair, then book your own free virtual
                consultation when you&rsquo;re ready.
              </p>
              {google.meta.reviewCount > 0 ? (
                <a
                  href={google.meta.reviewsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-auto mt-6 inline-flex items-center gap-3 rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] px-5 py-3"
                >
                  <GoogleGIcon size={22} />
                  <span className="text-left">
                    <span className="block font-display text-lg font-bold text-[color:var(--mh-ink-950)]">
                      {google.meta.rating} <span className="text-[#F5B400]">★★★★★</span>
                    </span>
                    <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
                      {google.meta.reviewCount} Google reviews
                    </span>
                  </span>
                </a>
              ) : (
                <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
                  <GoogleGIcon size={16} />
                  5-star Google reviews
                </p>
              )}
              <div className="mt-8 flex justify-center">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {fiveStarCards.length > 0 ? (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
          <div className="mh-container">
            <Reveal>
              <SectionLabel>Client Stories</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                More than a service. <Italic>A confidence.</Italic>
              </Display>
            </Reveal>
            <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2">
              {fiveStarCards.map((t, i) => (
                <TestimonialCard
                  key={`${t.name}-${i}`}
                  t={t}
                  index={i}
                  className="mh-goog-card mh-goog-card-grid"
                />
              ))}
            </RevealGrid>
          </div>
        </section>
      ) : null}

      <section className="bg-[color:var(--mh-bg)] py-16 md:py-24">
        <div className="mh-container max-w-2xl text-center">
          <Reveal>
            <Display as={2} size="lg">
              Ready to start? Book a <Italic>free virtual consultation</Italic>
            </Display>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--mh-ink-700)]">
              No cost, no pressure. When you&rsquo;re ready, your fitting
              happens at our Orange, CA studio.
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
  );
}
