import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BadgeCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TutorAvailabilityPreview } from "@/components/tutor-availability-preview";
import { TutorBookingFlow } from "@/components/tutor-booking-flow";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import {
  getPublicTutorAvailability,
  getPublicTutorProfile,
} from "@/lib/tutor/public-dal";

export default async function TutorProfilePage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
  const tutor = await getPublicTutorProfile(tutorId);

  if (!tutor) notFound();

  const slots = await getPublicTutorAvailability(tutor.id!, 14);
  const profile = await getProfile();

  let photoSignedUrl: string | null = null;
  if (tutor.photo_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("tutor-photos")
      .createSignedUrl(tutor.photo_url, 60);
    photoSignedUrl = data?.signedUrl ?? null;
  }

  const initials =
    `${tutor.first_name?.[0] ?? ""}${tutor.last_initial?.[0] ?? ""}`.toUpperCase();

  const hasTeachingDetail = Boolean(
    tutor.grade_level_labels?.length ||
      tutor.subject_labels?.length ||
      tutor.languages?.length ||
      tutor.teaching_style_tags?.length,
  );

  return (
    <>
      <SiteNav isSignedIn={Boolean(profile)} />

      <main className="app-main">
        <div className="wrap wrap--narrow">
          <div className="page-head">
            <Link href="/tutors" className="page-head__back">
              <ArrowLeft aria-hidden="true" /> All tutors
            </Link>
            <div className="page-head__row">
              <div
                style={{
                  display: "flex",
                  gap: "var(--space-md)",
                  alignItems: "center",
                  minWidth: 0,
                }}
              >
                {photoSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSignedUrl}
                    alt={`${tutor.first_name} ${tutor.last_initial}.`}
                    width={88}
                    height={88}
                    className="avatar avatar--lg"
                  />
                ) : (
                  <span
                    className="avatar avatar--lg avatar--initials"
                    aria-hidden="true"
                    style={{ fontSize: "var(--text-xl)" }}
                  >
                    {initials}
                  </span>
                )}
                <div style={{ minWidth: 0 }}>
                  <h1>
                    {tutor.first_name} {tutor.last_initial}.
                  </h1>
                  <p className="tutor-card__verified">
                    <BadgeCheck aria-hidden="true" /> Approved volunteer tutor
                  </p>
                </div>
              </div>
              <Link href="#book" className="btn btn--primary">
                Book a session
              </Link>
            </div>
          </div>

          <div className="stack" style={{ gap: "var(--space-lg)" }}>
            {tutor.bio && (
              <section className="panel">
                <div className="panel__head">
                  <h2>About {tutor.first_name}</h2>
                </div>
                <p style={{ margin: 0 }}>{tutor.bio}</p>
              </section>
            )}

            <section className="panel">
              <div className="panel__head">
                <h2>Teaching</h2>
              </div>
              {!hasTeachingDetail && (
                <p className="field__hint" style={{ margin: 0 }}>
                  {tutor.first_name} has not listed subjects or grade levels
                  yet.
                </p>
              )}
              <dl className="meta-list meta-list--2">
                {tutor.grade_level_labels &&
                  tutor.grade_level_labels.length > 0 && (
                    <div>
                      <dt>Grade levels</dt>
                      <dd>{tutor.grade_level_labels.join(", ")}</dd>
                    </div>
                  )}
                {tutor.subject_labels && tutor.subject_labels.length > 0 && (
                  <div>
                    <dt>Subjects</dt>
                    <dd>{tutor.subject_labels.join(", ")}</dd>
                  </div>
                )}
                {tutor.languages && tutor.languages.length > 0 && (
                  <div>
                    <dt>Languages</dt>
                    <dd>{tutor.languages.join(", ")}</dd>
                  </div>
                )}
                {tutor.teaching_style_tags &&
                  tutor.teaching_style_tags.length > 0 && (
                    <div>
                      <dt>Teaching style</dt>
                      <dd>
                        <ul className="tutor-card__tags">
                          {tutor.teaching_style_tags.map((tag) => (
                            <li key={tag} className="tag">
                              {tag}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
              </dl>
            </section>

            <section className="panel">
              <div className="panel__head">
                <h2>Availability</h2>
                <p className="panel__note">Shown in your local timezone</p>
              </div>
              <TutorAvailabilityPreview slots={slots} variant="full" />
            </section>

            <section id="book" className="panel">
              <div className="panel__head">
                <h2>Book a free session</h2>
                <p className="panel__note">45 minutes · Google Meet · free</p>
              </div>
              {profile && profile.role === "student" ? (
                <TutorBookingFlow
                  tutor={{
                    id: tutor.id!,
                    first_name: tutor.first_name,
                    last_initial: tutor.last_initial,
                    subject_ids: tutor.subject_ids,
                    subject_labels: tutor.subject_labels,
                    grade_level_ids: tutor.grade_level_ids,
                    grade_level_labels: tutor.grade_level_labels,
                  }}
                  slots={slots}
                />
              ) : (
                <div className="alert">
                  <Link href="/login" className="link">
                    Sign in as a student
                  </Link>{" "}
                  to book a session with {tutor.first_name}. It stays free.
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
