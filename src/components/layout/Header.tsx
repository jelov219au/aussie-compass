"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";

export function Header() {
  const content = getContent();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { label: content.nav.tools, href: "/tools" },
    { label: content.nav.guides, href: "/resources" },
    { label: "나의 진행", href: "/my-compass" },
    { label: "Pro", href: "/pro" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md" onKeyDown={(event) => {
      if (event.key === "Escape" && menuOpen) {
        event.preventDefault();
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }}>
      <Container className="flex h-[4.5rem] items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2.5 rounded-sm text-base font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 sm:text-lg">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy shadow-sm" aria-hidden="true">
            <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
              <path d="m11 8 5 7 5-3 3 7" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <circle cx="11" cy="8" r="1.6" fill="#F4D36A" />
              <circle cx="16" cy="15" r="1.8" fill="#F4D36A" />
              <circle cx="21" cy="12" r="1.4" fill="#F4D36A" />
              <circle cx="24" cy="19" r="1.7" fill="#F4D36A" />
            </svg>
          </span>
          {content.brand.name}
        </Link>

        <nav
          className="hidden items-center gap-7 md:flex"
          aria-label="주요 메뉴"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-sm text-sm font-medium text-muted transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/search" aria-label="통합 검색" className="ml-1 inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-navy transition hover:border-navy/25 hover:bg-surface">검색</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <Link
            href="/search"
            aria-label="통합 검색"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-navy transition hover:border-navy/25 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 min-[420px]:px-4"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 min-[420px]:hidden" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.75" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
            <span className="hidden min-[420px]:inline">검색</span>
          </Link>
          <button
            ref={menuButtonRef}
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 md:hidden"
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
            <span>{menuOpen ? "닫기" : "메뉴"}</span>
          </button>
        </div>
      </Container>

      {menuOpen ? (
        <nav
          id="mobile-menu"
          className="max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain border-t border-border bg-background md:hidden"
          aria-label="모바일 메뉴"
        >
          <Container className="flex flex-col gap-1 py-3">
            <Link
              href="/resume-builder"
              className="mb-1 flex min-h-11 items-center justify-between rounded-lg bg-gold/15 px-3 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-gold/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              onClick={() => setMenuOpen(false)}
            >
              <span>무료 영문 이력서 빌더</span>
              <span aria-hidden="true">→</span>
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </Container>
        </nav>
      ) : null}
    </header>
  );
}
