import type { MetadataRoute } from "next";
import { PAGES } from "@/lib/pages";
import { POSTS } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { SERVICES } from "@/lib/seo/services";
import { CONDITIONS } from "@/lib/seo/conditions";
import { TIER1_CITIES, TIER2_CITIES } from "@/lib/seo/cities";

/**
 * Site sitemap.
 *
 * URLs match the historical Yoast SEO output as closely as possible:
 * - All 26 top-level pages (page-sitemap.xml)
 * - All 3 category archives (category-sitemap.xml)
 * - All discoverable blog posts (was not present in the WP sitemap but is
 *   reachable via internal links; we surface them explicitly so search
 *   engines can (re)index the same URLs on the new build).
 * - Full programmatic build (ModFX Media SEO spec, all 3 phases): 8
 *   services, 10 hair-loss conditions, 35 Tier 1 + 89 Tier 2 city pages,
 *   and 280 Tier 1 city x service pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const items: MetadataRoute.Sitemap = [];

  for (const p of PAGES) {
    if (p.path === "/landing-page/" || p.path === "/booking/" || p.path === "/video-call/") continue;
    items.push({
      url: p.canonical,
      lastModified: now,
      changeFrequency: p.isCategory ? "monthly" : "yearly",
      priority: p.path === "/" ? 1 : 0.7,
    });
  }
  for (const post of POSTS) {
    items.push({
      url: post.canonical ?? `${SITE.origin}${post.path}`,
      lastModified: post.dateModified ? new Date(post.dateModified) : now,
      changeFrequency: "yearly",
      priority: 0.6,
    });
  }
  for (const service of SERVICES) {
    const path =
      service.slug === "mens-hair-replacement-systems"
        ? "/mens-hair-replacement-systems/"
        : `/services/${service.slug}/`;
    items.push({
      url: `${SITE.origin}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  for (const condition of CONDITIONS) {
    items.push({
      url: `${SITE.origin}/hair-loss/${condition.slug}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const city of TIER1_CITIES) {
    items.push({
      url: `${SITE.origin}/locations/${city.slug}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    for (const service of SERVICES) {
      items.push({
        url: `${SITE.origin}/locations/${city.slug}/${service.slug}/`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }
  for (const city of TIER2_CITIES) {
    items.push({
      url: `${SITE.origin}/locations/${city.slug}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  items.push({
    url: `${SITE.origin}/sitemap/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  });
  return items;
}
