import { getPayload } from "payload";
import config from "@payload-config";
import { normalizeCmsPath } from "./path";
import { withCMS } from "./safe";

export type RoutedDoc = {
  collection: "pages" | "posts";
  doc: Record<string, unknown>;
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
