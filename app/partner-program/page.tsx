import type { Metadata } from "next";
import Image from "next/image";
import { Button, Display, Italic } from "@/components/ui";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";

const PAGE = getPageMeta("/partner-program/")!;
export const metadata: Metadata = toMetadata(PAGE);

const PHONE = "888-610-4799";
const PHONE_HREF = "tel:8886104799";
const FACEBOOK = "https://www.facebook.com/ManHairReplacementFranchise";
const INSTAGRAM = "https://www.instagram.com/manhairreplacementfranchise/";

const HERO_IMG = "/images/homepage-images/unnamed.jpg";
const IMG_MISSION = "/images/mens-hair-replacement-systems/1.webp";

/* "The advantages of being a Man hair online" — verbatim (incl. live typos). */
const ADVANTAGES = [
  {
    title: "Market leader",
    body: "Partner with a renowned and recognised brand that is the leader in the hair restoration industry.",
  },
  {
    title: "Methodology",
    body: "Get unhindered access to the pioneering hair restoration methods that deliver consistent excellent client results.",
  },
  {
    title: "Full support",
    body: "Get all the support and structure you need to operate a clinic includeing IT, Sales, Medical protocols and customer care.",
  },
  {
    title: "Legacy",
    body: "Learn protocols and methods that have been tried, tested and developed over 16 years by our hair restoration specialists.",
  },
  {
    title: "High Margins",
    body: "Joining the Man Hair Clinic organisation ensures high profit margins, optimized cost structures and fast ROI.",
  },
  {
    title: "Training",
    body: "In depth training that passes knowledge and techniques gained over decades of experience.",
  },
];

/* "Men's Hair Loss Statistics:" — verbatim. */
const STATS = [
  "1 in 4 men start balding by 21",
  "66% of all men experience hair loss by the age of 35",
  "Hair loss industry is $6.9 Billion per year and growing",
  "Hair loss industry projected to grow to $9.89 Billion by 2026",
];

/* "Why You Must Partner with ManHair?" — verbatim. */
const WHY_PARTNER = [
  "Average of 84% NET profit margins",
  "Average partner has 5k to 20k per MONTH of additional income",
  "Huge pain point so leads show up to their appointments and almost always move forward",
  "Easy seamless sales process we provide everything you need to get started",
  "Almost zero start-up costs are needed if you already cut hair thats all you need",
  "Full training program in place online and in-person events",
  "Recurring revenue model stream for peace of mind on income",
  "Financial stability with a recession-proof industry",
  "Exclusive territory rights",
  "Opportunity to open multiple locations",
  "Continuous on-going support and training for you and your staff",
  "Website and social media setup all done for you",
  "Zero fees or royalties",
  "No experience required",
];

/* "ManHair Preferred Partnership Support:" — verbatim. */
const SUPPORT = [
  "Training and grand openings",
  "Purchasing of any product or supplies that may be required",
  "Innovative marketing programs to drive business on-demand to your salon",
  "Modern and efficient but easy to use technology systems",
  "Ongoing support from our team to ensure your success with our 3 X ROI Guarantee",
  "Full in house IT support to setup and manage your CRM",
];

