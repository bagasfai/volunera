import Link from "next/link";
import { listAdjustments, listTutorsWithHours } from "@/lib/admin/hours-dal";
import { formatMinutesAsHours } from "@/lib/format/datetime";
import { AdjustmentForm } from "./adjustment-form";
import { DeleteAdjustmentButton } from "./delete-adjustment-button";

export default async function AdminHoursPage({
  searchParams,
}: {
  searchParams: Promise<{ tutorId?: string }>;
}) {
  const { tutorId } = await searchParams;
  const tutors = await listTutorsWithHours();
  const selected = tutorId ? tutors.find((t) => t.tutorId === tutorId) : undefined;
  const adjustments = selected ? await listAdjustments(selected.tutorId) : [];

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Volunteer hours</h1>
            <p className="page-head__lede">
              Session hours are computed from completed bookings. Adjustments are
              a separate ledger and are never merged into that figure.
            </p>
          </div>
        </div>
      </div>

      <section className="panel">
        <div className="panel__head">
          <h2>Tutors</h2>
        </div>
        <ul className="record-rows">
          {tutors.map((tutor) => (
            <li key={tutor.tutorId} className="record-row">
              <div>
                <p className="record-row__name">
                  {tutor.firstName} {tutor.lastName}
                </p>
                <p className="record-row__meta">
                  {formatMinutesAsHours(tutor.completedMinutes)} from sessions ·{" "}
                  {formatMinutesAsHours(tutor.adjustmentMinutes)} adjusted
                </p>
              </div>
              <Link
                href={`/dashboard/admin/hours?tutorId=${tutor.tutorId}`}
                className="btn btn--quiet btn--sm"
              >
                Adjust
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>
                Adjustments for {selected.firstName} {selected.lastName}
              </h2>
              <p className="panel__note">
                {formatMinutesAsHours(selected.completedMinutes)} from sessions,
                held separately from{" "}
                {formatMinutesAsHours(selected.adjustmentMinutes)} of adjustments.
              </p>
            </div>
          </div>

          <AdjustmentForm tutorId={selected.tutorId} />

          <ul className="summary-list">
            {adjustments.map((adjustment) => (
              <li key={adjustment.id}>
                <span>{formatMinutesAsHours(adjustment.minutes)}</span>
                <span>{adjustment.reason}</span>
                <DeleteAdjustmentButton adjustmentId={adjustment.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
