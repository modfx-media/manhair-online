import { POSTS } from "@/lib/posts";

/**
 * Local covers for blog cards. Remote /wp-content/ URLs now 508-loop
 * because www.manhaironline.com is this Next.js app, so featured
 * images must be first-party files under /public/images/.
 */
const COVER_BY_SLUG: Record<string, string> = {
  "what-to-expect-from-a-hair-replacement-consultation-in-jacksonville":
    "/images/blogs-images/what-to-expect-from-a-hair-replacement-consultation-in-jacksonville.png",
  "choosing-receding-hairline-solutions-in-jacksonville":
    "/images/blogs-images/choosing-receding-hairline-solutions-in-jacksonville.jpg",
  "florida-humidity-tips-for-natural-looking-hair-systems":
    "/images/blogs-images/florida-humidity-tips-for-natural-looking-hair-systems.webp",
  "5-tactics-that-help-slow-aging-hair-loss-in-men":
    "/images/mens-hair-units/thinning-image.jpg",
  "are-hair-replacement-systems-worth-it":
    "/images/mens-hair-replacement-systems/3.jpg",
  "can-hair-loss-be-a-sign-of-something-serious":
    "/images/mens-hair-replacement-systems/5.jpg",
};

const COVER_POOL = [
  "/images/mens-hair-units/thinning-image.jpg",
  "/images/mens-hair-replacement-systems/2.jpeg",
  "/images/mens-hair-replacement-systems/3.jpg",
  "/images/mens-hair-replacement-systems/4.jpg",
  "/images/mens-hair-replacement-systems/5.jpg",
  "/images/homepage-images/Warren-Sims-Dallas-Man-weave.jpg",
  "/images/mens-toupees/1.jpg",
  "/images/mens-toupees/2.jpg",
  "/images/mens-toupees/3.jpg",
  "/images/mens-hairpieces/1.jpg",
  "/images/mens-hair-units/1.jpeg",
  "/images/mens-hair-units/2.jpg",
  "/images/mens-wigs/2.jpg",
  "/images/non-surgical-hair-replacement/2.jpg",
  "/images/non-surgical-hair-replacement/4.jpg",
  "/images/before-after/6.jpg",
  "/images/before-after/8.jpg",
  "/images/before-after/11.jpg",
  "/images/before-after/12.jpg",
  "/images/hair-system-maintenance/2.jpg",
] as const;

export function postCoverSrc(slug: string): string {
  const explicit = COVER_BY_SLUG[slug];
  if (explicit) return explicit;
  const idx = POSTS.findIndex((p) => p.slug === slug);
  return COVER_POOL[Math.max(idx, 0) % COVER_POOL.length];
}
