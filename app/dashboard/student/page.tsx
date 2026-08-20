import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import { BookingList } from "@/components/booking-list";
import { requireProfile } from "@/lib/auth/dal";
import { getMyStudentBookings } from "@/lib/student/booking-dal";

export default async function StudentDashboardPage() {
  const profile = await requireProfile();
  const { upcoming, past } = await getMyStudentBookings();

  return (
    <div className="space-y-5">
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Student</p>
            <h1>Hello, {profile.first_name}</h1>
            <p className="page-head__lede">
              Find a volunteer tutor and manage your free sessions.
            </p>
          </div>
          <p className="panel__note">Timezone: {profile.timezone}</p>
        </div>
      </div>

      <section className="panel">
        <div className="panel__head">
          <div>
            <h2>Upcoming sessions</h2>
            <p className="panel__note">
              Times shown in your timezone, {profile.timezone}.
            </p>
          </div>
          <span className="icon-chip" aria-hidden="true">
            <CalendarDays />
          </span>
        </div>
        <BookingList
          rows={upcoming}
          timezone={profile.timezone}
          revalidatePath="/dashboard/student"
          emptyMessage="No sessions booked yet. Browse tutors to book your first one."
        />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Past sessions</h2>
        </div>
        <BookingList
          rows={past}
          timezone={profile.timezone}
          revalidatePath="/dashboard/student"
          emptyMessage="Nothing here yet."
        />
      </section>

      <section className="panel">
        <div className="panel__head">
          <h2>Find a tutor</h2>
          <span className="icon-chip" aria-hidden="true">
            <Search />
          </span>
        </div>
        <p style={{ marginTop: 0 }}>
          Filter approved volunteers by grade, subject, and language, then book
          a free 45-minute session.
        </p>
        <Link href="/tutors" className="btn btn--primary">
          Browse tutors
        </Link>
      </section>
    </div>
  );
}
