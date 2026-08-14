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
    href: "/help-directory",
    eyebrow: "긴급·생활 도움",
    title: "호주 생활 도움 연락처",
    description: "000 긴급전화부터 의료상담, 통역, 위기지원, 직장 문제와 사기 신고까지 공식 연락처를 상황별로 찾으세요.",
    features: ["긴급·비긴급 구분", "전화 바로 연결", "공식 출처 확인"],
    cta: "도움 연락처 확인하기",
    categories: ["arrival", "work", "home"],
  },
  {
    href: "/arrival-checklist",
    eyebrow: "호주 도착 직후",
    title: "첫 30일 정착 체크리스트",
    description: "VEVO, 전화·교통, 은행, TFN, 의료·학생 절차부터 첫 Payslip과 생활비 점검까지 시기별로 진행하세요.",
    features: ["도착 시기별 16개 항목", "공식 기관 연결", "캘린더 리마인더"],
    cta: "정착 프로젝트 시작하기",
    categories: ["arrival", "work", "money", "home"],
  },
  {
    href: "/public-transport-guide",
    eyebrow: "차 없이 시작하기",
    title: "대중교통·통학 생활권 비교",
    description: "집 후보별 주거비와 통학시간을 비교하고 Google Maps 대중교통 경로, 주변 생활시설과 주별 교통정보를 확인하세요.",
    features: ["최대 3곳 비교", "Google Maps 연결", "학생·치안 공식 정보"],
    cta: "생활권 비교하기",
    categories: ["arrival", "home", "money"],
  },
  {
    href: "/visa-preparation-guide",
    eyebrow: "호주 첫 단계",
    title: "비자 신청·신체검사 준비 허브",
    description: "공식 비자 탐색부터 ImmiAccount, 비용, HAP ID와 국내외 지정 신체검사 기관까지 순서대로 확인하세요.",
    features: ["공식 신청 경로", "지정 병원 찾기", "총비용 계획"],
    cta: "비자 준비 시작하기",
    categories: ["arrival"],
  },
  {
    href: "/salary-calculator",
    eyebrow: "급여와 세금",
    title: "통합 급여 계산기",
    description: "시급이나 연봉을 입력해 세전·세후 급여, Super와 전체 보상 패키지를 확인하세요.",
    features: ["2025–26·2026–27 세율", "Resident·워홀 유형", "급여 비교"],
    cta: "급여 계산하기",
    categories: ["arrival", "work", "money"],
    featured: true,
  },
  {
    href: "/cost-of-living-calculator",
    eyebrow: "생활 예산",
    title: "생활비 계산기",
    description: "주·월·연 단위의 지출을 한 번에 환산하고 세후 수입에서 남는 예산을 확인하세요.",
    features: ["결제 주기 자동 환산", "사용자 항목 추가", "로컬 자동 저장"],
    cta: "생활비 계산하기",
    categories: ["arrival", "money", "home"],
  },
  {
    href: "/resume-builder",
    eyebrow: "호주 취업",
    title: "영문 이력서 빌더",
    description: "한국어 강점을 영문 초안으로 바꾸고 원하는 색상과 레이아웃의 이력서를 만드세요.",
    features: ["영문 문장 도우미", "실시간 A4 미리보기", "PDF·백업 저장"],
    cta: "이력서 만들기",
    categories: ["work"],
  },
  {
    href: "/savings-goal-calculator",
    eyebrow: "저축과 비상금",
    title: "저축 목표 계산기",
    description: "목표 달성 기간을 계산하거나 원하는 기한에 맞는 정기 저축액을 확인하세요.",
    features: ["주·격주·월 저축", "예상 이자 반영", "두 가지 계산 방식"],
    cta: "저축 계획 세우기",
    categories: ["money"],
  },
  {
    href: "/job-application-tracker",
    eyebrow: "구직 프로젝트",
    title: "구직 지원 트래커",
    description: "관심 공고, 지원일, 면접과 다음 행동을 기록해 구직 활동을 꾸준히 관리하세요.",
    features: ["진행 상태 관리", "면접 일정 확인", "로컬 저장·백업"],
    cta: "지원 현황 관리하기",
    categories: ["work"],
  },
  {
    href: "/career-pathways",
    eyebrow: "직업과 진로",
    title: "호주 직업·부족 분야 탐색기",
    description: "주요 직업의 하는 일과 준비 항목을 살펴보고 공식 부족·비자 목록을 구분해 확인하세요.",
    features: ["공식 출처 연결", "분야별 직업 검색", "자격·면허 준비 항목"],
    cta: "직업 분야 살펴보기",
    categories: ["arrival", "work"],
  },
  {
    href: "/tax-return-guide",
    eyebrow: "EOFY 준비",
    title: "택스 리턴 준비 허브",
    description: "소득 자료와 공제 증빙을 빠짐없이 준비하고, 공식 신고 일정과 다음 행동을 체크하세요.",
    features: ["개인 준비 체크리스트", "ATO 공식 링크", "민감정보 입력 없음"],
    cta: "택스 리턴 준비하기",
    categories: ["money", "annual"],
  },
  {
    href: "/service-quote-comparator",
    eyebrow: "생활 서비스",
    title: "서비스 견적 비교표",
    description: "플러머·전기기사·청소·이사 등 최대 3개 견적을 가격과 확인 항목으로 나란히 비교하세요.",
    features: ["항목별 가격 비교", "ABN·면허 확인", "계약 전 질문"],
    cta: "견적 비교하기",
    categories: ["home"],
  },
  {
    href: "/property-inspection-checklist",
    eyebrow: "집 구하기",
    title: "쉐어하우스·집 방문 체크리스트",
    description: "쉐어하우스부터 일반 렌트와 구매까지 집 상태, 비용, 계약, 안전과 생활 환경을 현장에서 점검하세요.",
    features: ["쉐어·렌트·구매 모드", "우려 항목 모아보기", "주별 공식 정보"],
    cta: "집 점검 시작하기",
    categories: ["arrival", "home"],
  },
  {
    href: "/used-car-comparison",
    eyebrow: "차량 구매",
    title: "중고차 구매 비교표",
    description: "구매가, Rego, 보험, 정비와 연료비를 합산하고 PPSR·VIN·사전검사 여부를 비교하세요.",
    features: ["첫 1년 비용", "PPSR 확인", "최대 3대 비교"],
    cta: "차량 비교하기",
    categories: ["home", "money"],
  },
  {
    href: "/moving-checklist",
    eyebrow: "이사 준비",
    title: "이사 체크리스트와 리마인더",
    description: "퇴거 통지, 공과금, 주소 변경, Condition report와 보증금까지 시기별로 관리하세요.",
    features: ["23개 준비 항목", "이사일 리마인더", "주소 변경 목록"],
    cta: "이사 준비 시작하기",
    categories: ["arrival", "home"],
  },
  {
    href: "/service-price-log",
    eyebrow: "서비스 가격 데이터",
    title: "내 서비스 가격 기록",
    description: "생활 서비스의 견적·결제 금액을 항목별로 기록하고 서비스별 개인 중앙값과 범위를 확인하세요.",
    features: ["업체명 수집 없음", "개인 가격 범위", "기기 내 저장"],
    cta: "가격 기록하기",
    categories: ["home", "annual"],
  },
  {
    href: "/life-admin-reminder",
    eyebrow: "생활 일정",
    title: "만료일·갱신 일정 리마인더",
    description: "비자, 여권, 렌트, Rego, 보험과 자격증처럼 놓치기 쉬운 날짜를 기록하고 캘린더에 추가하세요.",
    features: ["기기 내 일정 저장", "준비 시작일 계산", "캘린더 파일 생성"],
    cta: "생활 일정 정리하기",
    categories: ["arrival", "work", "home", "annual", "departure"],
  },
  {
    href: "/social-card-maker",
    eyebrow: "SNS 콘텐츠",
    title: "호주 생활 카드뉴스 만들기",
    description: "검증한 생활 정보를 Instagram 게시물·스토리용 이미지와 설명문으로 만들고 바로 저장하세요.",
    features: ["3가지 이미지 크기", "예시 문장", "PNG·설명문 저장"],
    cta: "SNS 카드 만들기",
    categories: ["arrival", "work", "money", "home", "annual", "departure"],
  },
  {
    href: "/data-transfer",
    eyebrow: "기록 관리",
    title: "기기 데이터 백업·이전",
    description: "체크리스트, 이력서, 계산 기록을 개인 JSON 파일로 백업하고 새 공식 주소나 다른 기기에서 이어가세요.",
    features: ["서버 전송 없음", "항목별 선택", "기존 기록 우선 보존"],
    cta: "기록 백업하기",
    categories: ["arrival", "work", "money", "home", "annual", "departure"],
  },
  {
    href: "/leaving-australia-guide",
    eyebrow: "호주 생활 마무리",
    title: "귀국 준비·Super DASP 허브",
    description: "퇴사, 렌트, 공과금과 계정 접근을 정리하고 출국 후 DASP와 마지막 세금 업무를 준비하세요.",
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
            <div className="max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">Hoju Compass / Toolkit</p><h1 className="mt-4 text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy sm:text-6xl">호주 생활에서<br/><span className="font-normal italic text-navy-light">막막한 순간을 위한 도구.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">급여를 확인하고, 집과 일을 준비하고, 귀국까지. 필요한 순간에 꺼내 쓰는 실용 도구를 한곳에 모았습니다.</p></div>
            <div className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">계정도, 제출도 없습니다.</strong>입력 내용은 별도 안내가 없는 한 현재 브라우저에만 저장됩니다.</div>
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
