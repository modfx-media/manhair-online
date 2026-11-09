import type { GlobalConfig } from "payload";
import { payloadOwner } from "../collections/access";

const draftGlobals = {
  drafts: {
    schedulePublish: true,
  },
  maxPerDoc: 50,
} as const;

export const Header: GlobalConfig = {
  slug: "header",
  access: {
    read: () => true,
    update: payloadOwner,
  },
  fields: [
    {
      name: "logoUrl",
      type: "text",
    },
    {
      name: "navItems",
      type: "array",
      fields: [
        { name: "label", type: "text" },
        { name: "href", type: "text" },
      ],
    },
  ],
  versions: draftGlobals,
};

export const Footer: GlobalConfig = {
  slug: "footer",
  access: {
    read: () => true,
    update: payloadOwner,
  },
  fields: [
    {
      name: "blurb",
      type: "textarea",
    },
    {
      name: "quickLinks",
      type: "array",
      fields: [
        { name: "label", type: "text" },
        { name: "href", type: "text" },
      ],
    },
  ],
  versions: draftGlobals,
};

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  access: {
    read: () => true,
    update: payloadOwner,
  },
  fields: [
    {
      name: "siteName",
      type: "text",
    },
    {
      name: "tagline",
      type: "text",
    },
    {
      name: "brandStatement",
      type: "textarea",
    },
  ],
  versions: draftGlobals,
};
