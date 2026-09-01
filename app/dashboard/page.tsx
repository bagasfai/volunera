import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth/dal";

export default async function DashboardPage() {
  const profile = await requireProfile();
  redirect(`/dashboard/${profile.role}`);
}
