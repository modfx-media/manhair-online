/**
 * ManHair site-wide constants.
 * Derived verbatim from the live site metadata + JSON-LD graph.
 * Do not "improve" copy here — this is a preservation project.
 */

const SITE_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.manhaironline.com"
).replace(/\/$/, "");

export const SITE = {
  /** Canonical origin. Override with NEXT_PUBLIC_SITE_URL in .env and Vercel. */
  origin: SITE_ORIGIN,
  /** Business / organization display name (from Organization JSON-LD). */
  orgName: "Man Hair - Hair Replacement Solutions",
  /** Verbatim site name from og:site_name / <title> suffix. */
  siteName: "ManHair | Hair Restoration Orange County, CA",
  /** Short brand mark used in tight layouts. */
  brandMark: "ManHair",
  /** Verbatim tagline from JSON-LD WebSite.description. */
  tagline: "Hair Restoration Orange County",
  /** Public-facing brand statement used in hero / footer marketing copy. */
  brandStatement:
    "The leading non-surgical hair replacement system for men in Orange County, CA.",
  logo: {
    url: "/wp-content/uploads/2018/08/MH-Logo.png",
    width: 615,
    height: 156,
    caption: "Man Hair - Hair Replacement Solutions",
  },
  locale: "en_US",
} as const;

export const CONTACT = {
  studio: {
    label: "Lake Forest Studio",
    streetLine1: "20 Heron",
    streetLine2: "Lake Forest, CA 92630",
    streetAddress: "20 Heron",
    addressLocality: "Lake Forest",
    addressRegion: "CA",
    postalCode: "92630",
    // Griselda's direct line. The GoHighLevel texting number (904) 526-8500 is not monitored.
    phone: "+1 (714) 604-6001",
    phoneHref: "tel:+17146046001",
    phoneNote: "Text or call Griselda",
    region: "CA",
  },
  email: "info@manhaironline.com",
  emailHref: "mailto:info@manhaironline.com",
  hours: "Monday to Friday | 9:00 AM – 5:00 PM",
  hoursShort: "Mon – Fri · 9:00 AM – 5:00 PM",
} as const;

/** Verbatim short tagline + follow-us paragraph as rendered in the live footer. */
export const FOOTER_TAGLINE = {
  short: "Hair Loss Solutions.",
  long: "Be sure to follow us on Facebook, Instagram and Twitter to stay up-to-date on new product releases and tips on your hair system.",
} as const;

/** Social profiles.
 *
 *  Union of the JSON-LD Organization `sameAs` set (Yoast) AND the
 *  visible socials in the live footer. Preserving every URL verbatim
 *  keeps existing SEO signals and internal-link parity.
 *
 *  Notes:
 *  - `twitter.com/ManHair_Online` (visible footer) and `x.com/manhaironline`
 *    (Yoast schema) use DIFFERENT handles on the live site. Both are
 *    kept so no historical outbound link disappears.
 *  - `platform` doubles as the icon key in `components/icons.tsx`.
 */
export const SOCIAL: ReadonlyArray<{
  platform:
    | "facebook"
    | "instagram"
    | "twitter"
    | "x"
    | "tiktok"
    | "linkedin"
    | "youtube";
  label: string;
  href: string;
  /** True if this profile is visible in the live footer icon row. */
  visibleInFooter: boolean;
}> = [
  {
    platform: "facebook",
    label: "Facebook",
    href: "https://www.facebook.com/ManHairOnline/",
    visibleInFooter: true,
  },
  {
    platform: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/manhaironline/",
    visibleInFooter: true,
  },
  {
    platform: "twitter",
    label: "Twitter",
    href: "https://twitter.com/ManHair_Online",
    visibleInFooter: true,
  },
  {
    platform: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@manhair_online",
    visibleInFooter: true,
  },
  {
    platform: "x",
    label: "X",
    href: "https://x.com/manhaironline",
    visibleInFooter: false,
  },
  {
    platform: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/man-hair-hair-replacement-837b4816a/",
    visibleInFooter: false,
  },
  {
    platform: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCEc9SIKrJyX-E2Sg2DnB1Gg?view_as=subscriber",
    visibleInFooter: false,
  },
];

