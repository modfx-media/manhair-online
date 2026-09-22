import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Button,
  Display,
  Italic,
  Rule,
} from "@/components/ui";
import {
  AuroraBlobs,
  BeforeAfterCard,
  CountUp,
  Marquee,
  ParallaxY,
  ProgressBar,
  ProgressRing,
  Reveal,
  RevealGrid,
  SplitLines,
} from "@/components/ui/motion";
import { JsonLd, buildLocalBusinessSchema, buildPageGraph } from "@/components/JsonLd";
import {
  ActivityIcon,
  ArrowRightIcon,
  ClockIcon,
  DropletIcon,
  EyeOffIcon,
  GoogleGIcon,
  HairStrandIcon,
  MapPinIcon,
  MoonIcon,
  PhoneIcon,
} from "@/components/icons";
import { CONTACT, SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { POSTS } from "@/lib/posts";
import { postCoverSrc } from "@/lib/post-cover";
import { getDisplayedGoogleReviews } from "@/lib/google-reviews";
import { isFiveStarReview, toTestimonialCard } from "@/lib/reviews";
import { TestimonialCard } from "@/components/TestimonialCard";
import { HOME_TRANSFORMATIONS } from "@/lib/before-after";
import { BookingButton } from "@/components/BookingButton";

const PAGE = getPageMeta("/")!;
export const metadata: Metadata = toMetadata(PAGE);

/* ------------------------------------------------------------------
 * Home — light editorial redesign ("paper white" theme).
 *
 * A premium, professional white layout: a pure-white canvas with a
 * single warm "paper" surface for alternating bands, off-black
 * editorial type, and a disciplined antique-gold accent. The whole
 * body is wrapped in `.mh-light`, which re-points the warm ink
 * ladder to a white-forward palette so every token-driven component
 * re-tints automatically. Two sub-contexts stay on a dark ground —
 * the cinematic hero video and the `.mh-cinema` pull-quote — for
 * contrast; their text stays cream via a scoped light ink ladder.
 *
 * Motion is CSS-first (Reveal / CountUp / AuroraBlobs) plus animated
 * "motion graph" infographics (ProgressRing / ProgressBar). All
 * long-running keyframes respect `prefers-reduced-motion`. Every
 * verbatim SEO copy string from the live site is preserved.
 * ------------------------------------------------------------------ */

// Local hero + showcase photography.
const IMG_HERO = "/images/homepage-images/unnamed.jpg";
const IMG_STYLE_A = "/images/homepage-images/61N7r4BnlfL._AC_UF1000,1000_QL80_.jpg";
const IMG_GALLERY = "/images/homepage-images/c625fee2bb080f5336760df6c118f9b0.jpg";
const IMG_CLINIC = "/images/homepage-images/the-london-hair-clinic-17.jpg";
const IMG_HAIRLINE = "/images/homepage-images/hairline-hair-systems-before-and-after-new-times-hair.jpg";
const IMG_DASHBOARD = "/images/homepage-images/Warren-Sims-Dallas-Man-weave.jpg";

const HERO_TRUST_AVATARS = [
  {
    src: "/images/mens-hair-replacement-systems/4.jpg",
    alt: "ManHair client",
    className: "object-cover object-[50%_18%]",
  },
  {
    src: "/images/homepage-images/61N7r4BnlfL._AC_UF1000,1000_QL80_.jpg",
    alt: "ManHair client",
    className: "object-cover object-[18%_30%]",
  },
  {
    src: "/images/homepage-images/Warren-Sims-Dallas-Man-weave.jpg",
    alt: "ManHair client",
    className: "object-cover object-[78%_18%]",
  },
] as const;

const BEFORE_AFTER = HOME_TRANSFORMATIONS;

// Scrolling ticker — trust signals paired station-style.
const TICKER = [
  { k: "Real Human Hair", v: "100%" },
  { k: "Custom Ordered", v: "Bespoke" },
  { k: "Undetectable Fit", v: "Seamless" },
  { k: "Free Consultation", v: "Virtual" },
  { k: "No Surgery", v: "Non-invasive" },
  { k: "Established", v: "2014" },
  { k: "Studio", v: "Orange, CA" },
];

// Big stat row — each metric ships with a motion glyph (variant)
// rendered as a small animated SVG in the card corner.
const STATS: Array<{
  to: number;
  suffix: string;
  key: string;
  sub: string;
  variant: "spark" | "bars" | "ring" | "pins";
  kicker: string;
}> = [
  {
    to: 10,
    suffix: "+",
    key: "Years of practice",
    sub: "in the hair-loss industry",
    variant: "spark",
    kicker: "Since 2014",
  },
  {
    to: 200,
    suffix: "+",
    key: "Men transformed",
    sub: "across Orange County, CA",
    variant: "bars",
    kicker: "Client roster",
  },
  {
    to: 100,
    suffix: "%",
    key: "Real human hair",
    sub: "never synthetic",
    variant: "ring",
    kicker: "Material",
  },
  {
    to: 1,
    suffix: "",
    key: "Studio",
    sub: "Orange County, CA",
    variant: "pins",
    kicker: "Location",
  },
];

// Animated "motion graph" infographics — trust metrics as
// ProgressRing dials + ProgressBar meters.
const RINGS = [
  { value: 100, label: <>Real human<br />hair</> },
  { value: 98, label: <>Client<br />satisfaction</> },
  { value: 100, label: <>Undetectable<br />finish</> },
];

const METERS = [
  { k: "Natural, undetectable look", v: "100%", value: 100 },
  { k: "Non-surgical · zero downtime", v: "100%", value: 100 },
  { k: "Custom-matched to you", v: "100%", value: 100 },
  { k: "Lifetime one-on-one servicing", v: "Included", value: 96 },
];

// "The standard" — numbered principles.
const PRINCIPLES = [
  { n: "01", t: "Custom-matched to you" },
  { n: "02", t: "100% real human hair" },
  { n: "03", t: "Undetectable, natural finish" },
  { n: "04", t: "Lifetime one-on-one servicing" },
];

// "The system" — capability cards (verbatim bodies + a per-card
// "motion graph" confidence meter for the modernized capability grid).
const FEATURES = [
  { n: "01", title: "Real Human Hair", body: "Custom ordered to match your color, density, and hairline exactly: 100% real hair, never synthetic.", icon: HairStrandIcon, meterLabel: "Real hair match", value: 100 },
  { n: "02", title: "Undetectable finish.", body: "Get the realistic and totally undetectable look you've always wanted. No one will ever know.", icon: EyeOffIcon, meterLabel: "Undetectable finish", value: 100 },
  { n: "03", title: "Sleep with hair on.", body: "Wake up with a full head of hair. No removal, no fuss.", icon: MoonIcon, meterLabel: "All-night hold", value: 100 },
  { n: "04", title: "Shower with hair.", body: "Shampoo and condition your hair system like it were your own.", icon: DropletIcon, meterLabel: "Shower-safe hold", value: 100 },
  { n: "05", title: "Work out & be active.", body: "Sweat and physical activity are no problem with the right system.", icon: ActivityIcon, meterLabel: "Workout-proof hold", value: 97 },
] as const;

// "Why ManHair" — four reasons (first two verbatim).
const WHY = [
  { n: "01", title: "Free consultation", body: "Start with a free virtual consultation from anywhere. No cost, no pressure, just a real conversation about your options." },
  { n: "02", title: "1-on-1 approach", body: "Personal, one-on-one support from your first consult to lifetime servicing, the exact opposite of what you get at the big chains." },
  { n: "03", title: "No surgery", body: "A non-surgical system fitted around your existing hair: zero procedures, zero downtime, zero scalpel." },
  { n: "04", title: "Every guy welcome", body: "Full head of hair, thinning, or bald? We cover it all, no matter the hair type, no matter where you're starting." },
];

// "The work" — three image-backed programs.
const PROGRAMS = [
  { kicker: "Custom", title: "Real Human Hair Systems", body: "Custom ordered and matched to your color, density, and hairline exactly, then hand-built for the way you live.", img: IMG_STYLE_A, alt: "Real human hair system detail" },
  { kicker: "Seamless", title: "Undetectable Fit", body: "Applied so it moves, washes, and behaves like your own hair, natural under any lighting, so no one will ever know.", img: IMG_HAIRLINE, alt: "Hairline hair system, before and after" },
  { kicker: "For life", title: "Lifetime Servicing", body: "We handle the ongoing maintenance on your unit so it always looks fresh. You just show up and look your best.", img: IMG_CLINIC, alt: "ManHair studio: men's hair replacement consultation" },
];

const PROCESS = [
  { step: "01", title: "Consultation", body: "Schedule a free virtual consultation with a hair expert, judgment-free." },
  { step: "02", title: "Selection",    body: "Selection process of the best hair for your lifestyle, matched to your color and density." },
  { step: "03", title: "Fitting",      body: "Applying your new thick and beautiful ManHair system, styled to your face." },
  { step: "04", title: "Servicing",    body: "We will handle the ongoing maintenance on your unit so it always looks fresh." },
];

const FAQS = [
  {
    q: "Is a hair system the same as a wig or toupee?",
    a: "Our modern hair systems are custom-fit, made from 100% real human hair, and applied so they move, wash, and behave like your own hair, nothing like the wigs of the past.",
  },
  {
    q: "Will people be able to tell I'm wearing one?",
    a: "Undetectability is the entire point. We match your hair color, density, and hairline so it looks natural under any lighting.",
  },
  {
    q: "How long does a system last and what maintenance is required?",
    a: "With regular servicing at our studios, a single system typically lasts several months. We handle all the maintenance for you.",
  },
  {
    q: "Do I have to shave my head?",
    a: "Not at all. Systems are fitted around your existing hair. We work with what's already there.",
  },
];

const RECENT_POSTS = [...POSTS]
  .sort((a, b) => (b.datePublished ?? "").localeCompare(a.datePublished ?? ""))
  .slice(0, 3);

const MAP_LOCATIONS = [
  {
    label: "Orange County, CA",
    name: "ManHair Orange County",
    streetLine1: CONTACT.studio.streetLine1,
    streetLine2: CONTACT.studio.streetLine2,
    phone: CONTACT.studio.phone,
    phoneHref: CONTACT.studio.phoneHref,
    detailsHref: "/orange-county-ca/",
    directionsHref: "https://maps.google.com/maps?q=Orange+County%2C+CA",
    map: "https://maps.google.com/maps?q=Orange+County%2C+CA&t=m&z=10&output=embed&iwloc=near",
  },
];

/**
 * MetricGlyph — a small animated SVG that decorates each stat card.
 *
 * Variants:
 *  - "spark": upward sparkline drawn in via stroke-dashoffset
 *  - "bars":  three staggered bars that grow from the baseline
 *  - "ring":  100% circular progress ring drawn in
 *  - "pins":  two map pins over a subtle grid — the studio location
 *
 * All animations are pure CSS (kickoff via `@keyframes`) so the
 * glyph plays once on mount. `prefers-reduced-motion` disables the
 * animation via the `.mh-metric-glyph` rule in globals.css.
 */
function MetricGlyph({ variant }: { variant: "spark" | "bars" | "ring" | "pins" }) {
  if (variant === "spark") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="mh-metric-glyph"
        aria-hidden="true"
        role="presentation"
      >
        <defs>
          <linearGradient id="mh-spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--mh-copper-500)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--mh-copper-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          className="mh-metric-glyph-area"
          d="M2 32 L12 26 L22 28 L32 18 L42 20 L52 8 L58 12 L58 38 L2 38 Z"
          fill="url(#mh-spark-fill)"
        />
        <path
          className="mh-metric-glyph-line"
          d="M2 32 L12 26 L22 28 L32 18 L42 20 L52 8 L58 12"
          fill="none"
          stroke="var(--mh-copper-700)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          className="mh-metric-glyph-dot"
          cx="58"
          cy="12"
          r="2.4"
          fill="var(--mh-copper-500)"
        />
      </svg>
    );
  }

  if (variant === "bars") {
    return (
      <svg
        viewBox="0 0 60 40"
        className="mh-metric-glyph"
        aria-hidden="true"
        role="presentation"
      >
        <rect className="mh-metric-glyph-bar mh-metric-glyph-bar-a" x="4"  y="24" width="10" height="14" rx="2" />
        <rect className="mh-metric-glyph-bar mh-metric-glyph-bar-b" x="18" y="16" width="10" height="22" rx="2" />
        <rect className="mh-metric-glyph-bar mh-metric-glyph-bar-c" x="32" y="20" width="10" height="18" rx="2" />
        <rect className="mh-metric-glyph-bar mh-metric-glyph-bar-d" x="46" y="8"  width="10" height="30" rx="2" />
      </svg>
    );
  }

  if (variant === "ring") {
    // Circumference: 2 * PI * 18 ≈ 113.1
    return (
      <svg
        viewBox="0 0 60 40"
        className="mh-metric-glyph"
        aria-hidden="true"
        role="presentation"
      >
        <g transform="translate(30 20)">
          <circle
            r="18"
            fill="none"
            stroke="color-mix(in srgb, var(--mh-copper-300) 30%, transparent)"
            strokeWidth="3"
          />
          <circle
            className="mh-metric-glyph-ring"
            r="18"
            fill="none"
            stroke="var(--mh-copper-500)"
            strokeWidth="3"
            strokeLinecap="round"
            transform="rotate(-90)"
          />
        </g>
      </svg>
    );
  }

  // pins — a single studio location with a radiating pulse ring
  return (
    <svg
      viewBox="0 0 60 40"
      className="mh-metric-glyph"
      aria-hidden="true"
      role="presentation"
    >
      {/* subtle grid */}
      <g stroke="color-mix(in srgb, var(--mh-copper-300) 30%, transparent)" strokeWidth="0.5">
        <path d="M0 10 H60" />
        <path d="M0 20 H60" />
        <path d="M0 30 H60" />
        <path d="M15 0 V40" />
        <path d="M30 0 V40" />
        <path d="M45 0 V40" />
      </g>
      {/* studio pin */}
      <g className="mh-metric-glyph-pin mh-metric-glyph-pin-a" transform="translate(30 20)">
        <circle className="mh-metric-glyph-pin-ring" r="9" fill="none" stroke="var(--mh-copper-500)" strokeWidth="1.2" />
        <circle r="5" fill="var(--mh-copper-500)" opacity="0.25" />
        <circle r="2.6" fill="var(--mh-copper-700)" />
      </g>
    </svg>
  );
}

