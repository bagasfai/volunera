import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

const COLUMNS = [
  {
    heading: "For Learners",
    links: [
      { href: "/tutors", label: "Find a Tutor" },
      { href: "/signup", label: "Student Sign Up" },
      { href: "/#how-it-works", label: "How It Works" },
    ],
  },
  {
    heading: "For Tutors",
    links: [
      { href: "/signup", label: "Become a Tutor" },
      { href: "/#for-tutors", label: "How Volunteering Works" },
      { href: "/dashboard", label: "Tutor Dashboard" },
    ],
  },
  {
    heading: "Learnivia",
    links: [
      { href: "/#impact", label: "Our Impact" },
      { href: "/#stories", label: "Success Stories" },
      { href: "/login", label: "Log in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="site-foot__grid">
          <div>
            <BrandMark invert />
            <p className="site-foot__blurb">
              Built by volunteers, for students. Bridging academic gaps with
              personalized, free one-on-one virtual instruction.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading} className="site-foot__col">
              <h2>{column.heading}</h2>
              <ul>
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <hr className="site-foot__rule" />

        <div className="site-foot__legal">
          <span>© {new Date().getFullYear()} Learnivia. Always free.</span>
          <nav aria-label="Footer">
            <Link href="/#how-it-works">How It Works</Link>
            <Link href="/tutors">Find a Tutor</Link>
            <Link href="/signup">Volunteer</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
