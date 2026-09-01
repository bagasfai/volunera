"use client";

import { useRouter } from "next/navigation";

type Option = { id: string; label: string };

export function TutorFilters({
  gradeLevels,
  subjects,
  languages,
  currentGrade,
  currentSubject,
  currentLanguage,
}: {
  gradeLevels: (Option & { category: string })[];
  subjects: Option[];
  languages: string[];
  currentGrade?: string;
  currentSubject?: string;
  currentLanguage?: string;
}) {
  const router = useRouter();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams();
    if (key !== "grade" && currentGrade) params.set("grade", currentGrade);
    if (key !== "subject" && currentSubject)
      params.set("subject", currentSubject);
    if (key !== "language" && currentLanguage)
      params.set("language", currentLanguage);
    if (value) params.set(key, value);
    router.push(params.size > 0 ? `/tutors?${params.toString()}` : "/tutors");
  }

  const gradesByCategory = new Map<string, Option[]>();
  for (const grade of gradeLevels) {
    const existing = gradesByCategory.get(grade.category) ?? [];
    existing.push(grade);
    gradesByCategory.set(grade.category, existing);
  }
  const categoryLabels: Record<string, string> = {
    elementary: "Elementary School",
    middle: "Middle School",
    high: "High School",
  };

  const hasFilters = Boolean(currentGrade || currentSubject || currentLanguage);

  return (
    <div className="filter-bar">
      <div className="field">
        <label htmlFor="tutor-filter-grade">Grade level</label>
        <select
          id="tutor-filter-grade"
          value={currentGrade ?? ""}
          onChange={(e) => updateParam("grade", e.target.value)}
        >
          <option value="">Any grade</option>
          {Array.from(gradesByCategory.entries()).map(([category, grades]) => (
            <optgroup
              key={category}
              label={categoryLabels[category] ?? category}
            >
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tutor-filter-subject">Subject</label>
        <select
          id="tutor-filter-subject"
          value={currentSubject ?? ""}
          onChange={(e) => updateParam("subject", e.target.value)}
        >
          <option value="">Any subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="tutor-filter-language">Language</label>
        <select
          id="tutor-filter-language"
          value={currentLanguage ?? ""}
          onChange={(e) => updateParam("language", e.target.value)}
        >
          <option value="">Any language</option>
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-bar__actions">
        <button
          type="button"
          className="btn btn--text"
          onClick={() => router.push("/tutors")}
          disabled={!hasFilters}
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
