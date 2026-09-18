import type { SVGProps } from "react";

/**
 * Icon set — minimal, single-color SVGs sized to the 24×24 viewBox
 * so they scale cleanly and inherit `currentColor`. Brand marks are
 * simplified enough to render at 18–20px without artifacts.
 *
 * The three utility icons (`Phone`, `Mail`, `Arrow`) are used across
 * the site chrome. The brand map exports a component per platform
 * plus a `SocialIcon` lookup keyed by `platform` from `lib/site.ts`.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** Utility icons ---------------------------------------------------- */

export function PhoneIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M6.6 10.8c1.4 2.7 3.6 4.9 6.3 6.3l2.1-2.1c.3-.3.7-.4 1-.3 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.1 21 3 13.9 3 5.3c0-.6.4-1 1-1h3.7c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.3 1L6.6 10.8Z"
      />
    </Base>
  );
}

export function MailIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6.5h16v11H4zM4 7l8 6 8-6"
      />
    </Base>
  );
}

export function ArrowRightIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 5l7 7-7 7"
      />
    </Base>
  );
}

/** "The system" capability-card icons ------------------------------- */

export function HairStrandIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        d="M7 21c-1-4 2-6 1-10S6 5 8 3M12 21c-1-5 2.5-7 1.5-11S11 4 13.5 2M17 21c-1-4 2-6.5 1-10.5S15.5 5 17.5 3"
      />
    </Base>
  );
}

export function EyeOffIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 5.2A10.8 10.8 0 0 1 12 5c5 0 8.7 3.3 10 7-.5 1.4-1.3 2.8-2.4 3.9M6.6 6.6C4.6 8 3 9.9 2 12c1.3 3.7 5 7 10 7 1.3 0 2.5-.2 3.6-.6M9.9 10a3 3 0 0 0 4.1 4.1"
      />
    </Base>
  );
}

export function MoonIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
      />
    </Base>
  );
}

export function DropletIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3s6.5 7.1 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 10.1 12 3 12 3Z"
      />
    </Base>
  );
}

export function ActivityIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h4l2.5 7L13 5l2 7h6"
      />
    </Base>
  );
}

/** "Visit us" map-section icons ------------------------------------- */

export function MapPinIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 10.5c0 5-5.4 9.4-6.4 10.1a1 1 0 0 1-1.2 0C10.4 19.9 5 15.5 5 10.5a7 7 0 1 1 14 0Z"
      />
      <circle cx="12" cy="10.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </Base>
  );
}

export function ClockIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 7.5V12l3.2 2"
      />
    </Base>
  );
}

/** Mega-menu row icons — minimal single-stroke line marks. */

export function VideoIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="7" width="12.5" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M15.5 10.4 21 8v8l-5.5-2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Base>
  );
}

export function CalendarIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Base>
  );
}

export function CreditCardIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 10h18" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 15h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Base>
  );
}

export function BuildingIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M4 20V6l6-3v17M14 20V9l6 2v9M4 20h16"
      />
      <path d="M7 8v0M7 12v0M7 16v0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </Base>
  );
}

export function HelpCircleIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.4V14"
      />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" />
    </Base>
  );
}

export function ArticleIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        d="M8 9h8M8 12.5h8M8 16h5"
      />
    </Base>
  );
}

export function TagIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        d="M12.5 3.5H20V11l-8.5 8.5a1.5 1.5 0 0 1-2.1 0L4 14.1a1.5 1.5 0 0 1 0-2.1L12.5 3.5Z"
      />
      <circle cx="16" cy="8" r="1.35" fill="currentColor" />
    </Base>
  );
}

export function ScissorsIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="6.5" cy="7" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="6.5" cy="17" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.5 8.5 20 20M8.5 15.5 20 4"
      />
    </Base>
  );
}

export function CompassIcon(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        fill="currentColor"
        d="m14.4 9.6-1 4.5-4.5 1a.25.25 0 0 1-.3-.3l1-4.5 4.5-1a.25.25 0 0 1 .3.3Z"
      />
    </Base>
  );
}

export function SparklesIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v3M12 18v3M4.5 12h-3M22.5 12h-3M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </Base>
  );
}

export function StarIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M12 3.2 14.6 9l6.4.5-4.9 4.2 1.5 6.2-5.6-3.4-5.6 3.4 1.5-6.2L2.6 9.5 9 9 12 3.2Z"
      />
    </Base>
  );
}

export function GridIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        d="M4 4h6.5v6.5H4zM13.5 4H20v6.5h-6.5zM4 13.5h6.5V20H4zM13.5 13.5H20V20h-6.5z"
      />
    </Base>
  );
}

