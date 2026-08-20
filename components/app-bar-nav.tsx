"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppBarNav({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const pathname = usePathname();

  return (
    <nav className="app-bar__nav" aria-label="Dashboard">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="app-bar__link"
          aria-current={pathname === link.href ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
