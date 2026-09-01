import "server-only";

import { createClient } from "@/lib/supabase/server";

export type HourAdjustment = {
  id: string;
  minutes: number;
  reason: string;
  created_at: string;
};

export type VolunteerHours = {
  completedMinutes: number;
  adjustmentMinutes: number;
  adjustments: HourAdjustment[];
};

export async function getMyVolunteerHours(): Promise<VolunteerHours> {
  const supabase = await createClient();

  const [{ data: totals }, { data: adjustments }] = await Promise.all([
    supabase
      .from("tutor_volunteer_hours")
      .select("completed_minutes, adjustment_minutes")
      .maybeSingle(),
    supabase
      .from("volunteer_hour_adjustments")
      .select("id, minutes, reason, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return {
    completedMinutes: totals?.completed_minutes ?? 0,
    adjustmentMinutes: totals?.adjustment_minutes ?? 0,
    adjustments: (adjustments ?? []) as HourAdjustment[],
  };
}
