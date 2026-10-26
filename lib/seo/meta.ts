import type { Metadata } from "next";
import { imageDimensions } from "@/lib/image-dimensions";
import { SITE } from "@/lib/site";

export const INDEXABLE =
  "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
export const NOINDEX = "noindex, nofollow";

export const DEFAULT_OG = {
  url: "/images/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "ManHair men's hair replacement in Orange County, CA",
} as const;

export function pageTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

export function socialMetadata({
  title,
  description,
  url,
  image,
  imageAlt,
  imageWidth,
  imageHeight,
}: {
  title: string;
  description: string;
  url: string;
  image?: string | null;
  imageAlt?: string | null;
  /** Real pixel size of `image`. Omit only for the default 1200×630 card. */
  imageWidth?: number | null;
  imageHeight?: number | null;
}): Pick<Metadata, "openGraph" | "twitter"> {
  const imageUrl = image || DEFAULT_OG.url;
  const lookedUp = imageDimensions(imageUrl);
  const width = imageWidth || lookedUp?.width || DEFAULT_OG.width;
  const height = imageHeight || lookedUp?.height || DEFAULT_OG.height;
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: SITE.siteName,
      locale: SITE.locale,
      type: "website",
      images: [
        {
          url: imageUrl,
          width,
          height,
          alt: imageAlt || DEFAULT_OG.alt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
