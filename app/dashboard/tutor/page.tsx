import Link from "next/link";
import { requireProfile } from "@/lib/auth/dal";
import { getApplicationLookups, getMyApplication } from "@/lib/tutor/dal";
import { BookingList } from "@/components/booking-list";
import { formatMinutesAsHours } from "@/lib/format/datetime";
import { getMyTutorBookings } from "@/lib/tutor/booking-dal";
import { getMyVolunteerHours } from "@/lib/tutor/hours-dal";
import { TutorApplicationForm } from "./tutor-application-form";

export default async function TutorDashboardPage() {
  const profile = await requireProfile();
  const application = await getMyApplication();
  const lookups = await getApplicationLookups();

  const pageHead = (
    <div className="page-head">
      <div className="page-head__row">
        <div>
          <p className="eyebrow">Tutor</p>
          <h1>Hello, {profile.first_name}</h1>
          <p className="page-head__lede">
            Keep your availability current so students can book you.
          </p>
        </div>
        <p className="panel__note">Timezone: {profile.timezone}</p>
      </div>
    </div>
  );

  if (!application) {
    return (
      <>
        {pageHead}
        <div className="empty">
          <h2>No tutor application yet</h2>
          <p>
            This account is marked as a tutor but has no application record.
            Contact an admin so they can reset it.
          </p>
        </div>
      </>
    );
  }

  const { profile: tutorProfile } = application;
  const notYetSubmitted = tutorProfile.application_submitted_at === null;

  if (tutorProfile.application_status === "approved") {
    const [{ upcoming, past }, hours] = await Promise.all([
      getMyTutorBookings(),
      getMyVolunteerHours(),
    ]);

    return (
      <>
        {pageHead}
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Your volunteer hours</h2>
              <p className="panel__note">
                Sessions and manual adjustments are tracked separately, and are
                never merged into one figure.
              </p>
            </div>
            <span className="status-pill status-pill--ok">Approved</span>
          </div>
          <div className="stat-pair">
            <div className="stat">
              <p className="stat__num">
                {formatMinutesAsHours(hours.completedMinutes)}
              </p>
              <p className="stat__label">From completed sessions</p>
            </div>
            <div className="stat">
              <p className="stat__num">
                {formatMinutesAsHours(hours.adjustmentMinutes)}
              </p>
              <p className="stat__label">From admin adjustments</p>
            </div>
          </div>
          {hours.adjustments.length > 0 && (
            <ul className="summary-list">
              {hours.adjustments.map((adjustment) => (
                <li key={adjustment.id}>
                  <span>{formatMinutesAsHours(adjustment.minutes)}</span>
                  <span>{adjustment.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Upcoming sessions</h2>
              <p className="panel__note">
                Times shown in your timezone, {profile.timezone}.
              </p>
            </div>
            <Link
              href="/dashboard/tutor/availability"
              className="btn btn--outline btn--sm"
            >
              Edit availability
            </Link>
          </div>
          <BookingList
            rows={upcoming}
            timezone={profile.timezone}
            revalidatePath="/dashboard/tutor"
            emptyMessage="No sessions booked yet. Keep your availability current so students can find you."
          />
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Past sessions</h2>
          </div>
          <BookingList
            rows={past}
            timezone={profile.timezone}
            revalidatePath="/dashboard/tutor"
            emptyMessage="Nothing here yet."
          />
        </section>
      </>
    );
  }

  if (
    tutorProfile.application_status === "inactive" ||
    tutorProfile.application_status === "suspended"
  ) {
    return (
      <>
        {pageHead}
        <div className="empty">
          <span className="status-pill status-pill--stop">
            {tutorProfile.application_status}
          </span>
          <h2 style={{ marginTop: "var(--space-sm)" }}>
            Your tutor account is paused
          </h2>
          <p>Contact an admin for the details and to have it restored.</p>
        </div>
      </>
    );
  }

  if (tutorProfile.application_status === "pending" && !notYetSubmitted) {
    return (
      <>
        {pageHead}
        <div className="empty">
          <span className="status-pill status-pill--wait">Under review</span>
          <h2 style={{ marginTop: "var(--space-sm)" }}>
            Your application is with an admin
          </h2>
          <p>
            We email you as soon as it has been looked at. Nothing else to do for
            now.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {pageHead}
      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>
              {tutorProfile.application_status === "rejected"
                ? "Your application was not approved"
                : "Become a volunteer tutor"}
            </h2>
            <p className="panel__note">
              {tutorProfile.application_status === "rejected"
                ? "Update the details below and submit again."
                : "Tell us what you teach and when. An admin reviews every application."}
            </p>
          </div>
          {tutorProfile.application_status === "rejected" && (
            <span className="status-pill status-pill--stop">Not approved</span>
          )}
        </div>
        <TutorApplicationForm application={application} lookups={lookups} />
      </section>
    </>
  );
}
