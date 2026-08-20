import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function AuthCodeErrorPage() {
  return (
    <main className="auth">
      <BrandMark />
      <div className="auth__card">
        <h1>That link did not work</h1>
        <p className="auth__lede">
          The sign-in link was invalid or has already been used. Links expire
          after a short time.
        </p>
        <Link href="/login" className="btn btn--primary btn--block">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
