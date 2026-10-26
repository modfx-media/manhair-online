/**
 * In-body images inherited from WordPress.
 *
 * Requests for `/wp-content/uploads/...` on the live site rewrite back to
 * the same host and return HTTP 508, so the original files no longer load.
 * They are also absent from the Wayback Machine. Each broken `src` is
 * swapped for a photo already in this repo, with alt text that describes
 * that photo. The surrounding article copy is left in place, and `srcset`
 * entries that still point at the dead uploads are dropped so the browser
 * cannot prefer them.
 */

type InlineImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

const LEGACY_INLINE_IMAGES: Record<string, InlineImage> = {
  // food-fixes-to-strengthen-your-strands
  "https://www.manhaironline.com/wp-content/uploads/2023/04/man2.jpg": {
    src: "/images/mens-hair-units/thinning-image.jpg",
    alt: "Hand resting on a man's thinning crown",
    width: 1080,
    height: 1080,
  },
  "https://www.manhaironline.com/wp-content/uploads/2023/04/man3.jpg": {
    src: "/images/mens-hair-replacement-systems/3.jpg",
    alt: "Smiling man with a full, natural-looking hair system",
    width: 700,
    height: 700,
  },
  "https://www.manhaironline.com/wp-content/uploads/2023/04/man4.jpg": {
    src: "/images/non-surgical-hair-replacement/2.jpg",
    alt: "Man with a full hair system facing the camera",
    width: 977,
    height: 1000,
  },
  "https://www.manhaironline.com/wp-content/uploads/2023/04/man5.jpg": {
    src: "/images/mens-toupees/1.jpg",
    alt: "Man with a blonde hair system styled forward",
    width: 962,
    height: 1000,
  },
  "https://www.manhaironline.com/wp-content/uploads/2023/04/man6.png": {
    src: "/images/hair-system-maintenance/2.jpg",
    alt: "Smiling man wearing a professionally fitted hair system",
    width: 612,
    height: 408,
  },
  // what-hair-to-wear (the original was a portrait comparison chart)
  "https://www.manhaironline.com/wp-content/uploads/2023/04/manchart1.jpg": {
    src: "/images/before-after/6.jpg",
    alt: "Grid of men wearing different men's hair systems",
    width: 700,
    height: 700,
  },
  // getting-hair-transplant-surgery… and mens-hair-loss-myths… share this file
  "https://www.manhaironline.com/wp-content/uploads/2022/01/8DA43B73-5B91-4A50-9809-59394833C68F-1024x1024.png": {
    src: "/images/mens-hair-replacement-systems/5.jpg",
    alt: "Man covering thinning hair on the crown of his head with one hand",
    width: 560,
    height: 700,
  },
  // male-pattern-baldness… (the markup points at the 300px derivative)
  "https://www.manhaironline.com/wp-content/uploads/2021/12/63-300x225.png": {
    src: "/images/mens-hair-units/2.jpg",
    alt: "Man seen from behind with one hand touching the back of his hair",
    width: 1000,
    height: 1000,
  },
  "https://www.manhaironline.com/wp-content/uploads/2021/12/63.png": {
    src: "/images/mens-hair-units/2.jpg",
    alt: "Man seen from behind with one hand touching the back of his hair",
    width: 1000,
    height: 1000,
  },
};

function canonicalLegacyUrl(src: string): string {
  return src
    .replace(/^http:\/\//, "https://")
    .replace(/^https:\/\/manhaironline\.com/, "https://www.manhaironline.com");
}

export function repairLegacyInlineImages(html: string): string {
  if (!html || !html.includes("wp-content/uploads")) return html;
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    const srcMatch = tag.match(/\ssrc="([^"]+)"/);
    if (!srcMatch) return tag;
    const fix = LEGACY_INLINE_IMAGES[canonicalLegacyUrl(srcMatch[1])];
    if (!fix) return tag;
    const stripped = tag
      .replace(/\ssrc="[^"]*"/i, "")
      .replace(/\ssrcset="[^"]*"/gi, "")
      .replace(/\ssizes="[^"]*"/gi, "")
      .replace(/\salt="[^"]*"/i, "")
      .replace(/\swidth="[^"]*"/i, "")
      .replace(/\sheight="[^"]*"/i, "");
    return stripped.replace(
      /<img\b/i,
      `<img src="${fix.src}" alt="${fix.alt}" width="${fix.width}" height="${fix.height}"`,
    );
  });
}
