"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { firstFieldErrors } from "@/lib/validation/auth";
import { gradeLevelSchema, subjectSchema } from "@/lib/validation/lookup";

export type LookupState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

const IN_USE =
  "This option is already in use, so it cannot be deleted. Deactivate it instead, so it disappears from every student-facing list without touching history.";

export async function createGradeLevel(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  await requireRole("admin");

  const parsed = gradeLevelSchema.safeParse({
    label: formData.get("label"),
    category: formData.get("category"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("grade_levels").insert({
    label: parsed.data.label,
    category: parsed.data.category,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { label: "That label already exists." } };
    }
    return { error: "Could not add this grade level. Try again." };
  }

  revalidatePath("/dashboard/admin/lookups");
  return { saved: true };
}

export async function createSubject(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  await requireRole("admin");

  const parsed = subjectSchema.safeParse({
    label: formData.get("label"),
    category: formData.get("category"),
    sortOrder: formData.get("sortOrder"),
  });
  if (!parsed.success) return { fieldErrors: firstFieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    label: parsed.data.label,
    category: parsed.data.category,
    sort_order: parsed.data.sortOrder,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { label: "That label already exists." } };
    }
    return { error: "Could not add this subject. Try again." };
  }

  revalidatePath("/dashboard/admin/lookups");
  return { saved: true };
}

export async function setLookupActive(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  await requireRole("admin");

  const table = String(formData.get("table") ?? "");
  const id = String(formData.get("id") ?? "");
  const isActive = String(formData.get("isActive") ?? "") === "true";

  if ((table !== "grade_levels" && table !== "subjects") || !id) {
    return { error: "Could not update this option." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { error: "Could not update this option. Try again." };

  revalidatePath("/dashboard/admin/lookups");
  return { saved: true };
}

export async function deleteLookup(
  _prev: LookupState,
  formData: FormData,
): Promise<LookupState> {
  await requireRole("admin");

  const table = String(formData.get("table") ?? "");
  const id = String(formData.get("id") ?? "");

  if ((table !== "grade_levels" && table !== "subjects") || !id) {
    return { error: "Could not delete this option." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) {
    if (error.code === "P0001" || error.code === "23503") {
      return { error: IN_USE };
    }
    return { error: "Could not delete this option. Try again." };
  }

  revalidatePath("/dashboard/admin/lookups");
  return { saved: true };
}
