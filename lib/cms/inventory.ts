import { PAGES } from "@/lib/pages";
import { POSTS } from "@/lib/posts";
import { SITE, PRIMARY_NAV, FOOTER_QUICK_LINKS } from "@/lib/site";
import { SERVICES } from "@/lib/seo/services";
import { CONDITIONS } from "@/lib/seo/conditions";
import { TIER1_CITIES, TIER2_CITIES } from "@/lib/seo/cities";
import { normalizeCmsPath, publicPathFromCms } from "./path";

export type ExportRecord = {
  collection: "pages" | "posts";
  legacyId: string;
  sourceUrl: string;
  path: string;
  slug: string | null;
  title: string;
  heading?: string | null;
  excerpt?: string | null;
  bodyHtml?: string | null;
  template?: string;
  category?: string | null;
  coverImage?: string | null;
  publishedAt?: string | null;
  sourceUpdatedAt?: string | null;
  meta: {
    title?: string | null;
    description?: string | null;
    canonicalUrl?: string | null;
    noIndex?: boolean;
    noFollow?: boolean;
    excludeFromSitemap?: boolean;
  };
};

function noIndexFromRobots(robots: string | undefined): boolean {
  return Boolean(robots?.includes("noindex"));
}

function pageTemplate(cmsPath: string): string {
  if (cmsPath === "/") return "home";
  if (
    cmsPath === "/privacy-policy" ||
    cmsPath === "/terms-of-service" ||
    cmsPath === "/refund-policy"
  ) {
    return "legal";
  }
  if (cmsPath === "/blog") return "blogIndex";
  if (cmsPath.startsWith("/category/")) return "category";
  if (cmsPath.startsWith("/locations/") && cmsPath.split("/").length === 4)
    return "cityService";
  if (cmsPath.startsWith("/locations/") && cmsPath.split("/").length === 3)
    return "city";
  if (cmsPath.startsWith("/services/") || cmsPath === "/mens-hair-replacement-systems")
    return "service";
  if (cmsPath.startsWith("/hair-loss/")) return "condition";
  if (cmsPath === "/landing-page") return "landing";
  return "marketing";
}

