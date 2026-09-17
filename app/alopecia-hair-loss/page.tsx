import type { Metadata } from "next";
import Image from "next/image";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { BookingLink } from "@/components/BookingLink";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/alopecia-hair-loss/")!;
export const metadata: Metadata = toMetadata(PAGE);

const HERO_IMG = "/images/mens-hair-units/thinning-image.jpg";
const IMG_HAIR = "/images/mens-wigs/2.jpg";
const IMG_CUT = "/images/how-it-works/cutstyle-600x597.png";

const CTA_TICKER = [
  "Get Your Hair Back",
  "Get Your Confidence Back",
  "Alopecia Hair Loss Solutions",
  "Free Virtual Consultation",
  "Orange, CA Studio",
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
      { name: "Alopecia Hair Loss" },
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
              <p className="mh-kicker">Alopecia Hair Loss</p>
              <Display as={1} size="hero" className="mt-5">
                Alopecia and <Italic>Hair Loss</Italic>
              </Display>
              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--mh-copper-300)]">
                Are You Struggling With Alopecia and Hair Loss? At ManHairOnline,
                We can Help!
              </p>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Do you have Alopecia and are looking for a way to restore your
                  hair? Have you been struggling with hair loss and don&rsquo;t
                  know what to do? ManHairOnline is here to help with our Alopecia
                  Hair Loss Solutions.
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
                  alt="alopecia hair replacement"
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
       * MEDICAL TREATMENTS — DisplayHeading + verbatim body copy
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-7">
              <p className="mh-kicker">Understanding Alopecia</p>
              <Display as={2} size="lg" className="mt-4">
                A solution for your <Italic>specific needs.</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Alopecia is a medical condition that causes hair loss and
                  baldness. It can affect both men and women and can range from
                  mild to severe. At ManHairOnline, we understand the emotional
                  toll Alopecia can take on a person and we are here to help you
                  find the best solution for your specific needs.
                </p>
                <p>
                  We offer a wide range of Alopecia Hair Loss Solutions ranging
                  from medical treatments to hair replacement solutions. Our
                  medical treatments include topical medications, laser therapy,
                  and hormone therapy. These treatments can help slow down the
                  hair loss and even stimulate new hair growth.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_HAIR}
                  alt="Alopecia hair loss solutions"
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
       * HAIR REPLACEMENT SOLUTIONS — DisplayHeading + verbatim body
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal direction="right" className="order-2 lg:order-1 lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_CUT}
                  alt="Custom-made hair replacement"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2 lg:col-span-7">
              <p className="mh-kicker">The non-medical route</p>
              <Display as={2} size="lg" className="mt-4">
                Custom-made to <Italic>fit you.</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  For those who prefer to go the non-medical route, we also offer
                  a variety of hair replacement solutions such as hairpieces,
                  wigs, and hair extensions. Our hairpieces are custom-made to fit
                  your head and are available in a variety of styles and colors.
                  We also offer high-quality human hair wigs and extensions that
                  can help you achieve the look you want.
                </p>
                <p>
                  At ManHairOnline, we understand that finding the right solution
                  for Alopecia and hair loss can be a difficult and stressful
                  process. That&rsquo;s why our team of experienced professionals
                  is here to help. We will guide you every step of the way, from
                  diagnosis to treatment and beyond. With our extensive knowledge
                  and experience, we can help you find the solution that&rsquo;s
                  right for you.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * QUOTE BLOCK — pull-quote (confidence statement)
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">It is time&hellip;</p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                Don&rsquo;t let Alopecia and hair loss rob you of your confidence.
                With ManHairOnline, you can find the right solution for your
                specific needs. Our team of professionals is here to help you
                every step of the way.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                <BookingLink className="font-semibold text-[color:var(--mh-copper-300)] underline underline-offset-4">
                  Call us today
                </BookingLink>{" "}
                to learn more about our Alopecia Hair Loss Solutions and start
                your journey to a happier and healthier head of hair.
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
