import { AppBarNav } from "@/components/app-bar-nav";
import { BrandMark } from "@/components/brand-mark";
import { signOut } from "@/lib/auth/actions";
import { requireProfile } from "@/lib/auth/dal";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();

  const links = [
    { href: `/dashboard/${profile.role}`, label: "Dashboard" },
    ...(profile.role === "admin"
      ? [
          { href: "/dashboard/admin/applications", label: "Applications" },
          { href: "/dashboard/admin/bookings", label: "Bookings" },
          { href: "/dashboard/admin/users", label: "Users" },
          { href: "/dashboard/admin/hours", label: "Hours" },
          { href: "/dashboard/admin/lookups", label: "Lookups" },
        ]
      : []),
    ...(profile.role === "tutor"
      ? [{ href: "/dashboard/tutor/availability", label: "Availability" }]
      : []),
    ...(profile.role === "student"
      ? [{ href: "/tutors", label: "Find a tutor" }]
      : []),
  ];

  return (
    <>
      <header className="app-bar">
        <div className="app-bar__inner">
          <BrandMark href="/dashboard" />

          <AppBarNav links={links} />

          <form action={signOut}>
            <button type="submit" className="btn btn--quiet btn--sm">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="app-main">
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
