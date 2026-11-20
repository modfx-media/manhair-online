import type { Metadata } from "next";
import { DEFAULT_OG, INDEXABLE, pageTitle } from "@/lib/seo/meta";
import { SITE } from "@/lib/site";
import { queryRoutedContentByPath } from "./queries";
import { normalizeCmsPath, publicPathFromCms } from "./path";
import { withCMS } from "./safe";

/**
 * Same social defaults as `app/(site)/layout.tsx`. A page that does not set
 * `openGraph` inherits these. Next replaces the whole object when a child
 * sets one, so a CMS title override has to carry the other fields forward.
 */
const LAYOUT_OPEN_GRAPH: NonNullable<Metadata["openGraph"]> = {
  siteName: SITE.siteName,
  locale: SITE.locale,
  type: "website",
  title: SITE.siteName,
  description: SITE.brandStatement,
  url: `${SITE.origin}/`,
  images: [
    {
      url: DEFAULT_OG.url,
      width: DEFAULT_OG.width,
      height: DEFAULT_OG.height,
      alt: DEFAULT_OG.alt,
    },
  ],
};

const LAYOUT_TWITTER: NonNullable<Metadata["twitter"]> = {
  card: "summary_large_image",
  title: SITE.siteName,
  description: SITE.brandStatement,
  images: [DEFAULT_OG.url],
};

/**
 * Non-empty CMS string. Whitespace is preserved; only "" is treated as unset.
 * Matches the previous truthiness check (`value &&`).
 */
function cmsText(value: unknown): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

/**
 * `app/(site)/layout.tsx` sets `title.template` to `%s | ManHair`. Next runs
 * that template through `resolveTitle` for document titles, and uses the same
 * resolver for Open Graph and Twitter titles. `{ absolute }` skips whichever
 * template is active. Fallback titles stay as the page built them.
 */
function withOpenGraph(
  social: Metadata["openGraph"],
  title: string | undefined,
  description: string | undefined,
): NonNullable<Metadata["openGraph"]> {
  return {
    ...(social ?? LAYOUT_OPEN_GRAPH),
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
  };
}

function withTwitter(
  social: Metadata["twitter"],
  title: string | undefined,
  description: string | undefined,
): NonNullable<Metadata["twitter"]> {
  return {
    ...(social ?? LAYOUT_TWITTER),
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
  };
}

export function metadataFromCmsDoc(
  doc: Record<string, unknown>,
  fallback: Metadata,
): Metadata {
  const cmsMeta = (doc.meta ?? {}) as Record<string, unknown>;
  const cmsTitle = cmsText(cmsMeta.title);
  const cmsDescription = cmsText(cmsMeta.description);
  const canonical =
    cmsText(cmsMeta.canonicalUrl) ||
    (typeof doc.path === "string"
      ? `${SITE.origin}${publicPathFromCms(normalizeCmsPath(doc.path) ?? "/")}`
      : undefined);
  const noIndex = Boolean(cmsMeta.noIndex);
  const noFollow = Boolean(cmsMeta.noFollow);

  const overrideSocial = Boolean(cmsTitle || cmsDescription);

  return {
    ...fallback,
    ...(cmsTitle ? { title: pageTitle(cmsTitle) } : {}),
    ...(cmsDescription ? { description: cmsDescription } : {}),
    ...(overrideSocial
      ? {
          openGraph: withOpenGraph(fallback.openGraph, cmsTitle, cmsDescription),
          twitter: withTwitter(fallback.twitter, cmsTitle, cmsDescription),
        }
      : {}),
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
    return metadataFromCmsDoc(routed.doc, fallback);
  }, fallback);
}
