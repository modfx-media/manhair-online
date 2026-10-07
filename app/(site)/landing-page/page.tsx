import type { Metadata } from "next";
import Image from "next/image";
import { Button, Display, Italic } from "@/components/ui";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/landing-page/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

// Verbatim booking + contact links preserved from the live landing page.
const BOOK = "https://calendly.com/manhaironline/discovery-call?back=1&month=2019-11";
const CAL = "https://calendly.com/manhaironline";
const PHONE = "1-904-458-7592";
const PHONE_HREF = "tel:19044587592";
const EMAIL_HREF = "mailto:info@manhaironline.com";

const IMG_HERO = "/wp-content/uploads/2018/08/IMG_1207-1024x1024.jpg";
const IMG_ALT2 = "/wp-content/uploads/2018/08/IMG_1203-1024x1024.jpg";
const IMG_BEFORE = "/wp-content/uploads/2018/08/before-mens-hair-system-1024x1024.jpg";
const IMG_AFTER = "/wp-content/uploads/2018/08/after-mens-hair-system-1024x1024.jpg";

const SERVICES = [
  "Free Consultation With Our Specialists",
  "Unique and Premium Quality Indian and European Hair (Human Hair)",
  "Handcrafted Custom Made Hair Systems",
  "Full Range Of Customization; Color, Density, Style, Direction, Length",
  "Professional Range Of Hair Systems Maintenance Products",
  "10-12 Weeks Production And Delivery Time",
  "Full Training Program For You And Your Chosen Hair Stylist",
];

const MANHAIR_GETS = [
  "Beautiful looking hair with a natural, undetectable hairline",
  "Real human hair that\u2019s available in a variety of colors and trendy styles",
  "Over 10 years of experience in the hair loss industry \u2013 we know the needs and concerns of hair loss sufferers and will work closely with you to ensure you get the perfect solution",
];

const TESTIMONIALS = [
  {
    name: "Greg",
    img: "/wp-content/uploads/2018/08/greg-mens-hair-replacement-testimony.jpg",
    quote:
      "I have been wearing hair systems for over 20 years and this is the best quality and service I have received without question I would recommend to everyone I know suffering with hair loss.",
  },
  {
    name: "nick",
    img: "/wp-content/uploads/2018/08/nick-hair-replacement-system-testimony.jpg",
    quote:
      "I have rocked a shaved head now for over 5 years and was sick of how I looked in the mirror and decided to make a change. Thank you ManHair for giving my confidence a major boost!",
  },
  {
    name: "pam",
    img: "/wp-content/uploads/2018/08/pam-hair-system-testimony-150x150.jpg",
    quote:
      "My husband was always thinning at an early age and then eventually decided to shave his head. I wasn't thrilled with the chrome dome and recommended ManHair to him and now he looks 20 years younger we are both so happy!",
  },
  {
    name: "william",
    img: "/wp-content/uploads/2018/08/bill-hair-system-testimony.jpg",
    quote:
      "My entire family starting balding at very young age. We all decided to take the plunge to get new hair together and we are all so pleased with the end results thank you.",
  },
];

const WORRY_FREE = [
  {
    img: "/wp-content/uploads/2018/08/sleeping.png",
    title: "sleep with hair on",
    body: "Sleep with your hair system on and wake up with a full head of hair.",
  },
  {
    img: "/wp-content/uploads/2018/08/shower.png",
    title: "shower with hair",
    body: "Shampoo and Condition your hair system like it were you own.",
  },
  {
    img: "/wp-content/uploads/2018/08/training.png",
    title: "work out, be active",
    body: "Sweat from physical activity is no problem with the right system.",
  },
];

