import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <main className="mx-auto flex max-w-sm flex-col gap-4 p-8">
      <h1 className="text-xl font-semibold">That link did not work</h1>
      <p>
        The sign-in link was invalid or has already been used. Links expire
        after a short time.
      </p>
      <Link href="/login">Back to sign in</Link>
    </main>
  );
}
