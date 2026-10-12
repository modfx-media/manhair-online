import type { Metadata } from "next";
import { Button, Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph, buildPersonSchema } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/about/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

const SERVICES = [
  {
    n: "01",
    title: "Cut in & style of unit",
    body: "We provide the cut in or can direct you on where to go in you prefer.",
  },
  {
    n: "02",
    title: "shave of your head",
    body: "We will prepare your head for the best fit of your new unit.",
  },
  {
    n: "03",
    title: "HOT LATHER SHAVE",
    body: "While doing your hair we can also trim up your facial hair.",
  },
  {
    n: "04",
    title: "WASH-BLOW DRY",
    body: "We will prepare your unit first with shampoo, condition & blow dry.",
  },
  {
    n: "05",
    title: "SCALP TREATMENT",
    body: "In between every service of your unit we will apply scalp treatment.",
  },
  {
    n: "06",
    title: "RE-CHARGE FACIAL",
    body: "We have the best products to condition your skin to look its best.",
  },
];

const EXPERIENCE = [
  {
    n: "01",
    title: "consultation",
    body: "Schedule a free consultation with a hair expert.",
  },
  {
    n: "02",
    title: "selection",
    body: "Selection process of the best hair for your lifestyle.",
  },
  {
    n: "03",
    title: "fitting",
    body: "Applying your new thick and beautiful manhair system.",
  },
  {
    n: "04",
    title: "servicing",
    body: "We will handle the maintenance on your unit.",
  },
];

