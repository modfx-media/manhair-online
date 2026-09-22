import type { Metadata } from "next";
import { Manrope, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IntroSplash } from "@/components/IntroSplash";
import { JsonLd } from "@/components/JsonLd";
import { BookingModal } from "@/components/BookingModal";
import { SITE, SOCIAL } from "@/lib/site";
import { DEFAULT_OG } from "@/lib/seo/meta";
import { getDisplayedGoogleReviews } from "@/lib/google-reviews";
import { isFiveStarReview } from "@/lib/reviews";

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Outfit — geometric sans used for all display headlines. Variable
// weight axis (100–900) so a single import covers everything from
// light accent phrases to bold H1s. Outfit ships no italic face,
// so the design system's italic accent below relies on a lighter
// weight + gold color instead of true italic.
const display = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

/**
 * Root metadata. Page-level `generateMetadata` / `metadata` exports
 * override title/description/canonical/OG per route. Values here act
 * as the default fallback and set `metadataBase` for relative URLs.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.origin),
  title: {
    default: SITE.siteName,
    template: "%s | ManHair",
  },
  description: SITE.brandStatement,
  applicationName: SITE.siteName,
  openGraph: {
    siteName: SITE.siteName,
    locale: SITE.locale,
    type: "website",
    title: SITE.siteName,
    description: SITE.brandStatement,
    url: `${SITE.origin}/`,
    images: [
      {
        url: DEFAULT_OG.url,
        width: DEFAULT_OG.width,
        height: DEFAULT_OG.height,
        alt: DEFAULT_OG.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.siteName,
    description: SITE.brandStatement,
    images: [DEFAULT_OG.url],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  } as Metadata["robots"],
  icons: {
    icon: [
      { url: "/favicon-32x32.png?v=3", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png?v=3", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png?v=3", sizes: "180x180", type: "image/png" }],
  },
  verification: {
    google: "9OOudO709sX1-6y62xy3eeil3PooVArGf_KAcKD-bJM",
  },
};

/** Site-wide Organization + WebSite graph (identical shape to the
 *  Yoast-generated payload on the live site, so search engines see
 *  the same entity references). */
const SITE_GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE.origin}/#website`,
      url: `${SITE.origin}/`,
      name: SITE.siteName,
      description: SITE.tagline,
      publisher: { "@id": `${SITE.origin}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "Organization",
      "@id": `${SITE.origin}/#organization`,
      name: SITE.orgName,
      url: `${SITE.origin}/`,
      logo: {
        "@type": "ImageObject",
        inLanguage: "en-US",
        "@id": `${SITE.origin}/#/schema/logo/image/`,
        url: `${SITE.origin}${SITE.logo.url}`,
        contentUrl: `${SITE.origin}${SITE.logo.url}`,
        width: SITE.logo.width,
        height: SITE.logo.height,
        caption: SITE.logo.caption,
      },
      image: { "@id": `${SITE.origin}/#/schema/logo/image/` },
      sameAs: SOCIAL.map((s) => s.href),
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { reviews, meta } = await getDisplayedGoogleReviews();
  const visible = reviews.filter(isFiveStarReview);
  const siteGraph = {
    ...SITE_GRAPH,
    "@graph": SITE_GRAPH["@graph"].map((node) => {
      if (node["@type"] !== "Organization") return node;
      return {
        ...node,
        ...(meta.rating > 0 && meta.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: String(meta.rating),
                reviewCount: String(meta.reviewCount),
                bestRating: "5",
              },
            }
          : {}),
        ...(visible.length
          ? {
              review: visible.map((review) => ({
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
    }),
  };

  return (
    <html
      lang="en-US"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[color:var(--mh-bg)] text-[color:var(--mh-fg)] selection:bg-[color:var(--mh-copper-200)]">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-NTLDFH6CYS"
          strategy="beforeInteractive"
        />
        <Script id="google-analytics" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NTLDFH6CYS');
          `}
        </Script>
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "yj6lraerbd");
          `}
        </Script>
        <JsonLd data={siteGraph} />
        <IntroSplash />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <BookingModal />
        <Script
          src="https://link.manhaironline.com/js/form_embed.js"
          strategy="lazyOnload"
        />
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a95e182e48bae5398803e54"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

