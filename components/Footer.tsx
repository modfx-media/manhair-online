import Link from "next/link";
import { ContactChip } from "@/components/ui";
import { BookingButton } from "@/components/BookingButton";
import { MailIcon, PhoneIcon, SocialIcon } from "@/components/icons";
import { Wordmark } from "./Wordmark";
import {
  CONTACT,
  FOOTER_LEGAL,
  FOOTER_QUICK_LINKS,
  FOOTER_TAGLINE,
  SITE,
  SOCIAL,
} from "@/lib/site";

/**
 * Global site footer.
 *
 * Sections (top → bottom):
 *   1. Brand column: wordmark + verbatim "Hair Loss Solutions." tagline
 *      + follow-us paragraph.
 *   2. Quick Links column (verbatim from live footer menu).
 *   3. Locations column: the Orange County, CA address.
 *   4. Working Hours block.
 *   5. Contact chips row: two phone numbers + email, styled as
 *      bordered dark buttons with copper icons.
 *   6. Social row: every profile URL from the Organization schema
 *      plus the visible live-footer icons (Twitter, TikTok).
 *   7. Bottom bar: copyright + legal links (Privacy, Terms, Refund).
 *   8. Disclaimer strip (verbatim).
 *
 * Every href on this page mirrors a live URL exactly so nothing in
 * the internal-link graph breaks.
 */
