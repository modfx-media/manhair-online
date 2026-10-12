import type { FieldHook } from "payload";

/** Unique slug/path/legacyId must store null instead of empty string. */
export const emptyToNull: FieldHook = ({ value }) => {
  if (value === "" || value === undefined) return null;
  return value;
};
