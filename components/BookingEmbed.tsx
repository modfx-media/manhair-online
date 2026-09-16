"use client";

import { useEffect, useRef } from "react";

const SRC = "https://link.manhaironline.com/widget/booking/wxn5qBpBWtFY1x2DPxa3";
const FALLBACK_HEIGHT = 760;
/** GHL only paints time slots beside the month grid above ~1024px. */
const DESKTOP_WIDGET_WIDTH = 1100;
const SCALE_FROM = 720;

/**
 * GoHighLevel consultation calendar.
 *
 * The widget hides the time column unless the iframe is desktop-wide.
 * On tablet / smaller laptops we render that desktop layout at 1100px
 * and scale it to the card, so times stay beside the calendar.
 */
export default function BookingEmbed() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const heightRef = useRef(FALLBACK_HEIGHT);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    if (!wrap || !frame) return;

    const unpark = () => {
      frame.style.opacity = "1";
      frame.style.visibility = "visible";
      frame.style.pointerEvents = "auto";
      frame.style.display = "block";
      frame.style.position = "relative";
      frame.style.left = "0";
    };

    const fit = () => {
      const parent = wrap.clientWidth;
      const height = heightRef.current;
      frame.style.height = `${height}px`;
      frame.style.minHeight = `${height}px`;

      if (parent >= SCALE_FROM && parent < DESKTOP_WIDGET_WIDTH) {
        const scale = parent / DESKTOP_WIDGET_WIDTH;
        frame.style.width = `${DESKTOP_WIDGET_WIDTH}px`;
        frame.style.maxWidth = "none";
        frame.style.transform = `scale(${scale})`;
        frame.style.transformOrigin = "top left";
        wrap.style.height = `${height * scale}px`;
      } else {
        frame.style.width = "100%";
        frame.style.maxWidth = "100%";
        frame.style.transform = "";
        wrap.style.height = "";
      }
      unpark();
    };

    const setHeight = (px: number) => {
      heightRef.current = Math.min(1200, Math.max(FALLBACK_HEIGHT, Math.round(px)));
      fit();
    };

    unpark();
    fit();

    const onMessage = (event: MessageEvent) => {
      const height = readWidgetHeight(event.data);
      if (height) setHeight(height);
    };

    const onLoad = () => {
      unpark();
      fit();
    };

    window.addEventListener("message", onMessage);
    window.addEventListener("resize", fit);
    frame.addEventListener("load", onLoad);

    const mo = new MutationObserver(() => {
      const parked =
        frame.style.visibility === "hidden" ||
        frame.style.opacity === "0" ||
        frame.style.left === "-9999px" ||
        frame.style.position === "absolute";
      if (parked) {
        unpark();
        fit();
      }
    });
    mo.observe(frame, { attributes: true, attributeFilter: ["style"] });

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("resize", fit);
      frame.removeEventListener("load", onLoad);
      mo.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className="mh-booking-embed">
      <iframe
        ref={frameRef}
        src={SRC}
        title="Book a ManHair consultation"
        id="wxn5qBpBWtFY1x2DPxa3_1789554396720"
        allow="payment"
        scrolling="no"
        className="mh-booking-iframe"
        style={{
          width: "100%",
          border: "none",
          overflow: "hidden",
          height: FALLBACK_HEIGHT,
        }}
      />
    </div>
  );
}

function readWidgetHeight(data: unknown): number | null {
  if (typeof data === "string" && data.startsWith("[iFrameSizer]")) {
    const parts = data.slice("[iFrameSizer]".length).split(":");
    const height = Number(parts[1]);
    return Number.isFinite(height) && height > 80 ? height : null;
  }
  if (data && typeof data === "object") {
    const rec = data as Record<string, unknown>;
    const height = Number(rec.height ?? rec.iFrameHeight);
    if (Number.isFinite(height) && height > 80) return height;
  }
  return null;
}
