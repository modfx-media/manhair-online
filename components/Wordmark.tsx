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
 * The file is 2170px wide, but the mark renders around 100–170px.
 * Without `sizes`, next/image preloads the 3840px candidate and that
 * download competes with the page's LCP image.
 */
const SIZES: Record<Size, string> = {
  sm: "96px",
  md: "(min-width: 768px) 120px, 108px",
  lg: "(min-width: 768px) 168px, 144px",
};

export function Wordmark({
  size = "md",
  tone: _tone = "dark",
  className,
  priority = false,
}: {
  size?: Size;
  tone?: Tone;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="ManHair: Hair Restoration Orange County, CA"
      width={2170}
      height={725}
      sizes={SIZES[size]}
      priority={priority}
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
