"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight before/after comparison slider. Both images are runtime
 * object/data URLs (not static assets), so this uses plain <img> tags
 * rather than next/image. The interactive control is a single native
 * <input type="range"> stretched over the whole frame and made
 * invisible via CSS (see `.mh-ba-slider` in globals.css) — this keeps
 * drag, click, touch, and keyboard support "for free" without any
 * pointer-event wiring.
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
}: {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [position, setPosition] = useState(50);

  return (
    <div
      className={cn(
        "relative aspect-square w-full select-none overflow-hidden rounded-[var(--mh-radius-sm)] bg-[color:var(--mh-surface)]",
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- runtime object/data URL, not a static asset */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- runtime object/data URL, not a static asset */}
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
        {afterLabel}
      </span>

      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[color:var(--mh-copper-500)] bg-white text-[color:var(--mh-copper-700)] shadow-md"
        style={{ left: `${position}%` }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M8 5l-5 7 5 7M16 5l5 7-5 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={position}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label="Drag to compare before and after"
        className="mh-ba-slider absolute inset-0 h-full w-full cursor-ew-resize appearance-none bg-transparent"
      />
    </div>
  );
}
