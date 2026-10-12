import type { Metadata } from "next";
import { INDEXABLE } from "@/lib/seo/meta";
import { SITE } from "@/lib/site";
import { queryRoutedContentByPath } from "./queries";
import { normalizeCmsPath, publicPathFromCms } from "./path";
import { withCMS } from "./safe";

function metaFromDoc(doc: Record<string, unknown>, fallback: Metadata): Metadata {
  const cmsMeta = (doc.meta ?? {}) as Record<string, unknown>;
  const title =
    (typeof cmsMeta.title === "string" && cmsMeta.title) ||
    (typeof doc.title === "string" && doc.title) ||
    fallback.title;
  const description =
    (typeof cmsMeta.description === "string" && cmsMeta.description) ||
    (typeof doc.excerpt === "string" && doc.excerpt) ||
    fallback.description;
  const canonical =
    (typeof cmsMeta.canonicalUrl === "string" && cmsMeta.canonicalUrl) ||
    (typeof doc.path === "string"
      ? `${SITE.origin}${publicPathFromCms(normalizeCmsPath(doc.path) ?? "/")}`
      : undefined);
  const noIndex = Boolean(cmsMeta.noIndex);
  const noFollow = Boolean(cmsMeta.noFollow);

  return {
    ...fallback,
    title,
    description,
    ...(canonical ? { alternates: { ...fallback.alternates, canonical } } : {}),
    robots:
      noIndex || noFollow
        ? { index: !noIndex, follow: !noFollow }
        : fallback.robots ?? INDEXABLE,
  };
}

export async function cmsGenerateMetadata(
  path: string,
  fallback: Metadata,
): Promise<Metadata> {
  return withCMS(async () => {
    const routed = await queryRoutedContentByPath(path);
    if (!routed) return fallback;
    return metaFromDoc(routed.doc, fallback);
  }, fallback);
}
