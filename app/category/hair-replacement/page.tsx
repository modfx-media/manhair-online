import type { Metadata } from "next";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { PostGrid, type PostCard } from "@/components/PostGrid";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { POSTS } from "@/lib/posts";
import { postCoverSrc } from "@/lib/post-cover";

const PAGE = getPageMeta("/category/hair-replacement/")!;
export const metadata: Metadata = toMetadata(PAGE);

const CATEGORY = "Hair Replacement";
const BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));

/* Post order captured verbatim from the live Hair Replacement archive. */
const SLUGS = [
  "what-to-expect-from-a-hair-replacement-consultation-in-jacksonville",
  "florida-humidity-tips-for-natural-looking-hair-systems",
  "5-tactics-that-help-slow-aging-hair-loss-in-men",
  "massaging-your-scalp-can-help-with-hair-growth",
  "can-you-go-bald-from-wearing-hats",
  "vitamin-deficiencies-that-cause-hair-loss",
  "are-hair-replacement-systems-worth-it",
  "why-hair-systems-are-the-safest-hair-loss-solution",
  "mens-hair-loss-and-the-depression-it-causes",
  "can-over-shampooing-cause-hair-thinning",
  "caring-for-your-manhair-hair-replacement-system-in-thesummer",
  "does-warmer-weather-affect-hair-loss",
];

const CARDS: PostCard[] = SLUGS.map((slug) => {
  const p = BY_SLUG.get(slug)!;
  const title = p.heading ?? p.title;
  return {
    href: p.path,
    category: CATEGORY,
    title,
    excerpt: p.excerpt,
    image: postCoverSrc(p.slug),
    imageAlt: title,
  };
});

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Hair Replacement" },
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

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <p className="mh-kicker">Category</p>
            <Display as={1} size="hero" className="mt-5 max-w-4xl">
              Hair <Italic>Replacement</Italic>
            </Display>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Guides and insights on non-surgical hair replacement systems &mdash;
              how they work, how they last, and why they&rsquo;re the safest
              solution.
            </p>
            <div className="mt-8">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* POST GRID */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-10 md:py-24">
        <div className="mh-container">
          <PostGrid posts={CARDS} />
        </div>
      </section>

      {/* CLOSING CTA */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-8 md:py-20">
        <div className="mh-container text-center">
          <p className="mh-kicker justify-center">
            Get your hair back. Get your confidence back.
          </p>
          <Display as={2} size="lg" className="mt-4">
            It is time for a <Italic>change.</Italic>
          </Display>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            Start with a free virtual consultation from anywhere. When
            you&rsquo;re ready, visit our Orange, CA studio for your fitting,
            no pushy sales tactics, just real support on your journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BookingButton size="lg">
              Book a Private Consultation
            </BookingButton>
          </div>
        </div>
      </section>
    </div>
  );
}
