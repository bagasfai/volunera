import Link from "next/link";
import { SignupForm } from "./signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-6 p-8">
      <h1 className="text-xl font-semibold">Create your Learnivia account</h1>
      <SignupForm />
      <p>
        Already have one? <Link href="/login">Sign in</Link>
      </p>
    </main>
  );
}
