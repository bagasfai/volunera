import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { TutorFilters } from "@/components/tutor-filters";
import { TutorCard } from "@/components/tutor-card";
import { getProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { tutorSearchParamsSchema } from "@/lib/validation/tutor-search";
import {
  getPublicTutorAvailability,
  getPublicTutorLookups,
  searchPublicTutors,
} from "@/lib/tutor/public-dal";

function buildPageHref(
  filters: { grade?: string; subject?: string; language?: string },
  page: number,
) {
  const params = new URLSearchParams();
  if (filters.grade) params.set("grade", filters.grade);
  if (filters.subject) params.set("subject", filters.subject);
  if (filters.language) params.set("language", filters.language);
  params.set("page", String(page));
  return `/tutors?${params.toString()}`;
}

export default async function TutorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const parsed = tutorSearchParamsSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : { page: 1 };

  const [profile, lookups, results] = await Promise.all([
    getProfile(),
    getPublicTutorLookups(),
    searchPublicTutors({
      gradeLevelId: filters.grade,
      subjectId: filters.subject,
      language: filters.language,
      page: filters.page,
    }),
  ]);

  const supabase = await createClient();
  const [slotsByTutor, photosByTutor] = await Promise.all([
    Promise.all(
      results.tutors.map((tutor) => getPublicTutorAvailability(tutor.id!, 14)),
    ),
    Promise.all(
      results.tutors.map(async (tutor) => {
        if (!tutor.photo_url) return null;
        const { data } = await supabase.storage
          .from("tutor-photos")
          .createSignedUrl(tutor.photo_url, 3600);
        return data?.signedUrl ?? null;
      }),
    ),
  ]);

  const totalPages = Math.max(1, Math.ceil(results.total / results.pageSize));

  return (
    <>
      <SiteNav isSignedIn={Boolean(profile)} />

      <main className="app-main">
        <div className="wrap">
          <div className="page-head">
            <div className="page-head__row">
              <div>
                <p className="eyebrow">Find a tutor</p>
                <h1>Browse volunteer tutors</h1>
                <p className="page-head__lede">
                  Every tutor here is approved by an admin. Filter by grade,
                  subject, or language and then book a free 45-minute session.
                </p>
              </div>
              <p className="panel__note">
                {results.total} tutor{results.total === 1 ? "" : "s"} available
              </p>
            </div>
          </div>

          <TutorFilters
            gradeLevels={lookups.gradeLevels}
            subjects={lookups.subjects}
            languages={lookups.languages}
            currentGrade={filters.grade}
            currentSubject={filters.subject}
            currentLanguage={filters.language}
          />

          {results.tutors.length === 0 ? (
            <div className="empty" style={{ marginTop: "var(--space-xl)" }}>
              <h2>No tutors match these filters</h2>
              <p>Try widening your search or clear a filter and start again.</p>
              <p style={{ marginTop: "var(--space-md)" }}>
                <Link href="/tutors" className="btn btn--quiet">
                  Clear filters
                </Link>
              </p>
            </div>
          ) : (
            <div
              className="grid-auto grid-auto--3"
              style={{ marginTop: "var(--space-xl)" }}
            >
              {results.tutors.map((tutor, i) => (
                <TutorCard
                  key={tutor.id}
                  tutor={tutor}
                  slots={slotsByTutor[i]}
                  photoUrl={photosByTutor[i]}
                />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              {filters.page > 1 ? (
                <Link
                  href={buildPageHref(filters, filters.page - 1)}
                  className="btn btn--quiet btn--sm"
                >
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="panel__note">
                Page {filters.page} of {totalPages}
              </span>
              {filters.page < totalPages ? (
                <Link
                  href={buildPageHref(filters, filters.page + 1)}
                  className="btn btn--quiet btn--sm"
                >
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
