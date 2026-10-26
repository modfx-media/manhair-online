"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./Wordmark";

/**
 * The header mark is the homepage LCP element. Preload it only there so
 * blog and post covers stay the high-priority image on those URLs.
 * `usePathname` is available during SSR, so the preload is in the first HTML.
 */
export function HeaderLogo() {
  const pathname = usePathname();
  const prioritize = pathname === "/";

  return (
    <Link
      href="/"
      className="mh-logo-link inline-flex shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mh-copper-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--mh-bg)]"
      aria-label="ManHair home"
    >
      <Wordmark size="md" priority={prioritize} eager={!prioritize} />
    </Link>
  );
}
