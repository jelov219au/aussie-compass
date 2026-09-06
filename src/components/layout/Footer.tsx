import Link from "next/link";
import { getContent } from "@/content";
import { Container } from "@/components/ui/Container";

export function Footer() {
  const content = getContent();
  const year = new Date().getFullYear();

  const footerLinks = [
    { label: content.nav.tools, href: "/tools" },
    { label: content.nav.guides, href: "/resources" },
    { label: "나의 진행", href: "/my-compass" },
    { label: "Hoju Compass Pro", href: "/pro" },
    { label: "통합 검색", href: "/search" },
    { label: "도움 연락처", href: "/help-directory" },
  ];

  const supportLinks = [
    { label: "문의하기", href: "/contact" },
    { label: "콘텐츠 작성 원칙", href: "/editorial-policy" },
    { label: "서비스 이용 조건", href: "/terms" },
    { label: "앱으로 사용하기", href: "/install" },
    { label: "구매·환불 안내", href: "/purchase-information" },
    { label: "결제·접근 문제 해결", href: "/payment-help" },
    { label: content.footer.privacy, href: "/privacy" },
    { label: content.footer.disclaimer, href: "/disclaimer" },
  ];
  const socialLinks = [
    { label: "Instagram", href: "https://www.instagram.com/hojucompass/" },
    { label: "YouTube", href: "https://www.youtube.com/channel/UChn-PJcHHVz2XPVhHUkbFkQ" },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="py-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold text-navy">{content.brand.name}</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              {content.brand.tagline}
            </p>
            <nav className="mt-3 flex flex-wrap gap-x-5" aria-label="공식 소셜 채널">
              {socialLinks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-navy transition-colors hover:text-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">{link.label} <span className="ml-1" aria-hidden="true">↗</span><span className="sr-only"> (새 창)</span></a>)}
            </nav>
          </div>

          <nav aria-label="Footer navigation">
            <p className="text-xs font-semibold text-muted">둘러보기</p>
            <ul className="mt-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-navy transition-colors hover:text-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="지원 및 정책">
            <p className="text-xs font-semibold text-muted">지원·정책</p>
            <ul className="mt-2">
              {supportLinks.map((link) => (
                <li key={link.href}><Link href={link.href} className="inline-flex min-h-11 items-center rounded-sm text-sm font-medium text-navy transition-colors hover:text-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">{link.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 space-y-3 border-t border-border pt-6 text-xs leading-6 text-muted">
          <p>도구 입력값은 별도 안내가 없는 한 현재 브라우저에만 저장됩니다. 이메일·광고 추적은 현재 운영하지 않습니다.</p>
          <p>© {year} {content.brand.name}</p>
        </div>
      </Container>
    </footer>
  );
}
