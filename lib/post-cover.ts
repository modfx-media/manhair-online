/**
 * Featured image for every blog post.
 *
 * Listing cards, article heroes, and Open Graph tags all read this module,
 * so a post uses one photo in every place it appears.
 *
 * Covers are existing ManHair photos already in the repo (studio fittings,
 * hair systems, and client results). Two multi-megabyte PNG covers were
 * recompressed to JPEG at the same crop; no outside stock was added.
 *
 * CMS posts that are not in this map used to collapse onto the first pool
 * image (a hand on a thinning crown), so every unassigned post shared it.
 * Known posts are assigned here. A new slug hashes into FALLBACK_POOL,
 * which does not overlap these assignments.
 */

type Cover = {
  src: string;
  alt: string;
};

export const POST_COVERS: Record<string, Cover> = {
  "common-custom-hair-replacement-mistakes": {
    src: "/images/the-london-hair-clinic-27.jpg",
    alt: "Man seated in a salon chair during a professional hair system fitting",
  },
  "professional-hair-systems-diy-vs-studio-costs": {
    src: "/images/the-london-hair-clinic-36.jpg",
    alt: "Stylist fitting a men's hair system in a studio",
  },
  "a-guide-to-full-head-hair-replacement-for-men": {
    src: "/images/blogs-images/a-guide-to-full-head-hair-replacement-for-men.jpeg",
    alt: "Man with a full, textured hair system styled away from his face",
  },
  "active-mens-guide-to-human-hair-systems-in-jacksonville": {
    src: "/images/blogs-images/active-mens-guide-to-human-hair-systems-in-jacksonville.jpg",
    alt: "Smiling man with a short, styled men's hair system",
  },
  "compare-hair-replacement-vs-transplants-in-atlanta": {
    src: "/images/blogs-images/compare-hair-replacement-vs-transplants-in-atlanta.jpg",
    alt: "Man with a full hair system, hand resting against his hairline",
  },
  "what-to-expect-from-a-hair-replacement-consultation-in-jacksonville": {
    src: "/images/blogs-images/what-to-expect-from-a-hair-replacement-consultation-in-jacksonville.jpg",
    alt: "Man with a natural hair system looking slightly off camera",
  },
  "choosing-receding-hairline-solutions-in-jacksonville": {
    src: "/images/blogs-images/choosing-receding-hairline-solutions-in-jacksonville.jpg",
    alt: "Man touching a receding hairline at the temples",
  },
  "florida-humidity-tips-for-natural-looking-hair-systems": {
    src: "/images/blogs-images/florida-humidity-tips-for-natural-looking-hair-systems.webp",
    alt: "Man with a hair system walking on a sunny beach",
  },
  "5-tactics-that-help-slow-aging-hair-loss-in-men": {
    src: "/images/mens-hair-units/thinning-image.jpg",
    alt: "Hand resting on a man's thinning crown",
  },
  "are-hair-replacement-systems-worth-it": {
    src: "/images/mens-hair-replacement-systems/3.jpg",
    alt: "Man with a full, natural-looking hair system smiling at the camera",
  },
  "can-hair-loss-be-a-sign-of-something-serious": {
    src: "/images/mens-hair-replacement-systems/5.jpg",
    alt: "Man covering thinning hair on the top of his head with one hand",
  },
  "can-over-shampooing-cause-hair-thinning": {
    src: "/images/mens-hairpieces/2.webp",
    alt: "Man with dark, styled hair looking at the camera",
  },
  "can-you-go-bald-from-wearing-hats": {
    src: "/images/mens-wigs/2.jpg",
    alt: "Man with a short, side-parted hair system",
  },
  "caring-for-your-manhair-hair-replacement-system-in-thesummer": {
    src: "/images/mens-hair-units/2.jpg",
    alt: "Man styling a wavy hair system in front of a mirror",
  },
  "do-hair-loss-shampoos-really-work": {
    src: "/images/mens-wigs/1.webp",
    alt: "Man with a blonde, wavy hair system",
  },
  "does-warmer-weather-affect-hair-loss": {
    src: "/images/non-surgical-hair-replacement/2.jpg",
    alt: "Man with a full hair system facing the camera",
  },
  "food-fixes-to-strengthen-your-strands": {
    src: "/images/mens-toupees/4.jpg",
    alt: "Man with thick, dark hair styled with a side part",
  },
  "getting-hair-transplant-surgery-may-not-be-the-best-solutions-there-are-other-options-out-there-like-hair-replacement-systems":
    {
      src: "/images/before-after/6.jpg",
      alt: "Grid of men wearing different men's hair systems",
    },
  "hair-replacement-surgery-vs-topical-hair-replacement": {
    src: "/images/before-after/8.jpg",
    alt: "Before-and-after grid of men's hair replacement results",
  },
  "how-long-do-hair-replacement-systems-last": {
    src: "/hair-styles/skin-base-system.webp",
    alt: "Skin-base men's hair system shown on a mannequin",
  },
  "how-to-tell-your-girlfriend-that-you-wear-a-hair-replacement-system": {
    src: "/images/before-after/12.jpg",
    alt: "Older man with a natural gray hair system",
  },
  "male-pattern-baldness-what-is-it-and-can-it-be-stopped": {
    src: "/images/mens-hair-replacement-systems/1.webp",
    alt: "Top view of a man's thinning crown",
  },
  "massaging-your-scalp-can-help-with-hair-growth": {
    src: "/images/homepage-images/Warren-Sims-Dallas-Man-weave.jpg",
    alt: "Close-up of a man's hairline and hair system",
  },
  "mens-hair-loss-and-the-depression-it-causes": {
    src: "/images/mens-hair-replacement-systems/2.jpeg",
    alt: "Side profile of a man with a full hair system",
  },
  "mens-hair-loss-myths-we-bet-some-will-surprise-you": {
    src: "/images/mens-toupees/1.jpg",
    alt: "Man with a blonde hair system styled forward",
  },
  "non-surgical-hair-replacement-systems-vs-micro-scalp-pigmentation": {
    src: "/images/mens-hair-units/3.jpg",
    alt: "Top-down view of a men's hair system on the scalp",
  },
  "the-harsh-truth-how-hair-loss-shampoos-can-aggravate-hair-loss": {
    src: "/images/hair-system-maintenance/1.jpeg",
    alt: "Barber tools laid out for men's hair system care",
  },
  "vitamin-deficiencies-that-cause-hair-loss": {
    src: "/images/before-after/11.jpg",
    alt: "Man with a full head of hair after non-surgical replacement",
  },
  "what-hair-to-wear": {
    src: "/hair-styles/full-cut-toupee.webp",
    alt: "Full-cut men's toupee displayed on a mannequin",
  },
  "what-not-to-do-when-your-hair-is-falling-out-a-guide-for-men": {
    src: "/images/hair-system-maintenance/3.jpg",
    alt: "Man resting a hand on thinning hair",
  },
  "why-hair-systems-are-the-safest-hair-loss-solution": {
    src: "/images/hair-system-maintenance/2.jpg",
    alt: "Smiling man wearing a professionally fitted hair system",
  },
  "why-men-lose-their-hair-young": {
    src: "/images/mens-hair-units/4.jpg",
    alt: "Side profile of a younger man with a full hair system",
  },
  "why-your-hair-can-have-such-a-dramatic-effect-on-your-confidence": {
    src: "/images/mens-toupees/3.jpg",
    alt: "Man with a brown hair system looking at the camera",
  },
};

