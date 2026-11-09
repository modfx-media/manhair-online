import type { CollectionConfig } from "payload";
import { payloadOwner, payloadOwnerAdmin } from "./access";

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: true,
  access: {
    admin: payloadOwnerAdmin,
    create: payloadOwner,
    delete: payloadOwner,
    read: payloadOwner,
    update: payloadOwner,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
