import type { Access } from "payload";

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Anonymous visitors only see published docs; logged-in editors see drafts. */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true;
  return {
    _status: {
      equals: "published",
    },
  };
};
