import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToolIcon } from "@/components/icons/Icons";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 생활 무료 도구 | Aussie Compass",
  description: "호주 급여, 생활비 계산기와 영문 이력서 빌더를 한곳에서 이용하세요.",
  path: "/tools",
});

const availableTools = [
  {
    href: "/salary-calculator",
    eyebrow: "급여와 세금",
    title: "통합 급여 계산기",
    description: "시급이나 연봉을 입력해 세전·세후 급여, Super와 전체 보상 패키지를 확인하세요.",
    features: ["2025–26·2026–27 세율", "Resident·워홀 유형", "급여 비교"],
    cta: "급여 계산하기",
    featured: true,
  },
  {
    href: "/cost-of-living-calculator",
    eyebrow: "생활 예산",
    title: "생활비 계산기",
    description: "주·월·연 단위의 지출을 한 번에 환산하고 세후 수입에서 남는 예산을 확인하세요.",
    features: ["결제 주기 자동 환산", "사용자 항목 추가", "로컬 자동 저장"],
    cta: "생활비 계산하기",
  },
  {
    href: "/resume-builder",
    eyebrow: "호주 취업",
    title: "영문 이력서 빌더",
    description: "한국어 강점을 영문 초안으로 바꾸고 원하는 색상과 레이아웃의 이력서를 만드세요.",
    features: ["영문 문장 도우미", "실시간 A4 미리보기", "PDF·백업 저장"],
    cta: "이력서 만들기",
  },
  {
    href: "/savings-goal-calculator",
    eyebrow: "저축과 비상금",
    title: "저축 목표 계산기",
    description: "목표 달성 기간을 계산하거나 원하는 기한에 맞는 정기 저축액을 확인하세요.",
    features: ["주·격주·월 저축", "예상 이자 반영", "두 가지 계산 방식"],
    cta: "저축 계획 세우기",
  },
  {
    href: "/job-application-tracker",
    eyebrow: "구직 프로젝트",
    title: "구직 지원 트래커",
    description: "관심 공고, 지원일, 면접과 다음 행동을 기록해 구직 활동을 꾸준히 관리하세요.",
    features: ["진행 상태 관리", "면접 일정 확인", "로컬 저장·백업"],
    cta: "지원 현황 관리하기",
  },
  {
    href: "/career-pathways",
    eyebrow: "직업과 진로",
    title: "호주 직업·부족 분야 탐색기",
    description: "주요 직업의 하는 일과 준비 항목을 살펴보고 공식 부족·비자 목록을 구분해 확인하세요.",
    features: ["공식 출처 연결", "분야별 직업 검색", "자격·면허 준비 항목"],
    cta: "직업 분야 살펴보기",
  },
  {
    href: "/tax-return-guide",
    eyebrow: "EOFY 준비",
    title: "택스 리턴 준비 허브",
    description: "소득 자료와 공제 증빙을 빠짐없이 준비하고, 공식 신고 일정과 다음 행동을 체크하세요.",
    features: ["개인 준비 체크리스트", "ATO 공식 링크", "민감정보 입력 없음"],
    cta: "택스 리턴 준비하기",
  },
  {
    href: "/service-quote-comparator",
    eyebrow: "생활 서비스",
    title: "서비스 견적 비교표",
    description: "플러머·전기기사·청소·이사 등 최대 3개 견적을 가격과 확인 항목으로 나란히 비교하세요.",
    features: ["항목별 가격 비교", "ABN·면허 확인", "계약 전 질문"],
    cta: "견적 비교하기",
  },
  {
    href: "/property-inspection-checklist",
    eyebrow: "집 구하기",
    title: "쉐어하우스·집 방문 체크리스트",
    description: "쉐어하우스부터 일반 렌트와 구매까지 집 상태, 비용, 계약, 안전과 생활 환경을 현장에서 점검하세요.",
    features: ["쉐어·렌트·구매 모드", "우려 항목 모아보기", "주별 공식 정보"],
    cta: "집 점검 시작하기",
  },
  {
    href: "/used-car-comparison",
    eyebrow: "차량 구매",
    title: "중고차 구매 비교표",
    description: "구매가, Rego, 보험, 정비와 연료비를 합산하고 PPSR·VIN·사전검사 여부를 비교하세요.",
    features: ["첫 1년 비용", "PPSR 확인", "최대 3대 비교"],
    cta: "차량 비교하기",
  },
  {
    href: "/moving-checklist",
    eyebrow: "이사 준비",
    title: "이사 체크리스트와 리마인더",
    description: "퇴거 통지, 공과금, 주소 변경, Condition report와 보증금까지 시기별로 관리하세요.",
    features: ["23개 준비 항목", "이사일 리마인더", "주소 변경 목록"],
    cta: "이사 준비 시작하기",
  },
  {
    href: "/service-price-log",
    eyebrow: "서비스 가격 데이터",
    title: "내 서비스 가격 기록",
    description: "생활 서비스의 견적·결제 금액을 항목별로 기록하고 서비스별 개인 중앙값과 범위를 확인하세요.",
    features: ["업체명 수집 없음", "개인 가격 범위", "기기 내 저장"],
    cta: "가격 기록하기",
  },
];

