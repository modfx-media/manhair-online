import { POSTS, type Post } from "@/lib/posts";
import { postCoverSrc } from "@/lib/post-cover";
import type { PostCard } from "@/components/PostGrid";
import { isPublishedAtPublic } from "./publish-date";
import { queryPublishedPosts, type CMSPostSummary } from "./queries";

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
    image: postCoverSrc(post.slug),
    imageAlt: title,
    date: post.datePublished ? formatCardDate(post.datePublished) : undefined,
  };
}

function cmsToCard(post: CMSPostSummary): PostCard {
  const title = post.heading ?? post.title;
  const image =
    (post.coverImage && post.coverImage.startsWith("/")
      ? post.coverImage
      : null) ?? postCoverSrc(post.slug);
  return {
    href: post.href,
    category: post.category ?? "Uncategorized",
    title,
    excerpt: post.excerpt,
    image,
    imageAlt: title,
    date: post.publishedAt ? formatCardDate(post.publishedAt) : undefined,
  };
}

/**
 * Merge designed static posts with CMS-published posts.
 * CMS wins on slug collisions. Future-dated entries are excluded.
 */
export async function getBlogPostCards(limit?: number): Promise<PostCard[]> {
  const now = new Date();
  const cmsPosts = await queryPublishedPosts(5000);
  const rows: { slug: string; iso: string; card: PostCard }[] = [];
  const seen = new Set<string>();

  for (const post of cmsPosts) {
    seen.add(post.slug);
    rows.push({
      slug: post.slug,
      iso: post.publishedAt ?? "",
      card: cmsToCard(post),
    });
  }
  for (const post of POSTS) {
    if (seen.has(post.slug)) continue;
    if (!isPublishedAtPublic(post.datePublished, now)) continue;
    rows.push({
      slug: post.slug,
      iso: post.datePublished ?? "",
      card: staticToCard(post),
    });
  }

  const cards = rows
    .sort((a, b) => b.iso.localeCompare(a.iso))
    .map((row) => row.card);
  return typeof limit === "number" ? cards.slice(0, limit) : cards;
}
