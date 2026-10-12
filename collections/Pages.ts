import type { CollectionConfig } from "payload";
import { emptyToNull } from "@/lib/cms/hooks";
import { authenticated, authenticatedOrPublished } from "./access";
import { assignPathFromSlug, uniqueNullableText } from "./fields";
import { previewAdmin, publicDrafts } from "./versions";

export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "path", "template", "_status", "updatedAt"],
    ...previewAdmin,
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  defaultPopulate: {
    title: true,
    path: true,
    slug: true,
    template: true,
    excerpt: true,
    heading: true,
    bodyHtml: true,
    meta: true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "heading",
      type: "text",
    },
    uniqueNullableText("slug", "Slug"),
    uniqueNullableText("path", "Path", {
      admin: {
        description: "Public path without trailing slash, e.g. /about",
      },
    }),
    uniqueNullableText("legacyId", "Legacy ID"),
    {
      name: "sourceUrl",
      type: "text",
      index: true,
      hooks: { beforeValidate: [emptyToNull] },
    },
    {
      name: "sourceUpdatedAt",
      type: "text",
    },
    {
      name: "template",
      type: "select",
      defaultValue: "marketing",
      options: [
        { label: "Home", value: "home" },
        { label: "Marketing", value: "marketing" },
        { label: "Service", value: "service" },
        { label: "Condition", value: "condition" },
        { label: "City", value: "city" },
        { label: "City + service", value: "cityService" },
        { label: "Legal", value: "legal" },
        { label: "Blog index", value: "blogIndex" },
        { label: "Category", value: "category" },
        { label: "Landing", value: "landing" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "bodyHtml",
      type: "textarea",
      admin: {
        description:
          "Optional HTML overlay. Leave empty to keep the designed page after publish (SEO-only). Only fill when ready to replace the designed UI.",
      },
    },
  ],
  hooks: {
    beforeValidate: [({ data }) => assignPathFromSlug(data)],
  },
  versions: publicDrafts,
};

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "path", "slug", "_status", "updatedAt"],
    ...previewAdmin,
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "heading",
      type: "text",
    },
    uniqueNullableText("slug", "Slug"),
    uniqueNullableText("path", "Path"),
    uniqueNullableText("legacyId", "Legacy ID"),
    {
      name: "sourceUrl",
      type: "text",
      index: true,
      hooks: { beforeValidate: [emptyToNull] },
    },
    {
      name: "sourceUpdatedAt",
      type: "text",
    },
    {
      name: "excerpt",
      type: "textarea",
    },
    {
      name: "category",
      type: "text",
    },
    {
      name: "publishedAt",
      type: "date",
      admin: { date: { pickerAppearance: "dayAndTime" } },
    },
    {
      name: "coverImage",
      type: "text",
    },
    {
      name: "content",
      type: "richText",
    },
    {
      name: "bodyHtml",
      type: "textarea",
      admin: {
        description:
          "Optional HTML overlay. Leave empty to keep the designed blog post after publish.",
      },
    },
  ],
  hooks: {
    beforeValidate: [({ data }) => assignPathFromSlug(data)],
  },
  versions: publicDrafts,
};
