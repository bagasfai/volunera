import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function BrandMark({
  href = "/",
  invert = false,
}: {
  href?: string;
  invert?: boolean;
}) {
  return (
    <Link href={href} className={`brand${invert ? " brand--invert" : ""}`}>
      <span className="brand__chip" aria-hidden="true">
        <GraduationCap strokeWidth={2.25} />
      </span>
      Learnivia
    </Link>
  );
}