/** Google "G" mark — full-color brand mark used on the review cards. */
export function GoogleGIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.76-.07-1.5-.2-2.2H12v4.17h5.4a4.62 4.62 0 0 1-2 3.03v2.5h3.23c1.9-1.75 2.97-4.3 2.97-7.5Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.23-2.5c-.9.6-2.05.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H3.1v2.58A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.1a10 10 0 0 0 0 8.96l3.3-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.8.5 3.84 1.5l2.87-2.87A9.9 9.9 0 0 0 12 2a10 10 0 0 0-8.9 5.52l3.3 2.58c.8-2.36 3-4.12 5.6-4.12Z"
      />
    </Base>
  );
}

/** Brand marks ----------------------------------------------------- */

export function FacebookIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M13.5 21v-8H16l.5-3.4h-3V7.4c0-1 .3-1.6 1.7-1.6h1.4V2.8c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.1H8v3.4h2.7V21h2.8Z"
      />
    </Base>
  );
}

export function InstagramIcon(p: IconProps) {
  return (
    <Base {...p}>
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="12"
        r="3.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </Base>
  );
}

export function TwitterIcon(p: IconProps) {
  // Legacy Twitter bird — matches the `twitter.com/ManHair_Online` link.
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M21 5.9c-.7.3-1.4.5-2.1.6.8-.5 1.4-1.2 1.6-2-.7.4-1.5.7-2.4.9-.7-.8-1.7-1.2-2.8-1.2-2.1 0-3.9 1.7-3.9 3.9 0 .3 0 .6.1.9C8.2 8.8 5.2 7.2 3.3 4.9c-.3.6-.5 1.3-.5 2 0 1.4.7 2.6 1.8 3.3-.7 0-1.3-.2-1.9-.5v.1c0 1.9 1.4 3.5 3.2 3.9-.3.1-.7.1-1 .1-.3 0-.5 0-.7-.1.5 1.6 2 2.7 3.7 2.7-1.3 1-3 1.7-4.9 1.7H2c1.7 1.1 3.7 1.8 5.9 1.8 7.1 0 11-5.9 11-11v-.5c.8-.5 1.4-1.2 2.1-2Z"
      />
    </Base>
  );
}

export function XIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M17.5 3H21l-7.5 8.6L22 21h-6.9l-5.4-6.6L3.5 21H0l8-9.2L0 3h7.1l4.9 6L17.5 3Zm-1.2 16h1.9L7.8 5H5.8l10.5 14Z"
      />
    </Base>
  );
}

export function TikTokIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M17 3h-3v12.2c0 1.3-1 2.3-2.3 2.3s-2.3-1-2.3-2.3 1-2.3 2.3-2.3c.2 0 .5 0 .7.1v-3.1c-.2 0-.5 0-.7 0-3 0-5.4 2.4-5.4 5.4S8.8 21 11.7 21c3 0 5.4-2.4 5.4-5.4V9.9c1 .6 2.2 1 3.5 1v-3c-1.4 0-2.7-.5-3.6-1.5-.8-.9-1.3-2-1.4-3.4h1.4Z"
      />
    </Base>
  );
}

export function LinkedInIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M4.8 3.5c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8S3 6.3 3 5.3s.8-1.8 1.8-1.8Zm-1.6 5.7h3.2V21H3.2V9.2Zm5.2 0h3.1v1.6h.1c.4-.8 1.5-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.9V21h-3.2v-6c0-1.4 0-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H8.4V9.2Z"
      />
    </Base>
  );
}

export function YouTubeIcon(p: IconProps) {
  return (
    <Base {...p}>
      <path
        fill="currentColor"
        d="M21.6 7.4a2.5 2.5 0 0 0-1.7-1.7C18.3 5.3 12 5.3 12 5.3s-6.3 0-7.9.4A2.5 2.5 0 0 0 2.4 7.4C2 9 2 12 2 12s0 3 .4 4.6a2.5 2.5 0 0 0 1.7 1.7c1.6.4 7.9.4 7.9.4s6.3 0 7.9-.4a2.5 2.5 0 0 0 1.7-1.7c.4-1.6.4-4.6.4-4.6s0-3-.4-4.6ZM10 15V9l5 3-5 3Z"
      />
    </Base>
  );
}

export const SocialIcon: Record<
  | "facebook"
  | "instagram"
  | "twitter"
  | "x"
  | "tiktok"
  | "linkedin"
  | "youtube",
  (p: IconProps) => React.ReactElement
> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  x: XIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
};
