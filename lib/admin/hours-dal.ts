import "server-only";

import { createClient } from "@/lib/supabase/server";

export type TutorHoursRow = {
  tutorId: string;
  firstName: string;
  lastName: string;
  completedMinutes: number;
  adjustmentMinutes: number;
};

export type AdjustmentRow = {
  id: string;
  tutor_id: string;
  minutes: number;
  reason: string;
  created_at: string;
};

export async function listTutorsWithHours(): Promise<TutorHoursRow[]> {
  const supabase = await createClient();

  const [{ data: hours }, { data: tutors }] = await Promise.all([
    supabase
      .from("tutor_volunteer_hours")
      .select("tutor_id, completed_minutes, adjustment_minutes"),
    supabase.from("profiles").select("id, first_name, last_name").eq("role", "tutor"),
  ]);

  const names = new Map(
    (tutors ?? []).map((t) => [t.id, { first: t.first_name, last: t.last_name }]),
  );

  return (hours ?? []).map((row) => ({
    tutorId: row.tutor_id!,
    firstName: names.get(row.tutor_id!)?.first ?? "Unknown",
    lastName: names.get(row.tutor_id!)?.last ?? "",
    completedMinutes: row.completed_minutes ?? 0,
    adjustmentMinutes: row.adjustment_minutes ?? 0,
  }));
}

export async function listAdjustments(tutorId: string): Promise<AdjustmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("volunteer_hour_adjustments")
    .select("id, tutor_id, minutes, reason, created_at")
    .eq("tutor_id", tutorId)
    .order("created_at", { ascending: false });

  return (data ?? []) as AdjustmentRow[];
}
