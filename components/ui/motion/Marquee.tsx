import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/cn";

/**
 * Marquee — infinite horizontal scroll strip, pure CSS.
 *
 * Renders `children` twice back-to-back inside `.mh-marquee-track`
 * so the keyframe transform (0 → -50%) loops seamlessly. Pauses
 * when hovered (see globals.css). Respects prefers-reduced-motion.
 *
 * `speed` = pixels per second (approx). Internally converted to a
 * fixed duration for the CSS keyframe. Higher = faster.
 */

type Props = {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
};

export function Marquee({
  children,
  speed = 60,
  reverse = false,
  className,
}: Props) {
  const durationSec = Math.max(6, 1200 / speed);
  const style: CSSProperties & Record<string, string> = {
    ["--mh-marquee-duration"]: `${durationSec}s`,
  };
  return (
    <div className={cn("mh-marquee", className)}>
      <div className={cn("mh-marquee-track", reverse && "reverse")} style={style}>
        <div className="mh-marquee-group">{children}</div>
        <div className="mh-marquee-group" aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}

export function MarqueeItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-4 font-display text-3xl md:text-4xl",
        className
      )}
    >
      {children}
    </span>
  );
}

export function MarqueeDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block h-2 w-2 rotate-45 bg-[color:var(--mh-copper-500)]",
        className
      )}
    />
  );
}
