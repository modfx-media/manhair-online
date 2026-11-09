import type { CollectionConfig } from "payload";
import { anyone, payloadOwner } from "./access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: payloadOwner,
    delete: payloadOwner,
    read: anyone,
    update: payloadOwner,
  },
  fields: [
    {
      name: "alt",
      type: "text",
    },
  ],
  upload: true,
};
