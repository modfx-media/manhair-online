import Image from "next/image";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { BookingButton } from "@/components/BookingButton";
import { Display, Italic } from "@/components/ui";
import { getCoverMap } from "@/lib/cms/blog-posts";
import { repairLegacyInlineImages } from "@/lib/legacy-inline-images";
import { postCoverAlt, postCoverSrc } from "@/lib/post-cover";

function lexicalToHtml(content: unknown): string {
  if (!content || typeof content !== "object") return "";
  try {
    return convertLexicalToHTML({ data: content as never });
  } catch {
    return "";
  }
}

export function hasRenderableCMSContent(doc: Record<string, unknown>): boolean {
  const html = typeof doc.bodyHtml === "string" ? doc.bodyHtml.trim() : "";
  if (html) return true;
  return Boolean(lexicalToHtml(doc.content).trim());
}

export async function RenderRoutedContent({
  doc,
  collection,
}: {
  doc: Record<string, unknown>;
  collection: "pages" | "posts";
}) {
  const title =
    (typeof doc.heading === "string" && doc.heading) ||
    (typeof doc.title === "string" && doc.title) ||
    "ManHair";
  const excerpt = typeof doc.excerpt === "string" ? doc.excerpt : "";
  const html = repairLegacyInlineImages(
    (typeof doc.bodyHtml === "string" && doc.bodyHtml.trim()) ||
      lexicalToHtml(doc.content),
  );
  const slug =
    (typeof doc.slug === "string" && doc.slug.trim()) ||
    (typeof doc.path === "string" ? doc.path.replace(/^\/+|\/+$/g, "") : "");
  const cmsCover = typeof doc.coverImage === "string" ? doc.coverImage : null;
  const covers = collection === "posts" && slug ? await getCoverMap() : null;
  const coverSrc =
    collection === "posts" && slug
      ? (covers?.get(slug) ?? postCoverSrc(slug, cmsCover))
      : null;

  return (
    <article className="mh-light border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
      <div className="mh-container py-20 md:py-28">
        <p className="mh-eyebrow">{collection === "posts" ? "Journal" : "ManHair"}</p>
        <Display as={1} size="hero" className="mt-6 max-w-4xl">
          {title}
        </Display>
        <span className="mh-rule mt-8" aria-hidden="true" />
        {excerpt ? (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            {excerpt}
          </p>
        ) : null}
        {coverSrc ? (
          <figure className="mt-8 max-w-3xl overflow-hidden rounded-[var(--mh-radius-md)] bg-[color:var(--mh-ink-50)] p-1.5 ring-1 ring-[color:var(--mh-border)]">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[calc(var(--mh-radius-md)-4px)]">
              <Image
                src={coverSrc}
                alt={postCoverAlt(slug, title)}
                fill
                preload
                fetchPriority="high"
                quality={60}
                sizes="(max-width: 768px) 100vw, 40rem"
                className="object-cover"
              />
            </div>
          </figure>
        ) : null}
        {html ? (
          <div
            className="mh-prose mt-12 max-w-3xl"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--mh-ink-800)]">
            <Italic>Content is being prepared in the CMS.</Italic>
          </p>
        )}
        <div className="mt-12">
          <BookingButton size="md">Book a Private Consultation</BookingButton>
        </div>
      </div>
    </article>
  );
}
