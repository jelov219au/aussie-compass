import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { FirstCustomerInvitationDesk } from "@/components/tools/FirstCustomerInvitationDesk";
import { Container } from "@/components/ui/Container";
import { firstCustomerLaunchDecision } from "@/lib/firstCustomerLaunchDecision";
import { requireLocalOperatorAccess } from "@/lib/operatorOnly";
import { createPageMetadata } from "@/lib/site";

export const metadata = {
  ...createPageMetadata({
    title: "첫 고객 1회 안내 준비 | Hoju Compass",
    description: "첫 고객에게 보낼 Resume Pro 1회 안내의 승인 조건과 중단 규칙을 확인하는 운영자 전용 화면입니다.",
    path: "/first-customer-invitation",
  }),
  robots: { index: false, follow: false },
};

export default function FirstCustomerInvitationPage() {
  requireLocalOperatorAccess();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Resume Pro 성과", path: "/resume-pro-performance" }, { name: "첫 고객 1회 안내", path: "/first-customer-invitation" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/resume-pro-performance" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Resume Pro 성과 확인</Link>
          <header className="mb-10 mt-5 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_20rem] lg:items-end">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Single-customer launch desk</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">첫 고객에게 보낼<br /><span className="font-normal text-navy-light">단 한 번의 안내만 준비합니다.</span></h1>
              <p className="mt-5 max-w-3xl leading-7 text-muted">고객이 먼저 요청한 판매 시작 안내에 답장하기 전, 결제·접근 권한·운영 승인을 다시 확인합니다. 이 화면에는 고객 이름, 이메일, 이력서나 공고 내용을 입력하거나 저장하지 않습니다.</p>
            </div>
            <aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted">
              <strong className="block text-navy">로컬 운영자 전용</strong>
              메일 발송, 고객 등록과 Checkout 생성은 하지 않습니다. 모든 조건을 확인한 뒤 고정 안내문만 클립보드에 복사합니다.
            </aside>
          </header>
          <FirstCustomerInvitationDesk decision={firstCustomerLaunchDecision} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
