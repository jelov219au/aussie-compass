import Link from "next/link";
import { GuideIcon, ToolIcon } from "@/components/icons/Icons";
import { Container } from "@/components/ui/Container";
import { sectionIds } from "@/lib/utils";

const payGuides = [
  {
    href: "/minimum-wage-guide",
    title: "최저임금 가이드",
    description: "최신 호주 최저임금과 캐주얼 기준 시급을 확인합니다.",
    cta: "최저임금 확인하기",
  },
  {
    href: "/casual-loading-guide",
    title: "Casual Loading",
    description: "캐주얼 시급이 더 높은 이유와 25% 로딩을 알아봅니다.",
    cta: "캐주얼 로딩 알아보기",
  },
  {
    href: "/super-guide",
    title: "Super 이해하기",
    description: "Super 12%, 급여 패키지와 납부 확인 방법을 알아봅니다.",
    cta: "Super 가이드 읽기",
  },
  {
    href: "/payslip-guide",
    title: "Payslip 읽는 법",
    description: "Gross, Net, PAYG, Super와 YTD 항목을 쉽게 확인합니다.",
    cta: "Payslip 가이드 읽기",
  },
  {
    href: "/award-guide",
    title: "내 Award 찾기",
    description: "적용 Award와 Classification을 찾아 정확한 시급을 확인합니다.",
    cta: "Award 확인 순서 보기",
  },
  {
    href: "/underpayment-guide",
    title: "급여가 적게 들어왔다면",
    description: "근무 기록과 Payslip을 비교하고 미지급 급여를 확인하는 순서를 알아봅니다.",
    cta: "급여 확인 순서 보기",
  },
  {
    href: "/leave-guide",
    title: "휴가·병가·공휴일",
    description: "Annual Leave, Personal Leave와 Public Holiday의 기본 권리를 비교합니다.",
    cta: "휴가 권리 알아보기",
  },
];

const featuredGuideHrefs = ["/minimum-wage-guide", "/payslip-guide", "/award-guide"];
const featuredGuides = payGuides.filter((guide) => featuredGuideHrefs.includes(guide.href));

export function ToolsSection() {
  return (
    <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-16 sm:py-20" aria-labelledby="pay-hub-heading">
      <Container>
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 허브</p>
          <h2 id="pay-hub-heading" className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 급여, 한곳에서 확인하세요</h2>
          <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">금액을 계산하고 싶다면 통합 급여 계산기를, 제도를 이해하고 싶다면 아래 가이드를 선택하세요.</p>
        </div>

        <article className="mt-10 overflow-hidden rounded-3xl border border-gold/40 bg-navy text-white shadow-sm">
          <div className="grid gap-8 p-7 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <div className="max-w-3xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-gold"><ToolIcon /></div>
              <p className="mt-5 text-sm font-semibold text-gold">가장 많이 사용하는 도구</p>
              <h3 className="mt-2 text-2xl font-semibold sm:text-3xl">통합 급여 계산기</h3>
              <p className="mt-3 max-w-2xl leading-7 text-white/70">시급과 주당 근무시간을 한 번만 입력하면 세전·세후 급여, Super와 총 급여 패키지를 함께 확인할 수 있습니다.</p>
              <ul className="mt-5 flex flex-wrap gap-2 text-sm text-white/80" aria-label="계산 결과">
                {["세전 급여", "예상 세후 급여", "Super 12%", "Total Package"].map((item) => (
                  <li key={item} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{item}</li>
                ))}
              </ul>
            </div>
            <Link href="/salary-calculator" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-gold px-6 py-3 font-semibold text-navy transition hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy lg:min-w-48">내 급여 계산하기</Link>
          </div>
        </article>

        <article className="mt-6 rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-navy"><ToolIcon /></div>
              <p className="mt-5 text-sm font-semibold text-gold">새로운 무료 도구</p>
              <h3 className="mt-2 text-2xl font-semibold text-navy">호주 영문 이력서 빌더</h3>
              <p className="mt-3 leading-7 text-muted">경력과 학력을 입력하면서 깔끔한 A4 이력서를 바로 확인하고 PDF로 저장하세요. 작성 내용은 현재 브라우저에만 저장됩니다.</p>
            </div>
            <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 py-3 font-semibold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 lg:min-w-48">이력서 만들기</Link>
          </div>
        </article>

        <article className="mt-6 rounded-3xl border border-border bg-white p-7 shadow-sm sm:p-9">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-navy"><ToolIcon /></div>
              <p className="mt-5 text-sm font-semibold text-gold">새로운 무료 도구</p>
              <h3 className="mt-2 text-2xl font-semibold text-navy">호주 생활비 계산기</h3>
              <p className="mt-3 leading-7 text-muted">주거비부터 연간 보험료까지 서로 다른 결제 주기를 한 번에 환산하고, 세후 수입에서 남는 예산을 확인하세요.</p>
            </div>
            <Link href="/cost-of-living-calculator" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-navy px-6 py-3 font-semibold text-white transition hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 lg:min-w-48">생활비 계산하기</Link>
          </div>
        </article>

        <div id={sectionIds.guides} className="scroll-mt-24 pt-16" aria-labelledby="pay-guides-heading">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">급여 정보 바로가기</p>
            <h2 id="pay-guides-heading" className="mt-2 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">계산 없이 필요한 정보만 확인하세요</h2>
            <p className="mt-3 leading-relaxed text-muted">궁금한 주제를 선택하면 계산기를 거치지 않고 바로 가이드를 읽을 수 있습니다.</p>
          </div>
          <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featuredGuides.map((guide) => (
              <li key={guide.href}>
                <Link href={guide.href} className="group flex h-full min-h-56 flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-navy"><GuideIcon /></div>
                  <h3 className="mt-5 text-lg font-semibold text-navy">{guide.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">{guide.description}</p>
                  <span className="mt-5 text-sm font-semibold text-navy group-hover:text-navy-light">{guide.cta} &rarr;</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-7">
            <Link href="/guides" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
              전체 급여 가이드 보기 &rarr;
            </Link>
          </div>
        </div>

      </Container>
    </section>
  );
}
