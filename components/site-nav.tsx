"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

const CENTER_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#students", label: "For students" },
  { href: "#volunteers", label: "For volunteers" },
];

export function SiteNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 24);
        ticking = false;
      });
    }
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

  return (
    <header className={`nav${isScrolled ? " is-scrolled" : ""}`}>
      <div className="nav__inner">
        <Link href="/" className="nav__brand">
          <span className="nav__brand-dot" aria-hidden="true" />
          Learnivia
        </Link>

        <nav className="nav__center" aria-label="Primary">
          {CENTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <Link href="/login" className="btn btn--text">
            Log in
          </Link>
          <Link href="/tutors" className="btn btn--primary">
            Find a Tutor
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
        {CENTER_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="nav__sheet-link"
            onClick={() => setIsOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <div className="nav__sheet-actions">
          <Link href="/login" className="btn btn--text">
            Log in
          </Link>
          <Link href="/tutors" className="btn btn--primary">
            Find a Tutor
          </Link>
        </div>
      </div>
    </header>
  );
}
