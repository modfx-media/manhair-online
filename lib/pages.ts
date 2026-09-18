import type { Metadata } from "next";
import { SITE } from "./site";
import {
  DEFAULT_OG,
  INDEXABLE,
  NOINDEX,
  pageTitle,
  socialMetadata,
} from "./seo/meta";

/**
 * Page metadata inventory. Titles and descriptions are unique,
 * 120–160 character descriptions, and indexable unless noted.
 */
export type PageMeta = {
  path: string;
  title: string;
  description: string | null;
  canonical: string;
  robots: string;
  og: {
    title: string | null;
    description: string | null;
    image: string | null;
    type: string | null;
    url: string | null;
    siteName: string | null;
    locale: string | null;
  };
  twitterCard?: string | null;
  isPost?: boolean;
  isCategory?: boolean;
};

const R = INDEXABLE;

function og(
  title: string | null,
  description: string | null,
  path: string,
  image: string | null = DEFAULT_OG.url,
  type: string = "website"
) {
  return {
    title,
    description,
    image,
    type,
    url: `${SITE.origin}${path}`,
    siteName: SITE.siteName,
    locale: SITE.locale,
  };
}

export const PAGES: PageMeta[] = [
  {
    path: "/",
    title: "Men's Hair Replacement Systems in Orange County | ManHair",
    description:
      "Custom men's hair replacement systems in Orange County, CA. Real human hair, fitted at our Orange studio. Book a free virtual consultation.",
    canonical: `${SITE.origin}/`,
    robots: R,
    og: og(
      "Men's Hair Replacement Systems in Orange County | ManHair",
      "Custom men's hair replacement systems in Orange County, CA. Real human hair, fitted at our Orange studio. Book a free virtual consultation.",
      "/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/how-it-works/",
    title: "How ManHair Hair Systems Work | Orange County",
    description:
      "See how a ManHair system is fitted in Orange County, CA. Virtual consult first, then one studio visit. No surgery and no downtime.",
    canonical: `${SITE.origin}/how-it-works/`,
    robots: R,
    og: og(
      "How ManHair Hair Systems Work | Orange County",
      "See how a ManHair system is fitted in Orange County, CA. Virtual consult first, then one studio visit. No surgery and no downtime.",
      "/how-it-works/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/about/",
    title: "About ManHair | Non-Surgical Hair Replacement Orange County",
    description:
      "Meet ManHair, Orange County's non-surgical hair replacement studio. Custom human-hair systems, private fittings, and ongoing care.",
    canonical: `${SITE.origin}/about/`,
    robots: R,
    og: og(
      "About ManHair | Non-Surgical Hair Replacement Orange County",
      "Meet ManHair, Orange County's non-surgical hair replacement studio. Custom human-hair systems, private fittings, and ongoing care.",
      "/about/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/payment-plans/",
    title: "Cherry Financing for Hair Systems | ManHair Orange County",
    description:
      "Pay for a ManHair system with Cherry financing. Easy monthly payments, no hard credit check, and a 60-second application.",
    canonical: `${SITE.origin}/payment-plans/`,
    robots: R,
    og: og(
      "Cherry Financing for Hair Systems | ManHair Orange County",
      "Pay for a ManHair system with Cherry financing. Easy monthly payments, no hard credit check, and a 60-second application.",
      "/payment-plans/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/booking/",
    title: "Book a Free Consultation | Orange County | ManHair",
    description:
      "Book a free ManHair consultation online. Pick a time on the calendar for a virtual call, then visit our Orange, CA studio when you are ready.",
    canonical: `${SITE.origin}/booking/`,
    robots: NOINDEX,
    og: og(
      "Book a Free Consultation | Orange County | ManHair",
      "Book a free ManHair consultation online. Pick a time on the calendar for a virtual call, then visit our Orange, CA studio when you are ready.",
      "/booking/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/video-call/",
    title: "Book a 45-Minute Video Consultation | ManHair",
    description:
      "Schedule a private 45-minute ManHair video consultation. Pick a time, join from anywhere, and review hairline options face to face.",
    canonical: `${SITE.origin}/video-call/`,
    robots: NOINDEX,
    og: og(
      "Book a 45-Minute Video Consultation | ManHair",
      "Schedule a private 45-minute ManHair video consultation. Pick a time, join from anywhere, and review hairline options face to face.",
      "/video-call/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/results/",
    title: "Before & After Results | Men's Hair Replacement | ManHair",
    description:
      "Real before and after results from men we've worked with at our Orange, CA studio. See what a custom hair system can do.",
    canonical: `${SITE.origin}/results/`,
    robots: R,
    og: og(
      "Before & After Results | Men's Hair Replacement | ManHair",
      "Real before and after results from men we've worked with at our Orange, CA studio. See what a custom hair system can do.",
      "/results/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/reviews/",
    title: "Client Reviews | Men's Hair Replacement | Orange, CA | ManHair",
    description:
      "What our clients say about their experience at ManHair in Orange, CA. Read reviews before booking your free virtual consultation.",
    canonical: `${SITE.origin}/reviews/`,
    robots: R,
    og: og(
      "Client Reviews | Men's Hair Replacement | Orange, CA | ManHair",
      "What our clients say about their experience at ManHair in Orange, CA. Read reviews before booking your free virtual consultation.",
      "/reviews/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/faq/",
    title: "FAQ | Men's Hair Replacement Systems in Orange County",
    description:
      "Answers about ManHair non-surgical hair systems, fittings, maintenance, and travel. Book a free virtual consultation in Orange, CA.",
    canonical: `${SITE.origin}/faq/`,
    robots: R,
    og: og(
      "FAQ | Men's Hair Replacement Systems in Orange County",
      "Answers about ManHair non-surgical hair systems, fittings, maintenance, and travel. Book a free virtual consultation in Orange, CA.",
      "/faq/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/locations/",
    title: "Hair Replacement Locations We Serve | ManHair Orange County",
    description:
      "ManHair serves men across Orange County and nearby cities from one Orange, CA studio. Find your city and book a free virtual consult.",
    canonical: `${SITE.origin}/locations/`,
    robots: R,
    og: og(
      "Hair Replacement Locations We Serve | ManHair Orange County",
      "ManHair serves men across Orange County and nearby cities from one Orange, CA studio. Find your city and book a free virtual consult.",
      "/locations/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/orange-county-ca/",
    title: "Hair Replacement in Orange County, CA | ManHair Studio",
    description:
      "Visit ManHair in Orange County, CA for custom men's hair systems. Free virtual consult, then a fitting at our Orange studio.",
    canonical: `${SITE.origin}/orange-county-ca/`,
    robots: R,
    og: og(
      "Hair Replacement in Orange County, CA | ManHair Studio",
      "Visit ManHair in Orange County, CA for custom men's hair systems. Free virtual consult, then a fitting at our Orange studio.",
      "/orange-county-ca/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/products/",
    title: "Hair System Care Products | ManHair Orange County",
    description:
      "Shop maintenance products for your ManHair system. Adhesives, cleaners, and care supplies used at our Orange County studio.",
    canonical: `${SITE.origin}/products/`,
    robots: R,
    og: og(
      "Hair System Care Products | ManHair Orange County",
      "Shop maintenance products for your ManHair system. Adhesives, cleaners, and care supplies used at our Orange County studio.",
      "/products/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/blog/",
    title: "Hair Replacement Blog | Non-Surgical Systems | ManHair",
    description:
      "Guides on men's hair systems, thinning hair, and non-surgical replacement from ManHair in Orange County, CA. Start with a free consult.",
    canonical: `${SITE.origin}/blog/`,
    robots: R,
    og: og(
      "Hair Replacement Blog | Non-Surgical Systems | ManHair",
      "Guides on men's hair systems, thinning hair, and non-surgical replacement from ManHair in Orange County, CA. Start with a free consult.",
      "/blog/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/hair-loss/male-pattern-baldness/",
    title: "Male Pattern Baldness | Non-Surgical Hair Replacement | ManHair",
    description:
      "Male pattern baldness is the most common hair loss in men. See how a ManHair system covers it — no surgery. Orange County, CA.",
    canonical: `${SITE.origin}/hair-loss/male-pattern-baldness/`,
    robots: R,
    og: og(
      "Male Pattern Baldness | Non-Surgical Hair Replacement | ManHair",
      "Male pattern baldness is the most common hair loss in men. See how a ManHair system covers it — no surgery. Orange County, CA.",
      "/hair-loss/male-pattern-baldness/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/alopecia-hair-loss/",
    title: "Alopecia Hair Coverage for Men | ManHair Orange County",
    description:
      "A custom hair system can cover alopecia-related hair loss. Cosmetic coverage at ManHair in Orange, CA — not a medical treatment.",
    canonical: `${SITE.origin}/alopecia-hair-loss/`,
    robots: R,
    og: og(
      "Alopecia Hair Coverage for Men | ManHair Orange County",
      "A custom hair system can cover alopecia-related hair loss. Cosmetic coverage at ManHair in Orange, CA — not a medical treatment.",
      "/alopecia-hair-loss/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/mens-hair-styles/",
    title: "Men's Hair Styles for Hair Systems | Orange County",
    description:
      "See haircut and style options for a ManHair system. Custom color, density, and cut-in at our Orange County, CA studio. Book a consult.",
    canonical: `${SITE.origin}/mens-hair-styles/`,
    robots: R,
    og: og(
      "Men's Hair Styles for Hair Systems | Orange County",
      "See haircut and style options for a ManHair system. Custom color, density, and cut-in at our Orange County, CA studio. Book a consult.",
      "/mens-hair-styles/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/receding-hairline-restoration/",
    title: "Receding Hairline Restoration | Non-Surgical | ManHair",
    description:
      "Restore a receding hairline with a custom ManHair system in Orange County. Non-surgical coverage and a free virtual consultation.",
    canonical: `${SITE.origin}/receding-hairline-restoration/`,
    robots: R,
    og: og(
      "Receding Hairline Restoration | Non-Surgical | ManHair",
      "Restore a receding hairline with a custom ManHair system in Orange County. Non-surgical coverage and a free virtual consultation.",
      "/receding-hairline-restoration/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/partner-program/",
    title: "ManHair Franchise & Partner Program | Orange County",
    description:
      "Learn about the ManHair partner program for stylists and owners. Bring non-surgical hair replacement to your market, with studio support.",
    canonical: `${SITE.origin}/partner-program/`,
    robots: R,
    og: og(
      "ManHair Franchise & Partner Program | Orange County",
      "Learn about the ManHair partner program for stylists and owners. Bring non-surgical hair replacement to your market, with studio support.",
      "/partner-program/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/privacy-policy/",
    title: "Privacy Policy | How ManHair Uses Your Information",
    description:
      "Read how ManHair collects and uses personal information when you book a consultation or visit manhaironline.com from Orange County.",
    canonical: `${SITE.origin}/privacy-policy/`,
    robots: R,
    og: og(
      "Privacy Policy | How ManHair Uses Your Information",
      "Read how ManHair collects and uses personal information when you book a consultation or visit manhaironline.com from Orange County.",
      "/privacy-policy/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/refund-policy/",
    title: "Refund Policy | ManHair Hair System Purchases",
    description:
      "Review ManHair's refund terms for custom hair systems and studio services booked through our Orange County, CA location.",
    canonical: `${SITE.origin}/refund-policy/`,
    robots: R,
    og: og(
      "Refund Policy | ManHair Hair System Purchases",
      "Review ManHair's refund terms for custom hair systems and studio services booked through our Orange County, CA location.",
      "/refund-policy/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/terms-of-service/",
    title: "Terms of Service | ManHair Online",
    description:
      "These terms govern your use of manhaironline.com and ManHair hair replacement services booked in Orange County, California.",
    canonical: `${SITE.origin}/terms-of-service/`,
    robots: R,
    og: og(
      "Terms of Service | ManHair Online",
      "These terms govern your use of manhaironline.com and ManHair hair replacement services booked in Orange County, California.",
      "/terms-of-service/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/landing-page/",
    title: "ManHair Consultation Landing Page",
    description:
      "This legacy booking landing page is no longer used. Start a free ManHair virtual consultation from the Orange County homepage.",
    canonical: `${SITE.origin}/`,
    robots: NOINDEX,
    og: og(
      "ManHair Consultation Landing Page",
      "This legacy booking landing page is no longer used. Start a free ManHair virtual consultation from the Orange County homepage.",
      "/"
    ),
    twitterCard: "summary_large_image",
  },
  {
    path: "/category/hair-loss/",
    title: "Hair Loss Articles | ManHair Orange County Blog",
    description:
      "Read ManHair articles on male hair loss, thinning, and non-surgical coverage options from our Orange County, CA studio today.",
    canonical: `${SITE.origin}/category/hair-loss/`,
    robots: R,
    og: og(
      "Hair Loss Articles | ManHair Orange County Blog",
      "Read ManHair articles on male hair loss, thinning, and non-surgical coverage options from our Orange County, CA studio today.",
      "/category/hair-loss/"
    ),
    twitterCard: "summary_large_image",
    isCategory: true,
  },
  {
    path: "/category/hair-replacement/",
    title: "Hair Replacement Articles | ManHair Orange County",
    description:
      "Blog posts on men's hair systems, fittings, and non-surgical replacement from ManHair in Orange County, CA. Read before you book.",
    canonical: `${SITE.origin}/category/hair-replacement/`,
    robots: R,
    og: og(
      "Hair Replacement Articles | ManHair Orange County",
      "Blog posts on men's hair systems, fittings, and non-surgical replacement from ManHair in Orange County, CA. Read before you book.",
      "/category/hair-replacement/"
    ),
    twitterCard: "summary_large_image",
    isCategory: true,
  },
  {
    path: "/category/uncategorized/",
    title: "More Hair System Articles | ManHair Blog",
    description:
      "Additional ManHair posts on hair systems, confidence, and non-surgical replacement for men in Orange County, California.",
    canonical: `${SITE.origin}/category/uncategorized/`,
    robots: R,
    og: og(
      "More Hair System Articles | ManHair Blog",
      "Additional ManHair posts on hair systems, confidence, and non-surgical replacement for men in Orange County, California.",
      "/category/uncategorized/"
    ),
    twitterCard: "summary_large_image",
    isCategory: true,
  },
];

export function getPageMeta(path: string): PageMeta | undefined {
  return PAGES.find((p) => p.path === path);
}

export function toMetadata(m: PageMeta | undefined): Metadata {
  if (!m) {
    return {
      metadataBase: new URL(SITE.origin),
      title: SITE.siteName,
    };
  }
  const description = m.description ?? undefined;
  const social = socialMetadata({
    title: m.og.title ?? m.title,
    description: m.og.description ?? m.description ?? SITE.brandStatement,
    url: m.og.url ?? m.canonical,
    image: m.og.image,
  });
  return {
    metadataBase: new URL(SITE.origin),
    title: pageTitle(m.title),
    description,
    alternates: { canonical: m.canonical },
    robots: m.robots,
    ...social,
  };
}
