import { POSTS, type Post } from "@/lib/posts";
import { distinctCover, postCoverAlt, postCoverSrc } from "@/lib/post-cover";
import type { PostCard } from "@/components/PostGrid";
import { isPublishedAtPublic } from "./publish-date";
import { queryPublishedPosts, type CMSPostSummary } from "./queries";
import {
  cmsDatabaseConfigured,
  SUPPLEMENTAL_POSTS,
  type SupplementalPost,
} from "./supplemental-posts";

function formatCardDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

function staticToCard(post: Post): PostCard {
  const title = post.heading ?? post.title;
  return {
    href: post.path,
    category: post.category ?? "Uncategorized",
    title,
    excerpt: post.excerpt,
    image: postCoverSrc(post.slug, post.coverImage),
    imageAlt: postCoverAlt(post.slug, title),
    date: post.datePublished ? formatCardDate(post.datePublished) : undefined,
  };
}

function cmsToCard(post: CMSPostSummary): PostCard {
  const title = post.heading ?? post.title;
  return {
    href: post.href,
    category: post.category ?? "Uncategorized",
    title,
    excerpt: post.excerpt,
    image: postCoverSrc(post.slug, post.coverImage),
    imageAlt: postCoverAlt(post.slug, title),
    date: post.publishedAt ? formatCardDate(post.publishedAt) : undefined,
  };
}

function supplementalToCard(post: SupplementalPost): PostCard {
  return {
    href: `/${post.slug}/`,
    category: post.category ?? "Uncategorized",
    title: post.title,
    excerpt: post.excerpt,
    image: postCoverSrc(post.slug),
    imageAlt: postCoverAlt(post.slug, post.title),
    date: formatCardDate(post.publishedAt),
  };
}

/**
 * Merge designed static posts with CMS-published posts.
 * CMS wins on slug collisions. Future-dated entries are excluded.
 * Without a database, supplemental CMS posts keep the listing complete.
 */
export async function getBlogPostCards(limit?: number): Promise<PostCard[]> {
  const now = new Date();
  const cmsPosts = await queryPublishedPosts(5000);
  const rows: { slug: string; iso: string; card: PostCard; cmsCover: string | null }[] = [];
  const seen = new Set<string>();

  for (const post of cmsPosts) {
    seen.add(post.slug);
    rows.push({
      slug: post.slug,
      iso: post.publishedAt ?? "",
      card: cmsToCard(post),
      cmsCover: post.coverImage,
    });
  }
  for (const post of POSTS) {
    if (seen.has(post.slug)) continue;
    if (!isPublishedAtPublic(post.datePublished, now)) continue;
    seen.add(post.slug);
    rows.push({
      slug: post.slug,
      iso: post.datePublished ?? "",
      card: staticToCard(post),
      cmsCover: post.coverImage,
    });
  }
  if (!cmsDatabaseConfigured()) {
    for (const post of SUPPLEMENTAL_POSTS) {
      if (seen.has(post.slug)) continue;
      if (!isPublishedAtPublic(post.publishedAt, now)) continue;
      seen.add(post.slug);
      rows.push({
        slug: post.slug,
        iso: post.publishedAt,
        card: supplementalToCard(post),
        cmsCover: null,
      });
    }
  }

  rows.sort((a, b) => b.iso.localeCompare(a.iso));

  const used = new Set<string>();
  for (const row of rows) {
    const image = distinctCover(row.slug, used, row.cmsCover);
    row.card.image = image;
    used.add(image);
  }

  const cards = rows.map((row) => row.card);
  return typeof limit === "number" ? cards.slice(0, limit) : cards;
}
