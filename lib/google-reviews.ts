import { cache } from "react";
import {
  cleanReviewQuote,
  fiveStarReviews,
  googleReviewsMeta,
  isFiveStarReview,
  type GoogleReview,
  type GoogleReviewsMeta,
} from "./reviews";

const REVIEWS_REVALIDATE_SECONDS = 60 * 60 * 24;
const PLACES_FIELD_MASK = "id,rating,userRatingCount,googleMapsUri,reviews";

export type GoogleReviewsPayload = {
  reviews: GoogleReview[];
  meta: GoogleReviewsMeta;
};

type PlacesReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  text?: { text?: string };
  originalText?: { text?: string };
  authorAttribution?: { displayName?: string };
};

type PlacesDetailsResponse = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlacesReview[];
  error?: { message?: string; status?: string };
};

function reviewKey(review: GoogleReview): string {
  return `${review.name.trim().toLowerCase()}\n${review.quote.trim()}`;
}

function uniqueFiveStarReviews(
  primary: GoogleReview[],
  extra: GoogleReview[],
): GoogleReview[] {
  const seen = new Set<string>();
  const merged: GoogleReview[] = [];
  for (const review of [...primary, ...extra]) {
    if (!isFiveStarReview(review)) continue;
    const key = reviewKey(review);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(review);
  }
  return merged;
}

function fallbackPayload(): GoogleReviewsPayload {
  const reviews = uniqueFiveStarReviews(fiveStarReviews, []);
  return {
    reviews,
    meta: {
      ...googleReviewsMeta,
      fiveStarCount: reviews.length,
    },
  };
}

function mapPlaceReview(review: PlacesReview): GoogleReview | null {
  const quote = cleanReviewQuote(
    review.text?.text ?? review.originalText?.text ?? "",
  );
  const name = review.authorAttribution?.displayName?.trim() ?? "";
  const rating = review.rating ?? 0;

  if (rating !== 5 || !quote || !name) return null;

  return {
    quote,
    name,
    rating: 5,
    relativeTime: review.relativePublishTimeDescription,
  };
}

function placesApiKey(): string {
  return (
    process.env.GOOGLE_PLACES_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim() ||
    ""
  );
}

/**
 * Places API (New), then every 5-star review with text.
 * Google returns at most 5 most-relevant reviews. Those are merged
 * with verified on-file 5-star Google quotes so the site can show
 * more than Google's 5-review cap.
 */
export const getDisplayedGoogleReviews = cache(
  async (): Promise<GoogleReviewsPayload> => {
    const apiKey = placesApiKey();
    const placeId =
      process.env.GOOGLE_PLACE_ID?.trim() || googleReviewsMeta.placeId;

    if (!apiKey || !placeId || placeId.startsWith("REPLACE_")) {
      return fallbackPayload();
    }

    try {
      const response = await fetch(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`,
        {
          headers: {
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
          },
          next: {
            revalidate: REVIEWS_REVALIDATE_SECONDS,
            tags: ["google-reviews"],
          },
        },
      );

      const data = (await response.json()) as PlacesDetailsResponse;

      if (!response.ok || data.error) {
        console.error(
          "Google Places reviews request failed:",
          data.error?.message ?? response.statusText,
        );
        return fallbackPayload();
      }

      const liveReviews = (data.reviews ?? [])
        .map(mapPlaceReview)
        .filter((review): review is GoogleReview => review !== null);

      const reviews = uniqueFiveStarReviews(liveReviews, fiveStarReviews);
      if (reviews.length === 0) return fallbackPayload();

      return {
        reviews,
        meta: {
          rating: data.rating ?? googleReviewsMeta.rating,
          reviewCount: data.userRatingCount ?? googleReviewsMeta.reviewCount,
          fiveStarCount: reviews.length,
          placeId,
          reviewsUrl: data.googleMapsUri ?? googleReviewsMeta.reviewsUrl,
        },
      };
    } catch (error) {
      console.error("Google Places reviews fetch error:", error);
      return fallbackPayload();
    }
  },
);
