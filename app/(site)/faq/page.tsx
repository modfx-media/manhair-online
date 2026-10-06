import type { Metadata } from "next";
import { Display, Italic } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { AuroraBlobs, Reveal } from "@/components/ui/motion";
import { JsonLd, buildFAQSchema, buildPageGraph } from "@/components/JsonLd";
import { SITE, SOCIAL } from "@/lib/site";
import { getPageMeta, toMetadata } from "@/lib/pages";
import { cmsGenerateMetadata } from "@/lib/cms/metadata";
import { CMSRoute } from "@/lib/cms/CMSRoute";

const PAGE = getPageMeta("/faq/")!;
export async function generateMetadata(): Promise<Metadata> {
  return cmsGenerateMetadata(PAGE.path, toMetadata(PAGE));
}

const FAQS: { q: string; a: string }[] = [
  {
    q: "How long can I wear the hair for?",
    a: "Unlike a traditional wig or toupee, ManHair does not spend the night on a stand or in a drawer for all to see (embarrassing and degrading to your self confidence), once attached you can wear up to 6 weeks at a time. We do however, recommend coming in every 4-6 weeks for a salon maintenance session, but this will vary depending on your lifestyle and also regards to natural oils, sweat, etc.. Our experienced consultants will take you through this process. Maintenance sessions last about an hour to an hour and a half.",
  },
  {
    q: "Can I shower/ swim in it?",
    a: "Yes! One thing we were passionate about was being able to do normal things while wearing our hair. You feel and treat it as if it were your own so you don't have to feel embarrassed when out with family or friends on a vacation retreat. If however, you're very active and sweat often we may suggest a re-groom on a more regular basis.",
  },
  {
    q: "How long do they last?",
    a: "Depending on options you choose and the care you provide and the lifestyle you live every system has an average lifespan of 6 months to 1 year before a replacement is needed. Depending on how well they are cared for some clients have made them last even longer than 1 year.",
  },
  {
    q: "Can I use styling products?",
    a: "Yes you can! We advise using lightweight water based products gels and hairsprays to hold shape. You treat this as your normal hair and most people go for a look they preferred when they had hair before and style the same way. Avoid heavy duty waxes and always ensure if using any products that you wash/wet the hair before trying to comb it out. We have carefully selected products we recommend and offer them here on this site for you to source easily and you know it will be best suited for our ManHair.",
  },
  {
    q: "Maintenance sessions (Re-grooms)",
    a: "We advise on average that you come into our salon for a maintenance session to clean and replace the adhesive every 4-6 weeks. Of course, this can sometimes vary depending on how active your lifestyle is. The more active the more frequently a maintenance session is advised. A maintenance session typically lasts about an hour to an hour and a half and we do not recommend doing it at home; our stylists are professionally trained to help your system look it's best and ensure the longevity of it!",
  },
  {
    q: "Can I do the re-groom myself?",
    a: "Yes! We strongly encourage every client to learn how to complete the maintenance themselves in the comfort of their own home. Avoid those high costs from going to a professional salon. Each maintenance session will take between 30-45 minutes.",
  },
  {
    q: "Will it ever fall off?",
    a: "No! As long as you come in for your regular maintenance sessions every 4-6 weeks, the hair will be securely fixed and won't come off without using the solvent release spray. You work out, shower, swim, play sports, live a NORMAL lifestyle in our hair. We want you to live your life and not worry about your hair. As previously mentioned if you're extremely active you may need to complete maintenance sessions more frequently to ensure a secure fixing. Edges may begin to lift slightly as an indication a maintenance session is due.",
  },
  {
    q: "Will it damage my natural hair?",
    a: "No, all our adhesives are medically treated and skin safe and produced from the highest qualify certified hair labs, allowing your scalp to breath and not affect natural hair growth or increase the rate of hair loss for the hair you do have.",
  },
  {
    q: "How do I clean it?",
    a: "You can shower as normal, you do not need any special shampoos or conditioning treatments though we do offer our products that work best and will increase the life of your ManHair. We suggest if you source your own product that it be made for color treated hair and also sulfate free. We do advise that you do not scrub the hair. As there is no natural oil reaching the hair from your follicles it does not get greasy. Scrubbing causes the hair to dry out quicker and can cause matting. Combing through conditioner on a semi-regular basis is advised to keep the hair fresh with occasional shampooing. We also advise using a leave in conditioning spray to supply moisture throughout the lifespan of the hair.",
  },
  {
    q: 'STOCK Hair only VS MANHAIR "CUSTOM ORDER"',
    a: "When placing your first order you have two options, STOCK hair only and our CUSTOM ORDER. The only difference is how we create the size, shape of the base and hairline. All other options including color, density, texture, wave% are still fully customizable for both. Our 'hair only' works on our standard shape/contour but using your measurements. All CUSTOM ORDERS will have their hair designed from a template. The temporary template can be created yourself during design consultation and shipped to us. The CUSTOM ORDER includes in dept consultation to ensure you get the best fit and look you want and also the emotional support to walk you through this process for the first time. All future replacement orders for perfect fit will be at the reduced cost of hair only.",
  },
  {
    q: "Do you offer discounts?",
    a: "Yes! We understand this is an investment in yourself, your confidence and your future. Many new wearers are unsure where or how to start and that is where we come in. Instead of investing $3,000 to $4,000 initially at a professional salon, you will get our expert services and support at our Orange, CA studio for a lot less. We can discuss progress payments for you if you are on a budget. We can also offer larger discounts if you buy more than 1 system at a time. We also offer a $100.00 referral bonus for you and your friend whenever you refer someone to our store. Unfortunately we DO NOT offer install services for systems that come from outside of ManHair Hair Loss Solutions. We will only provide maintenance services for those systems but will not cut or alter them. We know that this can be disappointing but we are only able to guarantee our standards of quality by using our own product.",
  },
];

