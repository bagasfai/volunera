import { requireRole } from "@/lib/auth/dal";

export default async function TutorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("tutor");
  return <>{children}</>;
}