const CTA_TICKER = [
  "Business In A Box",
  "3X ROI Guarantee",
  "Zero Fees Or Royalties",
  "Exclusive Territory Rights",
  "Recession-Proof Industry",
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
      { name: "Franchise" },
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
       * HERO
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Preferred Partner Program</p>
              <Display as={1} size="hero" className="mt-5">
                Open a ManHair Clinic At Your Salon or Office{" "}
                <Italic>Today!</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Call today {PHONE}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={PHONE_HREF} size="lg" className="mh-btn-glow">
                  Call {PHONE}
                </Button>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={HERO_IMG}
                  alt="mens hair replacement"
                  fill
                  unoptimized
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.15}>
            <div className="mt-14 max-w-3xl space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              <p>
                ManHair is changing up the men&rsquo;s hair replacement business
                for the better! Our &lsquo;Preferred Partner Program&rsquo; offers
                you a unique opportunity to join ManHair, open your own hair
                restoration business and change the lives of so many men
                struggling with hair loss. This is a high profit margin business
                with extremely low operating overhead costs so it is a great
                investment for you and your family.
              </p>
              <p>
                Our Preferred Partner Program is open to any hair professional. As
                long as you know how to cut men&rsquo;s hair, you can be part of a
                successful growing franchise.
              </p>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-copper-300)]">
                We have a 100% make your investment back guarantee. We will
                personally work with you until you make back 3 X your investment.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * ADVANTAGES — FeaturePanel rows (01–06)
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">Why partner with us</p>
            <Display as={2} size="lg" className="mt-4">
              The advantages of being a{" "}
              <Italic>Man Hair Online</Italic>
            </Display>
          </Reveal>
          <RevealGrid className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3" gap={0.08}>
            {ADVANTAGES.map((a, i) => (
              <article key={a.title} className="mh-index-card">
                <span className="mh-index-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)]">
                  {a.title}
                </h3>
                <p className="text-[color:var(--mh-ink-800)]">{a.body}</p>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * STATISTICS
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">A fasting growing industry</p>
            <Display as={2} size="lg" className="mt-4">
              Men&rsquo;s Hair Loss <Italic>Statistics</Italic>
            </Display>
          </Reveal>
          <RevealGrid className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.08}>
            {STATS.map((s) => (
              <div
                key={s}
                className="rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] p-6 text-lg leading-snug text-[color:var(--mh-ink-900)]"
              >
                {s}
              </div>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * WHY YOU MUST PARTNER — checklist
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">The numbers make it easy</p>
            <Display as={2} size="lg" className="mt-4">
              Why You Must Partner with <Italic>ManHair?</Italic>
            </Display>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mh-check md:grid-cols-2">
              {WHY_PARTNER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * DESTINY PULL-QUOTE
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <blockquote className="max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                You are in control of your destiny. We do EVERYTHING we can to
                support you along the way when partnering with us. A smart
                investment for a lifelong income. Leave a legacy.
              </blockquote>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * MISSION + BUSINESS IN A BOX
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-7">
              <p className="mh-kicker">Our Mission</p>
              <Display as={2} size="lg" className="mt-4">
                An experience, just like going to your{" "}
                <Italic>barber.</Italic>
              </Display>
              <div className="mt-6 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Hair Replacement Doesn&rsquo;t have to be something kept a
                  secret. All of our salon rooms have sports on the TV, music
                  playing, cold beer in the fridge&hellip; We want it to be an
                  experience just like going to your barber. We are striving to be
                  the #1 hair replacement company in the USA and to modernize and
                  make hair systems no longer something to be embarrassed about. We
                  are here to take on the corporate offices that charge crazy high
                  expensive rates that are signed on for yearly contracts. Our
                  office is low cost and pay as you go for only what you need so it
                  is a no brainer offer for guys to buy into.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_MISSION}
                  alt="mens non surgical hair replacement"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-16 max-w-3xl">
              <Display as={3} size="md">
                Complete business in a box solutions for hair professionals.
              </Display>
              <div className="mt-5 space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Modern solutions paired with proven systems for all our partner
                  salons make it easy to operate successfully from the start. We
                  have a large in house support team that handles marketing, social
                  media, proprietary lead management and CRM, Full IT support and
                  more that allows you the space to focus on what really matters,
                  helping men regain their confidence. We include detailed
                  protocols for non-surgical hair treatments with a unique range of
                  hair loss products you can upsell.
                </p>
                <p>
                  Our number one goal is to build a thriving franchise partner
                  community and build America largest network of men&rsquo;s hair
                  replacement salons.
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-14 max-w-3xl">
              <Display as={3} size="md">
                Leadership, Marketing, Finance, Operations &amp; Technology.
              </Display>
              <p className="mt-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Your journey will begin with initial partnership training at our
                corporate office located in Orange County, CA. Ongoing training
                classes will be hosted throughout the year via live webinars,
                conference calls and online training. Supporting our partners is
                the backbone of our success. We look forward to helping you build
                your business empire to leave a lasting legacy for you and your
                family.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * PARTNERSHIP SUPPORT — checklist
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">Headquarters in Orange County, CA</p>
            <Display as={2} size="lg" className="mt-4">
              ManHair Preferred Partnership <Italic>Support</Italic>
            </Display>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              At ManHair we offer a full in-house support team located at our
              headquarters in Orange County, CA. Expertise in supporting our
              partners that include:
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ul className="mh-check md:grid-cols-2">
              {SUPPORT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-12 max-w-3xl text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-copper-300)]">
              With our guarantees in place you have nothing to lose and everything
              to gain. Now is the time to make a bold move in your career and build
              an empire to leave a family legacy.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * ANSWER YOU'VE BEEN LOOKING FOR
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <Display as={2} size="lg" className="max-w-4xl">
              If you&rsquo;ve always wanted to own your own business but
              didn&rsquo;t know how or where to start&hellip;? This partnership
              program is the <Italic>answer</Italic> you&rsquo;ve been looking for!
            </Display>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              We know starting a business can be extremely stressful, risky,
              confusing and just downright overwhelming (not counting the financial
              risk). At ManHair we guide motivated people through the entire process
              to make it extremely easy to follow our PROVEN systems and gameplan to
              get up and running and profitable out of the gates. You are backed by
              a strong brand with proven marketing systems to drive in business in
              the fastest growing market in the industry. At ManHair our team is on
              standby to help you navigate the partnership process, answer any
              questions you may have and align you with all the resources and
              support to start and grow your very own business.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * TICKER BAND
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

      {/* ============================================================
       * JOIN CTA — GlowButton + follow us
       * ============================================================ */}
      <section className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-10 md:py-24">
        <div className="mh-container text-center">
          <p className="mh-kicker justify-center">Leave a legacy</p>
          <Display as={2} size="xl" className="mt-4">
            Ready to join a <Italic>winning team?</Italic>
          </Display>
          <div className="mt-8 flex justify-center">
            <Button href={PHONE_HREF} size="lg" className="mh-btn-glow">
              Call {PHONE} to Sign Up
            </Button>
          </div>
          <div className="mt-10">
            <p className="mh-kicker justify-center">Follow us</p>
            <div className="mt-4 flex justify-center gap-6 text-sm font-semibold uppercase tracking-[0.14em]">
              <a
                href={FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--mh-copper-300)] underline underline-offset-4 transition-colors hover:text-[color:var(--mh-copper-200)]"
              >
                Facebook
              </a>
              <a
                href={INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--mh-copper-300)] underline underline-offset-4 transition-colors hover:text-[color:var(--mh-copper-200)]"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
