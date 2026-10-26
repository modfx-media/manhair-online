import Link from "next/link";
import Image from "next/image";
import { RevealGrid } from "@/components/ui/motion";

/**
 * PostGrid — dark card-grid listing used by /blog/ and the /category/*
 * archives. Each card mirrors the captured post data verbatim:
 * thumbnail, category label (EyebrowTag), title, excerpt.
 *
 * Cards render inside the `.mh-dark` scope supplied by the page.
 */
export type PostCard = {
  href: string;
  category: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  imageAlt: string;
  /** Optional captured publish date, e.g. "July 26, 2023". */
  date?: string;
};

export function PostGrid({ posts }: { posts: PostCard[] }) {
  return (
    <RevealGrid
      className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      gap={0.06}
    >
      {posts.map((p, index) => {
        const lcp = index === 0;
        return (
        <article key={p.href} className={lcp ? "mh-prog-card mh-lcp" : "mh-prog-card"}>
          <Link href={p.href} className="mh-prog-media block" aria-label={p.title}>
            {p.image ? (
              <Image
                src={p.image}
                alt={p.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
                preload={lcp}
                fetchPriority={lcp ? "high" : "auto"}
              />
            ) : null}
          </Link>
          <div className="flex flex-1 flex-col gap-3 p-6">
            <div className="flex items-center gap-3">
              <p className="mh-kicker">{p.category}</p>
              {p.date ? (
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.12em] text-[color:var(--mh-ink-600)]">
                  {p.date}
                </span>
              ) : null}
            </div>
            <h2 className="mh-display text-xl leading-snug text-[color:var(--mh-ink-950)]">
              <Link
                href={p.href}
                className="transition-colors hover:text-[color:var(--mh-copper-300)]"
              >
                {p.title}
              </Link>
            </h2>
            {p.excerpt ? (
              <p className="text-sm leading-relaxed text-[color:var(--mh-ink-800)]">
                {p.excerpt}
              </p>
            ) : null}
            <Link
              href={p.href}
              className="mt-auto inline-flex items-center gap-1 pt-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-300)] transition-colors hover:text-[color:var(--mh-copper-200)]"
            >
              Read More &raquo;
            </Link>
          </div>
        </article>
        );
      })}
    </RevealGrid>
  );
}
