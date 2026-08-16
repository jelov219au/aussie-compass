import Link from "next/link";
import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";
import { PageShareButton } from "@/components/pwa/PageShareButton";

export function Footer() {
  const content = getContent();
  const year = new Date().getFullYear();

  const footerLinks = [
    { label: content.nav.tools, href: "/tools" },
    { label: "나의 진행", href: "/my-compass" },
    { label: "기록 백업·이전", href: "/data-transfer" },
    { label: "통합 검색", href: "/search" },
    { label: "새 글 RSS", href: "/feed.xml" },
    { label: "생활 용어집", href: "/glossary" },
    { label: "앱으로 사용하기", href: "/install" },
    { label: content.nav.guides, href: "/resources" },
    { label: "호주 생활 단계", href: "/#journey" },
    { label: "도움 연락처", href: "/help-directory" },
    { label: content.footer.privacy, href: "/privacy" },
    { label: content.footer.disclaimer, href: "/disclaimer" },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-lg font-semibold text-navy">{content.brand.name}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {content.brand.tagline}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm font-medium text-navy transition-colors hover:text-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 rounded-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-border pt-6"><PageShareButton /></div>
        <div className="mt-5 space-y-4 text-sm leading-relaxed text-muted">
          <p>도구 입력값은 별도 안내가 없는 한 현재 브라우저에만 저장됩니다. 이메일·광고 추적은 현재 운영하지 않습니다.</p>
          <p>© {year} {content.brand.name}</p>
        </div>
      </Container>
    </footer>
  );
}
