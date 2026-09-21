import type { Metadata } from "next";
import { Display, SectionLabel } from "@/components/ui";
import { NOINDEX } from "@/lib/seo/meta";
import { HairPreviewStudio } from "@/components/HairPreviewStudio";

// Internal tool, not linked from site navigation or the sitemap.
export const metadata: Metadata = {
  title: "Hair Preview Tool",
  robots: NOINDEX,
};

export default function Page() {
  return (
    <div className="mh-light">
      <section className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)] pb-10 pt-[5.5rem] md:pb-14 md:pt-28">
        <div className="mh-container">
          <SectionLabel>Internal tool</SectionLabel>
          <Display as={1} size="lg" className="mt-3">
            Hair system preview
          </Display>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-[color:var(--mh-ink-800)]">
            Upload a front-facing photo and pick a style to see how it maps
            onto a client. Preview generation isn&rsquo;t connected yet.
          </p>
        </div>
      </section>

      <section className="pb-16 pt-10 md:pb-24 md:pt-14">
        <div className="mh-container">
          <HairPreviewStudio />
        </div>
      </section>
    </div>
  );
}
