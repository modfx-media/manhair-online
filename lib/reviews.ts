/**
 * Per-client Google review types + fallback.
 * Fallback quotes are published 5-star Google reviews for ManHair.
 * Never invent names or quotes.
 */
export const googleReviewsMeta = {
  rating: 0,
  reviewCount: 0,
  fiveStarCount: 0,
  placeId: "",
  reviewsUrl: "https://www.google.com/maps",
} as const;

export type GoogleReview = {
  quote: string;
  name: string;
  rating: number;
  relativeTime?: string;
};

export type GoogleReviewsMeta = {
  rating: number;
  reviewCount: number;
  fiveStarCount: number;
  placeId: string;
  reviewsUrl: string;
};

export const googleReviews: GoogleReview[] = [
  {
    name: "Austin",
    rating: 5,
    quote:
      "Honestly, life changing! The staff is outstanding! He is extremely detail oriented and strives for perfection. He made the whole process comfortable and is very hospitable. I was never shy about going bald in my early 20s. My friend recommended Man Hair for non-surgical hair replacement. I couldn't be more satisfied! I recommend Man Hair 1000%.",
  },
  {
    name: "Lawrence",
    rating: 5,
    quote:
      "I was interested but unsure about hair replacement. I visited just about every hair replacement place, and still felt undecided. But after meeting with the staff, I knew I wanted to go forward, and I wanted him to be my stylist. He not only does great work, my hair looks incredible, but he makes me feel like family. I never feel like a product. These guys don't upsell you. It's come-as-you-need-it and pay-per-visit.",
  },
  {
    name: "Bengt",
    rating: 5,
    quote:
      "Look no further than Man Hair for the highest quality hair replacement. I have had two hair transplants elsewhere and the results were disappointing. The team at Man Hair, however, provide industry-leading replacement, the care and attention are second to none. I cannot recommend Man Hair more highly.",
  },
  {
    name: "Eliot",
    rating: 5,
    quote:
      "Loved the outcome of it so much! The staff's attention to detail is next level! Highly recommend anyone who is looking for hair replacement. Through this process, I was able to gain back confidence! Thank you so much Man Hair for a lovely experience!",
  },
];

/** The only acceptance test for a card or a JSON-LD review. */
export function isFiveStarReview(review: GoogleReview): boolean {
  return review.rating === 5 && review.quote.trim().length > 0 && review.name.trim().length > 0;
}

export const fiveStarReviews = googleReviews.filter(isFiveStarReview);

export function cleanReviewQuote(quote: string): string {
  return quote.replace(/\s*—\s*/g, ", ").replace(/\s+/g, " ").trim();
}

export function toTestimonialCard(review: GoogleReview): {
  name: string;
  photo: null;
  quote: string;
  source: "google";
  when: string;
} {
  return {
    name: review.name,
    photo: null,
    quote: cleanReviewQuote(review.quote),
    source: "google",
    when: review.relativeTime ?? "Posted on Google",
  };
}
