import type { Metadata } from "next";
import Image from "next/image";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal, RevealGrid } from "@/components/ui/motion";
import { JsonLd, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/how-it-works/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

const HIGHLIGHTS = [
  {
    n: "01",
    title: "experienced staff",
    body: "It all starts with a free consultation with one of our hair replacement specialists, in studio or virtually from anywhere.",
  },
  {
    n: "02",
    title: "training for you",
    body: "We will train you on how to take care of your system, including the 3–4 week reattachment, so you can do it at home and save a lot of money.",
  },
];

const STATIONS = [
  {
    n: "01",
    title: "Get your hair back",
    body: "Because going bald isn't a choice but staying bald is when we are here for you. You made the right choice moving forward with a ManHair system for the best hair line, ultra-realistic hair system available today. Get your life back!",
    image: "/images/how-it-works/start-600x597.png",
  },
  {
    n: "02",
    title: "Prepare your head",
    body: "The ManHair system has been completely customized for you and now it's time to get your head ready for applying the unit. We will shave the surface of your head and apply the adhesive. This is a process we will personally walk you through so you can do the 3–4 week reattachment yourself at home. It is a short, simple refresh with no downtime and no interruption to your daily life.",
    image: "/images/how-it-works/preparehead-600x597.png",
  },
  {
    n: "03",
    title: "Choose your adhesive",
    body: "Our systems can be used with glue or tape and we will discuss which may be a better option for you that will depend on the system you choose and your lifestyle. All of our products are from high end well established manufacturers and certified to be non-toxic and will not have any reactions to your skin.",
    image: "/images/how-it-works/adhesive-600x597.png",
  },
  {
    n: "04",
    title: "Apply the system",
    body: "We recommend lining the front of the system with your nose and starting the unit at the tip with where your natural hairline would start. Press down to secure the front of the system then pull the system back in a rolling method while keeping pressure applied to have the unit sit smoothly on all sides of the shaved area.",
    image: "/images/how-it-works/applysystem-600x597.png",
  },
  {
    n: "05",
    title: "Cut & style",
    body: "It is now time for the best part of having your hair back. You decide what hair style you want to look your absolute best. We will cut in the unit and style to your liking. You can choose to use one of our stylists or your own. Anything is possible!",
    image: "/images/how-it-works/cutstyle-600x597.png",
  },
  {
    n: "06",
    title: "New beginnings",
    body: "Welcome to new beginnings with the new and better you with a full head of beautiful, thick, soft, healthy and natural hair. Enjoy the empowerment you will have to feel powerful, feel sexy, take that promotion or find that significant other the possibilities are now endless.",
    image: "/images/how-it-works/final-600x597.png",
  },
];

const CTA_TICKER = [
  "Undetectable Hair Line",
  "Ultra-Realistic Look",
  "Real Human Hair",
  "Free Virtual Consultation",
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
      { name: "How It Works" },
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
    <CMSRoute path={"/how-it-works/"}>
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
              <p className="mh-kicker justify-center">How It Works</p>
              <Display as={1} size="hero" className="mt-5">
                How Manhair <Italic>Works.</Italic>
              </Display>
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
       * WHAT IS A MANHAIR PRODUCT — intro + highlights
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container grid gap-8 md:grid-cols-12 md:gap-12">
          <Reveal direction="right" className="md:col-span-7">
            <p className="mh-kicker">What is a manhair product?</p>
            <p className="mt-6 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              Our hair replacement systems of the absolute highest quality within
              the industry today made with the highest quality real human hair. You
              will achieve an undetectable hair line with an ultra-realistic look no
              one will ever know. The system is designed specifically for your head
              and the look you want. Our units typically last 6 months.
            </p>
            <p className="mt-5 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
              About every 3 to 4 weeks the adhesive is cleaned and reapplied so the
              bond stays secure. It is a straightforward refresh, not a medical
              procedure: most sessions take about 30 to 90 minutes, you keep your
              usual hair, and you go right back to work, the gym, and daily life.
              We can do it in studio, or we train you to do it at home so there is
              no disruption to your week.
            </p>
          </Reveal>

          <div className="md:col-span-5">
            <RevealGrid className="grid gap-4" gap={0.1}>
              {HIGHLIGHTS.map((h) => (
                <article key={h.n} className="mh-index-card">
                  <span className="mh-index-num">{h.n}</span>
                  <h3 className="font-display text-2xl font-bold capitalize text-[color:var(--mh-ink-950)]">
                    {h.title}
                  </h3>
                  <p className="text-[color:var(--mh-ink-800)]">{h.body}</p>
                </article>
              ))}
            </RevealGrid>
          </div>
        </div>
      </section>

      {/* ============================================================
       * OUT OF STATE — virtual consult + one studio visit
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <Display as={2} size="xl" className="max-w-5xl">
              If you do not live in Orange County, Not a problem! Start with a
              free consultation <Italic>from anywhere</Italic>
            </Display>
          </Reveal>
          <Reveal className="mt-10">
            <BookingButton size="lg">Book a Private Consultation</BookingButton>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
       * STATIONS — NumberedRow (giant outline numbers)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] py-12 md:py-28">
        <AuroraBlobs className="opacity-20" />
        <div className="mh-container relative z-10">
          <Reveal>
            <p className="mh-kicker">The process</p>
            <Display as={2} size="xl" className="mt-4">
              From first shave to <Italic>full head of hair.</Italic>
            </Display>
          </Reveal>

          <div className="mt-12">
            {STATIONS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.05}>
                <div className="mh-station">
                  <div className="mh-station-img">
                    <Image
                      src={s.image}
                      alt={s.title}
                      fill
                      sizes="(min-width: 768px) 13rem, 9rem"
                    />
                  </div>
                  <div className="max-w-3xl">
                    <h3 className="font-display text-2xl font-bold text-[color:var(--mh-ink-950)] md:text-3xl">
                      {s.title}
                    </h3>
                    <p className="mt-3 text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                      {s.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
       * CTA — real closing copy + Book My Appointment
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <div className="mh-price-panel grid gap-10 p-8 md:grid-cols-12 md:items-center md:p-14">
            <Reveal direction="right" className="md:col-span-8">
              <p className="mh-kicker">It is time</p>
              <Display as={2} size="xl" className="mt-4">
                Get your hair back. Get your <Italic>confidence back.</Italic>
              </Display>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                Start with a free virtual consultation from anywhere. When
                you&rsquo;re ready, visit our Orange, CA studio for your fitting,
                no pushy sales tactics, just real support on your journey.
              </p>
            </Reveal>
            <Reveal direction="left" className="md:col-span-4">
              <BookingButton size="lg" block>
                Book a Private Consultation
              </BookingButton>
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
          <p className="mh-kicker justify-center">Ready when you are</p>
          <Display as={2} size="lg" className="mt-4">
            Book your free <Italic>consultation.</Italic>
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