/** Primary navigation, mirrored from the live desktop header. Nested
 *  children reflect the actual hover dropdowns on manhaironline.com.
 *  Href values are preserved exactly for SEO. */
export type NavItem = {
  label: string;
  /** Path relative to site root. `"#"` indicates a non-navigable dropdown parent. */
  href: string;
  children?: NavItem[];
};

export const PRIMARY_NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Memberships", href: "/memberships/" },
  {
    label: "Services",
    href: "/mens-hair-replacement-systems/",
    children: [
      { label: "Men's Hair Systems", href: "/services/mens-hair-systems/" },
      { label: "Men's Toupees", href: "/services/mens-toupees/" },
      { label: "Men's Hairpieces", href: "/services/mens-hairpieces/" },
      { label: "Men's Hair Units", href: "/services/mens-hair-units/" },
      { label: "Men's Wigs", href: "/services/mens-wigs/" },
      { label: "Non-Surgical Hair Replacement", href: "/services/non-surgical-hair-replacement/" },
      { label: "Hair System Maintenance", href: "/services/hair-system-maintenance/" },
    ],
  },
  {
    label: "About",
    href: "/about/",
    children: [
      { label: "Cherry Financing", href: "/payment-plans/" },
      { label: "Franchise", href: "/partner-program/" },
      { label: "FAQ", href: "/faq/" },
      { label: "Blog", href: "/blog/" },
      { label: "Locations", href: "/locations/" },
    ],
  },
  {
    label: "How It Works",
    href: "/how-it-works/",
    children: [
      { label: "Receding Hairline Restoration", href: "/receding-hairline-restoration/" },
      { label: "Alopecia Hair Loss", href: "/alopecia-hair-loss/" },
      { label: "Men's Hair Styles", href: "/mens-hair-styles/" },
    ],
  },
  { label: "Before & After", href: "/results/" },
  { label: "Locations", href: "/locations/" },
];

/** Header CTA label. Opens the booking form modal (see `BookingButton`). */
export const HEADER_CTA = { label: "Book a Private Consultation" } as const;

/** Services / sitemap-adjacent links exposed in the footer. */
export const SERVICES_NAV: Array<{ label: string; href: string }> = [
  { label: "How It Works", href: "/how-it-works/" },
  {
    label: "Receding Hairline Restoration",
    href: "/receding-hairline-restoration/",
  },
  { label: "Alopecia Hair Loss", href: "/alopecia-hair-loss/" },
  { label: "Men's Hair Styles", href: "/mens-hair-styles/" },
  { label: "Before & After", href: "/results/" },
  { label: "Locations", href: "/locations/" },
];

/** Footer "Quick Links" column — mirrored verbatim from the live site's
 *  footer navigation menu. Preserving this list keeps the internal-link
 *  graph identical to what search engines have already crawled. */
export const FOOTER_QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about/" },
  { label: "Cherry Financing", href: "/payment-plans/" },
  { label: "Franchise", href: "/partner-program/" },
  { label: "Locations", href: "/locations/" },
  { label: "Reviews", href: "/reviews/" },
  { label: "Blog", href: "/blog/" },
  { label: "FAQ", href: "/faq/" },
  { label: "Sitemap", href: "/sitemap/" },
  { label: "How It Works", href: "/how-it-works/" },
  { label: "Terms of Service", href: "/terms-of-service/" },
  { label: "Refund Policy", href: "/refund-policy/" },
  { label: "Privacy Policy", href: "/privacy-policy/" },
];

/** Verbatim footer disclaimer / copyright line from the live site. */
export const FOOTER_LEGAL = {
  disclaimer:
    "**Disclaimer:  Image credit to their respectful owners.  Images used on this site are for example purposes only.  It is up to you to achieve the final look you want.**",
  copyright:
    "Copyright © 2026 ManHair | Hair Restoration Orange County, CA via JK Ingram Enterprises LLC",
  poweredBy: "Powered by ModFXMedia",
};