export function Footer() {
  const visibleSocial = SOCIAL.filter((s) => s.visibleInFooter);
  const otherSocial = SOCIAL.filter((s) => !s.visibleInFooter);

  return (
    <footer className="border-t border-[color:var(--mh-border)] bg-[color:var(--mh-surface)] text-[color:var(--mh-ink-800)]">
      {/* ================= UPPER GRID ================= */}
      <div className="mh-container grid gap-12 py-16 md:grid-cols-12 md:gap-10 md:py-20">
        {/* Brand column */}
        <div className="md:col-span-4">
          <Wordmark size="md" />
          <p className="mt-6 font-display font-light text-2xl tracking-[-0.02em] text-[color:var(--mh-copper-700)]">
            {FOOTER_TAGLINE.short}
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[color:var(--mh-ink-700)]">
            {FOOTER_TAGLINE.long}
          </p>
          <div className="mt-6">
            <BookingButton size="sm">
              Book a Private Consultation
            </BookingButton>
          </div>
        </div>

        {/* Quick Links */}
        <nav aria-labelledby="footer-quick-links" className="md:col-span-3">
          <p id="footer-quick-links" className="mh-eyebrow">
            Quick Links
          </p>
          <ul className="mt-5 space-y-2.5 text-sm">
            {FOOTER_QUICK_LINKS.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="text-[color:var(--mh-ink-800)] transition-colors hover:text-[color:var(--mh-copper-700)]"
                >
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Locations */}
        <div className="md:col-span-3">
          <p className="mh-eyebrow">Locations</p>
          <ul className="mt-5 space-y-6">
            <li>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-copper-700)]">
                {CONTACT.studio.label}
              </p>
              <address className="mt-2 not-italic text-sm leading-relaxed text-[color:var(--mh-ink-800)]">
                {CONTACT.studio.streetLine1}
                <br />
                {CONTACT.studio.streetLine2}
              </address>
              <a
                href={CONTACT.studio.phoneHref}
                className="mt-2 inline-block text-sm text-[color:var(--mh-ink-700)] transition-colors hover:text-[color:var(--mh-copper-700)]"
              >
                {CONTACT.studio.phone}
              </a>
            </li>
          </ul>
        </div>

        {/* Working Hours */}
        <div className="md:col-span-2">
          <p className="mh-eyebrow">Working Hours</p>
          <p className="mt-5 text-sm leading-relaxed text-[color:var(--mh-fg)]">
            Monday to Friday
          </p>
          <p className="mt-1 font-display text-2xl text-[color:var(--mh-copper-700)]">
            9:00 AM &ndash; 5:00 PM
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.14em] text-[color:var(--mh-ink-600)]">
            NO COST initial consultations
          </p>
        </div>
      </div>

      {/* ================= CONTACT CHIPS ================= */}
      <div className="border-t border-[color:var(--mh-border)]">
        <div className="mh-container flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <p className="mh-eyebrow">Get In Touch</p>
          <div className="flex flex-wrap gap-3">
            <ContactChip
              icon={<PhoneIcon size={18} />}
              label="Orange County"
              value={CONTACT.studio.phone}
              href={CONTACT.studio.phoneHref}
            />
            <ContactChip
              icon={<MailIcon size={18} />}
              label="Email"
              value={CONTACT.email}
              href={CONTACT.emailHref}
            />
          </div>
        </div>
      </div>

      {/* ================= SOCIAL ROW ================= */}
      <div className="border-t border-[color:var(--mh-border)]">
        <div className="mh-container flex flex-col gap-5 py-6 md:flex-row md:items-center md:justify-between">
          <p className="mh-eyebrow">Follow ManHair</p>
          <ul className="flex flex-wrap items-center gap-3">
            {visibleSocial.map((s) => {
              const Icon = SocialIcon[s.platform];
              return (
                <li key={s.href}>
                  <a
                    href={s.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    aria-label={`Follow ManHair on ${s.label}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--mh-border-strong)] text-[color:var(--mh-copper-700)] transition-colors hover:border-[color:var(--mh-copper-500)] hover:text-[color:var(--mh-copper-600)] hover:bg-[color:var(--mh-copper-50)] focus-visible:border-[color:var(--mh-copper-500)] focus-visible:outline-none"
                  >
                    <Icon size={18} />
                  </a>
                </li>
              );
            })}
            {/* Additional profiles from Organization.sameAs — smaller,
                text-labelled links so every URL stays discoverable. */}
            {otherSocial.map((s) => {
              const Icon = SocialIcon[s.platform];
              return (
                <li key={s.href}>
                  <a
                    href={s.href}
                    rel="noopener noreferrer"
                    target="_blank"
                    aria-label={`Follow ManHair on ${s.label}`}
                    className="inline-flex items-center gap-1.5 border border-[color:var(--mh-border-strong)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--mh-ink-700)] transition-colors hover:border-[color:var(--mh-copper-500)] hover:text-[color:var(--mh-copper-700)]"
                  >
                    <Icon size={14} />
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ================= BOTTOM BAR ================= */}
      <div className="border-t border-[color:var(--mh-border)]">
        <div className="mh-container flex flex-col gap-4 py-6 text-xs text-[color:var(--mh-ink-700)] md:flex-row md:items-center md:justify-between">
          <p>
            {FOOTER_LEGAL.copyright} &middot;{" "}
            <span className="text-[color:var(--mh-ink-600)]">
              {FOOTER_LEGAL.poweredBy}
            </span>
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[0.7rem] uppercase tracking-[0.14em]">
            <li>
              <Link
                href="/privacy-policy/"
                className="text-[color:var(--mh-ink-700)] hover:text-[color:var(--mh-copper-700)]"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms-of-service/"
                className="text-[color:var(--mh-ink-700)] hover:text-[color:var(--mh-copper-700)]"
              >
                Terms of Service
              </Link>
            </li>
            <li>
              <Link
                href="/refund-policy/"
                className="text-[color:var(--mh-ink-700)] hover:text-[color:var(--mh-copper-700)]"
              >
                Refund Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ================= DISCLAIMER ================= */}
      <div className="border-t border-[color:var(--mh-border)]">
        <div className="mh-container py-4">
          <p className="text-[11px] leading-relaxed text-[color:var(--mh-ink-600)]">
            {FOOTER_LEGAL.disclaimer}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--mh-ink-500)]">
            {SITE.orgName}
          </p>
        </div>
      </div>
    </footer>
  );
}
