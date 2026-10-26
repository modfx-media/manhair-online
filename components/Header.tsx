import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import { CONTACT, HEADER_CTA, PRIMARY_NAV, SOCIAL, type NavItem } from "@/lib/site";
import { getService } from "@/lib/seo/services";
import { BookingButton } from "@/components/BookingButton";
import { Wordmark } from "./Wordmark";
import { MobileNav } from "./MobileNav";
import { Button } from "@/components/ui";
import {
  ActivityIcon,
  ArrowRightIcon,
  ArticleIcon,
  BuildingIcon,
  ClockIcon,
  CompassIcon,
  CreditCardIcon,
  DropletIcon,
  EyeOffIcon,
  HairStrandIcon,
  HelpCircleIcon,
  MapPinIcon,
  PhoneIcon,
  ScissorsIcon,
  SocialIcon,
  SparklesIcon,
  StarIcon,
} from "./icons";

/**
 * Global site header.
 *
 * Layout:
 *   Top utility bar (desktop only) — free-consultation note, both
 *   studio phone numbers, social icons.
 *   Main row — [Wordmark]   [Primary nav, centered]   [Phone] [Book a Private Consultation] [Menu]
 *
 * - Sticky, light/cream background with a subtle backdrop blur + hairline shadow.
 * - Copper "Book a Private Consultation" pill CTA on the far right.
 * - Primary nav hrefs match the live site exactly:
 *     Home, About (▾), How It Works (▾), Before & After, Locations
 *   Dropdowns are open-on-hover / open-on-focus using CSS only, so
 *   the header itself stays a server component. Mobile nav is
 *   handled by the `<MobileNav />` client component (hamburger +
 *   slide-in panel).
 */
