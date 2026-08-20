"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const LINKS = [
  { href: "/tutors", label: "Find a Tutor" },
  { href: "/signup", label: "Become a Tutor" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#impact", label: "Our Impact" },
];

export function SiteNav({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 16);
        ticking = false;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        toggleRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function isCurrent(href: string) {
    if (href.startsWith("/#")) return false;
    return pathname === href;
  }

  return (
    <header className={`nav${isScrolled ? " is-scrolled" : ""}`}>
      <div className="nav__inner">
        <BrandMark />

        <nav className="nav__center" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav__link"
              aria-current={isCurrent(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="nav__right">
          <Link
            href={isSignedIn ? "/dashboard" : "/login"}
            className="btn btn--text"
          >
            {isSignedIn ? "Dashboard" : "Log in"}
          </Link>
          <Link href="/tutors" className="btn btn--primary btn--sm">
            Book Free Session
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="nav__toggle"
          aria-expanded={isOpen}
          aria-controls="nav-sheet"
          onClick={() => setIsOpen((v) => !v)}
        >
          {isOpen ? (
            <X size={22} aria-hidden="true" />
          ) : (
            <Menu size={22} aria-hidden="true" />
          )}
          <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
        </button>
      </div>

      <div id="nav-sheet" className={`nav__sheet${isOpen ? " is-open" : ""}`}>
        <div className="nav__sheet-inner">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav__sheet-link"
              aria-current={isCurrent(link.href) ? "page" : undefined}
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="nav__sheet-actions">
            <Link
              href={isSignedIn ? "/dashboard" : "/login"}
              className="btn btn--quiet"
              onClick={() => setIsOpen(false)}
            >
              {isSignedIn ? "Dashboard" : "Log in"}
            </Link>
            <Link
              href="/tutors"
              className="btn btn--primary"
              onClick={() => setIsOpen(false)}
            >
              Book Free Session
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
