"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Button, Card, SectionLabel } from "@/components/ui";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { cn } from "@/lib/cn";
import { HAIR_STYLE_CATEGORIES, HAIR_STYLES, type HairStyle } from "@/lib/hair-styles";

type Status = "idle" | "loading" | "result" | "error";
type CategoryFilter = "All" | (typeof HAIR_STYLE_CATEGORIES)[number];

const CATEGORY_FILTERS: CategoryFilter[] = ["All", ...HAIR_STYLE_CATEGORIES];

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const GENERIC_ERROR = "Something went wrong generating your preview. Please try again.";

/** Interactive shell for the /hair-preview/ tool: photo upload, style
 * selection, and the loading/result/error states around the
 * POST /api/hair-preview call. */
export function HairPreviewStudio() {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Object URLs must be revoked when replaced/unmounted to avoid leaks.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  const acceptFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG, or WEBP).");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("That image is too large. Please use a file under 15MB.");
        return;
      }
      setError(null);
      if (photoUrl) URL.revokeObjectURL(photoUrl);
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
      setGenerateError(null);
      setResultImageUrl(null);
      setStatus("idle");
    },
    [photoUrl]
  );

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFile(e.target.files?.[0]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemovePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoFile(null);
    setPhotoUrl(null);
    setGenerateError(null);
    setResultImageUrl(null);
    setStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectStyle = (id: string) => {
    setSelectedStyleId(id);
    setGenerateError(null);
    setResultImageUrl(null);
    setStatus("idle");
  };

  const canGenerate =
    Boolean(photoFile && selectedStyleId && consentChecked) && status !== "loading";

  const visibleStyles =
    activeCategory === "All"
      ? HAIR_STYLES
      : HAIR_STYLES.filter((style) => style.category === activeCategory);

  const handleGenerate = async () => {
    if (!canGenerate || !photoFile || !selectedStyleId) return;
    setStatus("loading");
    setGenerateError(null);

    try {
      const body = new FormData();
      body.append("photo", photoFile);
      body.append("styleId", selectedStyleId);

      const res = await fetch("/api/hair-preview", { method: "POST", body });
      const data: { image?: string; mimeType?: string; error?: string } | null = await res
        .json()
        .catch(() => null);

      if (!res.ok || !data?.image) {
        setGenerateError(data?.error || GENERIC_ERROR);
        setStatus("error");
        return;
      }

      setResultImageUrl(`data:${data.mimeType ?? "image/png"};base64,${data.image}`);
      setStatus("result");
    } catch {
      setGenerateError("We couldn't reach the preview service. Check your connection and try again.");
      setStatus("error");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:items-start">
      <div className="flex flex-col gap-6 lg:sticky lg:top-24">
        <UploadArea
          photoUrl={photoUrl}
          isDragging={isDragging}
          error={error}
          fileInputRef={fileInputRef}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onInputChange={handleInputChange}
          onRemove={handleRemovePhoto}
        />

        <PrivacyConsent checked={consentChecked} onChange={setConsentChecked} />

        <Button
          type="button"
          block
          disabled={!canGenerate}
          onClick={handleGenerate}
        >
          {status === "loading" ? "Generating…" : "Generate Preview"}
        </Button>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel>Choose a system</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_FILTERS.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.06em] transition-colors",
                    activeCategory === category
                      ? "border-[color:var(--mh-copper-500)] bg-[color:var(--mh-copper-500)] text-[color:var(--mh-ink-900)]"
                      : "border-[color:var(--mh-border-strong)] text-[color:var(--mh-ink-600)] hover:border-[color:var(--mh-copper-500)] hover:text-[color:var(--mh-copper-700)]"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visibleStyles.map((style) => (
              <StyleCard
                key={style.id}
                style={style}
                selected={selectedStyleId === style.id}
                onSelect={() => handleSelectStyle(style.id)}
              />
            ))}
          </div>
        </div>

        <ResultArea
          status={status}
          photoUrl={photoUrl}
          resultImageUrl={resultImageUrl}
          error={generateError}
        />
      </div>
    </div>
  );
}

