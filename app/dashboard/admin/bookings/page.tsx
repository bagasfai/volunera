import { requireProfile } from "@/lib/auth/dal";
import { BOOKING_STATUSES, listAllBookings } from "@/lib/admin/booking-dal";
import { formatSessionRange } from "@/lib/format/datetime";
import { BookingStatusForm } from "./booking-status-form";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; from?: string; to?: string }>;
}) {
  const profile = await requireProfile();
  const filters = await searchParams;
  const { rows: bookings, truncated } = await listAllBookings(filters);

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>All bookings</h1>
            <p className="page-head__lede">
              Every session on the platform, newest first.
            </p>
          </div>
          <p className="panel__note">{bookings.length} shown</p>
        </div>
      </div>

      <section className="panel">
        <form className="filter-bar">
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={filters.status ?? ""} className="control">
              <option value="">Any</option>
              {BOOKING_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>From</span>
            <input type="date" name="from" defaultValue={filters.from ?? ""} className="control" />
          </label>
          <label className="field">
            <span>To</span>
            <input type="date" name="to" defaultValue={filters.to ?? ""} className="control" />
          </label>
          <p className="field__hint">Date filters use UTC days.</p>
          <div className="filter-bar__actions">
            <button type="submit" className="btn btn--primary btn--sm">
              Apply
            </button>
          </div>
        </form>

        <ul className="booking-rows">
          {bookings.map((booking) => (
            <li key={booking.id} className="booking-row">
              <div className="booking-row__when">
                {formatSessionRange(
                  booking.start_time!,
                  booking.end_time!,
                  profile.timezone,
                )}
              </div>
              <div className="booking-row__who">
                <p className="booking-row__name">
                  {booking.student_first_name} {booking.student_last_name}
                </p>
                <p className="booking-row__meta">
                  with {booking.tutor_first_name} {booking.tutor_last_name}
                </p>
              </div>
              <div className="booking-row__what">
                <p className="booking-row__meta">
                  {booking.subject_label} · {booking.grade_label}
                </p>
                <p className="booking-row__topic">{booking.topic}</p>
              </div>
              <div className="booking-row__actions">
                <span className="status-pill">
                  {booking.status?.replace("_", " ")}
                </span>
                <BookingStatusForm
                  key={`${booking.id}-${booking.status}`}
                  bookingId={booking.id!}
                  currentStatus={booking.status!}
                />
              </div>
            </li>
          ))}
        </ul>

        {truncated && (
          <p className="field__hint">
            Showing the most recent 200 matches. Narrow the date range to see
            older sessions.
          </p>
        )}
      </section>
    </>
  );
}
