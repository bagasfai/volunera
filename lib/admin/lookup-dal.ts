import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

export type GradeLevel = Database["public"]["Tables"]["grade_levels"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];

export async function listLookups(): Promise<{
  gradeLevels: GradeLevel[];
  subjects: Subject[];
}> {
  const supabase = await createClient();

  const [{ data: gradeLevels }, { data: subjects }] = await Promise.all([
    supabase.from("grade_levels").select("*").order("sort_order"),
    supabase.from("subjects").select("*").order("sort_order"),
  ]);

  return {
    gradeLevels: (gradeLevels ?? []) as GradeLevel[],
    subjects: (subjects ?? []) as Subject[],
  };
}
