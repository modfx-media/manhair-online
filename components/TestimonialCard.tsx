import { GoogleGIcon } from "@/components/icons";
import {
  GOOGLE_AVATAR_TINTS,
  type Testimonial,
} from "@/lib/testimonials";

export function TestimonialCard({
  t,
  index,
  className,
}: {
  t: Testimonial;
  index: number;
  className?: string;
}) {
  const fromGoogle = t.source === "google";

  return (
    <article
      className={className ?? "mh-goog-card"}
      tabIndex={0}
      aria-label={`${t.name}, 5 star review. Hover or focus to read the full review.`}
    >
      <div className="mh-goog-head">
        <div className="mh-goog-id">
          <span
            className="mh-goog-avatar"
            style={{
              background: GOOGLE_AVATAR_TINTS[index % GOOGLE_AVATAR_TINTS.length],
            }}
          >
            {t.name.charAt(0)}
          </span>
          <div>
            <p className="mh-goog-name">{t.name}</p>
            <p className="mh-goog-meta">
              {fromGoogle ? "Google review" : "Client story"}
              {t.when ? ` · ${t.when}` : ""}
            </p>
          </div>
        </div>
        {fromGoogle ? <GoogleGIcon size={22} /> : null}
      </div>
      <p className="mh-goog-stars" aria-label="5 out of 5 stars">
        ★★★★★
      </p>
      <p className="mh-goog-quote">&ldquo;{t.quote}&rdquo;</p>
      <div className="mh-goog-foot">
        {fromGoogle ? (
          <>
            <GoogleGIcon size={14} />
            {t.when ?? "Posted on Google"}
          </>
        ) : (
          "From our clients"
        )}
      </div>
      <div className="mh-goog-popup" role="tooltip">
        <div className="mh-goog-head">
          <div className="mh-goog-id">
            <span
              className="mh-goog-avatar"
              style={{
                background: GOOGLE_AVATAR_TINTS[index % GOOGLE_AVATAR_TINTS.length],
              }}
            >
              {t.name.charAt(0)}
            </span>
            <div>
              <p className="mh-goog-name">{t.name}</p>
              <p className="mh-goog-meta">
                {fromGoogle ? "Google review" : "Client story"}
              </p>
            </div>
          </div>
          {fromGoogle ? <GoogleGIcon size={22} /> : null}
        </div>
        <p className="mh-goog-stars" aria-hidden="true">
          ★★★★★
        </p>
        <p className="mh-goog-popup-quote">&ldquo;{t.quote}&rdquo;</p>
        <div className="mh-goog-foot">
          {fromGoogle ? (
            <>
              <GoogleGIcon size={14} />
              {t.when ?? "Posted on Google"}
            </>
          ) : (
            "From our clients"
          )}
        </div>
      </div>
    </article>
  );
}
