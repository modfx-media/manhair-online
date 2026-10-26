"use client";

import { useEffect, useRef, useState } from "react";

const SRC = "/videos/4178139-hd_1920_1080_30fps.mp4";
const POSTER = "/images/homepage-images/unnamed.jpg";

/**
 * Homepage hero video. The file is ~7MB. A static `preload="auto"` (and
 * `autoPlay`, which overrides `preload="none"`) sat on the same connection
 * as the header logo and pushed mobile LCP out past 9s. The poster is in
 * the first HTML at low priority so the frame isn't empty; the video file
 * itself is attached only after `window` load.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const start = () => {
      if (video.getAttribute("data-ready") === "true") return;
      video.setAttribute("data-ready", "true");
      const source = document.createElement("source");
      source.src = SRC;
      source.type = "video/mp4";
      video.appendChild(source);
      video.load();
      video.play().catch(() => {});
    };

    if (document.readyState === "complete") {
      const id = window.setTimeout(start, 0);
      return () => window.clearTimeout(id);
    }
    window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  return (
    <>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        onPlaying={() => setPlaying(true)}
      />
      <img
        src={POSTER}
        alt=""
        width={1920}
        height={1080}
        loading="lazy"
        fetchPriority="low"
        decoding="async"
        hidden={playing}
      />
    </>
  );
}
