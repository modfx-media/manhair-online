import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";
import { revalidatePath } from "next/cache";
import { normalizeCmsPath, publicPathFromCms } from "@/lib/cms/path";

function pathsForDoc(doc: { path?: unknown; slug?: unknown } | null | undefined): string[] {
  const paths = new Set<string>(["/blog/", "/sitemap/", "/sitemap.xml"]);
  const fromPath = normalizeCmsPath(doc?.path);
  if (fromPath) paths.add(publicPathFromCms(fromPath));
  else if (typeof doc?.slug === "string" && doc.slug.trim()) {
    const slugPath = normalizeCmsPath(`/${doc.slug.trim()}`);
    if (slugPath) paths.add(publicPathFromCms(slugPath));
  }
  return [...paths];
}

function revalidateDocPaths(
  doc: { path?: unknown; slug?: unknown; _status?: unknown } | null | undefined,
  previousDoc?: { path?: unknown; slug?: unknown; _status?: unknown } | null,
) {
  for (const path of pathsForDoc(doc)) {
    revalidatePath(path);
  }
  if (previousDoc) {
    for (const path of pathsForDoc(previousDoc)) {
      revalidatePath(path);
    }
  }
}

/** On-demand ISR when posts are published, unpublished, or deleted. */
export const revalidatePost: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (context?.disableRevalidate) return doc;

  const becamePublic =
    doc?._status === "published" || previousDoc?._status === "published";
  if (!becamePublic) return doc;

  payload.logger.info(
    `Revalidating post paths for ${typeof doc?.slug === "string" ? doc.slug : doc?.id}`,
  );
  revalidateDocPaths(doc, previousDoc);
  return doc;
};

export const revalidatePostDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (context?.disableRevalidate) return doc;
  revalidateDocPaths(doc);
  return doc;
};