const TOPBAR_SOCIAL = SOCIAL.filter((s) => s.visibleInFooter).slice(0, 3);

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-[color:var(--mh-bg)]/90 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--mh-bg)]/80 shadow-[0_1px_0_rgba(26,19,14,0.05)]">
      {/* Utility bar */}
      <div className="mh-topbar hidden lg:block">
        <div className="mh-container flex h-9 items-center justify-between gap-6">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--mh-ink-700)]">
            Free Virtual Consultation &middot; Orange, CA Studio
          </p>
          <div className="flex items-center gap-5">
            <a href={CONTACT.studio.phoneHref} className="mh-topbar-link">
              <PhoneIcon size={12} />
              {CONTACT.studio.label}: {CONTACT.studio.phone}
            </a>
            <span aria-hidden="true" className="h-3 w-px bg-[color:var(--mh-border-strong)]" />
            <div className="flex items-center gap-1.5">
              {TOPBAR_SOCIAL.map((s) => {
                const Icon = SocialIcon[s.platform];
                return (
                  <a
                    key={s.platform}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="mh-icon-btn"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main row — wider than `.mh-container` so logo + nav + CTA
      stay on one line (page content stays at 1200px). */}
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between gap-3 px-5 md:h-20 md:gap-4 md:px-8 lg:gap-5">
        <Link
          href="/"
          className="mh-logo-link inline-flex shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mh-copper-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--mh-bg)]"
          aria-label="ManHair home"
        >
          <Wordmark size="md" priority />
        </Link>

        {/* Desktop primary nav */}
        <nav aria-label="Primary" className="hidden min-w-0 lg:flex lg:flex-1 lg:justify-center">
          <ul className="flex flex-nowrap items-center gap-4 xl:gap-6">
            {PRIMARY_NAV.map((item) => (
              <DesktopItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        {/* Right-side actions. On mobile/tablet only the phone icon +
        hamburger show — the "Book a Private Consultation" pill would crowd the
        row at those widths and duplicates the drawer's own CTA. */}
        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <a
            href={CONTACT.studio.phoneHref}
            className="mh-icon-btn !h-10 !w-10 border !border-[color:var(--mh-border-strong)]"
            aria-label={`Call ${CONTACT.studio.phone}`}
          >
            <PhoneIcon size={16} />
          </a>
          {/* CTA pill hidden on mobile/tablet — the drawer carries
          its own Book a Private Consultation button. Wrapped in a span with
          `hidden lg:contents` so the utility overrides `.mh-btn`'s
          default `display: inline-flex`. */}
          <span className="hidden lg:contents">
            <BookingButton size="sm" className="!px-3.5 !tracking-[0.08em]">
              {HEADER_CTA.label}
            </BookingButton>
          </span>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

/**
 * A top-level desktop nav item. If it has children, wraps its link
 * in a hover/focus group that reveals an absolutely-positioned
 * dropdown menu. Nested dropdowns (up to depth 2) render to the
 * side using the same pattern.
 *
 * If a top-level label has an entry in `MEGA_MENU`, the panel
 * renders as a rich multi-column mega menu with icons, subtitles,
 * and a featured promo tile (see `MegaPanel`). Otherwise it falls
 * back to the compact vertical list dropdown.
 *
 * The dropdown container uses `pt-3` (not `mt-3`) so the trigger
 * and menu form ONE continuous hover target — the top gap becomes
 * an invisible "bridge" that prevents the group from losing hover
 * as the pointer travels down. Same trick with `pl-2` for the
 * nested side dropdown. Combined with the CSS `visibility` toggle
 * (see `.mh-navdrop` in globals.css) this eliminates flicker.
 */
function DesktopItem({ item }: { item: NavItem }) {
  const hasChildren = !!item.children?.length;
  const mega = MEGA_MENU[item.label];
  return (
    <li className="relative shrink-0 group/top">
      <NavAnchor href={item.href} hasChildren={hasChildren} variant="top">
        {item.label}
        {hasChildren ? <Caret /> : null}
      </NavAnchor>
      {hasChildren && mega ? (
        <div className="mh-mega-wrap absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3">
          <MegaPanel config={mega} />
        </div>
      ) : hasChildren ? (
        <div className="mh-navdrop-wrap absolute left-1/2 top-full z-40 -translate-x-1/2 pt-3">
          <div className="mh-navdrop w-64 border border-[color:var(--mh-border)] p-2">
            <ul>
              {item.children!.map((c, i) => (
                <SubItem key={c.label} item={c} index={i} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function SubItem({ item, index = 0 }: { item: NavItem; index?: number }) {
  const hasChildren = !!item.children?.length;
  return (
    <li
      className="relative group/sub mh-navdrop-item"
      style={{ ["--i" as string]: index }}
    >
      <NavAnchor href={item.href} hasChildren={hasChildren} variant="sub">
        <span>{item.label}</span>
        {hasChildren ? (
          <span aria-hidden="true" className="mh-navdrop-chev">
            ›
          </span>
        ) : null}
      </NavAnchor>
      {hasChildren ? (
        <div className="mh-navdrop-side-wrap absolute left-full top-0 z-40 pl-2">
          <div className="mh-navdrop-side w-56 border border-[color:var(--mh-border)] p-2">
            <ul>
              {item.children!.map((cc, i) => (
                <SubItem key={cc.label} item={cc} index={i} />
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function NavAnchor({
  href,
  children,
  hasChildren,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  hasChildren: boolean;
  variant: "top" | "sub";
}) {
  const isFakeParent = href === "#";
  // Non-navigable dropdown parents (href="#") render as a role="button"
  // span so screen readers don't announce a bogus destination.
  if (isFakeParent) {
    return (
      <span
        role="button"
        tabIndex={0}
        aria-haspopup={hasChildren ? "menu" : undefined}
        className={
          variant === "top"
            ? "mh-nav-link cursor-default text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--mh-fg)]"
            : "mh-navdrop-link flex cursor-default items-center justify-between gap-2 rounded-[var(--mh-radius-sm)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--mh-ink-700)]"
        }
      >
        {children}
      </span>
    );
  }
  if (variant === "sub") {
    return (
      <Link
        href={href}
        className="mh-navdrop-link flex items-center justify-between gap-2 rounded-[var(--mh-radius-sm)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--mh-ink-800)]"
      >
        {children}
      </Link>
    );
  }
  return (
    <Link
      href={href}
      className="mh-nav-link text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[color:var(--mh-fg)] transition-colors hover:text-[color:var(--mh-copper-700)] focus:outline-none focus-visible:text-[color:var(--mh-copper-700)]"
      aria-haspopup={hasChildren ? "menu" : undefined}
    >
      {children}
    </Link>
  );
}

function Caret() {
  return (
    <svg
      width="8"
      height="6"
      viewBox="0 0 8 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mh-nav-caret opacity-70"
      aria-hidden="true"
    >
      <polyline points="1 1.5 4 4.5 7 1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------
 * Mega menu — rich multi-column dropdown for top-level nav items
 * with substantial children. Each column has an eyebrow heading and
 * icon+title+description rows. A "Featured" tile on the right
 * highlights a marquee page with a soft gold-wash gradient.
 * ------------------------------------------------------------------ */

type MegaLink = {
  label: string;
  href: string;
  desc: string;
  Icon: ComponentType<{ size?: number; className?: string }>;
};

type MegaColumn = {
  eyebrow: string;
  items: MegaLink[];
};

type MegaFeatured = {
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  Icon: ComponentType<{ size?: number; className?: string }>;
};

type MegaConfig = {
  columns: MegaColumn[];
  featured: MegaFeatured;
};

const MEGA_MENU: Record<string, MegaConfig> = {
  Services: {
    columns: [
      {
        eyebrow: "Hair Systems",
        items: [
          {
            label: "Men's Hair Systems",
            href: "/services/mens-hair-systems/",
            desc: "The everyday, wear-it-daily solution.",
            Icon: HairStrandIcon,
          },
          {
            label: "Men's Toupees",
            href: "/services/mens-toupees/",
            desc: "The classic, discreet hairpiece term.",
            Icon: EyeOffIcon,
          },
          {
            label: "Men's Hairpieces",
            href: "/services/mens-hairpieces/",
            desc: "Custom pieces built to your pattern.",
            Icon: ScissorsIcon,
          },
          {
            label: "Men's Hair Units",
            href: "/services/mens-hair-units/",
            desc: "Full-coverage units for total loss.",
            Icon: ActivityIcon,
          },
        ],
      },
      {
        eyebrow: "More Options",
        items: [
          {
            label: "Men's Wigs",
            href: "/services/mens-wigs/",
            desc: "Ready-to-wear and custom options.",
            Icon: SparklesIcon,
          },
          {
            label: "Non-Surgical Hair Replacement",
            href: "/services/non-surgical-hair-replacement/",
            desc: "No surgery, no downtime, real results.",
            Icon: DropletIcon,
          },
          {
            label: "Hair System Maintenance",
            href: "/services/hair-system-maintenance/",
            desc: "Cleaning, re-bonding, and upkeep visits.",
            Icon: ClockIcon,
          },
          {
            label: "All Services Overview",
            href: "/mens-hair-replacement-systems/",
            desc: "Not sure which term fits? Start here.",
            Icon: CompassIcon,
          },
        ],
      },
    ],
    featured: {
      eyebrow: "Real results",
      title: "See what clients say.",
      body: "Verified reviews from real ManHair clients on Google & Yelp.",
      cta: { label: "Read Reviews", href: "/reviews/" },
      Icon: StarIcon,
    },
  },
  About: {
    columns: [
      {
        eyebrow: "Company",
        items: [
          {
            label: "Cherry Financing",
            href: "/payment-plans/",
            desc: "Treat now, pay later with Cherry.",
            Icon: CreditCardIcon,
          },
          {
            label: "Franchise",
            href: "/partner-program/",
            desc: "Partner with ManHair: become an owner.",
            Icon: BuildingIcon,
          },
          {
            label: "FAQ",
            href: "/faq/",
            desc: "The most-asked hair-system questions.",
            Icon: HelpCircleIcon,
          },
          {
            label: "Blog",
            href: "/blog/",
            desc: "The ManHair journal: stories & guides.",
            Icon: ArticleIcon,
          },
          {
            label: "Reviews",
            href: "/reviews/",
            desc: "See what real clients say, on Google & Yelp.",
            Icon: StarIcon,
          },
        ],
      },
      {
        eyebrow: "Studio",
        items: [
          {
            label: "Orange County, CA",
            href: "/orange-county-ca/",
            desc: "By-appointment studio serving Orange County.",
            Icon: MapPinIcon,
          },
          {
            label: "All Locations",
            href: "/locations/",
            desc: "Hours, map, and phone.",
            Icon: CompassIcon,
          },
        ],
      },
    ],
    featured: {
      eyebrow: "Flexible payment",
      title: "Pay over time, not upfront.",
      body: "Cherry financing: easy monthly payments, no hard credit check.",
      cta: { label: "Cherry Financing", href: "/payment-plans/" },
      Icon: CreditCardIcon,
    },
  },
  "How It Works": {
    columns: [
      {
        eyebrow: "Solutions",
        items: [
          {
            label: "Receding Hairline Restoration",
            href: "/receding-hairline-restoration/",
            desc: "Rebuild the frontal zone and hairline.",
            Icon: HairStrandIcon,
          },
          {
            label: "Alopecia Hair Loss",
            href: "/alopecia-hair-loss/",
            desc: "A non-surgical answer to alopecia.",
            Icon: DropletIcon,
          },
          {
            label: "Male Pattern Baldness",
            href: "/hair-loss/male-pattern-baldness/",
            desc: "The most common form of hair loss.",
            Icon: ActivityIcon,
          },
          {
            label: "Thinning Hair",
            href: "/hair-loss/thinning-hair/",
            desc: "Early-stage density and coverage loss.",
            Icon: DropletIcon,
          },
          {
            label: "Men\u2019s Hair Styles",
            href: "/mens-hair-styles/",
            desc: "Cuts, textures, and styles built for you.",
            Icon: ScissorsIcon,
          },
        ],
      },
    ],
    featured: {
      eyebrow: "See it for yourself",
      title: "Before & After: real transformations.",
      body: "Seven case studies from actual ManHair clients.",
      cta: { label: "View the Gallery", href: "/results/" },
      Icon: CompassIcon,
    },
  },
};

function serviceThumb(href: string): string | undefined {
  if (href === "/mens-hair-replacement-systems/") {
    return getService("mens-hair-replacement-systems")?.image;
  }
  const match = href.match(/^\/services\/([^/]+)\//);
  return match ? getService(match[1])?.image : undefined;
}

function MegaPanel({ config }: { config: MegaConfig }) {
  const { columns, featured } = config;
  const FeaturedIcon = featured.Icon;
  return (
    <div className="mh-mega border border-[color:var(--mh-border)]" role="menu">
      <div className="mh-mega-inner">
        {columns.map((col) => (
          <div key={col.eyebrow} className="mh-mega-col">
            <p className="mh-mega-eyebrow">{col.eyebrow}</p>
            <ul>
              {col.items.map((it, i) => {
                const Icon = it.Icon;
                const thumb = serviceThumb(it.href);
                return (
                  <li
                    key={it.label}
                    className="mh-mega-item"
                    style={{ ["--i" as string]: i }}
                  >
                    <Link href={it.href} className="mh-mega-link" role="menuitem">
                      {thumb ? (
                        <span className="mh-mega-thumb" aria-hidden="true">
                          <Image
                            src={thumb}
                            alt={it.label}
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        </span>
                      ) : (
                        <span className="mh-mega-icon" aria-hidden="true">
                          <Icon size={18} />
                        </span>
                      )}
                      <span className="mh-mega-body">
                        <span className="mh-mega-title">{it.label}</span>
                        <span className="mh-mega-desc">{it.desc}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div
          className="mh-mega-featured"
          style={{ ["--i" as string]: columns.reduce((n, c) => n + c.items.length, 0) }}
        >
          <span aria-hidden="true" className="mh-mega-featured-glow" />
          <p className="mh-mega-eyebrow mh-mega-featured-eyebrow">{featured.eyebrow}</p>
          <span className="mh-mega-featured-icon" aria-hidden="true">
            <FeaturedIcon size={22} />
          </span>
          <p className="mh-mega-featured-title">{featured.title}</p>
          <p className="mh-mega-featured-body">{featured.body}</p>
          <Link href={featured.cta.href} className="mh-mega-featured-cta">
            {featured.cta.label}
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
