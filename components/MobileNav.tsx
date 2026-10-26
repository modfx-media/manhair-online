"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { CONTACT, HEADER_CTA, PRIMARY_NAV, SOCIAL, type NavItem } from "@/lib/site";
import { BookingButton } from "@/components/BookingButton";
import { Wordmark } from "./Wordmark";
import { Button } from "@/components/ui";
import { MailIcon, PhoneIcon, SocialIcon } from "./icons";

/**
 * MobileNav — the hamburger button + slide-in off-canvas panel.
 *
 * - Slides in from the right on top of a dimmed backdrop.
 * - Locks body scroll while open.
 * - Closes on Escape, backdrop click, or route change.
 * - Nested groups use native <details> for a JS-lean disclosure with
 *   a rotating chevron indicator.
 * - Panel is split into 3 vertical regions: brand row, scrolling nav,
 *   pinned footer (contact cards + Book a Private Consultation CTA + socials).
 *
 * Desktop breakpoint (lg) hides the hamburger and hides the panel
 * entirely, so this component is a no-op above 1024px.
 */
const DRAWER_SOCIAL = SOCIAL.filter((s) => s.visibleInFooter).slice(0, 4);

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal target only exists after mount (client only).
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when the panel is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const close = () => setOpen(false);

  /**
   * The drawer + backdrop are portaled to `document.body` so they
   * escape the sticky/backdrop-filter header's containing block
   * (position: fixed is otherwise contained by an ancestor with
   * a `backdrop-filter`). Without the portal the drawer would only
   * span the header's width.
   */
  const overlay = (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={close}
        className={cn(
          "fixed inset-0 z-40 bg-[color:var(--mh-ink-950)]/55 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Slide-in panel */}
      <aside
        id="mh-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Primary navigation"
        className={cn(
          "mh-mnav fixed inset-y-0 right-0 z-50 flex w-[92vw] max-w-[24rem] flex-col bg-[color:var(--mh-bg)] shadow-[0_30px_80px_-20px_rgba(26,19,14,0.35)] transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        inert={!open}
      >
        {/* Top hairline gold accent */}
        <span aria-hidden="true" className="mh-mnav-accent" />

        {/* Brand row */}
        <div className="flex items-center justify-between px-6 pb-5 pt-6">
          <Link
            href="/"
            onClick={close}
            aria-label="ManHair home"
            className="inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mh-copper-500)]"
          >
            <Wordmark size="sm" />
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--mh-border-strong)] text-[color:var(--mh-ink-800)] transition-colors hover:border-[color:var(--mh-copper-500)] hover:text-[color:var(--mh-copper-700)]"
          >
            <CloseIcon />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        {/* Eyebrow */}
        <div className="mh-mnav-eyebrow">
          <span aria-hidden="true" className="mh-mnav-eyebrow-line" />
          Menu
        </div>

        {/* Nav */}
        <nav
          aria-label="Mobile primary"
          className="mh-mnav-scroll flex-1 overflow-y-auto px-4 pb-6 pt-2"
        >
          <ul className="flex flex-col gap-0.5">
            {PRIMARY_NAV.map((item, i) => (
              <MobileItem
                key={item.label}
                item={item}
                onNavigate={close}
                index={i}
              />
            ))}
          </ul>
        </nav>

        {/* Footer — contact + CTA + socials */}
        <div className="mh-mnav-foot border-t border-[color:var(--mh-border)] px-5 pb-6 pt-5">
          <p className="mh-mnav-foot-eyebrow">
            <span aria-hidden="true" className="mh-mnav-eyebrow-line" />
            Reach us
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <a
              href={CONTACT.studio.phoneHref}
              className="mh-mnav-contact"
              onClick={close}
            >
              <span className="mh-mnav-contact-icon">
                <PhoneIcon size={14} />
              </span>
              <span className="mh-mnav-contact-body">
                <span className="mh-mnav-contact-label">Orange County, CA</span>
                <span className="mh-mnav-contact-value">{CONTACT.studio.phone}</span>
              </span>
            </a>
          </div>

          <BookingButton onClick={close} block className="mt-4">
            {HEADER_CTA.label}
          </BookingButton>

          <div className="mt-5 flex items-center justify-between gap-3">
            <a
              href={CONTACT.emailHref}
              onClick={close}
              className="mh-mnav-mail inline-flex items-center gap-1.5"
            >
              <MailIcon size={12} />
              {CONTACT.email}
            </a>
            <div className="flex items-center gap-1.5">
              {DRAWER_SOCIAL.map((s) => {
                const Icon = SocialIcon[s.platform];
                return (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="mh-mnav-social"
                  >
                    <Icon size={13} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mh-mobile-nav"
        onClick={() => setOpen((v) => !v)}
        className="mh-mnav-toggle inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--mh-border-strong)] text-[color:var(--mh-fg)] transition-colors hover:border-[color:var(--mh-copper-500)] hover:text-[color:var(--mh-copper-700)] lg:hidden"
      >
        <HamburgerIcon open={open} />
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>
      {mounted ? createPortal(overlay, document.body) : null}
    </>
  );
}

function MobileItem({
  item,
  onNavigate,
  depth = 0,
  index = 0,
}: {
  item: NavItem;
  onNavigate: () => void;
  depth?: number;
  index?: number;
}) {
  if (!item.children || item.children.length === 0) {
    return (
      <li
        className="mh-mnav-row"
        style={{ ["--i" as string]: index }}
      >
        <Link
          href={item.href}
          onClick={onNavigate}
          className={cn(
            "mh-mnav-link",
            depth > 0 && "mh-mnav-link--nested"
          )}
        >
          <span className="mh-mnav-link-label">{item.label}</span>
          <ChevronRightIcon />
        </Link>
      </li>
    );
  }
  return (
    <li
      className="mh-mnav-row"
      style={{ ["--i" as string]: index }}
    >
      <details className="mh-mnav-details group">
        <summary className="mh-mnav-summary">
          <span className="mh-mnav-link-label">{item.label}</span>
          <span
            aria-hidden="true"
            className="mh-mnav-chev inline-flex h-6 w-6 items-center justify-center text-[color:var(--mh-ink-600)] transition-transform duration-300 group-open:rotate-90"
          >
            <ChevronRightIcon />
          </span>
        </summary>
        <ul className="mh-mnav-sublist">
          {/* Also link to the parent's own href when it's a real page */}
          {item.href && item.href !== "#" ? (
            <li className="mh-mnav-row">
              <Link
                href={item.href}
                onClick={onNavigate}
                className="mh-mnav-sublink"
              >
                <span className="mh-mnav-suboverview">Overview</span>
              </Link>
            </li>
          ) : null}
          {item.children.map((c, i) => (
            <MobileItem
              key={c.label}
              item={c}
              onNavigate={onNavigate}
              depth={depth + 1}
              index={i}
            />
          ))}
        </ul>
      </details>
    </li>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="14"
      viewBox="0 0 18 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      className="transition-transform"
      aria-hidden="true"
    >
      <line x1="1" y1={open ? 7 : 2} x2="17" y2={open ? 7 : 2} />
      <line x1="1" y1="7" x2="17" y2="7" opacity={open ? 0 : 1} />
      <line x1="1" y1={open ? 7 : 12} x2="17" y2={open ? 7 : 12} />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="2" y1="2" x2="12" y2="12" />
      <line x1="12" y1="2" x2="2" y2="12" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 1.5 6.5 5 3 8.5" />
    </svg>
  );
}
