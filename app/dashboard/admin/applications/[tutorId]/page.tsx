import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getApplicationDetail } from "@/lib/admin/dal";
import {
  approveApplication,
  rejectApplication,
} from "@/lib/admin/review-actions";
import { createClient } from "@/lib/supabase/server";

const STATUS_CLASS: Record<string, string> = {
  approved: "status-pill--ok",
  pending: "status-pill--wait",
  rejected: "status-pill--stop",
  suspended: "status-pill--stop",
  inactive: "status-pill--stop",
};

export default async function AdminTutorDetailPage({
  params,
}: {
  params: Promise<{ tutorId: string }>;
}) {
  const { tutorId } = await params;
  const { profile, gradeLevelLabels, subjectLabels } =
    await getApplicationDetail(tutorId);

  if (!profile) notFound();

  let photoSignedUrl: string | null = null;
  if (profile.photo_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("tutor-photos")
      .createSignedUrl(profile.photo_url, 60);
    photoSignedUrl = data?.signedUrl ?? null;
  }

  async function approve() {
    "use server";
    const result = await approveApplication(tutorId);
    if (result.error) {
      throw new Error(result.error);
    }
  }

  async function reject() {
    "use server";
    const result = await rejectApplication(tutorId);
    if (result.error) {
      throw new Error(result.error);
    }
  }

  const status = profile.application_status ?? "pending";

  return (
    <>
      <div className="page-head">
        <Link href="/dashboard/admin/applications" className="page-head__back">
          <ArrowLeft aria-hidden="true" /> Review queue
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
                alt=""
                width={88}
                height={88}
                className="avatar avatar--lg"
              />
            ) : null}
            <div style={{ minWidth: 0 }}>
              <h1>
                {profile.profiles?.first_name} {profile.profiles?.last_name}
              </h1>
              <p className="page-head__lede">
                Volunteer tutor application
              </p>
            </div>
          </div>
          <span
            className={`status-pill ${STATUS_CLASS[status] ?? ""}`}
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="stack" style={{ gap: "var(--space-lg)" }}>
        <section className="panel">
          <div className="panel__head">
            <h2>Applicant</h2>
          </div>
          <dl className="meta-list meta-list--2">
            <div>
              <dt>Phone</dt>
              <dd>{profile.phone ?? "-"}</dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{profile.date_of_birth ?? "-"}</dd>
            </div>
            <div>
              <dt>School / college status</dt>
              <dd>{profile.education_status ?? "-"}</dd>
            </div>
            <div>
              <dt>Languages</dt>
              <dd>{(profile.languages ?? []).join(", ") || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>Teaching</h2>
          </div>
          <dl className="meta-list meta-list--2">
            <div>
              <dt>Grade levels</dt>
              <dd>{gradeLevelLabels.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt>Subjects</dt>
              <dd>{subjectLabels.join(", ") || "-"}</dd>
            </div>
            <div>
              <dt>Teaching style</dt>
              <dd>
                <ul className="tutor-card__tags">
                  {(profile.teaching_style_tags ?? []).map((tag) => (
                    <li key={tag} className="tag">
                      {tag}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>In their words</h2>
          </div>
          <dl className="meta-list">
            <div>
              <dt>Bio (public)</dt>
              <dd>{profile.bio ?? "-"}</dd>
            </div>
            <div>
              <dt>Motivation (admin only)</dt>
              <dd>{profile.motivation ?? "-"}</dd>
            </div>
            {profile.prior_experience && (
              <div>
                <dt>Prior experience</dt>
                <dd>{profile.prior_experience}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="panel">
          <div className="panel__head">
            <div>
              <h2>Decision</h2>
              <p className="panel__note">
                Approving publishes this tutor to the public directory.
              </p>
            </div>
          </div>
          <div className="form__actions">
            <form action={approve}>
              <button type="submit" className="btn btn--primary">
                Approve
              </button>
            </form>
            <form action={reject}>
              <button type="submit" className="btn btn--danger">
                Reject
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
