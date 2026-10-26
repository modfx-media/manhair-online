import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Served from the app root. `app/(site)/robots.ts` was shadowed by the
 * `[slug]` post route, so /robots.txt 404'd. Allow every crawler and
 * point at the existing sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