const CTA_TICKER = [
  "World Class Customer Service",
  "Text, Call, Email",
  "Hair Specialists On Hand",
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
      { name: "FAQ" },
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

  // FAQPage schema — per spec Section 7.2, this schema type belongs
  // ONLY on the /faq/ page. Do not copy it to city, service, or
  // condition pages (Google flags that as spammy schema).
  const faqSchema = buildFAQSchema({
    origin: SITE.origin,
    path: PAGE.path,
    items: FAQS.map((f) => ({ question: f.q, answer: f.a })),
  });

  return (
    <CMSRoute path={"/faq/"}>
    <div className="mh-light">
      <JsonLd data={[graph, faqSchema]} />

      {/* ============================================================
       * HERO — EyebrowTag + DisplayHeading (real page heading)
       * ============================================================ */}
      <section className="relative isolate overflow-hidden border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-16 pt-16 md:pb-24 md:pt-40">
        <AuroraBlobs className="opacity-30" />
        <div className="mh-container relative z-10">
          <Reveal>
            <div className="mx-auto max-w-4xl text-center">
              <p className="mh-kicker justify-center">FAQ</p>
              <Display as={1} size="hero" className="mt-5">
                Frequently asked <Italic>questions.</Italic>
              </Display>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
                We are always here to answer your questions. We offer world class
                customer service to answer any questions you may have in your hair
                replacement journey. You can reach out to us via Facebook messenger,
                Text, Call, Email, etc. we always have hair specialists to support
                you.
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
       * ACCORDION — real Q&A, exact copy
       * ============================================================ */}
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] py-12 md:py-28">
        <div className="mh-container">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <div className="mh-accordion">
                {FAQS.map((f, i) => (
                  <details key={f.q} open={i === 0}>
                    <summary>
                      <span>
                        <span className="mr-3 font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--mh-copper-400)]">
                          Q{String(i + 1).padStart(2, "0")}
                        </span>
                        {f.q}
                      </span>
                    </summary>
                    <p>{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Reveal>
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
          <p className="mh-kicker justify-center">Still have questions?</p>
          <Display as={2} size="lg" className="mt-4">
            Talk to a hair <Italic>specialist.</Italic>
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
