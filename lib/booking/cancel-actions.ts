"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export type CancelState = { error?: string; canceled?: boolean };

const CANNOT_CANCEL =
  "This session can no longer be canceled. Refresh to see its current status.";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function cancelBooking(
  _prev: CancelState,
  formData: FormData,
): Promise<CancelState> {
  await requireProfile();

  const bookingId = String(formData.get("bookingId") ?? "");
  const requested = String(formData.get("revalidate") ?? "");
  const pathToRevalidate = requested.startsWith("/dashboard/")
    ? requested
    : "/dashboard";

  if (!UUID_RE.test(bookingId)) {
    return { error: CANNOT_CANCEL };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "canceled" })
    .eq("id", bookingId)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "P0001" || error.code === "42501") {
      return { error: CANNOT_CANCEL };
    }
    return { error: "Could not cancel this session. Try again." };
  }

  if (!data) {
    return { error: CANNOT_CANCEL };
  }

  revalidatePath(pathToRevalidate);
  return { canceled: true };
}
