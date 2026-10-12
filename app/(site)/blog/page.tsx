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

const PAGE = getPageMeta("/blog/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

function formatCardDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const BLOG_POSTS: PostCard[] = [...POSTS]
  .sort((a, b) => (b.datePublished ?? "").localeCompare(a.datePublished ?? ""))
  .slice(0, 6)
  .map((p) => {
    const title = p.heading ?? p.title;
    return {
      href: p.path,
      category: p.category ?? "Uncategorized",
      title,
      excerpt: p.excerpt,
      image: postCoverSrc(p.slug),
      imageAlt: title,
      date: p.datePublished ? formatCardDate(p.datePublished) : undefined,
    };
  });

export default function BlogIndex() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: "/blog/",
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Blog" },
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
    <CMSRoute path={"/blog/"}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* ============================================================
       * HERO
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <p className="mh-kicker">The ManHair Blog</p>
            <Display as={1} size="hero" className="mt-5 max-w-4xl">
              the <Italic>man hair</Italic> blog
            </Display>
            {PAGE.description ? (
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                {PAGE.description}
              </p>
            ) : null}
            <div className="mt-8">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * POST GRID — dark card layout
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-10 md:py-24">
        <div className="mh-container">
          <PostGrid posts={BLOG_POSTS} />
        </div>
      </section>

      {/* ============================================================
       * CLOSING CTA
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-8 md:py-20">
        <div className="mh-container text-center">
          <p className="mh-kicker justify-center">
            Get your hair back. Get your confidence back.
          </p>
          <Display as={2} size="lg" className="mt-4">
            It is time. Get your hair back.{" "}
            <Italic>Get your confidence back.</Italic>
          </Display>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            Start with a free virtual consultation from anywhere. When
            you&rsquo;re ready, visit our Orange, CA studio for your fitting,
            no pushy sales tactics, just real support on your journey.
          </p>
          <div className="mt-8 flex justify-center">
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