/** Photos not used above. New posts rotate through these instead of sharing one image. */
const FALLBACK_POOL = [
  "/images/mens-hair-replacement-systems/4.jpg",
  "/images/mens-toupees/2.jpg",
  "/images/mens-wigs/3.jpeg",
  "/images/mens-hairpieces/1.jpg",
  "/images/mens-hairpieces/4.jpg",
  "/images/non-surgical-hair-replacement/3.jpeg",
  "/images/hair-system-maintenance/4.jpg",
  "/images/before-after/results/Before-after1.jpg",
  "/images/10.jpg",
  "/images/mens-hair-units/1.jpeg",
  "/images/non-surgical-hair-replacement/1.webp",
] as const;

const ASSIGNED = new Set(Object.values(POST_COVERS).map((cover) => cover.src));

function hashSlug(slug: string): number {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Local cover for a post. An explicit assignment always wins so the listing,
 * detail page, and OG image stay in sync even when the CMS stores a shared
 * or remote URL. A local CMS path is used only when this slug has no
 * assignment and that file is not already a featured image.
 */
export function postCoverSrc(slug: string, cmsCover?: string | null): string {
  const explicit = POST_COVERS[slug];
  if (explicit) return explicit.src;
  if (cmsCover && cmsCover.startsWith("/") && !ASSIGNED.has(cmsCover)) {
    return cmsCover;
  }
  return FALLBACK_POOL[hashSlug(slug) % FALLBACK_POOL.length];
}

export function postCoverAlt(slug: string, fallbackTitle: string): string {
  return POST_COVERS[slug]?.alt || fallbackTitle;
}

/** Listing helper: if two posts still resolve to one file, give the later one another fallback photo. */
export function distinctCover(
  slug: string,
  used: ReadonlySet<string>,
  cmsCover?: string | null,
): string {
  const preferred = postCoverSrc(slug, cmsCover);
  if (!used.has(preferred)) return preferred;
  const start = hashSlug(slug) % FALLBACK_POOL.length;
  for (let i = 0; i < FALLBACK_POOL.length; i++) {
    const candidate = FALLBACK_POOL[(start + i) % FALLBACK_POOL.length];
    if (!used.has(candidate)) return candidate;
  }
  return preferred;
}
