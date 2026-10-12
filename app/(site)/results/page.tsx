import type { Metadata } from "next";
import { Button, Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, BeforeAfterCard, Reveal } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { HOME_TRANSFORMATIONS } from "@/lib/before-after";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/results/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

type Aspect = "square" | "portrait" | "wide";

const GALLERY: { src: string; alt: string; aspect: Aspect }[] = [
  ...HOME_TRANSFORMATIONS.map((t) => ({
    src: t.src,
    alt: t.alt,
    aspect: "square" as const,
  })),
  {
    src: "/images/before-after/results/Before-after1.jpg",
    alt: "Before and after men's hair restoration",
    aspect: "wide",
  },
  {
    src: "/images/before-after/results/Before-after2.jpg",
    alt: "Before and after hair replacement result",
    aspect: "wide",
  },
  {
    src: "/images/before-after/results/Before-after3.jpg",
    alt: "Before and after men's hair restoration",
    aspect: "wide",
  },
  {
    src: "/images/before-after/results/unnamed.jpg",
    alt: "Before and after hair system transformation",
    aspect: "square",
  },
  {
    src: "/images/before-after/results/unnamed-1.jpg",
    alt: "Before and after custom hair system",
    aspect: "square",
  },
  {
    src: "/images/before-after/results/unnamed-2.jpg",
    alt: "Before and after men's hair restoration",
    aspect: "square",
  },
  {
    src: "/images/before-after/results/unnamed5.jpg",
    alt: "Before and after hair replacement",
    aspect: "portrait",
  },
  {
    src: "/images/before-after/results/IMG_2486.jpg",
    alt: "Before and after client result",
    aspect: "square",
  },
];

const CTA_TICKER = [
  "Real Men. Real Results.",
  "Years Of Experience",
  "Men's Makeovers",
  "New Look. New Confidence.",
  "Free Virtual Consultation",
];

export default function Page() {
  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Before and after" },
    ],
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

  return (
    <CMSRoute path={"/results/"}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* ============================================================
       * HERO — EyebrowTag + DisplayHeading (real page heading)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">Before &middot; After</p>
              <Display as={1} size="hero" className="mt-5">
                Before <Italic>&amp; After</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Whether you are due for a drastic haircut, a trim, or you desire a
                completely new hairstyle, you can trust ManHair&rsquo;s years of
                experience, dedicated training, and expert opinion. We love doing
                men&rsquo;s makeovers for new jobs, new looks, new decades, new
                significant others, or just because you need a change to boost those
                confidence levels up!
              </p>
              <div className="mt-8 flex justify-center">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * GALLERY — clean masonry grid of real before/after images
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {GALLERY.map((g, i) => (
              <div key={g.src} className="mb-5 break-inside-avoid">
                <Reveal delay={(i % 3) * 0.08}>
                  <BeforeAfterCard
                    src={g.src}
                    alt={g.alt}
                    aspect={g.aspect}
                    priority={i < 3}
                  />
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * CTA — real closing copy + Book My Appointment
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <AuroraBlobs className="opacity-25" intensity="strong" />
        <div className="mh-container relative z-10 text-center">
          <Reveal>
            <p className="mh-kicker justify-center">It is time</p>
            <Display as={2} size="xl" className="mt-4">
              Get your hair back. Get your <Italic>confidence back.</Italic>
            </Display>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Start with a free virtual consultation from anywhere. When
              you&rsquo;re ready, visit our Orange, CA studio for your fitting,
              no pushy sales tactics, just real support on your journey.
            </p>
            <div className="mt-8 flex justify-center">
              <BookingButton size="lg">
                Book a Private Consultation
              </BookingButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * TICKER BAND CTA — drives to booking
       * ============================================================ */}
      <section aria-hidden="true" className="mh-ticker">
        <div className="mh-marquee">
          <div
            className="mh-marquee-track"
            style={{ ["--mh-marquee-duration" as string]: "30s" } as React.CSSProperties}
          >
            {[0, 1].map((dup) => (
              <div key={dup} className="mh-marquee-group">
                {CTA_TICKER.map((t) => (
                  <span key={t + dup} className="inline-flex items-center gap-6">
                    <span className="mh-ticker-item">
                      <span>{t}</span>
                    </span>
                    <span className="mh-ticker-star">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-8 md:py-20">
        <div className="mh-container text-center">
          <p className="mh-kicker justify-center">See the difference</p>
          <Display as={2} size="lg" className="mt-4">
            Your transformation <Italic>starts here.</Italic>
          </Display>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BookingButton size="lg">
              Book a Private Consultation
            </BookingButton>
            <Button href="/how-it-works/" variant="ghost" size="lg">
              How It Works
            </Button>
          </div>
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
