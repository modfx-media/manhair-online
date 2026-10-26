import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * ContactChip — bordered dark button with a copper icon.
 *
 * Used for phone / email affordances in the footer and elsewhere.
 * Renders as an `<a>` when `href` is provided (e.g. `tel:` or
 * `mailto:`), otherwise as a non-interactive `<span>`.
 *
 *   <ContactChip icon={<PhoneIcon />} label="Phone" value="(904) 526-8500" href="tel:1-904-526-8500" />
 */

type Props = {
  icon: ReactNode;
  /** Small uppercase label above the value. */
  label: string;
  /** The visible primary value (phone number, email, etc.). */
  value: string;
  /** `tel:`, `mailto:`, or a page path. Omit for a display-only chip. */
  href?: string;
  className?: string;
  ariaLabel?: string;
};

export function ContactChip({
  icon,
  label,
  value,
  href,
  className,
  ariaLabel,
}: Props) {
  const base = cn(
    "group inline-flex items-center gap-3 border border-[color:var(--mh-border-strong)] bg-[color:var(--mh-ink-900)] px-4 py-3 rounded-[var(--mh-radius-sm)] transition-colors",
    href
      ? "hover:border-[color:var(--mh-copper-500)] focus-visible:border-[color:var(--mh-copper-500)] focus-visible:outline-none"
      : undefined,
    className
  );

  const inner = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-[color:var(--mh-copper-800)] bg-[color:var(--mh-ink-950)] text-[color:var(--mh-copper-500)] transition-colors",
          href && "group-hover:border-[color:var(--mh-copper-500)] group-hover:text-[color:var(--mh-copper-300)]"
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--mh-ink-400)]">
          {label}
        </span>
        <span className="text-sm font-medium text-[color:var(--mh-ink-100)] group-hover:text-[color:var(--mh-copper-300)]">
          {value}
        </span>
      </span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={base} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  return (
    <span className={base} aria-label={ariaLabel}>
      {inner}
    </span>
  );
}
