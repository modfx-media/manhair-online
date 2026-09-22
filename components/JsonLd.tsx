/**
 * JSON-LD injection helper.
 *
 * Renders a schema.org structured data payload inside a
 * `<script type="application/ld+json">` tag. We follow the
 * Next.js docs recommendation: scrub `<` characters to their
 * unicode form to prevent XSS via malicious string injection.
 *
 * See: node_modules/next/dist/docs/01-app/02-guides/json-ld.md
 */
export function JsonLd({ data }: { data: unknown | unknown[] }) {
  const payloads = Array.isArray(data) ? data : [data];
  return (
    <>
      {payloads.map((payload, i) => (
        <script
          // eslint-disable-next-line react/no-danger
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(payload).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}

/** Utility: build a WebPage/BreadcrumbList/WebSite/Organization graph
 *  in the same shape Yoast SEO emits on the live site. */
export function buildPageGraph(opts: {
  origin: string;
  path: string;
  title: string;
  description?: string | null;
  image?: string | null;
  imageWidth?: number;
  imageHeight?: number;
  imageCaption?: string | null;
  breadcrumbs: Array<{ name: string; path?: string }>;
  datePublished?: string;
  dateModified?: string;
  organization: {
    name: string;
    url: string;
    logo: { url: string; width: number; height: number; caption: string };
    sameAs: readonly string[];
  };
  siteName: string;
  siteDescription?: string;
  inLanguage?: string;
}) {
  const {
    origin,
    path,
    title,
    description,
    image,
    imageWidth,
    imageHeight,
    imageCaption,
    breadcrumbs,
    datePublished,
    dateModified,
    organization,
    siteName,
    siteDescription,
    inLanguage = "en-US",
  } = opts;

  const pageUrl = `${origin}${path}`;
  const graph: Record<string, unknown>[] = [];

  const webPage: Record<string, unknown> = {
    "@type": "WebPage",
    "@id": pageUrl,
    url: pageUrl,
    name: title,
    isPartOf: { "@id": `${origin}/#website` },
    about: { "@id": `${origin}/#organization` },
    inLanguage,
    breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
    potentialAction: [{ "@type": "ReadAction", target: [pageUrl] }],
  };
  if (description) webPage.description = description;
  if (datePublished) webPage.datePublished = datePublished;
  if (dateModified) webPage.dateModified = dateModified;
  if (image) {
    webPage.primaryImageOfPage = { "@id": `${pageUrl}#primaryimage` };
    webPage.image = { "@id": `${pageUrl}#primaryimage` };
    webPage.thumbnailUrl = image;
  }
  graph.push(webPage);

  if (image) {
    const img: Record<string, unknown> = {
      "@type": "ImageObject",
      inLanguage,
      "@id": `${pageUrl}#primaryimage`,
      url: image,
      contentUrl: image,
    };
    if (imageWidth) img.width = imageWidth;
    if (imageHeight) img.height = imageHeight;
    if (imageCaption) img.caption = imageCaption;
    graph.push(img);
  }

  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: breadcrumbs.map((b, i) => {
      const item: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        name: b.name,
      };
      if (b.path) item.item = `${origin}${b.path}`;
      return item;
    }),
  });

  graph.push({
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: `${origin}/`,
    name: siteName,
    description: siteDescription,
    publisher: { "@id": `${origin}/#organization` },
    inLanguage,
  });

  graph.push({
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: organization.name,
    url: organization.url,
    logo: {
      "@type": "ImageObject",
      inLanguage,
      "@id": `${origin}/#/schema/logo/image/`,
      url: organization.logo.url,
      contentUrl: organization.logo.url,
      width: organization.logo.width,
      height: organization.logo.height,
      caption: organization.logo.caption,
    },
    image: { "@id": `${origin}/#/schema/logo/image/` },
    sameAs: [...organization.sameAs],
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

/**
 * Service schema for individual service pages (spec Section 7.2).
 * Deliberately excludes any AggregateRating/Review — do not add fake
 * review data. `areaServed` should stay county/region-level, never a
 * fabricated list of every city (that reads as spam to Google).
 */
export function buildServiceSchema(opts: {
  origin: string;
  path: string;
  name: string;
  description: string;
  providerName: string;
  areaServed?: string;
}) {
  const { origin, path, name, description, providerName, areaServed = "Orange County, CA" } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${origin}${path}#service`,
    name,
    description,
    serviceType: name,
    provider: { "@id": `${origin}/#organization` },
    areaServed: { "@type": "AdministrativeArea", name: areaServed },
    url: `${origin}${path}`,
  };
}

/**
 * LocalBusiness schema. Per spec Section 7.2, this must ONLY be used on
 * the homepage and the `/locations/orange/` page — never on the other
 * 34 Tier 1 city pages ("the single most common programmatic SEO
 * mistake"). Do not call this from any city page other than Orange.
 */
export function buildLocalBusinessSchema(opts: {
  origin: string;
  name: string;
  telephone: string;
  streetAddress: string;
  addressLocality: string;
  addressRegion: string;
  postalCode?: string;
  url: string;
  logoUrl: string;
  sameAs: readonly string[];
  rating?: number;
  reviewCount?: number;
  reviews?: ReadonlyArray<{ name: string; quote: string; rating: number }>;
}) {
  const {
    origin,
    name,
    telephone,
    streetAddress,
    addressLocality,
    addressRegion,
    postalCode,
    url,
    logoUrl,
    sameAs,
    rating,
    reviewCount,
    reviews,
  } = opts;
  const fiveStar =
    reviews?.filter(
      (review) =>
        review.rating === 5 && review.quote.trim().length > 0 && review.name.trim().length > 0,
    ) ?? [];
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${origin}/#organization`,
    name,
    telephone,
    image: logoUrl,
    url,
    address: {
      "@type": "PostalAddress",
      streetAddress,
      addressLocality,
      addressRegion,
      ...(postalCode ? { postalCode } : {}),
      addressCountry: "US",
    },
    sameAs: [...sameAs],
    ...(rating && reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: String(rating),
            reviewCount: String(reviewCount),
            bestRating: "5",
          },
        }
      : {}),
    ...(fiveStar.length
      ? {
          review: fiveStar.map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.name },
            reviewRating: {
              "@type": "Rating",
              ratingValue: "5",
              bestRating: "5",
            },
            reviewBody: review.quote,
          })),
        }
      : {}),
  };
}

/** Person schema for `/about/` — the founder. No fabricated bio facts. */
export function buildPersonSchema(opts: {
  origin: string;
  name: string;
  jobTitle: string;
  worksForName: string;
  url: string;
}) {
  const { origin, name, jobTitle, worksForName, url } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${origin}/#founder`,
    name,
    jobTitle,
    worksFor: { "@id": `${origin}/#organization` },
    url,
  };
}

/** FAQPage schema — per spec, use ONLY on `/faq/`. Never add to city or
 *  service pages (that's a common spammy-schema mistake). */
export function buildFAQSchema(opts: {
  origin: string;
  path: string;
  items: Array<{ question: string; answer: string }>;
}) {
  const { origin, path, items } = opts;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${origin}${path}#faq`,
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
