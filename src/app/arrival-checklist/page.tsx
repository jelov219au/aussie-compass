import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LocalProjectChecklist, type ProjectGroup } from "@/components/tools/LocalProjectChecklist";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 도착 후 첫 30일 정착 체크리스트 | Hoju Compass",
  description: "호주에 도착한 뒤 VEVO, TFN, 은행, 통신, 교통, 의료와 첫 직장 준비를 첫 30일 순서에 맞춰 챙겨보세요.",
  path: "/arrival-checklist",
});

const groups: ProjectGroup[] = [
  { title: "도착 당일·첫 48시간", items: [
    { id: "safe-arrival", label: "숙소 도착과 비상 연락 확인", detail: "공항에서 숙소까지의 공식 이동 경로, 체크인 방법과 신뢰할 수 있는 연락처를 확인하세요." },
    { id: "sim", label: "호주 전화번호와 데이터 준비", detail: "선불·SIM-only 조건, 자동 갱신, 국제전화와 해지 방법을 비교하고 계약 화면을 보관하세요." },
    { id: "transport", label: "지역 교통 결제수단 설정", detail: "실물 카드와 비접촉 결제 가능 여부, 등록·분실 보호와 요금 상한을 공식 교통기관에서 확인하세요." },
    { id: "vevo", label: "VEVO에서 현재 비자 조건 확인", detail: "근무·학업 조건과 체류기간을 직접 확인하되 여권번호·grant number는 이 체크리스트에 적지 마세요." },
  ]},
  { title: "첫 7일", items: [
    { id: "bank", label: "은행 계좌 개설과 수수료 확인", detail: "신분증·주소 증빙 요구사항과 계좌 수수료를 확인하고 OTP·보안 알림을 설정하세요." },
    { id: "tfn", label: "근로 예정이라면 공식 ATO에서 TFN 신청", detail: "호주에 도착한 뒤 본인에게 맞는 신청 경로를 사용하고 TFN을 구직 사이트나 고용주 외 제3자에게 공개하지 마세요." },
    { id: "student-address", label: "학생은 학교 주소 신고 의무 확인", detail: "비자 조건과 학교 안내에서 도착 후 주소 통지 기한을 확인하고 공식 학생 포털로 업데이트하세요." },
    { id: "usi", label: "학생은 입국 후 USI 생성 여부 확인", detail: "호주에서 VET·고등교육을 이수한다면 공식 USI 안내와 학교 요구사항을 확인하세요." },
  ]},
  { title: "첫 2주", items: [
    { id: "health", label: "의료 보장과 이용 방법 확인", detail: "OSHC·OVHC·여행보험 또는 Medicare 자격을 단정하지 말고 본인 보험사와 Services Australia에서 확인하세요." },
    { id: "gp", label: "가까운 GP·약국·응급 경로 저장", detail: "진료비, direct billing 여부와 예약 취소비를 확인하고 위급할 때는 000을 이용하세요." },
    { id: "housing", label: "장기 주거 후보와 통학 경로 비교", detail: "주세뿐 아니라 공과금, 보증금, 도보·환승시간과 늦은 귀가 동선을 함께 비교하세요." },
    { id: "scam", label: "신분정보·송금 사기 대비", detail: "정부기관을 사칭한 긴급 송금, 상품권, 원격접속 요구에 응하지 말고 공식 번호로 다시 확인하세요." },
  ]},
  { title: "첫 30일", items: [
    { id: "work-records", label: "첫 직장 근무기록 방식 준비", detail: "시작·종료·휴게시간, 업무와 약속된 시급을 고용주 기록과 별도로 보관하세요." },
    { id: "super", label: "Super fund 선택·납부 정보 준비", detail: "새 계좌를 만들기 전 기존 계좌 유무와 수수료·보험을 확인하고 myGov 연결은 공식 경로만 이용하세요." },
    { id: "payslip", label: "첫 Payslip과 입금액 비교", detail: "Award·분류, 시급, 근무시간, PAYG와 Super 항목을 확인하고 이상하면 기록을 바탕으로 질문하세요." },
    { id: "budget", label: "실제 한 달 생활비로 예산 갱신", detail: "처음 예상과 실제 주거·교통·식비를 비교하고 비상금과 다음 달 저축액을 조정하세요." },
  ]},
];

const officialLinks = [
  ["현재 비자 조건", "VEVO", "https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online"],
  ["근로·세금 준비", "ATO TFN 신청 안내", "https://www.ato.gov.au/individuals-and-families/tax-file-number/apply-for-a-tfn/foreign-passport-holders-permanent-migrants-and-temporary-visitors-tfn-application"],
  ["학생 학적 준비", "공식 USI 안내", "https://www.usi.gov.au/students/international-students-and-students-studying-overseas"],
  ["의료 자격", "Medicare 가입 자격", "https://www.servicesaustralia.gov.au/enrolling-medicare"],
  ["유학생 첫 주", "Study Australia", "https://www.studyaustralia.gov.au/en/plan-your-move/your-first-week-in-australia.html"],
  ["근로 권리", "Fair Work 시작 안내", "https://www.fairwork.gov.au/starting-employment"],
];

