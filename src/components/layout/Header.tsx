"use client";

import { useState } from "react";
import Link from "next/link";
import { getContent } from "@/content";
import { sectionIds } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function Header() {
  const content = getContent();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: content.nav.tools, href: `/#${sectionIds.tools}` },
    { label: content.nav.guides, href: `/#${sectionIds.guides}` },
    { label: content.nav.about, href: `/#${sectionIds.about}` },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-sm">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-sm"
        >
          {content.brand.name}
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-sm"
            >
              {link.label}
            </Link>
          ))}
          <Button href={`/#${sectionIds.tools}`} className="ml-2">
            {content.nav.exploreTools}
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button href={`/#${sectionIds.tools}`} className="hidden min-[420px]:inline-flex">
            {content.nav.exploreTools}
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              {menuOpen ? (
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              ) : (
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              )}
            </svg>
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          className="border-t border-border bg-background md:hidden"
          aria-label="Mobile navigation"
        >
          <Container className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button
              href={`/#${sectionIds.tools}`}
              className="mt-2 w-full min-[420px]:hidden"
            >
              {content.nav.exploreTools}
            </Button>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
