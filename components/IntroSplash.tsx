"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * IntroSplash — a one-time branded preloader.
 *
 * On the first visit of a browser session the site name + white
 * logo animate in over a dark espresso screen, a thin gold meter
 * fills, then the whole panel wipes up to reveal the homepage.
 * Plays once per session (sessionStorage) so repeat navigations
 * aren't interrupted, and collapses instantly under
 * `prefers-reduced-motion`.
 */
type Phase = "showing" | "leaving" | "done";

export function IntroSplash() {
  const [phase, setPhase] = useState<Phase>("showing");
  const pathname = usePathname();
  const show = pathname === "/";

  useEffect(() => {
    if (!show) return;
    if (typeof window === "undefined") return;

    const seen = window.sessionStorage.getItem("mh-intro-seen");
    if (seen) {
      // Returning visitor this session — skip the splash on the next
      // frame (deferred so we don't setState synchronously in-effect).
      const raf = window.requestAnimationFrame(() => setPhase("done"));
      return () => window.cancelAnimationFrame(raf);
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 350 : 2000;

    const root = document.documentElement;
    root.style.overflow = "hidden";

    const t1 = window.setTimeout(() => setPhase("leaving"), hold);
    const t2 = window.setTimeout(() => {
      setPhase("done");
      window.sessionStorage.setItem("mh-intro-seen", "1");
      root.style.overflow = "";
    }, hold + 850);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      root.style.overflow = "";
    };
  }, [show]);

  if (!show || phase === "done") return null;

  return (
    <div
      className={cn("mh-intro", phase === "leaving" && "is-leaving")}
      role="presentation"
      aria-hidden={phase === "leaving"}
    >
      <div className="mh-intro-inner">
        <Image
          src="/images/logo-png/MH-white-Logo-copy-300x76.png"
          alt="ManHair hair restoration, Orange County, CA"
          width={300}
          height={76}
          loading="lazy"
          fetchPriority="low"
          className="mh-intro-logo"
        />
        <p className="mh-intro-name">Hair Restoration &middot; Orange County, CA</p>
        <span className="mh-intro-bar" aria-hidden="true">
          <span />
        </span>
      </div>
    </div>
  );
}
