import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { safeNextPath } from "@/lib/auth/safe-redirect";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="auth">
      <BrandMark />
      <div className="auth__card">
        <h1>Welcome back</h1>
        <p className="auth__lede">
          Sign in to book a session or manage your tutoring.
        </p>
        <LoginForm next={safeNextPath(next)} />
        <p className="auth__foot">
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