function UploadArea({
  photoUrl,
  isDragging,
  error,
  fileInputRef,
  onDrop,
  onDragOver,
  onDragLeave,
  onInputChange,
  onRemove,
}: {
  photoUrl: string | null;
  isDragging: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  return (
    <div>
      <SectionLabel>Your photo</SectionLabel>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={cn(
          "mt-3 flex min-h-56 flex-col items-center justify-center gap-3 rounded-[var(--mh-radius-sm)] border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-[color:var(--mh-copper-500)] bg-[color:var(--mh-copper-50)]"
            : "border-[color:var(--mh-border-strong)] bg-[color:var(--mh-surface)]"
        )}
      >
        {photoUrl ? (
          <>
            <div className="relative h-40 w-40 overflow-hidden rounded-full">
              {/* eslint-disable-next-line @next/next/no-img-element -- object URL preview, not an optimizable asset */}
              <img
                src={photoUrl}
                alt="Selected photo preview"
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--mh-copper-700)] hover:text-[color:var(--mh-copper-900)]"
            >
              Remove photo
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[color:var(--mh-ink-600)]">
              Drag and drop a front-facing photo here, or
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mh-btn mh-btn-ghost mh-btn-sm"
            >
              Choose a photo
            </button>
            <p className="text-xs text-[color:var(--mh-ink-500)]">
              JPG, PNG, or WEBP &middot; up to 15MB
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          className="sr-only"
          aria-label="Upload a front-facing photo"
        />
      </div>
      {error ? (
        <p className="mt-2 text-xs text-[color:var(--mh-copper-700)]">{error}</p>
      ) : null}
      {!photoUrl ? <PhotoTips /> : null}
    </div>
  );
}

function PhotoTips() {
  return (
    <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[color:var(--mh-ink-600)]">
      <div className="flex items-start gap-2 rounded-[var(--mh-radius-sm)] border border-[color:var(--mh-border-strong)] bg-[color:var(--mh-surface)] p-3">
        <CheckIcon className="mt-0.5 shrink-0 text-[color:var(--mh-copper-600)]" />
        <span>Front-facing, well-lit, hair and hairline visible.</span>
      </div>
      <div className="flex items-start gap-2 rounded-[var(--mh-radius-sm)] border border-[color:var(--mh-border-strong)] bg-[color:var(--mh-surface)] p-3">
        <CrossIcon className="mt-0.5 shrink-0 text-[color:var(--mh-ink-400)]" />
        <span>Avoid side profiles, hats, or dark/blurry photos.</span>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12.5 9.5 17 19 7"
      />
    </svg>
  );
}

function CrossIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6 6 18"
      />
    </svg>
  );
}

function PrivacyConsent({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="rounded-[var(--mh-radius-sm)] border border-[color:var(--mh-border-strong)] bg-[color:var(--mh-surface)] p-4">
      <p className="text-xs leading-relaxed text-[color:var(--mh-ink-600)]">
        Your photo is used only to generate this preview. It is not stored
        and is discarded as soon as the response is returned.
      </p>
      <label className="mt-3 flex items-start gap-2 text-xs text-[color:var(--mh-ink-700)]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--mh-copper-500)]"
        />
        <span>I agree to this.</span>
      </label>
    </div>
  );
}

function StyleCard({
  style,
  selected,
  onSelect,
}: {
  style: HairStyle;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      accent={selected ? "border" : "none"}
      padding="sm"
      className={cn(
        "cursor-pointer text-left transition-all",
        selected
          ? "border-[color:var(--mh-copper-500)] shadow-[0_0_0_1px_var(--mh-copper-500)]"
          : "hover:-translate-y-0.5 hover:border-[color:var(--mh-copper-500)]"
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="flex w-full flex-col gap-2 text-left"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--mh-radius-sm)]">
          <Image
            src={style.image}
            alt={style.name}
            fill
            sizes="(min-width: 1024px) 15vw, 30vw"
            className="object-cover"
          />
          {selected ? (
            <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--mh-copper-500)] text-[color:var(--mh-ink-900)]">
              <CheckIcon />
            </span>
          ) : null}
        </div>
        <span className="text-sm font-semibold text-[color:var(--mh-ink-900)]">
          {style.name}
        </span>
        <span className="text-xs leading-snug text-[color:var(--mh-ink-600)]">
          {style.description}
        </span>
      </button>
    </Card>
  );
}

function ResultArea({
  status,
  photoUrl,
  resultImageUrl,
  error,
}: {
  status: Status;
  photoUrl: string | null;
  resultImageUrl: string | null;
  error: string | null;
}) {
  if (status === "result" && photoUrl && resultImageUrl) {
    return (
      <div className="mh-form-card min-h-80">
        <SectionLabel>Preview</SectionLabel>
        <p className="mt-1 text-xs text-[color:var(--mh-ink-500)]">
          Drag the slider to compare.
        </p>
        <BeforeAfterSlider
          beforeSrc={photoUrl}
          afterSrc={resultImageUrl}
          className="mt-4"
        />
      </div>
    );
  }

  return (
    <div className="mh-form-card min-h-80">
      <SectionLabel>Preview</SectionLabel>
      <div className="mt-4 flex min-h-64 flex-col items-center justify-center gap-3 rounded-[var(--mh-radius-sm)] border border-dashed border-[color:var(--mh-border-strong)] p-6 text-center">
        {status === "idle" && (
          <p className="text-sm text-[color:var(--mh-ink-600)]">
            Upload a photo and pick a style to generate a before/after preview.
          </p>
        )}
        {status === "loading" && (
          <>
            <span
              className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--mh-border-strong)] border-t-[color:var(--mh-copper-500)]"
              aria-hidden="true"
            />
            <p className="text-sm text-[color:var(--mh-ink-600)]">
              Generating your preview…
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <p className="text-sm font-semibold text-[color:var(--mh-copper-700)]">
              {error ?? GENERIC_ERROR}
            </p>
            <p className="text-xs text-[color:var(--mh-ink-500)]">
              Try again, or pick a different photo or style.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