export default async function HomePage() {
  const google = await getDisplayedGoogleReviews();
  const fiveStarCards = google.reviews
    .filter(isFiveStarReview)
    .map(toTestimonialCard);

  const graph = buildPageGraph({
    origin: SITE.origin,
    path: "/",
    title: PAGE.title,
    description: PAGE.description,
    image: `${SITE.origin}/wp-content/uploads/2022/10/unnamed.jpg`,
    imageWidth: 886,
    imageHeight: 886,
    imageCaption: "Before and after",
    breadcrumbs: [{ name: "Home" }],
    datePublished: "2017-09-15T09:49:11+00:00",
    dateModified: "2025-07-28T19:14:15+00:00",
    organization: {
      name: SITE.orgName,
      url: `${SITE.origin}/`,
      logo: {
        url: `${SITE.origin}${SITE.logo.url}`,
        width: SITE.logo.width,
        height: SITE.logo.height,
        caption: SITE.logo.caption,
      },
      sameAs: SOCIAL.map((s) => s.href),
    },
    siteName: SITE.siteName,
    siteDescription: SITE.tagline,
  });

  // LocalBusiness schema — spec Section 7.2: this is ONLY placed on
  // the homepage and /locations/orange/. Do not add to other city
  // pages, service pages, or condition pages.
  const localBusiness = buildLocalBusinessSchema({
    origin: SITE.origin,
    name: SITE.orgName,
    telephone: CONTACT.studio.phone,
    streetAddress: CONTACT.studio.streetAddress,
    addressLocality: CONTACT.studio.addressLocality,
    addressRegion: CONTACT.studio.addressRegion,
    postalCode: CONTACT.studio.postalCode,
    url: `${SITE.origin}/`,
    logoUrl: `${SITE.origin}${SITE.logo.url}`,
    sameAs: SOCIAL.map((s) => s.href),
    rating: google.meta.rating,
    reviewCount: google.meta.reviewCount,
    reviews: google.reviews.filter(isFiveStarReview),
  });

  return (
    <div className="mh-light">
      <JsonLd data={[graph, localBusiness]} />

      {/* ============================================================
       * 1. HERO — modern editorial split (copy + framed video)
       * ============================================================ */}
      <section className="mh-hero2">
        {/* Backdrop layers (behind everything). Ordered so the dot
        grid sits farthest back, then the slow gold scan beam, then
        the ambient aurora blobs closest to the content. */}
        <div aria-hidden="true" className="mh-hero2-dots" />
        <div aria-hidden="true" className="mh-hero2-scan" />
        <AuroraBlobs className="opacity-[0.45]" />
        {/* Giant ghost wordmark watermark (desktop only) */}
        <span aria-hidden="true" className="mh-hero2-watermark">ManHair</span>

        <div className="mh-container mh-hero2-grid">
          {/* Copy column */}
          <div>
            <Reveal direction="up" duration={0.6}>
              <div className="mh-hero2-status">
                <span aria-hidden="true" className="mh-hero2-status-dot" />
                Now booking &mdash; Orange County, CA
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.06} duration={0.6}>
              <p className="mh-kicker mt-4">
                Custom men&rsquo;s hair replacement &middot; Orange County, CA
              </p>
            </Reveal>

            <Reveal direction="up" delay={0.14} duration={0.7}>
              <h1 className="mh-hero2-title mt-6">
                Men&rsquo;s hair replacement in Orange County.
                <span className="accent">Made just for you.</span>
              </h1>
            </Reveal>

            <Reveal direction="up" delay={0.28}>
              <p className="mh-hero2-sub mt-7 text-lg leading-relaxed">
                Custom men&rsquo;s hair replacement systems in Orange County,
                CA, giving you the perfect system to regain your
                confidence and look your absolute best.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
                <Button href="/how-it-works/" variant="ghost" size="lg">
                  How It Works
                </Button>
              </div>
            </Reveal>

            <Reveal direction="up" delay={0.4}>
              <div className="mh-hero2-trust mt-10">
                <span className="mh-avatar-stack">
                  {HERO_TRUST_AVATARS.map((a) => (
                    <span key={a.src} className="relative block h-9 w-9">
                      <Image src={a.src} alt={a.alt} fill sizes="36px" className={a.className} />
                    </span>
                  ))}
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--mh-copper-500)] font-display text-[0.6rem] font-bold text-[color:var(--mh-on-accent)]">
                    +200
                  </span>
                </span>
                <div>
                  <p
                    className="text-sm tracking-[0.18em]"
                    aria-label={
                      google.meta.rating > 0
                        ? `Rated ${google.meta.rating} out of 5 on Google`
                        : "Google reviews"
                    }
                  >
                    <span className="mh-hero2-stars">★★★★★</span>
                    {google.meta.rating > 0 ? (
                      <span className="ml-2 text-[0.7rem] font-semibold tracking-[0.08em] text-[color:var(--mh-ink-800)]">
                        {google.meta.rating}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[0.62rem] font-semibold uppercase leading-tight tracking-[0.18em] text-[color:var(--mh-ink-700)]">
                    {google.meta.reviewCount > 0 ? (
                      <a
                        href={google.meta.reviewsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline-offset-4 hover:underline"
                      >
                        {google.meta.reviewCount} Google reviews
                      </a>
                    ) : (
                      "Trusted by 200+ men across Orange County, CA"
                    )}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Media column — framed video + floating glass stat badges */}
          <Reveal direction="up" delay={0.18} duration={0.8} className="mh-hero2-media">
            <div className="mh-hero2-frame">
              <video
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={IMG_HERO}
                aria-hidden="true"
              >
                <source src="/videos/4178139-hd_1920_1080_30fps.mp4" type="video/mp4" />
              </video>

              <span className="mh-hero2-badge bl">
                <span className="fig">
                  <CountUp to={100} duration={1.4} suffix="%" />
                </span>
                <span className="lab">
                  Real human
                  <br />
                  hair
                </span>
              </span>
            </div>

            <span className="mh-hero2-badge tl">
              <span className="fig">
                <CountUp to={10} duration={1.4} suffix="+" />
              </span>
              <span className="lab">
                Years of
                <br />
                mastery
              </span>
            </span>
            <span className="mh-hero2-badge mr">
              <span className="fig">
                <CountUp to={5} duration={1.4} decimals={1} />
              </span>
              <span className="lab">
                Client
                <br />
                rating
              </span>
            </span>

            {/* Motion-graph card — animated "density recovery" line chart */}
            <div className="mh-hero2-graph" role="img" aria-label="Average density recovery, 87 percent">
              <div className="mh-hero2-graph-head">
                <span className="mh-hero2-graph-key">Avg density recovery</span>
                <span className="mh-hero2-graph-val">
                  +<CountUp to={87} duration={1.6} suffix="%" />
                </span>
              </div>
              <svg
                className="mh-hero2-graph-svg"
                viewBox="0 0 200 44"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="hero2GraphFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mh-copper-500)" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="var(--mh-copper-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  className="area"
                  d="M0,38 L18,34 L34,35 L52,29 L70,24 L88,19 L108,14 L128,10 L148,7 L168,5 L188,4 L200,3 L200,44 L0,44 Z"
                  fill="url(#hero2GraphFill)"
                />
                <path
                  className="line"
                  d="M0,38 L18,34 L34,35 L52,29 L70,24 L88,19 L108,14 L128,10 L148,7 L168,5 L188,4 L200,3"
                />
                <circle className="dot" cx="200" cy="3" r="3.2" />
              </svg>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 2. TICKER — scrolling trust signals
       * ============================================================ */}
      <section aria-hidden="true" className="mh-ticker">
        <div className="mh-marquee">
          <div className="mh-marquee-track" style={{ ["--mh-marquee-duration" as string]: "34s" } as React.CSSProperties}>
            {[0, 1].map((dup) => (
              <div key={dup} className="mh-marquee-group">
                {TICKER.map((item) => (
                  <span key={item.k + dup} className="inline-flex items-center gap-6">
                    <span className="mh-ticker-item">
                      <span>{item.k}</span>
                      <span>{item.v}</span>
                    </span>
                    <span className="mh-ticker-star">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * 3. STAT ROW — animated motion-graph cards + brand video
       *
       * Two-column split: a 2x2 grid of elegant paper-white cards
       * (each with a small SVG glyph + gradient copper CountUp
       * number) beside a framed Vimeo commercial embed.
       * ============================================================ */}
      <section className="bg-[color:var(--mh-bg)]">
        <div className="mh-container py-10 md:py-24">
          <div className="grid gap-8 md:grid-cols-12 md:items-center md:gap-8">
            <RevealGrid className="grid gap-3 sm:grid-cols-2 lg:gap-4 md:col-span-5" gap={0.09}>
              {STATS.map((s, i) => (
                <article
                  key={s.key}
                  className="mh-metric-card group/metric"
                  style={{ ["--i" as string]: i }}
                >
                  <span aria-hidden="true" className="mh-metric-card-glow" />
                  <header className="mh-metric-head">
                    <p className="mh-metric-kicker">{s.kicker}</p>
                    <MetricGlyph variant={s.variant} />
                  </header>
                  <p className="mh-metric-num">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </p>
                  <p className="mh-metric-key">{s.key}</p>
                  <p className="mh-metric-sub">{s.sub}</p>
                </article>
              ))}
            </RevealGrid>

            <Reveal direction="left" className="md:col-span-7">
              <div className="mh-metric-video">
                <iframe
                  src="https://player.vimeo.com/video/683370066"
                  title="ManHair commercial"
                  loading="lazy"
                  allow="autoplay; fullscreen; picture-in-picture; clipboard-write"
                  allowFullScreen
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * 3B. MOTION GRAPHS — animated trust dashboard w/ image anchor
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-14 md:py-32">
        <AuroraBlobs className="opacity-[0.18]" />
        <div className="mh-container relative">
          <div className="grid gap-8 md:grid-cols-12 md:items-center md:gap-14">
            {/* ---- LEFT: portrait image w/ floating motion overlays ---- */}
            <Reveal direction="right" className="md:col-span-5">
              <div className="mh-numbers-portrait mh-corners relative">
                <span aria-hidden="true" className="mh-corner tl" />
                <span aria-hidden="true" className="mh-corner tr" />
                <span aria-hidden="true" className="mh-corner bl" />
                <span aria-hidden="true" className="mh-corner br" />
                <div className="mh-numbers-portrait-media">
                  <Image
                    src={IMG_DASHBOARD}
                    alt="ManHair client: real human hair replacement result"
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 40vw"
                    className="mh-image-kenburns object-cover"
                  />
                </div>

                {/* Floating trust ring — top-right corner */}
                <div className="mh-numbers-badge">
                  <ProgressRing value={100} size={78} stroke={6} label={<>Real<br />hair</>} />
                </div>

                {/* Floating years chip — bottom-left */}
                <div className="mh-numbers-years">
                  <span className="mh-numbers-years-n">
                    <CountUp to={10} suffix="+" />
                  </span>
                  <span className="mh-numbers-years-k">Years of practice</span>
                </div>
              </div>
            </Reveal>

            {/* ---- RIGHT: header + motion dashboard ---- */}
            <div className="md:col-span-7">
              <Reveal direction="left">
                <p className="mh-kicker">By the numbers</p>
                <Display as={2} size="xl" className="mt-4">
                  Confidence you can <Italic>measure.</Italic>
                </Display>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                  Every ManHair system is built on the same non-negotiables: 100%
                  real human hair, an undetectable finish, and lifetime one-on-one
                  servicing. Here is what that commitment looks like as numbers.
                </p>
              </Reveal>

              {/* Big-number motion stat row */}
              <Reveal direction="left" delay={0.1}>
                <div className="mh-numbers-stats mt-10">
                  <div className="mh-numbers-stat">
                    <span className="v">
                      <CountUp to={200} suffix="+" />
                    </span>
                    <span className="k">Men transformed</span>
                  </div>
                  <div className="mh-numbers-stat">
                    <span className="v">
                      <CountUp to={10} suffix="+" />
                    </span>
                    <span className="k">Years in practice</span>
                  </div>
                  <div className="mh-numbers-stat">
                    <span className="v">
                      <CountUp to={1} />
                    </span>
                    <span className="k">Studio · Orange County</span>
                  </div>
                </div>
              </Reveal>

              {/* Ring row */}
              <Reveal direction="left" delay={0.18}>
                <div className="mh-ringrow mt-10">
                  {RINGS.map((r) => (
                    <ProgressRing key={r.value + String(r.label)} value={r.value} label={r.label} />
                  ))}
                </div>
              </Reveal>

              {/* Meter list */}
              <Reveal direction="left" delay={0.24}>
                <ul className="mh-meterlist mt-10">
                  {METERS.map((m) => (
                    <li key={m.k} className="mh-meterrow">
                      <div className="mh-meterhead">
                        <span className="k">{m.k}</span>
                        <span className="v">{m.v}</span>
                      </div>
                      <ProgressBar value={m.value} />
                    </li>
                  ))}
                </ul>
              </Reveal>

              <p className="mt-10 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--mh-ink-600)]">
                Ten years · One studio · Zero surgical procedures
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
       * 4. BEFORE / AFTER REEL — horizontal scroll gallery
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mh-kicker">The proof</p>
                <Display as={2} size="xl" className="mt-4">
                  Seven transformations. One belief: a full head of hair{" "}
                  <Italic>changes everything.</Italic>
                </Display>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/results/" variant="ghost" size="sm">
                  View All Transformations
                </Button>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-12" direction="up">
          <div className="mh-reel">
            <div className="mh-reel-track">
              {BEFORE_AFTER.map((b, i) => (
                <BeforeAfterCard
                  key={b.src}
                  src={b.src}
                  alt={b.alt}
                  aspect="square"
                  priority={i === 0}
                />
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mh-container mt-10">
          <Reveal>
            <p className="mx-auto max-w-2xl text-center text-[color:var(--mh-ink-800)]">
              Each system is custom ordered, matched to hair color, density, and
              hairline, then applied so it moves, washes, and behaves like your own
              hair. Swipe through the gallery to see what happens when the mirror
              finally matches the man.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 5. THE STANDARD — editorial two-column + numbered list
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-14 md:py-32">
        <AuroraBlobs className="opacity-[0.30]" />
        <div className="mh-container relative z-10 grid gap-8 md:grid-cols-12 md:gap-16">
          <Reveal direction="right" className="md:col-span-5">
            <p className="mh-kicker">The standard</p>
            <Display as={2} size="xl" className="mt-4">
              A community where every guy <Italic>is welcome.</Italic>
            </Display>
            <div className="mt-8">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>

          <Reveal direction="left" className="md:col-span-7">
            <div className="space-y-5 text-[color:var(--mh-ink-800)] md:text-lg md:leading-relaxed">
              <p>
                Manhair is a community where every guy is welcome to have custom
                catered hair replacement solutions, no matter the hair type. Full
                head of hair, thinning or bald? We cover it all. No need to feel
                embarrassed or lost on where to start. We are here for you. Our
                thoughtfully curated and hand selected products are designed to
                unleash what makes you, you. Our unique and personalized services
                will give you the knowledge you need to look your absolute best and
                feel more confident and handsome.
              </p>
              <p>
                You NO LONGER have to settle for impersonal, overpriced over
                unsupportive services you get from the large hair chains. We offer
                personal, one on one support to get you started.
              </p>
            </div>

            <ul className="mh-idx-list mt-10">
              {PRINCIPLES.map((p) => (
                <li key={p.n} className="mh-idx-row">
                  <span className="n">{p.n}</span>
                  <span className="t">{p.t}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 6. THE SYSTEM — numbered capability cards + motion meters
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-14 md:py-32">
        <AuroraBlobs className="opacity-[0.2]" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="max-w-3xl">
              <p className="mh-kicker">The system</p>
              <Display as={2} size="xl" className="mt-4">
                Everything a full head of hair <Italic>unlocks.</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Whether you&rsquo;re thinning at the crown, receding at the temples,
                or living with full hair loss, each ManHair system is custom
                ordered to match your color, density, and hairline exactly.
              </p>
            </div>
          </Reveal>

          <RevealGrid className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <article key={f.n} className="mh-cap-card">
                  <div className="mh-cap-head">
                    <span className="mh-cap-icon">
                      <Icon size={20} />
                    </span>
                    <span className="mh-cap-num">{f.n}</span>
                  </div>
                  <h3 className="mh-cap-title">{f.title}</h3>
                  <p className="mh-cap-body">{f.body}</p>
                  <div className="mh-cap-meter-row">
                    <div className="mh-cap-meter-head">
                      <span>{f.meterLabel}</span>
                      <span className="mh-cap-meter-val">{f.value}%</span>
                    </div>
                    <ProgressBar value={f.value} className="mh-cap-meter" />
                  </div>
                </article>
              );
            })}
            <article className="mh-cap-card mh-cap-cta">
              <div className="mh-cap-head">
                <span className="mh-cap-icon mh-cap-icon-inverse">
                  <ArrowRightIcon size={20} />
                </span>
                <span className="mh-cap-num">06</span>
              </div>
              <h3 className="mh-cap-title">
                See it for <Italic>yourself.</Italic>
              </h3>
              <p className="mh-cap-body">
                Walk through the exact process, step by step, before you ever book.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <BookingButton size="sm">
                  Book a Private Consultation
                </BookingButton>
                <Button href="/how-it-works/" variant="ghost" size="sm">
                  How It Works
                </Button>
              </div>
            </article>
          </RevealGrid>
        </div>
      </section>


      {/* ============================================================
       * 7. WHY MANHAIR — four-reason grid
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-14 md:py-32">
        <div className="mh-container">
          <Reveal>
            <div className="max-w-3xl">
              <p className="mh-kicker">Why ManHair</p>
              <Display as={2} size="xl" className="mt-4">
                Built for the guy who tried <Italic>everything else.</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Most places do one thing and neglect the rest. We fuse real human
                hair, an undetectable fit, expert one-on-one care, and a community
                that shows up, into one complete solution.
              </p>
              <div className="mt-8">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>

          <RevealGrid className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
            {WHY.map((w) => (
              <article key={w.n} className="mh-index-card">
                <span className="mh-index-num">{w.n}</span>
                <h3 className="font-display text-xl font-bold text-[color:var(--mh-ink-950)]">
                  {w.title}
                </h3>
                <p className="text-[color:var(--mh-ink-800)]">{w.body}</p>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * 8. THE WORK — vertical timeline of program steps
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-14 md:py-32">
        <AuroraBlobs className="opacity-25" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mh-kicker">The work</p>
                <Display as={2} size="xl" className="mt-4">
                  Every system has a <Italic>purpose.</Italic>
                </Display>
              </div>
              <div className="flex flex-wrap gap-3">
                <BookingButton size="sm">
                  Book a Private Consultation
                </BookingButton>
                <Button href="/how-it-works/" variant="ghost" size="sm">
                  Full Program Breakdown
                </Button>
              </div>
            </div>
          </Reveal>

          <RevealGrid className="mh-timeline mt-20 max-w-5xl" gap={0.18}>
            {PROGRAMS.map((p, i) => (
              <div
                key={p.title}
                className="group relative pb-20 pl-16 last:pb-0 sm:pl-20 md:pb-24 md:pl-28"
              >
                <span className="mh-timeline-node top-8 md:top-10" />
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-10">
                  <div className="relative aspect-square w-full flex-none overflow-hidden rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border-strong)] bg-[color:var(--mh-surface-elevated)] shadow-[0_18px_40px_-20px_rgba(20,16,8,0.35)] sm:w-52 md:w-72">
                    <Image
                      src={p.img}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 640px) 100vw, 320px"
                      className="object-contain transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="flex items-center gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--mh-copper-400)]">
                      <span className="font-mono text-lg tracking-[0.14em] text-[color:var(--mh-copper-500)]">{`0${i + 1}`}</span>
                      {p.kicker}
                    </p>
                    <h3 className="mt-4 font-display text-3xl font-bold text-[color:var(--mh-ink-950)] md:text-4xl">
                      {p.title}
                    </h3>
                    <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">{p.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </RevealGrid>
        </div>
      </section>


      {/* ============================================================
       * 9. PULL-QUOTE — dark cinema panel
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-36">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">The promise</p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="relative mt-6">
                <SplitLines
                  as="h2"
                  className="max-w-4xl text-[clamp(2rem,4vw+1rem,4.25rem)] text-[#FDF6E4]"
                  lines={[
                    <>We don&rsquo;t sell hair.</>,
                    <>
                      We give men their{" "}
                      <span className="italic font-light text-[color:var(--mh-red-300)]">
                        reflection back.
                      </span>
                    </>,
                  ]}
                  initialDelay={0.25}
                  gap={0.15}
                />
              </div>
            </Reveal>

            <Reveal delay={0.5}>
              <p className="mt-10 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                Ten years of building custom systems for men who&rsquo;d given up.
                One studio in Orange County. Zero surgical procedures. One promise: you walk in
                nervous, you walk out looking like the version of yourself you
                remember.
              </p>
              <p className="mt-8 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--mh-copper-300)]">
                ManHair &mdash; Orange County, CA
              </p>
              <div className="mt-8">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * 10. CLIENTS — Google-style review marquee
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-14 md:py-32">
        <div className="mh-container">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mh-kicker">The clients</p>
                <Display as={2} size="xl" className="mt-4">
                  More than a service. <Italic>A confidence.</Italic>
                </Display>
                <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                  We love our clients and are always here to support them. Here is
                  what some have to say about Manhair and the service we provide.
                </p>
              </div>
              <a
                href={google.meta.reviewsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-ink-50)] px-5 py-4"
              >
                <GoogleGIcon size={30} />
                <div>
                  <p className="flex items-center gap-1 font-display text-lg font-bold text-[color:var(--mh-ink-950)]">
                    {google.meta.rating > 0 ? google.meta.rating : "Google"}{" "}
                    <span className="text-[#F5B400]">★★★★★</span>
                  </p>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
                    {google.meta.reviewCount > 0
                      ? `${google.meta.reviewCount} Google reviews`
                      : "View all Google reviews"}
                  </p>
                </div>
              </a>
            </div>
          </Reveal>
        </div>

        {fiveStarCards.length > 0 ? (
          <div className="mt-14">
            <Marquee speed={34} className="mh-goog-marquee">
              <div className="mh-goog-track flex">
                {fiveStarCards.map((t, i) => (
                  <TestimonialCard key={`${t.name}-${i}`} t={t} index={i} />
                ))}
              </div>
            </Marquee>
          </div>
        ) : null}
      </section>

      {/* ============================================================
       * 11. THE PROCESS — image + checklist split
       * ============================================================ */}
      <section className="bg-[color:var(--mh-bg)] py-14 md:py-32">
        <div className="mh-container grid gap-8 md:grid-cols-12 md:gap-16">
          <Reveal direction="right" className="md:col-span-5">
            <ParallaxY intensity={36} className="relative">
              <div className="mh-corners relative aspect-square overflow-hidden rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border-strong)]">
                <span aria-hidden="true" className="mh-corner tl" />
                <span aria-hidden="true" className="mh-corner tr" />
                <span aria-hidden="true" className="mh-corner bl" />
                <span aria-hidden="true" className="mh-corner br" />
                <Image
                  src={IMG_GALLERY}
                  alt="Men's hair transformation gallery: ManHair"
                  fill
                  sizes="(max-width: 768px) 90vw, 40vw"
                  className="mh-image-kenburns object-cover"
                />
              </div>
            </ParallaxY>
          </Reveal>

          <Reveal direction="left" className="flex flex-col justify-center md:col-span-7">
            <p className="mh-kicker">The process</p>
            <Display as={2} size="xl" className="mt-4">
              The ManHair experience: <Italic>we keep it simple.</Italic>
            </Display>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Take years off your look and boost your confidence. From the first
              hello to lifetime servicing, here is exactly how it goes.
            </p>

            <ul className="mh-check">
              {PROCESS.map((s) => (
                <li key={s.step}>
                  <strong className="font-display text-[color:var(--mh-ink-950)]">
                    {s.step} · {s.title}
                  </strong>{": "}{s.body}
                </li>
              ))}
            </ul>

            <div className="mt-9 flex flex-wrap gap-3">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
              <Button href="/results/" variant="ghost" size="lg">
                Before &amp; After
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 12. FOUNDING OFFER — popped, colorful spotlight panel
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-14 md:py-32">
        <div className="mh-container">
          <Reveal>
            <div className="mh-offer-frame">
              <span className="mh-offer-badge">✦ Founding Offer · Limited Spots</span>
              <div className="mh-offer-panel grid gap-6 p-6 pt-9 md:grid-cols-12 md:items-center md:gap-10 md:p-14 md:pt-14">
                <div className="md:col-span-7">
                  <p className="mh-kicker">Founding offer</p>
                  <Display as={2} size="xl" className="mt-4">
                    Start with a <Italic>free consultation.</Italic>
                  </Display>
                  <p className="mt-6 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                    Get that promotion you deserve. ManHair will change your life,
                    guaranteed. Start with a free virtual consultation, no cost,
                    no pressure, then visit our Orange, CA studio for your fitting.
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <BookingButton size="lg">
                      Book a Private Consultation
                    </BookingButton>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="mh-price-figure mh-offer-figure-pop">
                    <span className="cur">$</span>
                    <span className="amt">0</span>
                    <span className="per">/ consultation</span>
                  </div>
                  <p className="mt-4 font-sans text-[0.78rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--mh-ink-700)]">
                    Free virtual consult · Orange, CA studio
                  </p>
                  <ul className="mh-offer-check">
                    <li>100% real human hair, custom ordered to match you</li>
                    <li>Undetectable, natural finish under any lighting</li>
                    <li>Lifetime one-on-one servicing and support</li>
                  </ul>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 13. FAQ + LOCATIONS
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-14 md:py-32">
        <div className="mh-container grid gap-8 md:grid-cols-12 md:gap-12">
          <Reveal direction="right" className="md:col-span-7">
            <p className="mh-kicker">FAQ</p>
            <Display as={2} size="xl" className="mt-4">
              Answers to the questions <Italic>everyone starts with.</Italic>
            </Display>
            <p className="mt-6 max-w-xl text-[color:var(--mh-ink-800)]">
              Still have questions? Our full FAQ covers everything from maintenance
              schedules to how our custom systems are built.
            </p>

            <div className="mh-accordion mt-8">
              {FAQS.map((f, i) => (
                <details key={f.q} open={i === 0}>
                  <summary>
                    <span>
                      <span className="mr-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                        Q{String(i + 1).padStart(2, "0")}
                      </span>
                      {f.q}
                    </span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/faq/" variant="ghost" size="md">
                Read All FAQs
              </Button>
            </div>
          </Reveal>

          <Reveal direction="left" className="md:col-span-5">
            <p className="mh-kicker">Location</p>
            <Display as={2} size="lg" className="mt-4">
              One studio. One <Italic>promise.</Italic>
            </Display>
            <div className="mt-8 space-y-4">
              <article className="mh-index-card">
                <p className="flex items-center gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                  <span className="mh-pin" />
                  Orange County, CA
                </p>
                <p className="font-display text-2xl text-[color:var(--mh-ink-950)]">
                  ManHair Orange County
                </p>
                <p className="text-[color:var(--mh-ink-800)]">
                  {CONTACT.studio.streetLine1}
                  <br />
                  {CONTACT.studio.streetLine2}
                </p>
                <p>
                  <a href={CONTACT.studio.phoneHref} className="font-semibold text-[color:var(--mh-copper-300)] hover:underline">
                    {CONTACT.studio.phone}
                  </a>
                </p>
              </article>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button href="/locations/" variant="ghost" size="sm">
                  All Locations
                </Button>
                <BookingButton size="sm">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 14. BLOG TEASER
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mh-kicker">Journal</p>
                <Display as={2} size="lg" className="mt-4">
                  Recent from the <Italic>ManHair blog.</Italic>
                </Display>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/blog/" variant="ghost" size="sm">
                  All Articles
                </Button>
              </div>
            </div>
          </Reveal>

          <RevealGrid className="grid gap-5 md:grid-cols-3" gap={0.1}>
            {RECENT_POSTS.map((p) => (
              <Link key={p.slug} href={p.path} className="mh-prog-card group">
                <div className="mh-prog-media">
                  {p.coverImage ? (
                    <Image
                      src={postCoverSrc(p.slug)}
                      alt={p.heading || p.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[color:var(--mh-ink-200)]" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                    Article
                  </p>
                  <h3 className="mt-3 font-display text-xl font-bold leading-tight text-[color:var(--mh-ink-950)] group-hover:text-[color:var(--mh-copper-300)]">
                    {p.heading || p.title}
                  </h3>
                  {p.excerpt ? (
                    <p className="mt-3 line-clamp-3 text-sm text-[color:var(--mh-ink-800)]">
                      {p.excerpt.slice(0, 160)}
                      {p.excerpt.length > 160 ? "…" : ""}
                    </p>
                  ) : null}
                  <p className="mt-6 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                    Read More →
                  </p>
                </div>
              </Link>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * 15. FINAL CTA
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-14 md:py-32">
        <AuroraBlobs intensity="strong" className="opacity-40" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">Next step</p>
              <Display as={2} size="hero" className="mt-5">
                Ready to find the{" "}
                <Italic>hairstyle for you?</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                We start every relationship with a free virtual consultation,
                wherever you are. There is no need to feel afraid or embarrassed.
                Your fitting happens at our Orange, CA studio.
              </p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * 16. VISIT US — modern map cards
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-14 md:py-32">
        <AuroraBlobs className="opacity-[0.16]" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mb-14 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="mh-kicker">Find us</p>
                <Display as={2} size="xl" className="mt-4">
                  Orange County. <Italic>Easy to find.</Italic>
                </Display>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                  Start with a free virtual consultation, then drop by our
                  Orange, CA studio. Either way, getting started is one tap away.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/locations/" variant="ghost" size="md">
                  All Locations
                </Button>
              </div>
            </div>
          </Reveal>

          <RevealGrid className="grid gap-7 max-w-2xl" gap={0.12}>
            {MAP_LOCATIONS.map((loc) => (
              <article key={loc.label} className="mh-mapcard group">
                <div className="mh-mapcard-frame">
                  <iframe
                    src={loc.map}
                    title={`Map: ${loc.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>

                <span className="mh-mapcard-badge">
                  <MapPinIcon size={15} />
                  {loc.label}
                </span>

                <div className="mh-mapcard-panel">
                  <p className="font-display text-xl font-bold text-[color:var(--mh-ink-950)]">
                    {loc.name}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--mh-ink-800)]">
                    {loc.streetLine1}, {loc.streetLine2}
                  </p>

                  <div className="mh-mapcard-meta">
                    <span>
                      <ClockIcon size={15} />
                      {CONTACT.hoursShort}
                    </span>
                    <a href={loc.phoneHref} className="hover:text-[color:var(--mh-copper-300)]">
                      <PhoneIcon size={15} />
                      {loc.phone}
                    </a>
                  </div>

                  <div className="mh-mapcard-actions">
                    <BookingButton size="sm">
                      Book a Private Consultation
                    </BookingButton>
                    <Button href={loc.directionsHref} variant="ghost" size="sm">
                      Get Directions
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* Final kinetic tape band with phone numbers */}
      <section aria-hidden="false" className="relative">
        <div className="mh-tape">
          <div className="mh-tape-track reverse">
            <div className="mh-tape-group">
              <span>Free Consultation</span>
              <span className="mh-tape-dot" />
              <span>{CONTACT.studio.phone} · Orange County, CA</span>
              <span className="mh-tape-dot" />
              <span>Undetectable Fit</span>
              <span className="mh-tape-dot" />
            </div>
            <div className="mh-tape-group" aria-hidden="true">
              <span>Free Consultation</span>
              <span className="mh-tape-dot" />
              <span>{CONTACT.studio.phone} · Orange County, CA</span>
              <span className="mh-tape-dot" />
              <span>Undetectable Fit</span>
              <span className="mh-tape-dot" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
