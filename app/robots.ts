import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * Served from the app root. `app/(site)/robots.ts` was shadowed by the
 * `[slug]` post route, so /robots.txt 404'd. Allow crawling, and keep
 * the private tools and admin URLs out. None of these paths are in
 * the sitemap (`app/(site)/sitemap.ts`).
 */
const DISALLOW = [
  "/landing-page/",
  "/booking/",
  "/video-call/",
  "/hair-preview/",
  "/admin/",
  "/wp-admin/",
  "/wp-login.php",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: DISALLOW,
    },
    sitemap: `${SITE.origin}/sitemap.xml`,
    host: SITE.origin,
  };
}
