"use server";

import { revalidatePath } from "next/cache";
import { getUserId } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { firstFieldErrors } from "@/lib/validation/auth";
import { tutorApplicationSchema } from "@/lib/validation/tutor-application";

export type TutorApplicationState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitTutorApplication(
  _prev: TutorApplicationState,
  formData: FormData,
): Promise<TutorApplicationState> {
  const parsed = tutorApplicationSchema.safeParse({
    phone: formData.get("phone"),
    dateOfBirth: formData.get("dateOfBirth"),
    educationStatus: formData.get("educationStatus"),
    bio: formData.get("bio"),
    motivation: formData.get("motivation"),
    priorExperience: formData.get("priorExperience") ?? "",
    languages: formData.get("languages"),
    teachingStyleTags: formData.getAll("teachingStyleTags"),
    gradeLevelIds: formData.getAll("gradeLevelIds"),
    subjectIds: formData.getAll("subjectIds"),
    photoUrl: formData.get("photoUrl") ?? "",
  });

  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) };
  }

  const userId = await getUserId();
  if (!userId) {
    return { error: "You must be signed in to submit an application." };
  }
  if (
    parsed.data.photoUrl !== "" &&
    !parsed.data.photoUrl.startsWith(`${userId}/`)
  ) {
    return {
      fieldErrors: {
        photoUrl: "That photo could not be verified. Upload it again.",
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_tutor_application", {
    p_bio: parsed.data.bio,
    p_motivation: parsed.data.motivation,
    p_prior_experience: parsed.data.priorExperience,
    p_phone: parsed.data.phone,
    p_date_of_birth: parsed.data.dateOfBirth,
    p_education_status: parsed.data.educationStatus,
    p_languages: parsed.data.languages,
    p_teaching_style_tags: parsed.data.teachingStyleTags,
    p_photo_url: parsed.data.photoUrl,
    p_grade_level_ids: parsed.data.gradeLevelIds,
    p_subject_ids: parsed.data.subjectIds,
  });

  if (error) {
    if (error.code === "42501") {
      return { error: "This application is not open for changes right now." };
    }
    if (error.code === "23514") {
      return { error: "Select at least one grade level and one subject." };
    }
    if (error.code === "P0002") {
      return { error: "No tutor application found for this account." };
    }
    return { error: "Could not submit your application. Try again." };
  }

  revalidatePath("/dashboard");
  return {};
}
