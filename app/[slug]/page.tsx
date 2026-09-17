import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { POSTS, getPostBySlug } from "@/lib/posts";
import { postCoverSrc } from "@/lib/post-cover";
import { DEFAULT_OG, pageTitle, socialMetadata } from "@/lib/seo/meta";

/**
 * Dynamic route for blog posts. Every historical /:slug/ URL that is a
 * blog post is generated statically here. `dynamicParams: false` ensures
 * unknown slugs return the 404 page (not accidentally rendered).
 *
 * Static top-level pages (about-us, faq, etc.) live in their own folders
 * and are matched by Next.js before this dynamic segment.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

type Params = { slug: string };
type Props = { params: Promise<Params> };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  const preferredTitle =
    post.title && post.title !== "Man Hair - Hair Replacement Solutions"
      ? post.title
      : (post.heading ?? post.title);
  const description = post.description ?? SITE.brandStatement;
  const url = post.canonical ?? `${SITE.origin}${post.path}`;
  const social = socialMetadata({
    title: preferredTitle,
    description,
    url,
    image: postCoverSrc(post.slug),
  });
  return {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(preferredTitle),
    description,
    alternates: { canonical: url },
    robots: post.robots,
    openGraph: {
      ...social.openGraph,
      type: "article",
      publishedTime: post.datePublished ?? undefined,
      modifiedTime: post.dateModified ?? undefined,
    },
    twitter: social.twitter,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const pageUrl = post.canonical ?? `${SITE.origin}${post.path}`;
  const title = post.heading ?? post.title;
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        isPartOf: { "@id": pageUrl },
        mainEntityOfPage: { "@id": pageUrl },
        headline: title,
        datePublished: post.datePublished ?? undefined,
        dateModified: post.dateModified ?? undefined,
        publisher: { "@id": `${SITE.origin}/#organization` },
        articleSection: post.category ?? undefined,
        inLanguage: "en-US",
        image: `${SITE.origin}${postCoverSrc(post.slug)}`,
      },
      {
        "@type": "WebPage",
        "@id": pageUrl,
        url: pageUrl,
        name: post.title,
        isPartOf: { "@id": `${SITE.origin}/#website` },
        primaryImageOfPage: { "@id": `${pageUrl}#primaryimage` },
        datePublished: post.datePublished ?? undefined,
        dateModified: post.dateModified ?? undefined,
        description: post.description ?? undefined,
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
        inLanguage: "en-US",
        potentialAction: [{ "@type": "ReadAction", target: [pageUrl] }],
      },
      {
        "@type": "ImageObject",
        inLanguage: "en-US",
        "@id": `${pageUrl}#primaryimage`,
        url: `${SITE.origin}${postCoverSrc(post.slug)}`,
        contentUrl: `${SITE.origin}${postCoverSrc(post.slug)}`,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE.origin}/` },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE.origin}/blog/` },
          { "@type": "ListItem", position: 3, name: title },
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.origin}/#website`,
        url: `${SITE.origin}/`,
        name: SITE.siteName,
        publisher: { "@id": `${SITE.origin}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "Organization",
        "@id": `${SITE.origin}/#organization`,
        name: SITE.orgName,
        url: `${SITE.origin}/`,
        logo: {
          "@type": "ImageObject",
          inLanguage: "en-US",
          "@id": `${SITE.origin}/#/schema/logo/image/`,
          url: `${SITE.origin}${SITE.logo.url}`,
          contentUrl: `${SITE.origin}${SITE.logo.url}`,
          width: SITE.logo.width,
          height: SITE.logo.height,
          caption: SITE.logo.caption,
        },
        image: { "@id": `${SITE.origin}/#/schema/logo/image/` },
        sameAs: SOCIAL.map((s) => s.href),
      },
    ].filter(Boolean),
  };

  const related = POSTS.filter((p) => p.slug !== post.slug && p.coverImage).slice(0, 3);

  return (
    <div className="mh-light">
      <JsonLd data={graph} />

      <article className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pt-16 md:pt-40">
        <AuroraBlobs className="opacity-20" />
        <div className="mh-container relative z-10 pb-16 md:pb-24">
          <div className="mx-auto max-w-2xl">
            <Reveal>
              <Link href="/blog/" className="mh-kicker">
                The ManHair Blog
              </Link>
              <Display as={1} size="lg" className="mt-4">
                {title}
              </Display>
              <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
                {post.category ? (
                  <span className="text-[color:var(--mh-copper-700)]">{post.category}</span>
                ) : null}
                {post.datePublished ? (
                  <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                ) : null}
              </div>
              {post.excerpt ? (
                <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                  {post.excerpt}
                </p>
              ) : post.description ? (
                <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                  {post.description}
                </p>
              ) : null}
            </Reveal>

            {post.coverImage ? (
              <Reveal className="mt-8" delay={0.06}>
                <figure className="overflow-hidden rounded-[var(--mh-radius-md)] bg-[color:var(--mh-ink-50)] p-1.5 ring-1 ring-[color:var(--mh-border)]">
                  <Image
                    src={postCoverSrc(post.slug)}
                    alt={title}
                    width={800}
                    height={520}
                    priority
                    sizes="(max-width: 768px) 100vw, 42rem"
                    className="h-auto w-full rounded-[calc(var(--mh-radius-md)-4px)]"
                    style={{ width: "100%", height: "auto" }}
                  />
                </figure>
              </Reveal>
            ) : null}

            <div
              className="mh-prose mt-10"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: post.bodyHtml ?? "" }}
            />

            <div className="mt-14 rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] px-6 py-8 text-center md:px-10">
              <Display as={2} size="sm">
                Ready for a result you can <Italic>see today?</Italic>
              </Display>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                Start with a free private consultation. We&rsquo;ll walk through
                the system that fits you, then book your fitting at our Orange,
                CA studio.
              </p>
              <div className="mt-6">
                <BookingButton size="lg">Book a Private Consultation</BookingButton>
              </div>
            </div>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
          <div className="mh-container">
            <Reveal>
              <p className="mh-kicker">More from the blog</p>
              <Display as={2} size="lg" className="mt-3">
                Keep <Italic>reading.</Italic>
              </Display>
            </Reveal>
            <RevealGrid className="mt-10 grid gap-6 md:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={p.path}
                  className="group overflow-hidden rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] transition-colors hover:border-[color:var(--mh-copper-500)]"
                >
                  {p.coverImage ? (
                    <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--mh-ink-50)]">
                      <Image
                        src={postCoverSrc(p.slug)}
                        alt={p.heading ?? p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : null}
                  <div className="p-5">
                    {p.datePublished ? (
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-copper-700)]">
                        {formatDate(p.datePublished)}
                      </p>
                    ) : null}
                    <h3 className="mt-2 font-display text-xl leading-snug text-[color:var(--mh-ink-950)] group-hover:text-[color:var(--mh-copper-700)]">
                      {p.heading ?? p.title}
                    </h3>
                    {p.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                        {p.excerpt}
                      </p>
                    ) : null}
                    <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-700)]">
                      Read more &rarr;
                    </p>
                  </div>
                </Link>
              ))}
            </RevealGrid>
          </div>
        </section>
      ) : null}
    </div>
  );
}
