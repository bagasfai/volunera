"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { firstFieldErrors, onboardingSchema } from "@/lib/validation/auth";

export type OnboardingState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const parsed = onboardingSchema.safeParse({
    role: formData.get("role"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    timezone: formData.get("timezone"),
  });
  if (!parsed.success) {
    return { fieldErrors: firstFieldErrors(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_onboarding", {
    p_role: parsed.data.role,
    p_first_name: parsed.data.firstName,
    p_last_name: parsed.data.lastName,
    p_timezone: parsed.data.timezone,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/dashboard");
    }
    if (error.code === "28000") {
      redirect("/login");
    }
    if (error.code === "42501") {
      return { error: "That role cannot be selected." };
    }
    if (error.code === "23514") {
      return { fieldErrors: { timezone: "That timezone was not recognised." } };
    }
    return { error: "Could not finish setting up your account. Try again." };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
