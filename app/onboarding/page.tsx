import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { getUser, getProfile } from "@/lib/auth/dal";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile) redirect("/dashboard");

  const metadata = user.user_metadata as { full_name?: string } | undefined;
  const fullName = metadata?.full_name ?? "";
  const [first = "", ...rest] = fullName.split(" ").filter(Boolean);

  return (
    <main className="auth">
      <BrandMark />
      <div className="auth__card">
        <h1>Welcome to Learnivia</h1>
        <p className="auth__lede">
          Two questions and you are set up. You can change this later.
        </p>
        <OnboardingForm
          defaultFirstName={first}
          defaultLastName={rest.join(" ")}
        />
      </div>
    </main>
  );
}
