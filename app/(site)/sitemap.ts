import type { MetadataRoute } from "next";
import { PAGES } from "@/lib/pages";
import { POSTS } from "@/lib/posts";
import { SITE } from "@/lib/site";
import { SERVICES } from "@/lib/seo/services";
import { CONDITIONS } from "@/lib/seo/conditions";
import { TIER1_CITIES, TIER2_CITIES } from "@/lib/seo/cities";
import { queryCMSSitemapEntries } from "@/lib/cms/queries";
import { normalizeCmsPath } from "@/lib/cms/path";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const items: MetadataRoute.Sitemap = [];
  const cms = await queryCMSSitemapEntries();
  const cmsByPath = new Map(cms.map((entry) => [entry.path, entry]));

  const push = (publicPath: string, canonical: string, extra: Partial<MetadataRoute.Sitemap[number]>) => {
    const cmsPath = normalizeCmsPath(publicPath);
    const cmsEntry = cmsPath ? cmsByPath.get(cmsPath) : undefined;
    if (cmsEntry?.noIndex || cmsEntry?.excludeFromSitemap) return;
    items.push({
      url: canonical,
      lastModified: cmsEntry?.lastModified ? new Date(cmsEntry.lastModified) : extra.lastModified ?? now,
      changeFrequency: extra.changeFrequency,
      priority: extra.priority,
    });
  };

  for (const p of PAGES) {
    if (p.path === "/landing-page/" || p.path === "/booking/" || p.path === "/video-call/") continue;
    push(p.path, p.canonical, {
      lastModified: now,
      changeFrequency: p.isCategory ? "monthly" : "yearly",
      priority: p.path === "/" ? 1 : 0.7,
    });
  }
  for (const post of POSTS) {
    push(post.path, post.canonical ?? `${SITE.origin}${post.path}`, {
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
    push(path, `${SITE.origin}${path}`, {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  for (const condition of CONDITIONS) {
    const path = `/hair-loss/${condition.slug}/`;
    push(path, `${SITE.origin}${path}`, {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const city of TIER1_CITIES) {
    const cityPath = `/locations/${city.slug}/`;
    push(cityPath, `${SITE.origin}${cityPath}`, {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
    for (const service of SERVICES) {
      const path = `/locations/${city.slug}/${service.slug}/`;
      push(path, `${SITE.origin}${path}`, {
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }
  for (const city of TIER2_CITIES) {
    const path = `/locations/${city.slug}/`;
    push(path, `${SITE.origin}${path}`, {
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  push("/sitemap/", `${SITE.origin}/sitemap/`, {
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.5,
  });

  return items;
}
