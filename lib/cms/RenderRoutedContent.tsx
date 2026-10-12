import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { BookingButton } from "@/components/BookingButton";
import { Display, Italic } from "@/components/ui";

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

export function RenderRoutedContent({
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
  const html =
    (typeof doc.bodyHtml === "string" && doc.bodyHtml.trim()) ||
    lexicalToHtml(doc.content);

  return (
    <article className="border-b border-[color:var(--mh-border)] bg-[color:var(--mh-bg)]">
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
