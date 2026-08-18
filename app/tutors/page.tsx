import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { TutorFilters } from "@/components/tutor-filters";
import { TutorCard } from "@/components/tutor-card";
import { baloo, jakarta } from "@/lib/fonts";
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

  const [lookups, results] = await Promise.all([
    getPublicTutorLookups(),
    searchPublicTutors({
      gradeLevelId: filters.grade,
      subjectId: filters.subject,
      language: filters.language,
      page: filters.page,
    }),
  ]);

  const slotsByTutor = await Promise.all(
    results.tutors.map((tutor) => getPublicTutorAvailability(tutor.id!, 14)),
  );

  const totalPages = Math.max(1, Math.ceil(results.total / results.pageSize));

  return (
    <div className={`landing-theme ${baloo.variable} ${jakarta.variable}`}>
      <SiteNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Find a Tutor</h1>
        <TutorFilters
          gradeLevels={lookups.gradeLevels}
          subjects={lookups.subjects}
          languages={lookups.languages}
          currentGrade={filters.grade}
          currentSubject={filters.subject}
          currentLanguage={filters.language}
        />

        {results.tutors.length === 0 ? (
          <p className="mt-8 text-muted-foreground">
            No tutors match these filters yet. Try widening your search.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.tutors.map((tutor, i) => (
              <TutorCard key={tutor.id} tutor={tutor} slots={slotsByTutor[i]} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
            {filters.page > 1 && (
              <Link href={buildPageHref(filters, filters.page - 1)}>
                Previous
              </Link>
            )}
            <span>
              Page {filters.page} of {totalPages}
            </span>
            {filters.page < totalPages && (
              <Link href={buildPageHref(filters, filters.page + 1)}>Next</Link>
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
