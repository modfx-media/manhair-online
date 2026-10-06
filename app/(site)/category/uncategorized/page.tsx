import type { Metadata } from "next";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { PostGrid, type PostCard } from "@/components/PostGrid";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { POSTS } from "@/lib/posts";
import { postCoverSrc } from "@/lib/post-cover";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/category/uncategorized/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

const CATEGORY = "Uncategorized";
const BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));

/* Post order captured verbatim from the live Uncategorized archive. */
const SLUGS = [
  "the-harsh-truth-how-hair-loss-shampoos-can-aggravate-hair-loss",
  "food-fixes-to-strengthen-your-strands",
  "what-hair-to-wear",
  "how-to-tell-your-girlfriend-that-you-wear-a-hair-replacement-system",
  "mens-hair-loss-myths-we-bet-some-will-surprise-you",
  "getting-hair-transplant-surgery-may-not-be-the-best-solutions-there-are-other-options-out-there-like-hair-replacement-systems",
  "why-men-lose-their-hair-young",
  "how-long-do-hair-replacement-systems-last",
  "male-pattern-baldness-what-is-it-and-can-it-be-stopped",
  "hair-replacement-surgery-vs-topical-hair-replacement",
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
      { name: "Uncategorized" },
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
    <CMSRoute path={"/category/uncategorized/"}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <p className="mh-kicker">Category</p>
            <Display as={1} size="hero" className="mt-5 max-w-4xl">
              <Italic>Uncategorized</Italic>
            </Display>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              The latest from the ManHair blog &mdash; hair care tips, myths, and
              honest advice for men navigating hair loss.
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
  </CMSRoute>
  );
}
