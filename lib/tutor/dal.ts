// lib/tutor/dal.ts
import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUserId } from "@/lib/auth/dal";
import type { Database } from "@/lib/types/database";

export type TutorProfile =
  Database["public"]["Tables"]["tutor_profiles"]["Row"];

export type TutorApplication = {
  profile: TutorProfile;
  gradeLevelIds: string[];
  subjectIds: string[];
};

export const getMyApplication = cache(
  async (): Promise<TutorApplication | null> => {
    const userId = await getUserId();
    if (!userId) return null;

    const supabase = await createClient();
    const [{ data: profile }, { data: gradeLevels }, { data: subjects }] =
      await Promise.all([
        supabase
          .from("tutor_profiles")
          .select("*")
          .eq("profile_id", userId)
          .maybeSingle(),
        supabase
          .from("tutor_grade_levels")
          .select("grade_level_id")
          .eq("tutor_id", userId),
        supabase
          .from("tutor_subjects")
          .select("subject_id")
          .eq("tutor_id", userId),
      ]);

    if (!profile) return null;

    return {
      profile,
      gradeLevelIds: (gradeLevels ?? []).map((row) => row.grade_level_id),
      subjectIds: (subjects ?? []).map((row) => row.subject_id),
    };
  },
);

export type LookupOption = {
  id: string;
  label: string;
  category: string | null;
};

export const getApplicationLookups = cache(async () => {
  const supabase = await createClient();
  const [{ data: gradeLevels }, { data: subjects }] = await Promise.all([
    supabase
      .from("grade_levels")
      .select("id, label, category")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("subjects")
      .select("id, label, category")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return {
    gradeLevels: (gradeLevels ?? []) as LookupOption[],
    subjects: (subjects ?? []) as LookupOption[],
  };
});