const CTA_TICKER = [
  "Get Your Hair Back",
  "Get Your Confidence Back",
  "Get Your Life Back",
  "Proven Hair Replacement Solutions",
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
      { name: "Landing Page" },
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
    <CMSRoute path={"/landing-page/"}>
    <div className="mh-light">
      <JsonLd data={graph} />

      {/* ============================================================
       * HERO — Welcome to ManHair (real H1)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Welcome to ManHair</p>
              <Display as={1} size="hero" className="mt-5">
                Welcome to <Italic>ManHair</Italic>
              </Display>
              <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Proven hair replacement solutions for men.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button href={BOOK} external size="lg">
                  Click Here To Book My Appointment Today
                </Button>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <div className="mh-image-frame relative aspect-[4/3] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_HERO}
                  alt="Proven hair replacement solutions for men"
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
       * INTRO CTA — it is time (verbatim recurring block)
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-8 md:py-20">
        <div className="mh-container text-center">
          <Reveal>
            <Display as={2} size="lg">
              It is time. Get your hair back. Get your{" "}
              <Italic>confidence back.</Italic>
            </Display>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Start with a free virtual consultation from anywhere. When
              you&rsquo;re ready, visit our Orange, CA studio for your fitting,
              no pushy sales tactics, just real support on your journey.
            </p>
            <div className="mt-8 flex justify-center">
              <Button href={BOOK} external size="lg">
                Book My Appointment
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * THE ULTIMATE HAIR REPLACEMENT SOLUTION — verbatim body
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">
              How to Regain Your Hair &hellip; And Your Self-Confidence &hellip; &amp;
              Get Your Life Back!
            </p>
            <Display as={2} size="xl" className="mt-4">
              The Ultimate Hair Replacement <Italic>Solution</Italic>
            </Display>
            <p className="mt-6 max-w-3xl text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-300)]">
              Hair Loss Can Destroy a Man&rsquo;s Self-Esteem &ndash; Discover Below
              What You Need to Know to Get Your Hair Back so You Can Look Your
              Absolute Best
            </p>
          </Reveal>
          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-7">
              <div className="space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  Hair loss can be devastating to a man&rsquo;s self esteem. If you
                  are suffering hair loss you may suddenly no longer see yourself as
                  a strong, attractive man and that negative self view can quickly
                  begin to leak into other parts of your life. Maybe your energy
                  wanes and you no longer are as active as you were before &hellip;
                  Maybe you feel less attractive and less confident around women
                  &hellip; Maybe you get passed over for promotions at work because
                  you look older and less attractive. The truth is our appearance
                  has a major impact on our lives &ndash; both personally and
                  professionally. In fact, according to Business Insider magazine,
                  &ldquo;studies have shown that attractive people are usually hired
                  sooner, get promotions more quickly, and are paid more than their
                  less-attractive counterparts.&rdquo;
                </p>
                <p>
                  If you feel you are less attractive because of hair loss your
                  career could suffer! And that&rsquo;s not all! Your sex drive
                  could also decrease, leading to relationship problems. You could
                  even begin to feel depressed. Luckily for you and other hair loss
                  sufferers, we live in a truly exciting time. There Are Now Proven
                  Hair Loss Solutions for Men! We&rsquo;re talking about solutions
                  that will allow you to have the look you have always wanted.
                  Solutions that range from hair replacement systems to hair
                  re-growth procedures like Platelet Rich Plasma (PRP) and Stem Cell
                  Injections and more. One solution that has quickly become very
                  popular among hair loss sufferers due to its effectiveness and its
                  cost efficiency is hair replacement systems. We&rsquo;re not
                  talking about your grandfather&rsquo;s toupee here. The new
                  systems are incredibly sophisticated and feature real human hair.
                  These systems are completely natural looking and can be worn in
                  bed, in the shower and while working out. Now no one ever has to
                  know that you are a hair loss sufferer.
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="mh-image-frame relative aspect-square overflow-hidden rounded-[var(--mh-radius-md)]">
                  <Image
                    src={IMG_BEFORE}
                    alt="Before mens hair system"
                    fill
                  unoptimized
                    sizes="(max-width: 1024px) 50vw, 21vw"
                    className="object-cover"
                  />
                </div>
                <div className="mh-image-frame relative aspect-square overflow-hidden rounded-[var(--mh-radius-md)]">
                  <Image
                    src={IMG_AFTER}
                    alt="After mens hair system"
                    fill
                    sizes="(max-width: 1024px) 50vw, 21vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * OUR SERVICES — ChecklistItem list
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <Reveal className="lg:col-span-6">
              <p className="mh-kicker">Our services</p>
              <Display as={2} size="lg" className="mt-4">
                Everything you need, <Italic>handled.</Italic>
              </Display>
              <ul className="mh-check !mt-8">
                {SERVICES.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-6">
              <div className="mh-image-frame relative aspect-[4/5] overflow-hidden rounded-[var(--mh-radius-md)]">
                <Image
                  src={IMG_ALT2}
                  alt="Handcrafted custom made hair systems"
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * CUSTOMIZED SOLUTIONS FOR ALL HAIR TYPES — verbatim body
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">For all hair types</p>
              <Display as={2} size="lg" className="mt-4">
                ManHair Offers Customized Hair Loss Solutions for{" "}
                <Italic>ALL Hair Types.</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                It doesn&rsquo;t matter if you have thinning hair or a smaller bald
                spot or a larger bald area, we have thoughtfully curated and hand
                selected products that are designed to unleash what makes you, you.
                You get exactly what you need to look your absolute best and feel
                more confident and handsome &hellip; and remember nobody else will
                know because your hair loss solution will look ultra realistic and
                be totally undetectable. Imagine having the flowing locks
                you&rsquo;ve always wanted &hellip; Imagine having a thick full head
                of natural hair that helps you stand out without drawing unwanted
                attention itself &hellip; Imagine being able to get the hair
                you&rsquo;ve always wanted safely and naturally AND much faster than
                you ever thought possible &hellip; It is all possible with ManHair.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * SO WHAT EXACTLY IS MANHAIR — verbatim body + ChecklistItem
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">So What exactly is manhair?</p>
            <Display as={2} size="lg" className="mt-4">
              We are here <Italic>for you.</Italic>
            </Display>
          </Reveal>
          <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:items-start">
            <Reveal className="lg:col-span-7">
              <div className="space-y-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                <p>
                  We are a full service hair loss solution provider located in
                  Orange County, CA. Our top priority is 100% client satisfaction.
                  To accomplish that goal we take care of every aspect of our
                  clients&rsquo; hair experience &ndash; starting with a FREE
                  personalized consultation to help guide you in the right direction
                  to get your hair back and achieve the look you have always wanted.
                  Should you decide to become a client, we can also handle
                  measurements, design, fitting, cut-in and styling and, in
                  addition, we even provide emotional support and advice as needed.
                  In other words, we are here for you! Here&rsquo;s more great news
                  &ndash; thanks to technological innovations we can provide our
                  hair loss solutions to anyone no matter where in the world you are
                  located. We can have the consultation and provide other guidance
                  and advice via phone or video chat!
                </p>
              </div>
            </Reveal>
            <Reveal direction="left" className="lg:col-span-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-300)]">
                With ManHair you get:
              </p>
              <ul className="mh-check !mt-6">
                {MANHAIR_GETS.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * MANHAIR PHILOSOPHY — QuoteBlock pull-quote
       * ============================================================ */}
      <section className="relative">
        <div className="mh-cinema border-y border-[color:var(--mh-copper-700)]/40 px-6 py-14 md:py-32">
          <div className="mh-container relative">
            <Reveal>
              <p className="mh-kicker">
                One Big Thing That Sets Us Apart from the Competition is the ManHair
                Philosophy&hellip;
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <blockquote className="mt-8 max-w-4xl text-[clamp(1.5rem,2.2vw+0.75rem,2.5rem)] font-light leading-[1.25] text-[#FDF6E4]">
                We believe that every guy has the right to have the full head of
                hair he deserves &hellip; the hair that was taken away too soon and
                without permission. It really isn&rsquo;t fair and that is why we
                have spent years researching to find the best solution to this
                detrimental condition.
              </blockquote>
            </Reveal>
            <Reveal delay={0.3}>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#F5EFE3]/85">
                We know that having a full head of hair can be just what is needed
                to bring back your confidence and self-esteem and help you get your
                life back. Our Founder Understands Firsthand the Negative Impact
                That Losing Hair Can Have on a Man&rsquo;s Life &amp; Wants to Help
                You Avoid It
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
       * TESTIMONIALS — look what others are saying
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">look what others are saying about manhair</p>
            <Display as={2} size="lg" className="mt-4">
              Loved by our <Italic>clients.</Italic>
            </Display>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              We love our clients and are always here to support them. Here is what
              some have to say about ManHair and the service we provide.
            </p>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 sm:grid-cols-2"
            gap={0.1}
          >
            {TESTIMONIALS.map((t) => (
              <article
                key={t.name}
                className="rounded-[var(--mh-radius-md)] border border-[color:var(--mh-border)] bg-[color:var(--mh-surface-elevated)] p-7"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={t.img}
                      alt={`${t.name} hair replacement testimony`}
                      fill
                  unoptimized
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-display text-2xl font-bold capitalize text-[color:var(--mh-ink-950)]">
                    {t.name}
                  </h3>
                </div>
                <blockquote className="mt-5 leading-relaxed text-[color:var(--mh-ink-800)]">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
              </article>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * LIVE WORRY FREE — 3 cards linking to how-it-works
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <p className="mh-kicker">
              live your life worry free with our high quality hair systems.
            </p>
            <Display as={2} size="lg" className="mt-4">
              Live your life <Italic>worry free.</Italic>
            </Display>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Live your life how it was meant, worry free all while looking your
              absolute best with a full head of hair.
            </p>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 sm:grid-cols-3"
            gap={0.1}
          >
            {WORRY_FREE.map((w) => (
              <a
                key={w.title}
                href="/how-it-works/"
                className="mh-index-card transition-colors"
              >
                <div className="relative mb-5 h-14 w-14">
                  <Image
                    src={w.img}
                    alt={w.title}
                    fill
                  unoptimized
                    sizes="56px"
                    className="object-contain"
                  />
                </div>
                <h3 className="font-display text-2xl font-bold capitalize text-[color:var(--mh-ink-950)]">
                  {w.title}
                </h3>
                <p className="text-[color:var(--mh-ink-800)]">{w.body}</p>
              </a>
            ))}
          </RevealGrid>
        </div>
      </section>

      {/* ============================================================
       * WORKING HOURS + CONTACT INFO — info cards
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <Display as={2} size="lg" className="max-w-4xl">
              It is Time for a Change, Time to Take Charge and Get the Look You Once
              Had or <Italic>Have Always Wanted!</Italic>
            </Display>
          </Reveal>
          <RevealGrid
            className="mt-14 grid gap-4 md:grid-cols-2"
            gap={0.1}
          >
            <article className="mh-index-card">
              <h3 className="font-display text-2xl font-bold uppercase text-[color:var(--mh-ink-950)]">
                Working Hours
              </h3>
              <p className="text-[color:var(--mh-ink-800)]">
                Monday to Friday | 09:00 AM &ndash; 9:00 PM
              </p>
              <p className="text-[color:var(--mh-ink-800)]">
                Saturday &amp; Sunday | 09:00 AM &ndash; 7:00 PM
              </p>
            </article>
            <article className="mh-index-card">
              <h3 className="font-display text-2xl font-bold uppercase text-[color:var(--mh-ink-950)]">
                Contact Info
              </h3>
              <p>
                <a
                  href={PHONE_HREF}
                  className="text-[color:var(--mh-copper-300)] underline underline-offset-4"
                >
                  {PHONE}
                </a>
              </p>
              <p>
                <a
                  href={EMAIL_HREF}
                  className="text-[color:var(--mh-copper-300)] underline underline-offset-4"
                >
                  INFO@manhaironline.com
                </a>
              </p>
              <p className="mt-2">
                <a
                  href={CAL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-copper-300)] underline underline-offset-4"
                >
                  Book a Discovery Call On Our Calendar
                </a>
              </p>
            </article>
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
          <p className="mh-kicker justify-center">click below to schedule a call</p>
          <Display as={2} size="lg" className="mt-4">
            Book a 100% free <Italic>discovery call.</Italic>
          </Display>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            Click the link below where you can book a 100% free discovery call with
            one of our hair specialists. We can determine together if we are a good
            fit for one another and if so review the next steps to booking an in
            person meeting to get your shiny new beautiful head of hair.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href={BOOK} external size="lg">
              YES Schedule my FREE Discovery Call
            </Button>
          </div>
        </div>
      </section>
    </div>
  </CMSRoute>
  );
}
