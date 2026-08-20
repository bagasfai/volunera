import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listPendingApplications } from "@/lib/admin/dal";

export default async function AdminTutorQueuePage() {
  const applications = await listPendingApplications();

  return (
    <>
      <div className="page-head">
        <div className="page-head__row">
          <div>
            <p className="eyebrow">Admin</p>
            <h1>Tutor applications</h1>
            <p className="page-head__lede">
              Approve a volunteer to put them on the public site. Nothing is
              visible to students until you do.
            </p>
          </div>
          <p className="panel__note">
            {applications.length} awaiting review
          </p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="empty">
          <h2>The queue is clear</h2>
          <p>No applications are waiting for review right now.</p>
        </div>
      ) : (
        <ul className="grid-auto grid-auto--2" style={{ listStyle: "none" }}>
          {applications.map((application) => (
            <li key={application.profile_id} className="card card--lift">
              <div className="tutor-card__name-row">
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: "var(--text-lg)" }}>
                    {application.profiles?.first_name}{" "}
                    {application.profiles?.last_name}
                  </h2>
                  <p className="tutor-card__role">
                    Submitted{" "}
                    {application.application_submitted_at
                      ? new Date(
                          application.application_submitted_at,
                        ).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <span className="status-pill status-pill--wait">Pending</span>
              </div>
              <p style={{ marginTop: "var(--space-md)" }}>
                <Link
                  href={`/dashboard/admin/applications/${application.profile_id}`}
                  className="tutor-card__link"
                >
                  Review application <ArrowRight aria-hidden="true" />
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
