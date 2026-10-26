import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { POSTS, getPostBySlug } from "@/lib/posts";
import { getCoverMap } from "@/lib/cms/blog-posts";
import { imageDimensions } from "@/lib/image-dimensions";
import { repairLegacyInlineImages } from "@/lib/legacy-inline-images";
import { postCoverAlt, postCoverSrc } from "@/lib/post-cover";
import {
  getSupplementalPost,
  SUPPLEMENTAL_POSTS,
  cmsDatabaseConfigured,
  type SupplementalPost,
} from "@/lib/cms/supplemental-posts";
import { pageTitle, socialMetadata } from "@/lib/seo/meta";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";
import { LivePreviewListener } from "@/lib/cms/LivePreviewListener";
import {
  hasRenderableCMSContent,
  RenderRoutedContent,
} from "@/lib/cms/RenderRoutedContent";
import {
  queryPublishedPostBySlug,
  queryPublishedPostSlugs,
  queryRoutedContentByPath,
} from "@/lib/cms/queries";
import { isPublishedAtPublic } from "@/lib/cms/publish-date";

/**
 * Dynamic route for blog posts. Historical /:slug/ URLs from the designed
 * inventory are prerendered; CMS-published posts are included when the DB is
 * available. `dynamicParams: true` lets a post scheduled after the last build
 * resolve on first request instead of hard-404ing until the next deploy.
 *
 * Static top-level pages (about-us, faq, etc.) live in their own folders
 * and are matched by Next.js before this dynamic segment.
 */

