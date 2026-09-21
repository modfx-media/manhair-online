/**
 * Placeholder catalog for the /hair-preview/ tool. Reference images
 * borrow existing product photography until real per-style renders
 * (or generated previews) replace them.
 */
export type HairStyle = {
  id: string;
  name: string;
  description: string;
  image: string;
};

export const HAIR_STYLES: HairStyle[] = [
  {
    id: "lace-front-classic",
    name: "Classic Lace Front",
    description: "Natural hairline with a soft, undetectable edge.",
    image: "/images/mens-hair-units/1.jpeg",
  },
  {
    id: "skin-base-system",
    name: "Skin Base System",
    description: "Ultra-thin polyurethane base for a scalp-close look.",
    image: "/images/mens-hair-units/2.jpg",
  },
  {
    id: "french-lace-hairpiece",
    name: "French Lace Hairpiece",
    description: "Breathable full-lace construction with natural movement.",
    image: "/images/mens-hairpieces/1.jpg",
  },
  {
    id: "mono-lace-hairpiece",
    name: "Mono Lace Hairpiece",
    description: "Reinforced mono top for durability with a realistic parting.",
    image: "/images/mens-hairpieces/3.avif",
  },
  {
    id: "full-cut-toupee",
    name: "Full Cut Toupee",
    description: "Dense, ready-to-style coverage for a fuller crown.",
    image: "/images/mens-toupees/1.jpg",
  },
  {
    id: "fine-welded-toupee",
    name: "Fine Welded Toupee",
    description: "Low-profile welded base built for everyday wear.",
    image: "/images/mens-toupees/3.jpg",
  },
  {
    id: "full-density-system",
    name: "Full Density System",
    description: "Maximum coverage system for significant hair loss.",
    image: "/images/mens-wigs/2.jpg",
  },
  {
    id: "non-surgical-replacement",
    name: "Non-Surgical Replacement",
    description: "Everyday system built for comfort and long-term wear.",
    image: "/images/non-surgical-hair-replacement/2.jpg",
  },
];
