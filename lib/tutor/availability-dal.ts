// lib/tutor/availability-dal.ts
import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getUserId } from "@/lib/auth/dal";
import type { Database } from "@/lib/types/database";

export type AvailabilityWindow =
  Database["public"]["Tables"]["tutor_availability"]["Row"];
export type AvailabilityException =
  Database["public"]["Tables"]["tutor_availability_exceptions"]["Row"];

export const getMyAvailability = cache(
  async (): Promise<AvailabilityWindow[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("tutor_availability")
      .select("*")
      .eq("tutor_id", userId)
      .order("weekday")
      .order("start_time");

    return data ?? [];
  },
);

export const getMyExceptions = cache(
  async (): Promise<AvailabilityException[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const supabase = await createClient();
    const { data } = await supabase
      .from("tutor_availability_exceptions")
      .select("*")
      .eq("tutor_id", userId)
      .order("exception_date");

    return data ?? [];
  },
);

export type UpcomingSlot = { slotStart: string; slotEnd: string };

export const getMyUpcomingSlots = cache(
  async (days: number): Promise<UpcomingSlot[]> => {
    const userId = await getUserId();
    if (!userId) return [];

    const profile = await getProfile();
    const timezone = profile?.timezone ?? "UTC";

    const supabase = await createClient();
    const formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    const rangeStart = formatter.format(new Date());
    const rangeEnd = formatter.format(
      new Date(Date.now() + (days - 1) * 24 * 60 * 60 * 1000),
    );

    const { data } = await supabase.rpc("get_tutor_available_slots", {
      p_tutor_id: userId,
      p_range_start: rangeStart,
      p_range_end: rangeEnd,
    });

    const now = Date.now();
    return (data ?? [])
      .filter((row) => new Date(row.slot_start).getTime() > now)
      .map((row) => ({
        slotStart: row.slot_start,
        slotEnd: row.slot_end,
      }));
  },
);
