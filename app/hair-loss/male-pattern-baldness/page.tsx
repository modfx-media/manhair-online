import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Card, Display, Italic, SectionLabel } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { BookingLink } from "@/components/BookingLink";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { ActivityIcon, ArrowRightIcon, HelpCircleIcon } from "@/components/icons";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { FullPhoto } from "@/components/FullPhoto";
import { MEDICAL_NOTE, getCondition } from "@/lib/seo/conditions";
import { getService } from "@/lib/seo/services";

const PAGE = getPageMeta("/hair-loss/male-pattern-baldness/")!;
export const metadata: Metadata = toMetadata(PAGE);

const HERO_IMG = "/images/mens-hair-replacement-systems/balding.avif";
const IMG_PATTERN = "/images/mens-hair-replacement-systems/3.jpg";

const CTA_TICKER = [
  "Non-Surgical Hair Replacement",
  "Custom Hair Systems",
  "Natural-Looking Hairline",
  "No Downtime",
  "Orange, CA Studio",
];

const OPTIONS = [
  {
    label: "Medications",
    title: "Minoxidil & Finasteride",
    body: [
      "Medications like minoxidil have shown to be effective in slowing the progression of male pattern baldness as well as stimulating hair growth and strengthening existing strands. Minoxidil is best for those who have minimal thinning — it will not give you back a full head of hair, but it can provide some assistance. Although generally an effective option, some do report it not working, while others see results in 6 months or sooner. If you ever decide to stop taking minoxidil, you will lose the new hair growth as well as the hair that would have been lost had you not taken any medication.",
      "Finasteride is more known for slowing down hair loss by 90%, but it does not provide much hair growth or strengthening. Results show in 6 months and, just like minoxidil, when you stop taking it, hair loss returns. Finasteride has more known side effects such as a lower libido, depression, and erectile dysfunction. These side effects can linger even after quitting the medication. Weigh your options with a physician before taking any medication that can alter your life.",
    ],
  },
  {
    label: "In-office",
    title: "PRP (Platelet-Rich Plasma)",
    body: [
      "PRP, or platelet-rich plasma, is when a small amount of your blood is drawn and placed into a machine that separates the red blood cells from the plasma. The plasma is then injected into your scalp. PRP can lessen hair loss and promote new, thicker hair growth. It is your own blood being injected back into your scalp, so there are not any major side effects. Results typically show in three to six months after continuous treatment once a month.",
    ],
  },
  {
    label: "Surgical",
    title: "Hair Transplant",
    body: [
      "Hair replacement surgery, or hair transplant surgery, works to restore patches and areas on your scalp that are bald or thinning by removing hair from other parts of the body and grafting it where it is needed. There are two common methods: FUT (Follicular Unit Transplantation) and FUE (Follicular Unit Extraction).",
      "Hair transplant surgery is a more permanent solution, but it comes with a hefty price tag, a long list of side effects, and downtime to recover.",
    ],
  },
];

