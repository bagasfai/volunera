import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="auth">
      <BrandMark />
      <div className="auth__card">
        <h1>Create your account</h1>
        <p className="auth__lede">
          One account covers both sides of the platform: book sessions as a student, or
          volunteer as a tutor. Always free.
        </p>
        <SignupForm />
        <p className="auth__foot">
          Already have one? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
