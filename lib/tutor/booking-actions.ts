"use server";

import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { firstFieldErrors } from "@/lib/validation/auth";
import { bookingRequestSchema } from "@/lib/validation/booking";
import type { Database } from "@/lib/types/database";
import { SLOT_TAKEN_MESSAGE } from "./booking-messages";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export type BookingActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  booking?: Booking;
};

export async function createBooking(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const parsed = bookingRequestSchema.safeParse({
    tutorId: formData.get("tutorId"),
    startTime: formData.get("startTime"),
    subjectId: formData.get("subjectId"),
    gradeLevelId: formData.get("gradeLevelId"),
    topicCategory: formData.get("topicCategory"),
    topic: formData.get("topic"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) };
  }

  const userId = await getUserId();
  if (!userId) {
    return { error: "You must be signed in to book a session." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_tutor_session", {
    p_tutor_id: parsed.data.tutorId,
    p_start_time: parsed.data.startTime,
    p_subject_id: parsed.data.subjectId,
    p_grade_level_id: parsed.data.gradeLevelId,
    p_topic_category: parsed.data.topicCategory,
    p_topic: parsed.data.topic,
  });

  if (error) {
    if (
      error.code === "23505" ||
      error.code === "23514" ||
      error.code === "23P01"
    ) {
      return { error: SLOT_TAKEN_MESSAGE };
    }
    return { error: "Could not complete your booking. Try again." };
  }

  revalidatePath(`/tutors/${parsed.data.tutorId}`);

  if (!data) {
    return { booking: undefined };
  }

  const admin = createAdminClient();

  let calendar: { calendarEventId?: string; meetLink?: string } | null = null;
  try {
    const { data: calendarResult } = await admin.functions.invoke(
      "booking-calendar-event",
      {
        body: { action: "create", bookingId: data.id },
        timeout: 8000,
      },
    );
    calendar = calendarResult as {
      calendarEventId?: string;
      meetLink?: string;
    } | null;
  } catch {}

  try {
    const { error: notifyError } = await admin.functions.invoke(
      "booking-notification-email",
      {
        body: { action: "confirm", bookingId: data.id },
        timeout: 8000,
      },
    );
    if (notifyError) {
      console.error("booking-notification-email invoke failed", notifyError);
    }
  } catch {}

  return {
    booking: calendar
      ? {
          ...data,
          calendar_event_id: calendar.calendarEventId ?? data.calendar_event_id,
          meet_link: calendar.meetLink ?? data.meet_link,
        }
      : data,
  };
}
