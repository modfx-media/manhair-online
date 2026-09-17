import type { Metadata } from "next";
import Image from "next/image";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { BookingLink } from "@/components/BookingLink";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/receding-hairline-restoration/")!;
export const metadata: Metadata = toMetadata(PAGE);

const HERO_IMG =
  "/images/homepage-images/hairline-hair-systems-before-and-after-new-times-hair.jpg";
const IMG_TREATMENT = "/images/non-surgical-hair-replacement/2.jpg";
const IMG_REPLACEMENT = "/images/mens-hair-replacement-systems/4.jpg";

const CTA_TICKER = [
  "Non-Surgical Hair Replacement",
  "Full Head Hair Systems",
  "Natural-Looking Hairline",
  "Professional Hair Restoration",
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
      { name: "Receding Hairline Restoration" },
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
              <p className="mh-kicker">Receding Hairline Restoration</p>
              <Display as={1} size="hero" className="mt-5">
                ManHair Receding Hairline Restoration and{" "}
                <Italic>Replacement</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Are you dealing with a receding hairline? If so, then
                  you&rsquo;re not alone. A receding hairline is a common
                  condition that affects millions of men around the world.
                  Fortunately, there are a number of effective treatments
                  available to help restore your hairline. At ManHairOnline, we
                  offer a variety of hair restoration treatments, including
                  non-surgical and surgical options, to help you achieve the look
                  you desire.
                </p>
              </div>
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
                  alt="Receding hairline restoration"
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
       * INTRO CONT. — verbatim body copy
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mx-auto max-w-4xl text-center text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Hair loss and receding hairlines can be devastating for men, but
              fortunately, there are hair restoration treatments available to help
              them regain their confidence. Hair restoration treatments vary in
              effectiveness and cost, so it&rsquo;s important to research the
              options to determine which is best for you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * TREATMENTS WE OFFER — DisplayHeading + verbatim body
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-7">
              <p className="mh-kicker">A full range of options</p>
              <Display as={2} size="lg" className="mt-4">
                Treatments <Italic>we offer</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  The most popular hair restoration treatments for men in the area
                  are hair replacement, full head hair replacement systems, and
                  hair restoration treatments. Each of these treatments can help
                  to restore hair growth, but they vary in cost and effectiveness.
                  If you&rsquo;re looking for hair restoration treatments near
                  Orange County, California, you&rsquo;re looking for a non-surgical
                  hair replacement system or a professional hair restoration near
                  you, ManHairOnline has you covered. We offer a full range of hair
                  restoration treatments, from non-surgical hair replacement
                  systems to full head hair replacement systems. Our non-surgical
                  hair replacement systems use advanced technology to provide
                  natural-looking, healthy hair growth. Our full head hair
                  replacement system uses the latest in hair replacement technology
                  to provide a full hairline restoration.
                </p>
                <p>
                  Hair replacement is a common and affordable option. It involves
                  replacing your existing hair with a new hairpiece. The hairpiece
                  is custom-made to match your existing hair color, texture, and
                  length. This procedure can be completed in one day and the
                  results are immediate. However, the hairpiece may require regular
                  maintenance to keep it looking its best. At ManHairOnline, we
                  understand the importance of a healthy, natural-looking hairline.
                  That&rsquo;s why we offer a variety of hair restoration
                  treatments to help you achieve the look you desire. From
                  non-surgical hair replacement systems to full head hair
                  replacement systems, we have the right solution for you. Our
                  professional hair restoration near you provides the latest
                  technology to help you achieve a full and natural hairline.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_TREATMENT}
                  alt="Hair restoration treatments"
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
       * NON-SURGICAL, ORANGE COUNTY — DisplayHeading + verbatim body
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal direction="right" className="order-2 lg:order-1 lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_REPLACEMENT}
                  alt="Non surgical hair replacement, Orange County"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2 lg:col-span-7">
              <p className="mh-kicker">Orange County, California</p>
              <Display as={2} size="lg" className="mt-4">
                Non Surgical Hair Replacement, <Italic>Orange County</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Full head hair replacement systems are also an option. Whether
                  you&rsquo;re looking for a non-surgical hair replacement system
                  or a professional hair restoration near you, Man Hair Online has
                  you covered. We offer a full range of hair restoration
                  treatments, from non-surgical hair replacement systems to full
                  head hair replacement systems. Our non-surgical hair replacement
                  systems use advanced technology to provide natural-looking,
                  healthy hair growth. Our full head hair replacement system uses
                  the latest in hair replacement technology to provide a full
                  hairline restoration.
                </p>
                <p>
                  Hair restoration treatments are also available at ManHairOnline
                  Orange County, California. Our treatments involve stimulating hair
                  growth through the use of medications and other products. The
                  most popular treatments for hair restoration include minoxidil,
                  finasteride, and laser therapy. These treatments can be
                  effective, but they may require several sessions to achieve the
                  desired results.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * QUOTE BLOCK — pull-quote (what are you waiting for?)
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">What are you waiting for?</p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                So, if you&rsquo;re looking for the best hair replacement for men
                near you, look no further than ManHairOnline. We&rsquo;re the
                perfect choice for professional hair replacement near you and hair
                restoration treatment near you.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                <BookingLink className="font-semibold text-[color:var(--mh-copper-300)] underline underline-offset-4">
                  Call us today
                </BookingLink>{" "}
                to learn more about our hair restoration treatments and how we can
                help you achieve the look you desire.
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