export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const cmsSlugs = await queryPublishedPostSlugs();
  const slugs = new Set<string>([
    ...POSTS.filter((p) => isPublishedAtPublic(p.datePublished)).map((p) => p.slug),
    ...cmsSlugs,
  ]);
  if (!cmsDatabaseConfigured()) {
    for (const post of SUPPLEMENTAL_POSTS) slugs.add(post.slug);
  }
  return [...slugs].map((slug) => ({ slug }));
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
  if (post) {
    if (!isPublishedAtPublic(post.datePublished)) return { title: "Not Found" };
    const preferredTitle =
      post.title && post.title !== "Man Hair - Hair Replacement Solutions"
        ? post.title
        : (post.heading ?? post.title);
    const description = post.description ?? SITE.brandStatement;
    const url = post.canonical ?? `${SITE.origin}${post.path}`;
    const covers = await getCoverMap();
    const image = covers.get(post.slug) ?? postCoverSrc(post.slug, post.coverImage);
    const dim = imageDimensions(image);
    const social = socialMetadata({
      title: preferredTitle,
      description,
      url,
      image,
      imageAlt: postCoverAlt(post.slug, preferredTitle),
      imageWidth: dim?.width,
      imageHeight: dim?.height,
    });
    return cmsGenerateMetadata(post.path, {
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
    });
  }

  const cmsPost = await queryPublishedPostBySlug(slug);
  if (!cmsPost) {
    const extra = getSupplementalPost(slug);
    if (!extra) return { title: "Not Found" };
    const title = extra.title;
    const url = `${SITE.origin}/${extra.slug}/`;
    const description = extra.excerpt;
    const covers = await getCoverMap();
    const image = covers.get(extra.slug) ?? postCoverSrc(extra.slug, extra.coverImage);
    const dim = imageDimensions(image);
    const social = socialMetadata({
      title,
      description,
      url,
      image,
      imageAlt: postCoverAlt(extra.slug, title),
      imageWidth: dim?.width,
      imageHeight: dim?.height,
    });
    return {
      metadataBase: new URL(SITE.origin),
      title: pageTitle(title),
      description,
      alternates: { canonical: url },
      openGraph: {
        ...social.openGraph,
        type: "article",
        publishedTime: extra.publishedAt,
      },
      twitter: social.twitter,
    };
  }
  const title = cmsPost.heading ?? cmsPost.title;
  const url = `${SITE.origin}${cmsPost.href}`;
  const description = cmsPost.excerpt ?? SITE.brandStatement;
  const covers = await getCoverMap();
  const image = covers.get(cmsPost.slug) ?? postCoverSrc(cmsPost.slug, cmsPost.coverImage);
  const dim = imageDimensions(image);
  const social = socialMetadata({
    title,
    description,
    url,
    image,
    imageAlt: postCoverAlt(cmsPost.slug, title),
    imageWidth: dim?.width,
    imageHeight: dim?.height,
  });
  return cmsGenerateMetadata(cmsPost.href, {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(title),
    description,
    alternates: { canonical: url },
    openGraph: {
      ...social.openGraph,
      type: "article",
      publishedTime: cmsPost.publishedAt ?? undefined,
    },
    twitter: social.twitter,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    const draft = await draftMode()
      .then((d) => d.isEnabled)
      .catch(() => false);
    const cmsSummary = draft ? null : await queryPublishedPostBySlug(slug);
    const routed = await queryRoutedContentByPath(
      cmsSummary?.path ?? `/${slug}`,
      { draft },
    );

    const extra = getSupplementalPost(slug);
    if (!routed || routed.collection !== "posts") {
      if (extra) return <SupplementalArticle post={extra} />;
      notFound();
    }
    if (!draft && !isPublishedAtPublic(routed.doc.publishedAt)) {
      if (extra) return <SupplementalArticle post={extra} />;
      notFound();
    }
    if (!draft && !hasRenderableCMSContent(routed.doc) && !cmsSummary) {
      if (extra) return <SupplementalArticle post={extra} />;
      notFound();
    }

    return (
      <>
        {draft ? <LivePreviewListener /> : null}
        <RenderRoutedContent doc={routed.doc} collection="posts" />
      </>
    );
  }

  if (!isPublishedAtPublic(post.datePublished)) notFound();

  const pageUrl = post.canonical ?? `${SITE.origin}${post.path}`;
  const title = post.heading ?? post.title;
  const covers = await getCoverMap();
  const cover = covers.get(post.slug) ?? postCoverSrc(post.slug, post.coverImage);
  const coverUrl = `${SITE.origin}${cover}`;
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
        image: coverUrl,
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
        url: coverUrl,
        contentUrl: coverUrl,
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
    <CMSRoute path={post.path}>
    <div className="mh-light">
      <JsonLd data={graph} />

      <article className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pt-16 md:pt-40">
        <AuroraBlobs className="opacity-20" />
        <div className="mh-container relative z-10 pb-16 md:pb-24">
          <div className="mx-auto max-w-2xl">
            <Reveal className="mh-lcp">
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

            {cover ? (
              <figure className="mt-8 overflow-hidden rounded-[var(--mh-radius-md)] bg-[color:var(--mh-ink-50)] p-1.5 ring-1 ring-[color:var(--mh-border)]">
                <Image
                  src={cover}
                  alt={postCoverAlt(post.slug, title)}
                  width={800}
                  height={520}
                  preload
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 42rem"
                  className="h-auto w-full rounded-[calc(var(--mh-radius-md)-4px)]"
                  style={{ width: "100%", height: "auto" }}
                />
              </figure>
            ) : null}

            <div
              className="mh-prose mt-10"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: repairLegacyInlineImages(post.bodyHtml ?? "") }}
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
                        src={covers.get(p.slug) ?? postCoverSrc(p.slug, p.coverImage)}
                        alt={postCoverAlt(p.slug, p.heading ?? p.title)}
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
  </CMSRoute>
  );
}

async function SupplementalArticle({ post }: { post: SupplementalPost }) {
  const title = post.title;
  const covers = await getCoverMap();
  const cover = covers.get(post.slug) ?? postCoverSrc(post.slug, post.coverImage);
  return (
    <CMSRoute path={`/${post.slug}`}>
      <article className="mh-light border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
        <div className="mh-container py-16 md:py-24">
          <p className="mh-kicker">{post.category ?? "Journal"}</p>
          <Display as={1} size="hero" className="mt-5 max-w-4xl">
            {title}
          </Display>
          <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            {post.excerpt}
          </p>
          <figure className="mt-8 max-w-3xl overflow-hidden rounded-[var(--mh-radius-md)] bg-[color:var(--mh-ink-50)] p-1.5 ring-1 ring-[color:var(--mh-border)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(var(--mh-radius-md)-4px)]">
              <Image
                src={cover}
                alt={postCoverAlt(post.slug, title)}
                fill
                preload
                fetchPriority="high"
                sizes="(max-width: 768px) 100vw, 48rem"
                className="object-cover"
              />
            </div>
          </figure>
          <div className="mt-14 max-w-3xl rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] px-6 py-8 text-center md:px-10">
            <Display as={2} size="sm">
              Ready for a result you can <Italic>see today?</Italic>
            </Display>
            <div className="mt-6">
              <BookingButton size="lg">Book a Private Consultation</BookingButton>
            </div>
          </div>
        </div>
      </article>
    </CMSRoute>
  );
}
