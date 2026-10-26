import Image from "next/image";
import { cn } from "@/lib/cn";

/**
 * Wordmark — brand mark used in the header + footer.
 *
 * Renders the official full-color logo (red beard mark + black
 * "MANHAIR" type), pre-cropped to its content bounds. It already
 * reads correctly on the light cream header/footer surfaces, so no
 * color filtering is applied.
 */

const LOGO_SRC = "/images/logo-png/man-logo.png";

type Size = "sm" | "md" | "lg";
type Tone = "dark" | "light";

/** Rendered heights per size; `w-auto` preserves the source aspect ratio. */
const HEIGHT: Record<Size, string> = {
  sm: "h-8",
  md: "h-9 md:h-10",
  lg: "h-12 md:h-14",
};

/**
 * Intrinsic box for the srcset. `sizes` is intentionally omitted: a `sizes`
 * value with no `vw` makes next/image emit every device width, and the `src`
 * fallback becomes the 3840px candidate. Width + 2x stays on the small
 * candidates (the mark renders around 100–170px).
 */
const BOX: Record<Size, { width: number; height: number }> = {
  sm: { width: 96, height: 32 },
  md: { width: 120, height: 40 },
  lg: { width: 168, height: 56 },
};

export function Wordmark({
  size = "md",
  tone: _tone = "dark",
  className,
  priority = false,
  eager = false,
}: {
  size?: Size;
  tone?: Tone;
  className?: string;
  /** Preload. Use only when this mark is the LCP image (the homepage). */
  priority?: boolean;
  /** Header: load with the document, but do not outrank a cover image. */
  eager?: boolean;
}) {
  const box = BOX[size];
  return (
    <Image
      src={LOGO_SRC}
      alt="ManHair: Hair Restoration Orange County, CA"
      width={box.width}
      height={box.height}
      // Next 16 throws if `preload` and `priority` are both set. `preload`
      // is the head hint; `fetchPriority` puts that hint on the high queue.
      preload={priority || undefined}
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? undefined : eager ? "eager" : undefined}
      // `h-auto` is intentionally omitted: it would be generated after the
      // `h-*` size classes in Tailwind's compiled CSS and win the cascade,
      // making the logo render at its full natural (800x235) size.
      className={cn("block w-auto max-w-none select-none", HEIGHT[size], className)}
    />
  );
}

/** Legacy alias — the mark is now always the PNG logo. */
export function PngWordmark({
  size = "md",
  className,
}: {
  size?: Size;
  className?: string;
}) {
  return <Wordmark size={size} tone="light" className={className} />;
}
