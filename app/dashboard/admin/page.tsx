import Link from "next/link";
import { requireProfile } from "@/lib/auth/dal";
import { getAdminCounts } from "@/lib/admin/dal";

export default async function AdminDashboardPage() {
  const profile = await requireProfile();
  const counts = await getAdminCounts();

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Hello, {profile.first_name}</h1>
            <p className="page-head__lede">
              Review volunteer applications and keep the roster healthy.
            </p>
          </div>
          <p className="panel__note">Timezone: {profile.timezone}</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <p className="stat__num">{counts.pendingApplications}</p>
          <p className="stat__label">Pending applications</p>
        </div>
        <div className="stat">
          <p className="stat__num">{counts.upcomingBookings}</p>
          <p className="stat__label">Upcoming bookings</p>
        </div>
        <div className="stat">
          <p className="stat__num">{counts.suspendedAccounts}</p>
          <p className="stat__label">Suspended or deactivated</p>
        </div>
      </div>

      <div className="grid-auto grid-auto--2">
        <section className="panel">
          <div className="panel__head">
            <h2>Applications</h2>
          </div>
          <p className="panel__note">
            Approve a volunteer to put them on the public site. Nothing is
            visible to students until you do.
          </p>
          <Link
            href="/dashboard/admin/applications"
            className="btn btn--primary"
          >
            Open applications
          </Link>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Bookings</h2>
          </div>
          <p className="panel__note">
            Every session on the platform, filterable by status and date.
          </p>
          <Link href="/dashboard/admin/bookings" className="btn btn--primary">
            Open bookings
          </Link>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Users</h2>
          </div>
          <p className="panel__note">
            Suspend or reactivate any account. Suspending a tutor removes
            them from public discovery immediately.
          </p>
          <Link href="/dashboard/admin/users" className="btn btn--primary">
            Open users
          </Link>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Hours</h2>
          </div>
          <p className="panel__note">
            Session hours are computed from completed bookings. File a
            manual adjustment when something happened off-platform.
          </p>
          <Link href="/dashboard/admin/hours" className="btn btn--primary">
            Open hours
          </Link>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Lookups</h2>
          </div>
          <p className="panel__note">
            Add grade levels and subjects without a code change.
          </p>
          <Link href="/dashboard/admin/lookups" className="btn btn--primary">
            Open lookups
          </Link>
        </section>
      </div>
    </>
  );
}
