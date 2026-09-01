import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { TutorAvailabilityPreview } from "@/components/tutor-availability-preview";
import type {
  PublicTutorProfile,
  PublicTutorSlot,
} from "@/lib/tutor/public-dal";

export function TutorCard({
  tutor,
  slots,
  photoUrl,
}: {
  tutor: PublicTutorProfile;
  slots: PublicTutorSlot[];
  photoUrl?: string | null;
}) {
  const primarySubject = tutor.subject_labels?.[0];
  const initials =
    `${tutor.first_name?.[0] ?? ""}${tutor.last_initial?.[0] ?? ""}`.toUpperCase();

  return (
    <article className="card card--lift tutor-card">
      <div className="tutor-card__body">
        <div className="tutor-card__name-row">
          <div style={{ display: "flex", gap: "var(--space-sm)", minWidth: 0 }}>
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt=""
                width={48}
                height={48}
                className="avatar"
              />
            ) : (
              <span className="avatar avatar--initials" aria-hidden="true">
                {initials}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <h3>
                {tutor.first_name} {tutor.last_initial}.
              </h3>
              <p className="tutor-card__role">
                {primarySubject
                  ? `Volunteer ${primarySubject} Tutor`
                  : "Volunteer Tutor"}
              </p>
            </div>
          </div>
          <span className="tutor-card__verified">
            <BadgeCheck aria-hidden="true" /> Verified
          </span>
        </div>

        {tutor.subject_labels && tutor.subject_labels.length > 0 && (
          <ul className="tutor-card__tags">
            {tutor.subject_labels.slice(0, 4).map((label) => (
              <li key={label} className="tag">
                {label}
              </li>
            ))}
          </ul>
        )}

        {tutor.grade_level_labels && tutor.grade_level_labels.length > 0 && (
          <p className="tutor-card__role">
            Teaches {tutor.grade_level_labels.join(", ")}
          </p>
        )}

        {tutor.bio && <p className="tutor-card__bio">{tutor.bio}</p>}

        <div className="tutor-card__slots">
          <span
            style={{
              display: "block",
              fontWeight: 600,
              color: "var(--color-ink)",
              marginBottom: "var(--space-2xs)",
            }}
          >
            Next available
          </span>
          <TutorAvailabilityPreview slots={slots} variant="compact" />
        </div>
      </div>

      <div className="tutor-card__foot">
        <Link href={`/tutors/${tutor.id}`} className="tutor-card__link">
          View profile <ArrowRight aria-hidden="true" />
        </Link>
        <Link href={`/tutors/${tutor.id}#book`} className="btn btn--sm btn--primary">
          Book
        </Link>
      </div>
    </article>
  );
}
