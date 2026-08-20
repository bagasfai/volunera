import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { BookingListRow } from "@/components/booking-list";

export type StudentBookings = {
  upcoming: BookingListRow[];
  past: BookingListRow[];
};

export async function getMyStudentBookings(): Promise<StudentBookings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_booking_details")
    .select("*")
    .order("start_time", { ascending: false });

  const now = Date.now();
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
      counterpartLabel: `${row.tutor_first_name} ${row.tutor_last_initial}.`,
      counterpartSublabel: "Volunteer tutor",
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