const CTA_TICKER = [
  "100% Satisfaction",
  "Personal Care Ambassador",
  "Free Virtual Consultation",
  "Regain Your Confidence",
  "The ManHair Philosophy",
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
      { name: "About Us" },
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

  // Person schema for the founder — spec Section 7.2 recommends this
  // on the /about/ page to strengthen the site's E-E-A-T signals.
  const personSchema = buildPersonSchema({
    origin: SITE.origin,
    name: "Justin",
    jobTitle: "Founder",
    worksForName: SITE.orgName,
    url: `${SITE.origin}/about/`,
  });

  return (
    <CMSRoute path={"/about/"}>
    <div className="mh-light">
      <JsonLd data={[graph, personSchema]} />

      {/* ============================================================
       * HERO — EyebrowTag + DisplayHeading (real H1)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">About Us</p>
              <Display as={1} size="hero" className="mt-5">
                About <Italic>ManHair Online</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-3xl text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--mh-copper-300)]">
                Discover how ManHair Online offers the best hair loss solution for men
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
       * INTRO — H2 + real body copy
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <Display as={2} size="xl">
                ManHair Online has fast hair loss solutions for men in{" "}
                <Italic>Orange County</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                At ManHair, our top priority is your 100% satisfaction. At ManHair,
                we take care of every aspect of your hair experience. We offer
                personalized consultations to help guide you in the right direction
                to reinvent the look of your hair, and achieve the look you have
                always wanted. We handle the measurements, design, fitting, cut-in,
                styling, and all the emotion support and advice you may need. Rely on
                us as the ultimate hair loss solution for men.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * SERVICES — FeaturePanel rows
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">Every aspect covered</p>
            <Display as={2} size="lg" className="mt-4">
              The complete <Italic>hair experience.</Italic>
            </Display>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            gap={0.08}
          >
            {SERVICES.map((s) => (
              <article key={s.n} className="mh-index-card">
                <span className="mh-index-num">{s.n}</span>
                <h3 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)]">
                  {s.title}
                </h3>
                <p className="text-[color:var(--mh-ink-800)]">{s.body}</p>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * PHILOSOPHY — QuoteBlock (mission statement)
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">The ManHair Philosophy&hellip;</p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                We believe that every guy has the right to have the full head of
                hair he deserves. Many men begin to lose their hair long before they
                should, and this isn&rsquo;t fair. This is the reason why we have
                spent years researching to find the best solution to this condition
                to help restore your confidence and help you take back control of
                your life.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                We know that having a full head of hair will bring back your
                confidence, self-esteem and help you regain control of your life.
                It&rsquo;s time for a change. Take charge of your potential and get
                the look you once had, or have always wanted. Let&rsquo;s be real
                here &ndash; looks do matter for personal reasons as well, such as
                finding a significant other, getting promoted at work, and finding
                the motivation to be a better you.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * MESSAGE FROM THE OWNER — QuoteBlock (founder statement)
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-8 md:grid-cols-12">
            <Reveal direction="right" className="md:col-span-4">
              <p className="mh-kicker">A message from the owner</p>
              <Display as={2} size="lg" className="mt-4">
                Founded by <Italic>Justin.</Italic>
              </Display>
              <p className="mt-6 text-[color:var(--mh-ink-800)]">
                ManHair was founded by Justin, who personally struggled with hair
                loss at a very early age which can be detrimental to a mans
                confidence and personality.
              </p>
            </Reveal>

            <Reveal direction="left" className="md:col-span-8">
              <div className="mh-price-panel space-y-6 p-8 md:p-12">
                <blockquote className="text-xl font-light leading-relaxed text-[color:var(--mh-ink-900)] md:text-2xl">
                  &ldquo;After many years of seeing myself, family, and friends
                  dealing with hair loss, spending countless hours of their time and
                  hard-earned money trying everything on the market, from hair
                  transplant surgery, visiting hair loss clinics for answers,
                  ointments and potions like Rogaine, nothing seemed to deliver a
                  full perfect head of hair and every time they were left wanting
                  more.&rdquo;
                </blockquote>
                <p className="text-[color:var(--mh-ink-800)]">
                  Our personal goal is to have a community where all men are treated
                  equally, regardless of their current hair situation. We understand
                  that going to a salon for help can be embarrassing and very time
                  consuming, but that is where we come in. At ManHair, we start
                  every relationship with a free virtual consultation, from anywhere.
                  You will be assigned a personal care ambassador to get
                  the one on one time you deserve to answer any and all questions you
                  have to find the proper solution for you and your current hair
                  condition. When you&rsquo;re ready, your fitting happens at our
                  Orange, CA studio. You will regain confidence in yourself, and save
                  thousands of dollars instead of overpaying at a salon. Feel
                  confident and handsome and know that you&rsquo;re in great hands at
                  ManHair!
                </p>
                <blockquote className="text-xl font-light leading-relaxed text-[color:var(--mh-ink-900)] md:text-2xl">
                  &ldquo;Little did I know when I started ManHair that I&rsquo;d have
                  such a great team to work with that was so dedicated to creating
                  wow-worthy hair experience for guys. But all these years later, we
                  do &ndash; and together, we look forward to earning your trust and
                  increasing your handsomeness.&rdquo;
                </blockquote>
                <p className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--mh-copper-300)]">
                  Welcome to ManHair &mdash; Justin
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * THE MANHAIR EXPERIENCE — 4 steps → /how-it-works/
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <AuroraBlobs className="opacity-25" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="mh-kicker">The manhair experience</p>
                <Display as={2} size="xl" className="mt-4">
                  We keep it <Italic>simple.</Italic>
                </Display>
              </div>
              <Button href="/how-it-works/" variant="ghost" size="sm">
                How It Works
              </Button>
            </div>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            gap={0.08}
          >
            {EXPERIENCE.map((s) => (
              <a
                key={s.n}
                href="/how-it-works/"
                className="mh-index-card transition-colors"
              >
                <span className="mh-index-num">{s.n}</span>
                <h3 className="font-display text-2xl font-bold capitalize text-[color:var(--mh-ink-950)]">
                  {s.title}
                </h3>
                <p className="text-[color:var(--mh-ink-800)]">{s.body}</p>
              </a>
            ))}
          </RevealGrid>
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
          <p className="mh-kicker justify-center">We would love to help you!</p>
          <Display as={2} size="lg" className="mt-4">
            Get in touch now! Book a free <Italic>hair discovery call.</Italic>
          </Display>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <BookingButton size="lg">
              Book a Private Consultation
            </BookingButton>
          </div>
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
