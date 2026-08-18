"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <Label htmlFor="tutor-filter-grade">Grade level</Label>
        <select
          id="tutor-filter-grade"
          className="h-9 rounded-md border px-2 text-sm"
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="tutor-filter-subject">Subject</Label>
        <select
          id="tutor-filter-subject"
          className="h-9 rounded-md border px-2 text-sm"
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

      <div className="flex flex-col gap-1">
        <Label htmlFor="tutor-filter-language">Language</Label>
        <select
          id="tutor-filter-language"
          className="h-9 rounded-md border px-2 text-sm"
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

      {hasFilters && (
        <button
          type="button"
          className="text-sm text-muted-foreground underline"
          onClick={() => router.push("/tutors")}
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
