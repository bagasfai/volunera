import { requireRole } from "@/lib/auth/dal";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return <>{children}</>;
}
