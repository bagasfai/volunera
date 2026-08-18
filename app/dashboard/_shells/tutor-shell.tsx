import type { Profile } from "@/lib/auth/dal";
import { getApplicationLookups, getMyApplication } from "@/lib/tutor/dal";
import {
  getMyAvailability,
  getMyExceptions,
  getMyUpcomingSlots,
} from "@/lib/tutor/availability-dal";
import { TutorApplicationForm } from "./tutor-application-form";
import { TutorAvailabilityEditor } from "./tutor-availability-editor";

export async function TutorShell({ profile }: { profile: Profile }) {
  const application = await getMyApplication();
  const lookups = await getApplicationLookups();

  if (!application) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>No tutor application found for this account.</p>
      </section>
    );
  }

  const { profile: tutorProfile } = application;
  const notYetSubmitted = tutorProfile.application_submitted_at === null;

  if (tutorProfile.application_status === "approved") {
    const [windows, exceptions, upcomingSlots] = await Promise.all([
      getMyAvailability(),
      getMyExceptions(),
      getMyUpcomingSlots(14),
    ]);
    return (
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>Hello, {profile.first_name}. Set your weekly availability below.</p>
        <TutorAvailabilityEditor
          windows={windows}
          exceptions={exceptions}
          upcomingSlots={upcomingSlots}
          timezone={profile.timezone}
        />
      </section>
    );
  }

  if (
    tutorProfile.application_status === "inactive" ||
    tutorProfile.application_status === "suspended"
  ) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>
          Your account status is &ldquo;{tutorProfile.application_status}
          &rdquo;. Contact an admin for details.
        </p>
      </section>
    );
  }

  if (tutorProfile.application_status === "pending" && !notYetSubmitted) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Tutor dashboard</h2>
        <p>
          Your application is under review. We&rsquo;ll email you once an admin
          has looked at it.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-medium">
        {tutorProfile.application_status === "rejected"
          ? "Your application was not approved"
          : "Become a volunteer tutor"}
      </h2>
      {tutorProfile.application_status === "rejected" && (
        <p className="text-sm text-muted-foreground">
          You can update your application below and submit it again.
        </p>
      )}
      <TutorApplicationForm application={application} lookups={lookups} />
    </section>
  );
}
