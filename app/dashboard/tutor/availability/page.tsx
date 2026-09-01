import Link from "next/link";
import { requireProfile } from "@/lib/auth/dal";
import {
  getMyAvailability,
  getMyExceptions,
  getMyUpcomingSlots,
} from "@/lib/tutor/availability-dal";
import { TutorAvailabilityEditor } from "../tutor-availability-editor";

export default async function TutorAvailabilityPage() {
  const profile = await requireProfile();
  const [windows, exceptions, upcomingSlots] = await Promise.all([
    getMyAvailability(),
    getMyExceptions(),
    getMyUpcomingSlots(14),
  ]);

  return (
    <>
      <div className="page-head">
        <Link href="/dashboard/tutor" className="page-head__back">
          Back to dashboard
        </Link>
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Tutor</p>
            <h1>Your weekly availability</h1>
            <p className="page-head__lede">
              Students see these hours converted into their own timezone.
            </p>
          </div>
          <p className="panel__note">Timezone: {profile.timezone}</p>
        </div>
      </div>

      <section className="panel">
        <TutorAvailabilityEditor
          windows={windows}
          exceptions={exceptions}
          upcomingSlots={upcomingSlots}
          timezone={profile.timezone}
        />
      </section>
    </>
  );
}
