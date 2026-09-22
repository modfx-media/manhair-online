import type { ReactNode } from "react";
import { getDisplayedGoogleReviews } from "@/lib/google-reviews";

export async function GoogleReviews({
  children,
}: {
  children: (
    payload: Awaited<ReturnType<typeof getDisplayedGoogleReviews>>,
  ) => ReactNode;
}) {
  const payload = await getDisplayedGoogleReviews();
  if (payload.reviews.length === 0) return null;
  return children(payload);
}