export default function ArrivalChecklistPage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "호주 도착 후 30일", path: "/arrival-checklist" }]} /><Header /><main className="py-12 sm:py-16"><Container>
  <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
  <div className="mt-5 max-w-4xl"><p className="text-sm font-semibold text-gold">비자 승인 뒤, 이제 호주 생활을 시작할 차례</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 도착 후 첫 30일, 필요한 것부터 차근차근</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">도착하자마자 모든 일을 끝낼 필요는 없어요. 첫날에는 연락과 이동을 챙기고, 첫 주에는 비자 조건과 은행·TFN을 확인하는 식으로 여유 있게 따라가 보세요.</p></div>

  <div className="my-8 grid gap-4 md:grid-cols-4">{[["DAY 1–2", "연락·교통", "숙소 도착, 전화번호와 이동수단"], ["WEEK 1", "공식 등록", "VEVO, 은행, TFN과 학생 절차"], ["WEEK 2", "생활 기반", "의료, 장기 주거와 사기 예방"], ["DAY 30", "첫 점검", "Payslip, Super와 실제 생활비"]].map(([time, title, body], index) => <article key={time} className={`rounded-2xl border p-5 ${index === 0 ? "border-gold/40 bg-gold/5" : "border-border bg-white"}`}><p className="text-xs font-semibold text-gold">{time}</p><h2 className="mt-2 font-semibold text-navy">{title}</h2><p className="mt-2 text-sm leading-6 text-muted">{body}</p></article>)}</div>

  <LocalProjectChecklist storageKey="arrival-first-30-days" eyebrow="하나씩 체크하며 이어가기" title="첫 30일 체크리스트" description="체크한 항목만 이 브라우저에 남아요. 여권, TFN, 비자 번호, 계좌·보험 정보는 적지 않아도 됩니다." groups={groups} dateLabel="30일 정착 점검일" calendarTitle="호주 도착 후 정착 진행 점검" />

  <section className="mt-10" aria-labelledby="arrival-official-heading"><h2 id="arrival-official-heading" className="text-2xl font-semibold text-navy">공식 확인 바로가기</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">자격·기한·필요 서류는 비자와 개인 상황에 따라 다릅니다. 아래 기관에서 최신 기준을 직접 확인하세요.</p><ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{officialLinks.map(([eyebrow, label, href]) => <li key={label}><a href={href} target="_blank" rel="noreferrer" className="flex h-full min-h-28 flex-col justify-between rounded-xl border border-border bg-white p-4 transition hover:border-gold"><span className="text-xs font-semibold text-gold">{eyebrow}</span><strong className="text-navy">{label} ↗</strong></a></li>)}</ul></section>

  <section className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Link href="/resources/tfn-application-after-arrival-australia" className="rounded-2xl bg-navy p-6 text-white"><span className="text-sm font-semibold text-gold">첫 7일</span><strong className="mt-2 block text-lg">TFN 상세 신청 가이드 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-white/70">신청 자격, 28일 처리 흐름과 번호 보안</span></Link><Link href="/resources/australia-sim-esim-setup-guide" className="rounded-2xl border border-gold/40 bg-gold/5 p-6"><span className="text-sm font-semibold text-gold">도착 당일</span><strong className="mt-2 block text-lg text-navy">SIM·eSIM 안전하게 개통하기 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">요금제, 본인 확인, 번호 이동과 SIM swap 예방</span></Link><Link href="/resources/australia-bank-account-opening-guide" className="rounded-2xl border border-border bg-white p-6"><span className="text-sm font-semibold text-gold">첫 계좌</span><strong className="mt-2 block text-lg text-navy">은행 계좌 안전하게 열기 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">수수료, 신원 확인, TFN·PayID와 보안 설정</span></Link><Link href="/public-transport-guide" className="rounded-2xl border border-border bg-white p-6"><span className="text-sm font-semibold text-gold">집과 통학</span><strong className="mt-2 block text-lg text-navy">생활권 후보 비교하기 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">주거비와 학교·직장까지 대중교통 시간 비교</span></Link><Link href="/salary-calculator" className="rounded-2xl border border-border bg-white p-6"><span className="text-sm font-semibold text-gold">첫 직장</span><strong className="mt-2 block text-lg text-navy">예상 급여 확인하기 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">세전·세후 급여와 Super를 함께 계산</span></Link><Link href="/resources/australia-gp-hospital-pharmacy-guide" className="rounded-2xl border border-border bg-white p-6"><span className="text-sm font-semibold text-gold">처음 아플 때</span><strong className="mt-2 block text-lg text-navy">GP·병원·약국 이용 순서 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">000, 진료비, Medicare·OSHC와 검사 결과 확인</span></Link></section>

  <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">중요 안내</h2><p className="mt-1">이 체크리스트는 일반적인 정착 안내이며 이민·세무·의료·금융 자문이 아닙니다. TFN·Medicare·USI 신청 가능 여부나 학생 주소 신고 기한을 자동 판정하지 않습니다. 본인의 비자 결정문, VEVO, 학교와 각 정부기관의 공식 안내를 우선하세요.</p></section>
</Container></main><Footer /></>; }
