import { requireRole } from "@/lib/auth/dal";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("student");
  return <>{children}</>;
}
