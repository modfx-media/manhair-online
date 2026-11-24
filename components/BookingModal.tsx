"use client";

import { useEffect, useRef, useState } from "react";
import { bookingPageHref, contactIdFromFormMessage } from "@/lib/booking/link";

const OPEN_EVENT = "manhair:open-booking-modal";
const GHL_FORM_SRC =
  "https://link.manhaironline.com/widget/form/hh9qLIaLPQ8U3Lmqc9Nf";
/** Tall enough for the opt-in, privacy line, and SMS consent before the embed reports its height. */
const FALLBACK_FORM_HEIGHT = 1120;

/** Dispatches the global event that opens the booking form modal. */
export function openBookingModal() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function isTrustedOrigin(origin: string) {
  return (
    origin.includes("manhaironline.com") ||
    origin.includes("msgsndr.com") ||
    origin.includes("leadconnectorhq.com") ||
    origin.includes("gohighlevel.com")
  );
}

function isFormSubmitMessage(data: unknown) {
  if (data == null) return false;
  const blob = typeof data === "string" ? data : JSON.stringify(data);
  return /form[-_ ]?submit|formsubmitted|thank[-_ ]?you/i.test(blob);
}

function goToBooking(contactId: string | null) {
  const current = new URLSearchParams(window.location.search);
  window.location.assign(bookingPageHref(current, contactId));
}

function readFrameHeight(data: unknown): number | null {
  if (typeof data === "string" && data.startsWith("[iFrameSizer]")) {
    const height = Number(data.slice("[iFrameSizer]".length).split(":")[1]);
    return Number.isFinite(height) && height > 480 ? height : null;
  }
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const height = Number(record.height ?? record.iFrameHeight);
  return Number.isFinite(height) && height > 480 ? height : null;
}

/**
 * Site-wide booking modal. The form itself is the GoHighLevel opt-in
 * so the lead is captured before anyone reaches the calendar. After
 * submit, the visitor goes to /book/, which records the click and
 * redirects to the ManHair stylist's booking link.
 */
export function BookingModal() {
  const [open, setOpen] = useState(false);
  const [frameHeight, setFrameHeight] = useState(FALLBACK_FORM_HEIGHT);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleOpen = () => {
      setFrameHeight(FALLBACK_FORM_HEIGHT);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, handleOpen);
    if (new URLSearchParams(window.location.search).get("consult") === "1") handleOpen();
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const frame = frameRef.current;

    const applyHeight = (px: number) => {
      if (!Number.isFinite(px) || px < 480 || px > 2400) return;
      const next = Math.round(px);
      setFrameHeight((current) => (Math.abs(current - next) < 2 ? current : next));
    };

    const fromElement = () => {
      const raw = frame?.style.height ?? "";
      if (!raw.endsWith("px")) return;
      applyHeight(Number.parseFloat(raw));
    };

    const onMessage = (event: MessageEvent) => {
      if (!isTrustedOrigin(event.origin)) return;
      const height = readFrameHeight(event.data);
      if (height) applyHeight(height);
      if (isFormSubmitMessage(event.data)) goToBooking(contactIdFromFormMessage(event.data));
    };

    const observer = frame
      ? new MutationObserver(fromElement)
      : null;
    observer?.observe(frame!, { attributes: true, attributeFilter: ["style"] });
    frame?.addEventListener("load", fromElement);
    window.addEventListener("message", onMessage);
    return () => {
      observer?.disconnect();
      frame?.removeEventListener("load", fromElement);
      window.removeEventListener("message", onMessage);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Book a private consultation"
      className="fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#1A130E]/70 backdrop-blur-md"
      onClick={() => setOpen(false)}
    >
      <div className="flex min-h-full justify-center p-[max(0.75rem,env(safe-area-inset-top))_max(0.75rem,env(safe-area-inset-right))_max(0.75rem,env(safe-area-inset-bottom))_max(0.75rem,env(safe-area-inset-left))] sm:p-5">
        <div
          className="relative my-auto w-full max-w-[26rem] rounded-2xl bg-[color:var(--mh-bg)] shadow-[0_24px_64px_-16px_rgba(26,19,14,0.5)] ring-1 ring-black/10 sm:rounded-[24px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            aria-hidden="true"
            className="h-1 w-full shrink-0 bg-gradient-to-r from-[color:var(--mh-red-600)] via-[color:var(--mh-copper-500)] to-[color:var(--mh-copper-300)]"
          />

          <div className="relative shrink-0 px-4 pb-2 pt-4 text-center sm:px-5 sm:pt-5">
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--mh-border-strong)] bg-white text-[1.25rem] leading-none text-[color:var(--mh-ink-800)] transition hover:border-[color:var(--mh-copper-500)] hover:bg-[color:var(--mh-copper-500)] hover:text-white"
            >
              ×
            </button>
            <h2 className="pr-10 font-display text-[1.3rem] font-light leading-snug text-[color:var(--mh-ink-950)] sm:pr-0 sm:text-[1.5rem]">
              Book a{" "}
              <em className="font-light not-italic text-[color:var(--mh-copper-700)]">
                private
              </em>{" "}
              consultation.
            </h2>
          </div>

          <div className="px-3 pb-3 sm:px-4 sm:pb-4">
            <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[color:var(--mh-border)]">
              <iframe
                ref={frameRef}
                src={GHL_FORM_SRC}
                scrolling="no"
                style={{
                  width: "100%",
                  height: frameHeight,
                  border: "none",
                  display: "block",
                }}
                id="inline-hh9qLIaLPQ8U3Lmqc9Nf"
                data-layout="{'id':'INLINE'}"
                data-trigger-type="alwaysShow"
                data-trigger-value=""
                data-activation-type="alwaysActivated"
                data-activation-value=""
                data-deactivation-type="neverDeactivate"
                data-deactivation-value=""
                data-form-name="ManHair Optin"
                data-height="undefined"
                data-layout-iframe-id="inline-hh9qLIaLPQ8U3Lmqc9Nf"
                data-form-id="hh9qLIaLPQ8U3Lmqc9Nf"
                data-cookie-consent="true"
                data-cookie-consent-provider="auto"
                title="ManHair Optin"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