export function buildContentExport(): {
  version: 1;
  records: ExportRecord[];
  globals: Record<string, unknown>;
} {
  const records: ExportRecord[] = [];
  const seen = new Set<string>();

  const push = (record: ExportRecord) => {
    if (!record.path || seen.has(record.path)) return;
    seen.add(record.path);
    records.push(record);
  };

  for (const page of PAGES) {
    const path = normalizeCmsPath(page.path);
    if (!path) continue;
    const noIndex = noIndexFromRobots(page.robots);
    push({
      collection: "pages",
      legacyId: `page:${path}`,
      sourceUrl: page.canonical,
      path,
      slug: path === "/" ? "home" : path.slice(1).replace(/\//g, "-"),
      title: page.title,
      excerpt: page.description,
      template: pageTemplate(path),
      meta: {
        title: page.og.title ?? page.title,
        description: page.og.description ?? page.description,
        canonicalUrl: page.canonical,
        noIndex,
        noFollow: Boolean(page.robots?.includes("nofollow")),
        excludeFromSitemap:
          noIndex ||
          path === "/landing-page" ||
          path === "/booking" ||
          path === "/video-call",
      },
    });
  }

  push({
    collection: "pages",
    legacyId: "page:/hair-preview",
    sourceUrl: `${SITE.origin}/hair-preview/`,
    path: "/hair-preview",
    slug: "hair-preview",
    title: "Hair Preview Tool",
    template: "other",
    meta: {
      title: "Hair Preview Tool",
      noIndex: true,
      noFollow: true,
      excludeFromSitemap: true,
      canonicalUrl: `${SITE.origin}/hair-preview/`,
    },
  });

  push({
    collection: "pages",
    legacyId: "page:/sitemap",
    sourceUrl: `${SITE.origin}/sitemap/`,
    path: "/sitemap",
    slug: "sitemap",
    title: "Sitemap | Every ManHair Page | Orange, CA",
    excerpt:
      "A complete directory of every ManHair page: services, hair-loss conditions, cities we serve, and core Orange County studio pages.",
    template: "marketing",
    meta: {
      title: "Sitemap | Every ManHair Page | Orange, CA",
      canonicalUrl: `${SITE.origin}/sitemap/`,
    },
  });

  for (const post of POSTS) {
    const path = normalizeCmsPath(post.path);
    if (!path) continue;
    push({
      collection: "posts",
      legacyId: `post:${post.slug}`,
      sourceUrl: post.canonical ?? `${SITE.origin}${post.path}`,
      path,
      slug: post.slug,
      title: post.title,
      heading: post.heading,
      excerpt: post.excerpt ?? post.description,
      // Keep designed blog UI after publish; editors can paste bodyHtml when ready to overlay.
      category: post.category,
      coverImage: post.coverImage,
      publishedAt: post.datePublished,
      sourceUpdatedAt: post.dateModified,
      meta: {
        title: post.og.title ?? post.title,
        description: post.description,
        canonicalUrl: post.canonical,
        noIndex: noIndexFromRobots(post.robots),
        noFollow: Boolean(post.robots?.includes("nofollow")),
        excludeFromSitemap: noIndexFromRobots(post.robots),
      },
    });
  }

  for (const service of SERVICES) {
    const publicPath =
      service.slug === "mens-hair-replacement-systems"
        ? "/mens-hair-replacement-systems/"
        : `/services/${service.slug}/`;
    const path = normalizeCmsPath(publicPath);
    if (!path) continue;
    push({
      collection: "pages",
      legacyId: `page:${path}`,
      sourceUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      path,
      slug: service.slug,
      title: `${service.name} | Orange, CA | ManHair`,
      heading: service.name,
      excerpt: service.metaDescription,
      // No bodyHtml: designed service pages stay until an editor intentionally overlays CMS content.
      template: "service",
      meta: {
        title: `${service.name} | Orange, CA | ManHair`,
        description: service.metaDescription,
        canonicalUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      },
    });
  }

  for (const condition of CONDITIONS) {
    const publicPath = `/hair-loss/${condition.slug}/`;
    const path = normalizeCmsPath(publicPath);
    if (!path) continue;
    push({
      collection: "pages",
      legacyId: `page:${path}`,
      sourceUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      path,
      slug: condition.slug,
      title: `${condition.name}: Hair Replacement Options | ManHair`,
      heading: condition.name,
      excerpt: condition.whatItIs,
      // No bodyHtml: designed condition pages stay until an editor intentionally overlays CMS content.
      template: "condition",
      meta: {
        title: `${condition.name}: Hair Replacement Options | ManHair`,
        description: `See how a custom hair system covers ${condition.name.toLowerCase()} at ManHair in Orange, CA.`,
        canonicalUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      },
    });
  }

  for (const city of [...TIER1_CITIES, ...TIER2_CITIES]) {
    const publicPath = `/locations/${city.slug}/`;
    const path = normalizeCmsPath(publicPath);
    if (!path) continue;
    push({
      collection: "pages",
      legacyId: `page:${path}`,
      sourceUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      path,
      slug: city.slug,
      title: `Hair Replacement Systems for Men in ${city.name}, CA | ManHair`,
      heading: city.name,
      excerpt: `Custom men's hair replacement for ${city.name}, ${city.county}. Fitted at our Orange, CA studio.`,
      template: "city",
      meta: {
        title: `Hair Replacement Systems for Men in ${city.name}, CA | ManHair`,
        description: `Custom men's hair replacement for ${city.name}, ${city.county}. Fitted at our Orange, CA studio. Start with a free virtual consultation.`,
        canonicalUrl: `${SITE.origin}${publicPathFromCms(path)}`,
      },
    });
  }

  for (const city of TIER1_CITIES) {
    for (const service of SERVICES) {
      const publicPath = `/locations/${city.slug}/${service.slug}/`;
      const path = normalizeCmsPath(publicPath);
      if (!path) continue;
      push({
        collection: "pages",
        legacyId: `page:${path}`,
        sourceUrl: `${SITE.origin}${publicPathFromCms(path)}`,
        path,
        slug: `${city.slug}-${service.slug}`,
        title: `${service.name} in ${city.name}, CA | ManHair`,
        heading: `${service.name} in ${city.name}`,
        excerpt: `${service.name} in ${city.name}, CA. Fitted at our Orange studio for ${city.county} clients.`,
        template: "cityService",
        meta: {
          title: `${service.name} in ${city.name}, CA | ManHair`,
          description: `${service.name} in ${city.name}, CA. Fitted at our Orange studio for ${city.county} clients. Book a free virtual consultation.`,
          canonicalUrl: `${SITE.origin}${publicPathFromCms(path)}`,
        },
      });
    }
  }

  return {
    version: 1,
    records,
    globals: {
      header: {
        logoUrl: SITE.logo.url,
        navItems: PRIMARY_NAV.map((item) => ({ label: item.label, href: item.href })),
      },
      footer: {
        blurb: SITE.brandStatement,
        quickLinks: FOOTER_QUICK_LINKS.map((item) => ({
          label: item.label,
          href: item.href,
        })),
      },
      "site-settings": {
        siteName: SITE.siteName,
        tagline: SITE.tagline,
        brandStatement: SITE.brandStatement,
      },
    },
  };
}

export function sitemapPublicPaths(): string[] {
  return buildContentExport()
    .records.filter((r) => !r.meta.excludeFromSitemap && !r.meta.noIndex)
    .map((r) => r.path);
}