export default function ToolsPage() {
  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }]} />
      <Header />
      <main className="py-12 sm:py-16">
        <Container>
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">&larr; 홈으로 돌아가기</Link>
          <div className="mt-5 max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">무료 도구 모음</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활의 복잡한 숫자와 준비를 간단하게</h1>
            <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">회원가입 없이 바로 사용할 수 있습니다. 입력 내용은 별도 안내가 없는 한 현재 브라우저에만 저장됩니다.</p>
          </div>

          <ul className="mt-10 grid gap-6 lg:grid-cols-2">
            {availableTools.map((tool) => (
              <li key={tool.href} className={tool.featured ? "lg:col-span-2" : ""}>
                <article className={`h-full overflow-hidden rounded-3xl border shadow-sm ${tool.featured ? "border-gold/40 bg-navy text-white" : "border-border bg-white text-navy"}`}>
                  <div className={`grid h-full gap-7 p-7 sm:p-9 ${tool.featured ? "lg:grid-cols-[1fr_auto] lg:items-center" : ""}`}>
                    <div>
                      <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tool.featured ? "bg-white/10 text-gold" : "bg-gold/10 text-navy"}`}><ToolIcon /></div>
                      <p className="mt-5 text-sm font-semibold text-gold">{tool.eyebrow}</p>
                      <h2 className="mt-2 text-2xl font-semibold">{tool.title}</h2>
                      <p className={`mt-3 max-w-2xl leading-7 ${tool.featured ? "text-white/70" : "text-muted"}`}>{tool.description}</p>
                      <ul className={`mt-5 flex flex-wrap gap-2 text-xs ${tool.featured ? "text-white/75" : "text-muted"}`} aria-label={`${tool.title} 주요 기능`}>{tool.features.map((feature) => <li key={feature} className={`rounded-full border px-3 py-1.5 ${tool.featured ? "border-white/15 bg-white/5" : "border-border bg-surface"}`}>{feature}</li>)}</ul>
                    </div>
                    <Link href={tool.href} className={`inline-flex min-h-12 items-center justify-center self-end rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${tool.featured ? "bg-gold text-navy hover:bg-gold/90 focus-visible:ring-white focus-visible:ring-offset-navy lg:min-w-48" : "bg-navy text-white hover:bg-navy-light focus-visible:ring-navy"}`}>{tool.cta}</Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <section className="mt-12 rounded-2xl border border-border bg-surface p-6 sm:p-8" aria-labelledby="tool-privacy-heading">
            <h2 id="tool-privacy-heading" className="text-xl font-semibold text-navy">내 정보는 어디에 저장되나요?</h2>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-muted sm:text-base">이력서와 계산기 입력값은 현재 기기의 브라우저 저장 공간을 사용합니다. 계정을 만들거나 개인 내용을 서버로 전송하지 않으며, 브라우저 데이터를 지우면 저장된 작성 내용도 함께 삭제될 수 있습니다.</p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
