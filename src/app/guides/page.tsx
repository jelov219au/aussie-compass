import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 급여 가이드 | Hoju Compass",
  description: "호주 최저 시급, Award, Payslip, Super, 미지급 급여와 휴가 권리를 한국어로 확인하세요.",
  path: "/guides",
});

const guides = [
  { href: "/minimum-wage-guide", title: "최저 시급 가이드", description: "최신 호주 최저 시급과 적용 기준을 확인합니다.", tag: "시급", covers: ["전국 최저임금과 적용 시점", "Award 시급을 따로 확인해야 하는 이유"] },
  { href: "/award-guide", title: "내 Award 찾기", description: "Award와 Classification을 찾아 정확한 시급을 확인합니다.", tag: "시급", covers: ["업종·직무로 Award 좁히기", "Level과 근무 시간대별 시급 확인"] },
  { href: "/casual-loading-guide", title: "Casual Loading", description: "Casual 시급이 높은 이유와 25% Loading을 알아봅니다.", tag: "고용 형태", covers: ["기본 시급과 Loading 구분", "주말·공휴일 Penalty와 비교"] },
  { href: "/payslip-guide", title: "Payslip 읽는 법", description: "Gross, Net, PAYG, Super와 YTD 항목을 쉽게 확인합니다.", tag: "급여 확인", covers: ["급여명세서 필수 항목", "근무 기록과 차이가 날 때 확인 순서"] },
  { href: "/underpayment-guide", title: "급여가 적게 들어왔다면", description: "기록과 Payslip을 비교하고 차액을 문의하는 순서를 봅니다.", tag: "문제 해결", covers: ["증거를 남기는 방법", "고용주 문의부터 Fair Work 도움까지"] },
  { href: "/super-guide", title: "Super 이해하기", description: "Super 12%와 급여 패키지 포함 여부를 확인합니다.", tag: "Super", covers: ["급여와 별도인지 포함인지 확인", "납부 내역과 계좌 확인 방법"] },
  { href: "/leave-guide", title: "휴가·병가·공휴일", description: "Annual Leave, Personal Leave와 Public Holiday 권리를 비교합니다.", tag: "휴가", covers: ["고용 형태별 휴가 차이", "공휴일 근무와 휴무 조건"] },
];

export default function GuidesPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "급여 가이드", path: "/guides" }]} />
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
            <ul className="grid border-y border-navy/20 lg:grid-cols-2">
              {guides.map((guide, index) => (
                <li key={guide.href} className="border-b border-border last:border-b-0 lg:odd:border-r lg:last:border-r-0">
                  <Link href={guide.href} className="group grid h-full min-h-72 grid-cols-[3rem_1fr] gap-4 p-6 transition hover:bg-white/70 sm:p-8">
                    <span className="font-mono text-sm text-gold">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{guide.tag}</span>
                      <strong className="mt-2 text-xl font-semibold text-navy sm:text-2xl">{guide.title}</strong>
                      <span className="mt-2 text-sm leading-6 text-muted">{guide.description}</span>
                      <span className="mt-5 border-l-2 border-gold/70 pl-4">
                        {guide.covers.map((item) => <span key={item} className="block py-1 text-sm leading-6 text-navy">{item}</span>)}
                      </span>
                      <span className="mt-auto pt-6 text-sm font-semibold text-navy">가이드 읽기 <span className="inline-block transition group-hover:translate-x-1">→</span></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 border-l-4 border-gold bg-navy p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
            <div>
              <h2 className="text-xl font-semibold">내 급여를 바로 계산하고 싶나요?</h2>
              <p className="mt-2 leading-7 text-white/70">시급이나 연봉을 입력해 세전·세후 급여, Super와 총 패키지를 확인하세요.</p>
            </div>
            <Link href="/salary-calculator" className="mt-5 inline-flex min-h-11 shrink-0 items-center justify-center bg-gold px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-gold/90 sm:mt-0">통합 급여 계산기 열기</Link>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
