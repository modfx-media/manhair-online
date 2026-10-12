import type { CollectionConfig } from "payload";
import { previewFromPath } from "@/lib/cms/path";

export const publicDrafts = {
  drafts: {
    schedulePublish: true,
  },
  maxPerDoc: 50,
} satisfies NonNullable<CollectionConfig["versions"]>;

export const previewAdmin = {
  preview: (doc: { path?: unknown; slug?: unknown }) => previewFromPath(doc),
  livePreview: {
    url: ({ data }: { data: { path?: unknown; slug?: unknown } }) =>
      previewFromPath(data),
  },
};
