import type { Metadata } from "next";
import Image from "next/image";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { BookingLink } from "@/components/BookingLink";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/mens-hair-styles/")!;
export const metadata: Metadata = toMetadata(PAGE);

const HERO_IMG = "/images/homepage-images/Warren-Sims-Dallas-Man-weave.jpg";
const IMG_INTRO = "/images/mens-hairpieces/1.jpg";
const IMG_HAIRCUT = "/images/mens-toupees/2.jpg";

const CTA_TICKER = [
  "Toupee Hair Systems",
  "Hair Pieces For Men",
  "Toupee Haircuts",
  "Exceptional Customer Service",
  "Get Your Confidence Back",
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
      { name: "men\u2019s hair styles" },
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
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* ============================================================
       * HERO — EyebrowTag + DisplayHeading (real H1)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Men&rsquo;s Hair Styles</p>
              <Display as={1} size="hero" className="mt-5">
                Men&rsquo;s <Italic>Hair Styles</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                For advice on men&rsquo;s hair styles for your manhair hair
                replacement system and toupee, check out these mens hair style
                trend at ManHair Online. Coming Soon.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={HERO_IMG}
                  alt="Men's hair styles"
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * INTRODUCING — DisplayHeading + verbatim body copy
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-7">
              <p className="mh-kicker">A one-stop shop in Orange County</p>
              <Display as={2} size="lg" className="mt-4">
                Introducing ManHairOnline: A One-Stop Shop for Men&rsquo;s Hair
                Styles in <Italic>Orange County</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  When it comes to mens hair styles in Orange County, ManHairOnline
                  is the go-to destination. We offer a wide selection of
                  contemporary and classic toupee hair systems, hair pieces for
                  men, and toupee haircuts. With our vast array of styles and
                  options, we are sure to have something for every man. Whether
                  you are looking for something modern and stylish, or something
                  classic and timeless, ManHairOnline has you covered.
                </p>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-300)]">
                  Discover Our Wide Array of Toupee Hair Systems, Hair Pieces &amp;
                  Toupee Haircuts
                </p>
                <p>
                  At ManHairOnline, we understand the importance of having a great
                  looking hairstyle. That&rsquo;s why we offer a wide selection of
                  toupee hair systems, hair pieces for men, and toupee haircuts.
                  Our toupee hair systems are crafted from the highest quality
                  materials, designed to provide a natural look and feel. From
                  classic looks to contemporary styles, we have something for
                  everyone. We also offer a range of hair pieces for men, to help
                  you achieve the look you&rsquo;re after. Whether you&rsquo;re
                  searching for something sleek and modern, or something classic
                  and timeless, we have you covered.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_INTRO}
                  alt="Toupee hair systems and hair pieces for men"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * HAIRCUT + CUSTOMER SERVICE — FeaturePanel rows
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">Experienced stylists, exceptional service</p>
            <Display as={2} size="lg" className="mt-4">
              The perfect cut, <Italic>near you.</Italic>
            </Display>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 lg:grid-cols-2"
            gap={0.1}
          >
            <article className="mh-index-card">
              <span className="mh-index-num">01</span>
              <h3 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)]">
                Get the Perfect Toupee Haircut Near You
              </h3>
              <p className="text-[color:var(--mh-ink-800)]">
                If you&rsquo;re looking for a toupee haircut near you, look no
                further than ManHairOnline. Our team of experienced stylists are
                on hand to provide you with the perfect cut. Whether you&rsquo;re
                looking for something modern and stylish, or something classic and
                timeless, our stylists will make sure you leave looking and
                feeling your best. Our stylists are knowledgeable in all the
                latest trends and techniques, so you can be sure you&rsquo;ll be
                getting the best possible service.
              </p>
            </article>
            <article className="mh-index-card">
              <span className="mh-index-num">02</span>
              <h3 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)]">
                Experience Our Exceptional Customer Service
              </h3>
              <p className="text-[color:var(--mh-ink-800)]">
                At ManHairOnline, we pride ourselves on providing exceptional
                customer service. Our team of experts are always on hand to answer
                any questions you may have, and to help you find the perfect toupee
                hair styles for you. We understand that finding the right style can
                be overwhelming, so we are here to make the process as easy as
                possible. From selecting the perfect toupee hair system, to finding
                the perfect toupee haircut near you, we are here to help.
              </p>
            </article>
          </RevealGrid>
          <Reveal delay={0.15}>
            <div className="mh-image-frame relative mt-10 aspect-[16/7] overflow-hidden rounded-[var(--mh-radius-md)]">
              <Image
                src={IMG_HAIRCUT}
                alt="Toupee haircut near you"
                fill
                  unoptimized
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * QUOTE BLOCK — pull-quote (visit us)
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">
                Visit ManHairOnline for the Best Toupee Hair Styles in Orange County
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                If you&rsquo;re looking for the best toupee hair styles in
                Orange County, ManHairOnline is the place to go. We offer a wide
                selection of toupee hair systems, hair pieces for men, and toupee
                haircuts.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                Our experienced stylists are always on hand to provide you with
                the perfect cut. So, if you&rsquo;re looking for something modern
                and stylish, or something classic and timeless, ManHairOnline has
                you covered.{" "}
                <BookingLink className="font-semibold text-[color:var(--mh-copper-300)] underline underline-offset-4">
                  Call us today
                </BookingLink>{" "}
                and experience our exceptional customer service.
              </p>
            </Reveal>
          </div>
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
          <p className="mh-kicker justify-center">
            Get your hair back. Get your confidence back.
          </p>
          <Display as={2} size="lg" className="mt-4">
            It is time for a <Italic>change.</Italic>
          </Display>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            Start with a free virtual consultation from anywhere. When
            you&rsquo;re ready, visit our Orange, CA studio for your fitting,
            no pushy sales tactics, just real support on your journey.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BookingButton size="lg">
              Book a Private Consultation
            </BookingButton>
          </div>
        </div>
      </section>
    </div>
  );
}