export default function Page() {
  const condition = getCondition("male-pattern-baldness");
  const recommended = (condition?.recommendedServiceSlugs ?? [])
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const graph = buildPageGraph({
    origin: SITE.origin,
    path: PAGE.path,
    title: PAGE.title,
    description: PAGE.description,
    image: PAGE.og.image,
    breadcrumbs: [
      { name: "Home", path: "/" },
      { name: "Male Pattern Baldness" },
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

      {/* HERO */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Male Pattern Baldness</p>
              <Display as={1} size="hero" className="mt-5">
                Male pattern baldness.{" "}
                <Italic>Coverage that looks like you.</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Male pattern baldness, otherwise known as androgenic alopecia,
                  accounts for more than 95% of hair loss in men. By the age of
                  35, two thirds of men in the U.S. will have some degree of
                  hair loss, and by age 50 about 85% of men will have
                  significant hair thinning or hair loss.
                </p>
                <p>
                  It is usually genetic. Family history of hair loss or
                  baldness makes you more susceptible. Androgens, the male sex
                  hormones in charge of hair growth, begin to weaken the
                  follicle, creating shorter, finer hair, and eventually no
                  growth at all.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <FullPhoto
                src={HERO_IMG}
                alt="Man with male pattern baldness, receding hairline and thinning crown"
                priority
                size="hero"
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-7">
              <p className="mh-kicker">Can it be stopped?</p>
              <Display as={2} size="lg" className="mt-4">
                There is no outright cure.{" "}
                <Italic>There is a better look.</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Unfortunately there is no outright cure for male pattern
                  baldness. Luckily, there are ways to slow it down, and
                  options that give you a full, natural-looking head of hair
                  while you decide what else, if anything, you want to pursue
                  with a physician.
                </p>
                <p>
                  Knowing what options you have, and which one is actually
                  right for you, is the key. Medications, PRP, and surgery are
                  paths some men explore. At ManHair, we specialize in
                  non-surgical topical hair replacement: a custom system that
                  covers the hairline and crown immediately, blended with the
                  hair you still have.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_PATTERN}
                  alt="Male pattern baldness"
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

      {/* OPTIONS MEN CONSIDER */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <SectionLabel>What men typically explore</SectionLabel>
            <Display as={2} size="lg" className="mt-3">
              Other options, <Italic>explained</Italic>
            </Display>
            <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              We do not prescribe medication, perform PRP, or do transplants.
              These are the paths most men research first. Here is a clear
              look at each, so you can compare them with a custom hair system.
            </p>
          </Reveal>
          <RevealGrid className="mt-10 grid gap-6 lg:grid-cols-3">
            {OPTIONS.map((opt) => (
              <Card key={opt.title} padding="md">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-700)]">
                  {opt.label}
                </p>
                <p className="mt-2 font-display text-xl text-[color:var(--mh-ink-950)]">
                  {opt.title}
                </p>
                <div className="mt-4 space-y-4 text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                  {opt.body.map((p) => (
                    <p key={p.slice(0, 40)}>{p}</p>
                  ))}
                </div>
                {opt.title === "Hair Transplant" && (
                  <Link
                    href="/hair-replacement-surgery-vs-topical-hair-replacement/"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--mh-copper-700)]"
                  >
                    Surgery vs. topical replacement{" "}
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                )}
              </Card>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* MANHAIR SOLUTION — topical hair replacement */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-5">
              <p className="mh-kicker">The ManHair approach</p>
              <Display as={2} size="lg" className="mt-4">
                Topical hair <Italic>replacement</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                This is the service we provide at our Orange, CA studio. No
                surgery, no injections, no downtime.
              </p>
              <div className="mt-8">
                <BookingButton size="lg">
                  Book a Private Consultation
                </BookingButton>
              </div>
            </Reveal>
            <Reveal className="lg:col-span-7" delay={0.1}>
              <div className="space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Topical hair replacement starts by preparing the surface of
                  your head if any remaining hair needs to be evened, then
                  applying a medical-grade adhesive. That bond lasts 3–4 weeks
                  and is refreshed at a maintenance visit each month. A custom
                  hair unit is placed on top and cut and styled to the look
                  you want. Units typically last about 6 months before they
                  are replaced, as they shed like real human hair.
                </p>
                <p>
                  With a topical unit you can exercise, shower, and sleep with
                  it on. It is a 24/7 system, secured with the correct
                  adhesives. Your scalp can still breathe through the mesh
                  lining where the hair is attached, so it sits comfortably —
                  most clients say they almost cannot feel it. There are no
                  medication side effects, and the look is realistic and
                  undetectable when it is fitted and cut in correctly.
                </p>
                <p>
                  <Link
                    href="/services/non-surgical-hair-replacement/"
                    className="font-semibold text-[color:var(--mh-copper-700)] underline underline-offset-4"
                  >
                    Learn more about non-surgical hair replacement
                  </Link>{" "}
                  or see{" "}
                  <Link
                    href="/mens-hair-replacement-systems/"
                    className="font-semibold text-[color:var(--mh-copper-700)] underline underline-offset-4"
                  >
                    all hair system options
                  </Link>
                  .
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* MEDICAL DISCLAIMER */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-10">
        <div className="mh-container max-w-3xl">
          <Card padding="md" accent="left">
            <div className="flex items-start gap-3">
              <HelpCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--mh-copper-700)]" />
              <p className="text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
                {MEDICAL_NOTE}
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* RECOMMENDED SERVICES */}
      {recommended.length > 0 && (
        <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-16 md:py-24">
          <div className="mh-container">
            <Reveal>
              <SectionLabel>Recommended</SectionLabel>
              <Display as={2} size="lg" className="mt-3">
                Services that <Italic>cover this</Italic>
              </Display>
            </Reveal>
            <RevealGrid className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recommended.map((s) => (
                <Card
                  key={s.slug}
                  href={
                    s.slug === "mens-hair-replacement-systems"
                      ? "/mens-hair-replacement-systems/"
                      : `/services/${s.slug}/`
                  }
                  padding="md"
                >
                  <ActivityIcon className="h-5 w-5 text-[color:var(--mh-copper-700)]" />
                  <p className="mt-3 font-sans text-base font-semibold text-[color:var(--mh-ink-900)]">
                    {s.name}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-sm text-[color:var(--mh-copper-700)]">
                    Learn more <ArrowRightIcon className="h-3 w-3" />
                  </p>
                </Card>
              ))}
            </RevealGrid>
          </div>
        </section>
      )}

      {/* QUOTE */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">A full look, without the wait</p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                Male pattern baldness cannot be stopped. A custom hair system
                can still give you the hairline and density you want, the same
                day you sit in our chair.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                <BookingLink className="font-semibold text-[color:var(--mh-copper-300)] underline underline-offset-4">
                  Book a private consultation
                </BookingLink>{" "}
                and we will walk through whether a system is the right fit —
                no pressure, no sales script.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

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
            you&rsquo;re ready, visit our Orange, CA studio for your fitting.
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
