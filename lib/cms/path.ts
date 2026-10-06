/** CMS paths are unique, start with `/`, and never use a trailing slash. */

export function normalizeCmsPath(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const asUrl = trimmed.includes("://") ? new URL(trimmed).pathname : trimmed;
    const segments = asUrl.split("/").filter(Boolean);
    if (segments.some((seg) => seg === "null" || seg === "undefined")) return null;
    if (segments.length === 0) return "/";
    return `/${segments.join("/")}`;
  } catch {
    return null;
  }
}

export function publicPathFromCms(path: string): string {
  if (path === "/") return "/";
  return `${path}/`;
}

export function previewFromPath(doc: {
  path?: unknown;
  slug?: unknown;
}): string | null {
  const secret = process.env.PREVIEW_SECRET;
  if (!secret) return null;

  const fromPath = normalizeCmsPath(doc.path);
  const fromSlug =
    typeof doc.slug === "string" && doc.slug.trim()
      ? normalizeCmsPath(`/${doc.slug.trim()}`)
      : null;
  const path = fromPath ?? fromSlug;
  if (!path) return null;

  const publicPath = publicPathFromCms(path);
  return `/next/preview?path=${encodeURIComponent(publicPath)}&previewSecret=${encodeURIComponent(secret)}`;
}
