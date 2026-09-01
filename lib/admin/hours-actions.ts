"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { firstFieldErrors } from "@/lib/validation/auth";
import { adjustmentSchema } from "@/lib/validation/volunteer-hours";

export type AdjustmentState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

export async function addAdjustment(
  _prev: AdjustmentState,
  formData: FormData,
): Promise<AdjustmentState> {
  const admin = await requireRole("admin");

  const parsed = adjustmentSchema.safeParse({
    tutorId: formData.get("tutorId"),
    minutes: formData.get("minutes"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_hour_adjustments").insert({
    tutor_id: parsed.data.tutorId,
    minutes: parsed.data.minutes,
    reason: parsed.data.reason,
    created_by: admin.id,
  });

  if (error) {
    return { error: "Could not file this adjustment. Try again." };
  }

  revalidatePath("/dashboard/admin/hours");
  return { saved: true };
}

export async function deleteAdjustment(
  _prev: AdjustmentState,
  formData: FormData,
): Promise<AdjustmentState> {
  await requireRole("admin");

  const id = String(formData.get("adjustmentId") ?? "");
  if (!id) return { error: "Could not remove this adjustment." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("volunteer_hour_adjustments")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    return { error: "Could not remove this adjustment. Try again." };
  }
  if (!data || data.length === 0) {
    return { error: "That adjustment no longer exists. Refresh the page." };
  }

  revalidatePath("/dashboard/admin/hours");
  return { saved: true };
}
