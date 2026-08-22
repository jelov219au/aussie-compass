import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { ToolsDirectory, type DirectoryTool } from "@/components/tools/ToolsDirectory";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 생활 무료 도구 | Hoju Compass",
  description: "호주 급여, 생활비 계산기와 영문 이력서 빌더를 한곳에서 이용하세요.",
  path: "/tools",
});

const availableTools: DirectoryTool[] = [
  {
    href: "/english-phrase-cards",
    eyebrow: "말이 막히는 순간",
    title: "호주 생활 영어 문장 카드",
    description: "은행, 렌트, 직장과 병원에서 바로 쓸 수 있는 확인 문장을 상황별로 고르고 이 기기에 저장할 수 있어요.",
    features: ["상황별 25개 문장", "영어·한국어 복사", "기기 내 저장"],
    cta: "필요한 문장 찾기",
    categories: ["arrival", "work", "home"],
  },
  {
    href: "/help-directory",
    eyebrow: "긴급·생활 도움",
    title: "호주 생활 도움 연락처",
    description: "000 긴급전화부터 의료 상담, 통역, 직장 문제와 사기 신고까지 상황에 맞는 공식 연락처를 빠르게 찾을 수 있어요.",
    features: ["긴급·비긴급 구분", "전화 바로 연결", "공식 출처 확인"],
    cta: "도움 연락처 확인하기",
    categories: ["arrival", "work", "home"],
  },
  {
    href: "/arrival-checklist",
    eyebrow: "호주 도착 직후",
    title: "첫 30일 정착 체크리스트",
    description: "VEVO와 전화·교통, 은행, TFN부터 첫 Payslip과 생활비까지 도착한 시점에 맞춰 하나씩 챙길 수 있어요.",
    features: ["도착 시기별 16개 항목", "공식 기관 연결", "캘린더 리마인더"],
    cta: "정착 프로젝트 시작하기",
    categories: ["arrival", "work", "money", "home"],
  },
  {
    href: "/public-transport-guide",
    eyebrow: "차 없이 시작하기",
    title: "대중교통·통학 생활권 비교",
    description: "집 후보별 주거비와 통학시간, Google Maps 대중교통 경로와 주변 생활시설을 한 화면에서 비교할 수 있어요.",
    features: ["최대 3곳 비교", "Google Maps 연결", "학생·치안 공식 정보"],
    cta: "생활권 비교하기",
    categories: ["arrival", "home", "money"],
  },
  {
    href: "/overseas-driver-licence-guide",
    eyebrow: "한국 면허로 운전하기",
    title: "주별 해외면허·면허 전환 가이드",
    description: "생활할 주와 비자 상태에 맞춰 한국 면허 사용 기간과 번역, 현지 면허 전환 준비를 살펴볼 수 있어요.",
    features: ["8개 주·준주 비교", "한국 면허 주의점", "공식 기관 바로가기"],
    cta: "거주 주 규정 확인하기",
    categories: ["arrival", "home"],
  },
  {
    href: "/visa-preparation-guide",
    eyebrow: "호주 첫 단계",
    title: "비자 신청·신체검사 준비 허브",
    description: "공식 비자 찾기부터 ImmiAccount, 비용, HAP ID와 지정 신체검사 기관까지 필요한 순서로 정리했어요.",
    features: ["공식 신청 경로", "지정 병원 찾기", "총비용 계획"],
    cta: "비자 준비 시작하기",
    categories: ["arrival"],
  },
  {
    href: "/salary-calculator",
    eyebrow: "급여와 세금",
    title: "통합 급여 계산기",
    description: "시급이나 연봉을 입력하면 세전·세후 급여와 Super, 전체 보상 금액을 함께 볼 수 있어요.",
    features: ["2025–26·2026–27 세율", "Resident·워홀 유형", "급여 비교"],
    cta: "급여 계산하기",
    categories: ["arrival", "work", "money"],
    featured: true,
  },
  {
    href: "/cost-of-living-calculator",
    eyebrow: "생활 예산",
    title: "생활비 계산기",
    description: "제각각인 지출 주기를 월 기준으로 맞추고, 세후 수입에서 실제로 얼마나 남는지 계산할 수 있어요.",
    features: ["결제 주기 자동 환산", "사용자 항목 추가", "로컬 자동 저장"],
    cta: "생활비 계산하기",
    categories: ["arrival", "money", "home"],
  },
  {
    href: "/resume-builder",
    eyebrow: "호주 취업",
    title: "영문 이력서 빌더",
    description: "한국어로 적은 강점을 자연스러운 영문 초안으로 바꾸고, 원하는 디자인의 이력서를 만들 수 있어요.",
    features: ["영문 문장 도우미", "실시간 A4 미리보기", "PDF·백업 저장"],
    cta: "이력서 만들기",
    categories: ["work"],
  },
  {
    href: "/savings-goal-calculator",
    eyebrow: "저축과 비상금",
    title: "저축 목표 계산기",
    description: "지금 저축 속도로 얼마나 걸리는지, 원하는 날짜에 맞추려면 얼마씩 모아야 하는지 계산할 수 있어요.",
    features: ["주·격주·월 저축", "예상 이자 반영", "두 가지 계산 방식"],
    cta: "저축 계획 세우기",
    categories: ["money"],
  },
  {
    href: "/job-application-tracker",
    eyebrow: "구직 프로젝트",
    title: "구직 지원 트래커",
    description: "관심 공고와 지원일, 면접 일정, 다음 할 일을 한곳에 기록해 두고 이어볼 수 있어요.",
    features: ["진행 상태 관리", "면접 일정 확인", "로컬 저장·백업"],
    cta: "지원 현황 관리하기",
    categories: ["work"],
  },
  {
    href: "/career-pathways",
    eyebrow: "직업과 진로",
    title: "호주 직업·부족 분야 탐색기",
    description: "주요 직업이 실제로 어떤 일을 하는지 살펴보고, 부족 직군과 비자 직업 목록의 차이도 알아볼 수 있어요.",
    features: ["공식 출처 연결", "분야별 직업 검색", "자격·면허 준비 항목"],
    cta: "직업 분야 살펴보기",
    categories: ["arrival", "work"],
  },
  {
    href: "/tax-return-guide",
    eyebrow: "EOFY 준비",
    title: "택스 리턴 준비 허브",
    description: "소득 자료와 공제 증빙, 공식 신고 일정까지 EOFY에 챙길 내용을 순서대로 모았어요.",
    features: ["개인 준비 체크리스트", "ATO 공식 링크", "민감정보 입력 없음"],
    cta: "택스 리턴 준비하기",
    categories: ["money", "annual"],
  },
  {
    href: "/service-quote-comparator",
    eyebrow: "생활 서비스",
    title: "서비스 견적 비교표",
    description: "플러머와 전기기사, 청소, 이사 등 최대 3개 견적을 같은 항목으로 나란히 비교할 수 있어요.",
    features: ["항목별 가격 비교", "ABN·면허 확인", "계약 전 질문"],
    cta: "견적 비교하기",
    categories: ["home"],
  },
  {
    href: "/property-inspection-checklist",
    eyebrow: "집 구하기",
    title: "쉐어하우스·집 방문 체크리스트",
    description: "쉐어하우스부터 일반 렌트와 구매까지, 집을 보러 갔을 때 놓치기 쉬운 부분을 현장에서 챙길 수 있어요.",
    features: ["쉐어·렌트·구매 모드", "우려 항목 모아보기", "주별 공식 정보"],
    cta: "집 점검 시작하기",
    categories: ["arrival", "home"],
  },
  {
    href: "/used-car-comparison",
    eyebrow: "차량 구매",
    title: "중고차 구매 비교표",
    description: "차값뿐 아니라 Rego와 보험, 정비, 연료비까지 더해 최대 3대의 실제 부담을 비교할 수 있어요.",
    features: ["첫 1년 비용", "PPSR 확인", "최대 3대 비교"],
    cta: "차량 비교하기",
    categories: ["home", "money"],
  },
  {
    href: "/moving-checklist",
    eyebrow: "이사 준비",
    title: "이사 체크리스트와 리마인더",
    description: "퇴거 통지와 공과금, 주소 변경, Condition report, 보증금까지 이사 날짜에 맞춰 챙길 수 있어요.",
    features: ["23개 준비 항목", "이사일 리마인더", "주소 변경 목록"],
    cta: "이사 준비 시작하기",
    categories: ["arrival", "home"],
  },
  {
    href: "/service-price-log",
    eyebrow: "서비스 가격 데이터",
    title: "내 서비스 가격 기록",
    description: "받은 견적과 실제 결제 금액을 기록해 두면 다음 견적을 판단할 나만의 가격 기준이 생겨요.",
    features: ["업체명 수집 없음", "개인 가격 범위", "기기 내 저장"],
    cta: "가격 기록하기",
    categories: ["home", "annual"],
  },
  {
    href: "/life-admin-reminder",
    eyebrow: "생활 일정",
    title: "만료일·갱신 일정 리마인더",
    description: "비자와 여권, 렌트, Rego, 보험처럼 놓치기 쉬운 날짜를 기록하고 내 캘린더에 남길 수 있어요.",
    features: ["기기 내 일정 저장", "준비 시작일 계산", "캘린더 파일 생성"],
    cta: "생활 일정 정리하기",
    categories: ["arrival", "work", "home", "annual", "departure"],
  },
  {
    href: "/data-transfer",
    eyebrow: "기록 관리",
    title: "기기 데이터 백업·이전",
    description: "체크리스트와 이력서, 계산 기록을 개인 파일로 받아두고 다른 기기에서도 이어볼 수 있어요.",
    features: ["서버 전송 없음", "항목별 선택", "기존 기록 우선 보존"],
    cta: "기록 백업하기",
    categories: ["arrival", "work", "money", "home", "annual", "departure"],
  },
  {
    href: "/leaving-australia-guide",
    eyebrow: "호주 생활 마무리",
    title: "귀국 준비·Super DASP 허브",
    description: "퇴사와 렌트, 공과금, 계정 접근부터 출국 후 DASP와 마지막 세금 업무까지 차례로 정리했어요.",
    features: ["출국 전후 20개 항목", "DASP 조건 안내", "공식 신청 연결"],
    cta: "귀국 준비 시작하기",
    categories: ["departure", "money"],
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
          <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_15rem] lg:items-end">
            <div className="max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">필요한 순간에 꺼내 쓰는 도구</p><h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy sm:text-6xl">호주 생활에서<br/><span className="font-normal text-navy-light">막막한 순간을 위해.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">급여가 맞는지 궁금할 때, 집이나 일을 준비할 때, 귀국을 앞두고 있을 때. 지금 필요한 도구부터 편하게 골라보세요.</p></div>
            <div className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">계정을 만들 필요 없어요.</strong>별도 안내가 없는 한 입력한 내용은 지금 사용하는 브라우저에만 저장돼요.</div>
          </div>

          <ToolsDirectory tools={availableTools} />

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
