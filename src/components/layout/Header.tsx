"use client";

import { useState } from "react";
import Link from "next/link";
import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";

export function Header() {
  const content = getContent();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: content.nav.tools, href: "/tools" },
    { label: content.nav.guides, href: "/resources" },
    { label: "나의 진행", href: "/my-compass" },
    { label: "Pro", href: "/pro" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 rounded-sm text-lg font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"><span className="relative inline-flex h-7 w-7 items-center justify-center rounded-full border border-gold/70" aria-hidden="true"><span className="h-2 w-2 rotate-45 border-r border-t border-navy" /></span>{content.brand.name}</Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="주요 메뉴"
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
          <Link href="/search" className="ml-1 inline-flex min-h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-navy transition hover:border-navy/25 hover:bg-surface">검색</Link>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link href="/search" className="hidden min-h-10 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-navy min-[420px]:inline-flex">검색</Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "메뉴 닫기" : "메뉴 열기"}
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
          aria-label="모바일 메뉴"
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
            <Link href="/search" className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-4 text-sm font-semibold text-white min-[420px]:hidden" onClick={() => setMenuOpen(false)}>검색</Link>
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
