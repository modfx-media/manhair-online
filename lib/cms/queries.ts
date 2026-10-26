import { cache } from "react";
import { getPayload } from "payload";
import config from "@payload-config";
import { normalizeCmsPath, publicPathFromCms } from "./path";
import { isPublishedAtPublic } from "./publish-date";
import { withCMS } from "./safe";

export type RoutedDoc = {
  collection: "pages" | "posts";
  doc: Record<string, unknown>;
};

export type CMSPostSummary = {
  id: string | number;
  slug: string;
  path: string;
  href: string;
  title: string;
  heading: string | null;
  excerpt: string | null;
  category: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

export async function queryRoutedContentByPath(
  rawPath: string,
  options: { draft?: boolean } = {},
): Promise<RoutedDoc | null> {
  const path = normalizeCmsPath(rawPath);
  if (!path) return null;
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) return null;

  return withCMS(async () => {
    const payload = await getPayload({ config });
    const isDraft = options.draft ?? false;
    const findOpts = {
      draft: isDraft,
      overrideAccess: isDraft,
      pagination: false as const,
      limit: 1,
      depth: 1,
      where: { path: { equals: path } },
    };

    const pages = await payload.find({ collection: "pages", ...findOpts });
    const page = pages.docs[0];
    if (page) {
      return { collection: "pages" as const, doc: page as unknown as Record<string, unknown> };
    }

    const posts = await payload.find({ collection: "posts", ...findOpts });
    const post = posts.docs[0];
    if (post) {
      return { collection: "posts" as const, doc: post as unknown as Record<string, unknown> };
    }

    return null;
  }, null);
}

export type CMSSitemapEntry = {
  path: string;
  lastModified?: string;
  noIndex?: boolean;
  excludeFromSitemap?: boolean;
};

export async function queryCMSSitemapEntries(): Promise<CMSSitemapEntry[]> {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) return [];
  return withCMS(async () => {
    const payload = await getPayload({ config });
    const entries: CMSSitemapEntry[] = [];

    for (const collection of ["pages", "posts"] as const) {
      const result = await payload.find({
        collection,
        draft: false,
        overrideAccess: false,
        pagination: false,
        limit: 5000,
        depth: 0,
        select: {
          path: true,
          updatedAt: true,
          sourceUpdatedAt: true,
          meta: true,
        },
      });
      for (const doc of result.docs) {
        const record = doc as Record<string, unknown>;
        const path = normalizeCmsPath(record.path);
        if (!path) continue;
        const meta = (record.meta ?? {}) as Record<string, unknown>;
        entries.push({
          path,
          lastModified:
            (typeof record.sourceUpdatedAt === "string" && record.sourceUpdatedAt) ||
            (typeof record.updatedAt === "string" ? record.updatedAt : undefined),
          noIndex: Boolean(meta.noIndex),
          excludeFromSitemap: Boolean(meta.excludeFromSitemap),
        });
      }
    }
    return entries;
  }, []);
}

function toPostSummary(doc: Record<string, unknown>): CMSPostSummary | null {
  const path = normalizeCmsPath(doc.path);
  const slug =
    (typeof doc.slug === "string" && doc.slug.trim()) ||
    (path && path !== "/" ? path.slice(1) : "");
  if (!path || !slug) return null;
  if (!isPublishedAtPublic(doc.publishedAt)) return null;

  const title = typeof doc.title === "string" ? doc.title : slug;
  return {
    id: doc.id as string | number,
    slug,
    path,
    href: publicPathFromCms(path),
    title,
    heading: typeof doc.heading === "string" ? doc.heading : null,
    excerpt: typeof doc.excerpt === "string" ? doc.excerpt : null,
    category: typeof doc.category === "string" ? doc.category : null,
    coverImage: typeof doc.coverImage === "string" ? doc.coverImage : null,
    publishedAt: typeof doc.publishedAt === "string" ? doc.publishedAt : null,
  };
}

/** Public, non-future posts for blog index / generateStaticParams. */
export const queryPublishedPosts = cache(async (
  limit = 100,
): Promise<CMSPostSummary[]> => {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) return [];
  return withCMS(async () => {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "posts",
      draft: false,
      overrideAccess: false,
      pagination: false,
      limit,
      depth: 0,
      sort: "-publishedAt",
      where: {
        _status: { equals: "published" },
      },
    });
    return result.docs
      .map((doc) => toPostSummary(doc as unknown as Record<string, unknown>))
      .filter((doc): doc is CMSPostSummary => Boolean(doc));
  }, []);
});

export async function queryPublishedPostSlugs(): Promise<string[]> {
  const posts = await queryPublishedPosts(5000);
  return posts.map((post) => post.slug);
}

export async function queryPublishedPostBySlug(
  slug: string,
): Promise<CMSPostSummary | null> {
  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!normalized) return null;
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) return null;

  return withCMS(async () => {
    const payload = await getPayload({ config });
    const path = normalizeCmsPath(`/${normalized}`);
    const result = await payload.find({
      collection: "posts",
      draft: false,
      overrideAccess: false,
      pagination: false,
      limit: 1,
      depth: 0,
      where: {
        and: [
          { _status: { equals: "published" } },
          {
            or: [
              { slug: { equals: normalized } },
              ...(path ? [{ path: { equals: path } }] : []),
            ],
          },
        ],
      },
    });
    const doc = result.docs[0] as unknown as Record<string, unknown> | undefined;
    return doc ? toPostSummary(doc) : null;
  }, null);
}
