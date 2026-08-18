// lib/tutor/public-dal.ts
import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type PublicTutorProfile =
  Database["public"]["Views"]["tutor_public_profiles"]["Row"];

export type PublicTutorSlot = { slotStart: string; slotEnd: string };

const PAGE_SIZE = 12;

export type TutorSearchFilters = {
  gradeLevelId?: string;
  subjectId?: string;
  language?: string;
  page: number;
};

export type TutorSearchResult = {
  tutors: PublicTutorProfile[];
  total: number;
  pageSize: number;
};

export const searchPublicTutors = cache(
  async (filters: TutorSearchFilters): Promise<TutorSearchResult> => {
    const supabase = await createClient();
    let query = supabase
      .from("tutor_public_profiles")
      .select("*", { count: "exact" })
      .order("first_name")
      .order("id");

    if (filters.gradeLevelId) {
      query = query.contains("grade_level_ids", [filters.gradeLevelId]);
    }
    if (filters.subjectId) {
      query = query.contains("subject_ids", [filters.subjectId]);
    }
    if (filters.language) {
      query = query.contains("languages", [filters.language]);
    }

    const from = (filters.page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, count } = await query.range(from, to);

    return {
      tutors: data ?? [],
      total: count ?? 0,
      pageSize: PAGE_SIZE,
    };
  },
);

export type TutorLookups = {
  gradeLevels: { id: string; label: string; category: string }[];
  subjects: { id: string; label: string }[];
  languages: string[];
};

export const getPublicTutorLookups = cache(async (): Promise<TutorLookups> => {
  const supabase = await createClient();
  const [{ data: gradeLevels }, { data: subjects }, { data: tutors }] =
    await Promise.all([
      supabase
        .from("grade_levels")
        .select("id, label, category")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("subjects")
        .select("id, label")
        .eq("is_active", true)
        .order("sort_order"),
      supabase.from("tutor_public_profiles").select("languages"),
    ]);

  const languages = Array.from(
    new Set((tutors ?? []).flatMap((t) => t.languages ?? [])),
  ).sort();

  return {
    gradeLevels: gradeLevels ?? [],
    subjects: subjects ?? [],
    languages,
  };
});

export const getPublicTutorProfile = cache(
  async (tutorId: string): Promise<PublicTutorProfile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tutor_public_profiles")
      .select("*")
      .eq("id", tutorId)
      .maybeSingle();

    return data;
  },
);

export const getPublicTutorAvailability = cache(
  async (tutorId: string, days: number): Promise<PublicTutorSlot[]> => {
    const supabase = await createClient();
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" });
    const rangeStart = formatter.format(now);
    const rangeEnd = formatter.format(
      new Date(now.getTime() + (days - 1) * 24 * 60 * 60 * 1000),
    );

    const { data } = await supabase.rpc("get_tutor_public_available_slots", {
      p_tutor_id: tutorId,
      p_range_start: rangeStart,
      p_range_end: rangeEnd,
    });

    const nowMs = now.getTime();
    return (data ?? [])
      .filter((row) => new Date(row.slot_start).getTime() > nowMs)
      .map((row) => ({ slotStart: row.slot_start, slotEnd: row.slot_end }));
  },
);
