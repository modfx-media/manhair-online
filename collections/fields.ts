import type { CollectionConfig } from "payload";
import { emptyToNull } from "@/lib/cms/hooks";
import { normalizeCmsPath } from "@/lib/cms/path";

export const uniqueNullableText = (
  name: string,
  label: string,
  extra: Record<string, unknown> = {},
) =>
  ({
    name,
    label,
    type: "text" as const,
    unique: true,
    index: true,
    hooks: {
      beforeValidate: [emptyToNull],
    },
    ...extra,
  }) as CollectionConfig["fields"][number];

export function assignPathFromSlug<T extends { slug?: unknown; path?: unknown }>(
  data: T | undefined,
): T | undefined {
  if (!data) return data;
  const existing = normalizeCmsPath(data.path);
  if (existing) {
    data.path = existing;
    return data;
  }
  const slug = typeof data.slug === "string" ? data.slug.trim() : "";
  if (!slug) return data;
  data.path = slug === "home" ? "/" : normalizeCmsPath(`/${slug}`);
  return data;
}
