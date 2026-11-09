import type { Access } from "payload";
import { staffRole } from "@/lib/membership/access";

export const anyone: Access = () => true;

export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Payload admin, user management, and page edits are limited to membership owners. */
export const payloadOwner: Access = ({ req: { user } }) => {
  const email = user && "email" in user && typeof user.email === "string" ? user.email : null;
  return staffRole(email, process.env) === "owner";
};

/** Admin-panel gate. Payload requires a boolean, not a query constraint. */
export function payloadOwnerAdmin({ req }: { req: { user?: { email?: unknown } | null } }): boolean {
  const email = req.user && typeof req.user.email === "string" ? req.user.email : null;
  return staffRole(email, process.env) === "owner";
}

/** Anonymous visitors and non-owners only see published docs. Owners see drafts. */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  const email = user && "email" in user && typeof user.email === "string" ? user.email : null;
  if (staffRole(email, process.env) === "owner") return true;
  return {
    _status: {
      equals: "published",
    },
  };
};
