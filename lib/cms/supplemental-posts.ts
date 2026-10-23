/**
 * Public CMS posts that are not in the static `POSTS` inventory.
 *
 * Production reads these from Payload. This list is used only when the
 * database is not configured (local dev and CI), so the blog listing, the
 * article hero, and the OG image can still be checked. When `DATABASE_URL`
 * is set, the CMS row wins and these entries are ignored.
 */

export type SupplementalPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string | null;
  publishedAt: string;
};

export const SUPPLEMENTAL_POSTS: SupplementalPost[] = [
  {
    slug: "common-custom-hair-replacement-mistakes",
    title: "Common Custom Hair Replacement Mistakes Jacksonville Men Can Avoid",
    excerpt:
      "Learn how to avoid common fit, maintenance, and styling errors with custom hair replacement in Jacksonville, Florida for a natural, lasting look",
    category: null,
    publishedAt: "2026-10-21T14:00:00.000Z",
  },
  {
    slug: "professional-hair-systems-diy-vs-studio-costs",
    title: "Professional Hair Systems Atlanta: DIY Vs Studio Costs",
    excerpt:
      "Compare DIY and studio options for professional hair systems in Atlanta, including upfront costs, maintenance needs, and support for a natural look",
    category: null,
    publishedAt: "2026-10-14T14:00:00.000Z",
  },
];

const BY_SLUG = new Map(SUPPLEMENTAL_POSTS.map((post) => [post.slug, post]));

export function cmsDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.PAYLOAD_SECRET);
}

export function getSupplementalPost(slug: string): SupplementalPost | undefined {
  if (cmsDatabaseConfigured()) return undefined;
  return BY_SLUG.get(slug);
}
