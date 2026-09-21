/**
 * Placeholder catalog for the /hair-preview/ tool. Reference images
 * borrow existing product photography until real per-style renders
 * (or generated previews) replace them.
 */
export type HairStyleCategory = "Lace Front" | "Skin Base" | "Toupee" | "Full Coverage";

export type HairStyle = {
  id: string;
  name: string;
  description: string;
  image: string;
  category: HairStyleCategory;
};

export const HAIR_STYLE_CATEGORIES: HairStyleCategory[] = [
  "Lace Front",
  "Skin Base",
  "Toupee",
  "Full Coverage",
];

export const HAIR_STYLES: HairStyle[] = [
  {
    id: "lace-front-classic",
    name: "Classic Lace Front",
    description: "Natural hairline with a soft, undetectable edge.",
    image: "/hair-styles/lace-front-classic.webp",
    category: "Lace Front",
  },
  {
    id: "skin-base-system",
    name: "Skin Base System",
    description: "Ultra-thin polyurethane base for a scalp-close look.",
    image: "/hair-styles/skin-base-system.webp",
    category: "Skin Base",
  },
  {
    id: "french-lace-hairpiece",
    name: "French Lace Hairpiece",
    description: "Breathable full-lace construction with natural movement.",
    image: "/hair-styles/french-lace-hairpiece.webp",
    category: "Lace Front",
  },
  {
    id: "mono-lace-hairpiece",
    name: "Mono Lace Hairpiece",
    description: "Reinforced mono top for durability with a realistic parting.",
    image: "/hair-styles/mono-lace-hairpiece.webp",
    category: "Lace Front",
  },
  {
    id: "full-cut-toupee",
    name: "Full Cut Toupee",
    description: "Dense, ready-to-style coverage for a fuller crown.",
    image: "/hair-styles/full-cut-toupee.webp",
    category: "Toupee",
  },
  {
    id: "fine-welded-toupee",
    name: "Fine Welded Toupee",
    description: "Low-profile welded base built for everyday wear.",
    image: "/hair-styles/fine-welded-toupee.webp",
    category: "Toupee",
  },
  {
    id: "full-density-system",
    name: "Full Density System",
    description: "Maximum coverage system for significant hair loss.",
    image: "/hair-styles/full-density-system.webp",
    category: "Full Coverage",
  },
  {
    id: "non-surgical-replacement",
    name: "Non-Surgical Replacement",
    description: "Everyday system built for comfort and long-term wear.",
    image: "/hair-styles/non-surgical-replacement.webp",
    category: "Full Coverage",
  },
];

