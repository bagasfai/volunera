import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { TutorAvailabilityPreview } from "@/components/tutor-availability-preview";
import { TutorBookingFlow } from "@/components/tutor-booking-flow";
import { baloo, jakarta } from "@/lib/fonts";
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

  return (
    <div className={`landing-theme ${baloo.variable} ${jakarta.variable}`}>
      <SiteNav />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-4">
          {photoSignedUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSignedUrl}
              alt={`${tutor.first_name} ${tutor.last_initial}.`}
              width={96}
              height={96}
              className="rounded-full object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold">
              {tutor.first_name} {tutor.last_initial}.
            </h1>
            <p className="text-muted-foreground">Volunteer Tutor</p>
          </div>
        </div>

        {tutor.bio && (
          <section>
            <h2 className="text-lg font-medium">About Me</h2>
            <p className="text-sm text-muted-foreground">{tutor.bio}</p>
          </section>
        )}

        {tutor.grade_level_labels && tutor.grade_level_labels.length > 0 && (
          <section>
            <h2 className="text-lg font-medium">Grade Levels Taught</h2>
            <p className="text-sm text-muted-foreground">
              {tutor.grade_level_labels.join(", ")}
            </p>
          </section>
        )}

        {tutor.subject_labels && tutor.subject_labels.length > 0 && (
          <section>
            <h2 className="text-lg font-medium">Subjects</h2>
            <p className="text-sm text-muted-foreground">
              {tutor.subject_labels.join(", ")}
            </p>
          </section>
        )}

        {tutor.teaching_style_tags && tutor.teaching_style_tags.length > 0 && (
          <section>
            <h2 className="text-lg font-medium">Teaching Style</h2>
            <ul className="flex flex-wrap gap-2 text-sm">
              {tutor.teaching_style_tags.map((tag) => (
                <li key={tag} className="rounded-full border px-3 py-1">
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        )}

        {tutor.languages && tutor.languages.length > 0 && (
          <section>
            <h2 className="text-lg font-medium">Languages</h2>
            <p className="text-sm text-muted-foreground">
              {tutor.languages.join(", ")}
            </p>
          </section>
        )}

        <section>
          <h2 className="text-lg font-medium">Availability</h2>
          <TutorAvailabilityPreview slots={slots} variant="full" />
        </section>

        <section>
          <h2 className="text-lg font-medium">Book a Free Session</h2>
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
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="underline">
                Sign in as a student
              </Link>{" "}
              to book a session with {tutor.first_name}.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
