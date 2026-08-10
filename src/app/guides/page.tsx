import type { Metadata } from "next";
import Link from "next/link";
import { GuideIcon } from "@/components/icons/Icons";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "호주 급여 가이드 | Aussie Compass",
  description: "호주 최저 시급, Award, Payslip, Super, 미지급 급여와 휴가 권리를 한국어로 확인하세요.",
};

const guides = [
  { href: "/minimum-wage-guide", title: "최저 시급 가이드", description: "최신 호주 최저 시급과 적용 기준을 확인합니다.", tag: "시급" },
  { href: "/award-guide", title: "내 Award 찾기", description: "Award와 Classification을 찾아 정확한 시급을 확인합니다.", tag: "시급" },
  { href: "/casual-loading-guide", title: "Casual Loading", description: "Casual 시급이 높은 이유와 25% Loading을 알아봅니다.", tag: "고용 형태" },
  { href: "/payslip-guide", title: "Payslip 읽는 법", description: "Gross, Net, PAYG, Super와 YTD 항목을 쉽게 확인합니다.", tag: "급여 확인" },
  { href: "/underpayment-guide", title: "급여가 적게 들어왔다면", description: "기록과 Payslip을 비교하고 차액을 문의하는 순서를 봅니다.", tag: "문제 해결" },
  { href: "/super-guide", title: "Super 이해하기", description: "Super 12%와 급여 패키지 포함 여부를 확인합니다.", tag: "Super" },
  { href: "/leave-guide", title: "휴가·병가·공휴일", description: "Annual Leave, Personal Leave와 Public Holiday 권리를 비교합니다.", tag: "휴가" },
];

export default function GuidesPage() {
  return (
    <>
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/" className="inline-flex text-sm font-medium text-muted transition-colors hover:text-navy">&larr; 홈으로 돌아가기</Link>
          <div className="mt-6 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Pay Guides</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 급여 정보를 주제별로 확인하세요</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">계산이 필요하면 통합 급여 계산기를, 제도와 권리를 이해하려면 아래 가이드를 선택하세요.</p>
          </div>

          <section className="mt-10" aria-labelledby="all-guides-heading">
            <h2 id="all-guides-heading" className="sr-only">전체 급여 가이드</h2>
            <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {guides.map((guide) => (
                <li key={guide.href}>
                  <Link href={guide.href} className="group flex h-full min-h-56 flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-navy"><GuideIcon /></span>
                      <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-muted">{guide.tag}</span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-navy">{guide.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted">{guide.description}</p>
                    <span className="mt-5 text-sm font-semibold text-navy group-hover:text-navy-light">가이드 읽기 &rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl bg-navy p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">내 급여를 바로 계산하고 싶나요?</h2>
              <p className="mt-2 leading-7 text-white/70">시급이나 연봉을 입력해 세전·세후 급여, Super와 총 패키지를 확인하세요.</p>
            </div>
            <Link href="/salary-calculator" className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold/90 sm:mt-0">통합 급여 계산기 열기</Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
