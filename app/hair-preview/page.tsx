import type { Metadata } from "next";
import { Display, SectionLabel } from "@/components/ui";
import { BeforeAfterCard } from "@/components/ui/motion";
import { NOINDEX } from "@/lib/seo/meta";
import { HairPreviewStudio } from "@/components/HairPreviewStudio";
import { HOME_TRANSFORMATIONS } from "@/lib/before-after";

// Internal tool, not linked from site navigation or the sitemap.
export const metadata: Metadata = {
  title: "Hair Preview Tool",
  robots: NOINDEX,
};

const STEPS = [
  {
    n: "01",
    title: "Upload your photo",
    body: "A clear, front-facing photo works best — good lighting, hairline visible.",
  },
  {
    n: "02",
    title: "Pick a system",
    body: "Browse real ManHair systems by type: lace front, skin base, toupee, or full coverage.",
  },
  {
    n: "03",
    title: "Generate your preview",
    body: "See a before/after preview in seconds, built from your own photo.",
  },
];

export default function Page() {
  return (
    <div className="mh-light">
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-10 pt-[5.5rem] md:pb-14 md:pt-28">
        <div className="mh-container">
          <SectionLabel>AI hair preview &middot; men&rsquo;s systems only</SectionLabel>
          <Display as={1} size="lg" className="mt-3">
            See your next hair system before you commit
          </Display>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[color:var(--mh-ink-800)]">
            Upload a photo, choose from real ManHair replacement systems, and
            preview how it looks on you &mdash; before booking a consultation.
          </p>
        </div>
      </section>

      <section className="border-b border-[color:var(--mh-border)] py-10 md:py-12">
        <div className="mh-container grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n} className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-[color:var(--mh-copper-600)]">
                {step.n}
              </span>
              <h3 className="text-base font-semibold text-[color:var(--mh-ink-900)]">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-[color:var(--mh-ink-600)]">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="mh-container">
          <HairPreviewStudio />
        </div>
      </section>

      <section className="border-t border-[color:var(--mh-border)] py-14 md:py-20">
        <div className="mh-container">
          <SectionLabel>Real client results</SectionLabel>
          <Display as={2} size="sm" className="mt-2">
            Not a mockup &mdash; real transformations
          </Display>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {HOME_TRANSFORMATIONS.slice(0, 4).map((item) => (
              <BeforeAfterCard key={item.src} src={item.src} alt={item.alt} aspect="square" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

