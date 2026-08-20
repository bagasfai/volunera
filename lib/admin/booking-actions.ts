"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";
import { BOOKING_STATUSES } from "@/lib/admin/booking-constants";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

export type BookingStatusState = { error?: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setBookingStatus(
  _prev: BookingStatusState,
  formData: FormData,
): Promise<BookingStatusState> {
  await requireRole("admin");

  const bookingId = String(formData.get("bookingId") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;

  if (!UUID_RE.test(bookingId)) {
    return { error: "Pick a valid session." };
  }
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) {
    return { error: "Pick a valid booking status." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId)
    .select("id");

  if (error) {
    // P0001 is the guard trigger refusing an unsupported status transition.
    if (error.code === "P0001") {
      return { error: "That status change is not allowed." };
    }
    return { error: "Could not update this session. Try again." };
  }

  if (!data || data.length === 0) {
    return { error: "That session no longer exists. Refresh the page." };
  }

  revalidatePath("/dashboard/admin/bookings");
  return {};
}
