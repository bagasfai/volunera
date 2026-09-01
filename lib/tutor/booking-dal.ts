import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BookingListRow } from "@/components/booking-list";

export type TutorBookings = {
  upcoming: BookingListRow[];
  past: BookingListRow[];
};

export async function getMyTutorBookings(): Promise<TutorBookings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tutor_booking_details")
    .select("*")
    .order("start_time", { ascending: false });

  const now = new Date().getTime();
  const upcoming: BookingListRow[] = [];
  const past: BookingListRow[] = [];

  for (const row of data ?? []) {
    const isUpcoming =
      new Date(row.end_time!).getTime() > now && row.status !== "canceled";

    const isCancelable =
      new Date(row.start_time!).getTime() > now && row.status === "confirmed";

    const mapped: BookingListRow = {
      id: row.id!,
      startTime: row.start_time!,
      endTime: row.end_time!,
      counterpartLabel: row.student_first_name!,
      counterpartSublabel: row.grade_label!,
      subject: row.subject_label!,
      grade: row.grade_label!,
      topicCategory: row.topic_category!,
      topic: row.topic!,
      status: row.status!,
      meetLink: row.meet_link,
      cancelable: isCancelable,
    };

    if (isUpcoming) upcoming.push(mapped);
    else past.push(mapped);
  }

  upcoming.reverse();
  return { upcoming, past };
}
