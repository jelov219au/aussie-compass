import Link from "next/link";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { LocalProjectChecklist, type ProjectGroup } from "@/components/tools/LocalProjectChecklist";
import { PropertyInspectionChecklist } from "@/components/tools/PropertyInspectionChecklist";
import { RentalJurisdictionPicker } from "@/components/tools/RentalJurisdictionPicker";
import { Container } from "@/components/ui/Container";
import { TopicIcon, type TopicIconName } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { getRentalApplicationPaymentReadiness } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 쉐어하우스·렌트 집 방문·계약 체크리스트 | Hoju Compass",
  description: "집 방문 전부터 Bond 송금, 계약, Condition report와 입주 첫날까지 확인하고 주·준주별 공식 임대 안내를 바로 찾으세요.",
  path: "/property-inspection-checklist",
});

const inspectionPhases: Array<{ step: string; icon: TopicIconName; title: string; detail: string }> = [
  { step: "01", icon: "search", title: "방문 전", detail: "광고·가격·포함 비용·입주일을 캡처하고, 혼자 방문하면 장소와 시간을 지인에게 공유하세요." },
  { step: "02", icon: "home", title: "현장에서", detail: "허락받고 사진을 찍으며 물·창문·잠금장치·가전과 실제 거주 인원을 직접 확인하세요." },
  { step: "03", icon: "document", title: "송금 전에", detail: "계약 상대와 임대·전대 권한, 서면 조건, Bond 공식 처리 방법과 모든 초기 비용을 확인하세요." },
  { step: "04", icon: "guide", title: "입주 첫날", detail: "짐을 풀기 전에 기존 손상·오염·계량기·열쇠를 Condition report와 날짜가 보이는 사진으로 남기세요." },
];

const stopSignals = [
  "서면 agreement와 계약 상대의 이름을 보여주지 않으면서 송금을 재촉해요.",
  "집 방문·실시간 영상 확인을 계속 피하거나 광고와 실제 방·거주 인원이 달라요.",
  "Bond를 어디에 접수하는지, 공과금을 어떻게 계산하는지 글로 남기지 않아요.",
  "수리 약속·추가 비용·퇴거 조건을 말로만 설명하고 영수증 제공을 거부해요.",
];

const bookingQuestions = [
  ["Could you send me the written agreement and confirm who I will be renting from before I pay?", "돈을 내기 전에 서면 계약서와 제가 누구에게서 임차하는지 확인해 주실 수 있나요?"],
  ["Will the bond be lodged through the official bond authority for this state or territory?", "Bond가 이 주·준주의 공식 보증금 기관을 통해 접수되나요?"],
  ["What is included in the rent, and how are electricity, gas, water and internet calculated?", "주세에 무엇이 포함되고 전기·가스·수도·인터넷은 어떻게 계산되나요?"],
  ["Can I photograph existing damage and add it to the condition report before I move in?", "입주 전에 기존 손상을 촬영하고 Condition report에 추가해도 될까요?"],
];

const houseHuntGroups: ProjectGroup[] = [
  { title: "후보 정리", items: [
    { id: "save-ad", label: "광고와 연락 내용 보관", detail: "가격·포함 비용·입주일이 바뀌는 경우를 대비하세요." },
    { id: "compare-commute", label: "총 주거비와 출퇴근 비교", detail: "주세뿐 아니라 공과금, 교통비와 이동 시간을 함께 보세요." },
    { id: "inspect", label: "현장 방문과 우려 항목 재확인", detail: "사진만 보고 송금하지 말고 가능하면 직접 방문하세요." },
  ] },
  { title: "지원 준비", items: [
    { id: "documents", label: "필요 서류 범위 확인", detail: "필요한 정보만 안전한 공식 채널로 제출하세요." },
    { id: "references", label: "레퍼런스 사전 동의", detail: "연락처를 제출하기 전 해당 사람에게 알려주세요." },
    { id: "scam-check", label: "상대방과 임대 권한 확인", detail: "급한 송금이나 과도한 개인정보 요구는 멈추고 검증하세요." },
  ] },
  { title: "계약·결제", items: [
    { id: "written-agreement", label: "서면 계약 검토", detail: "기간, 비용, 퇴거 통지와 책임을 확인하세요." },
    { id: "bond-process", label: "관할 지역 보증금 절차 확인", detail: "개인 계좌 송금 전 공식 처리 방식을 확인하세요." },
    { id: "receipts", label: "모든 결제 증빙 보관", detail: "보증금, 선불 임대료와 열쇠 비용의 영수증을 보관하세요." },
  ] },
  { title: "입주", items: [
    { id: "condition-report", label: "Condition report와 사진 완료", detail: "기존 손상·오염·계량기 상태를 기한 내 기록하세요." },
    { id: "keys", label: "열쇠·출입장치 인수", detail: "받은 개수와 분실 시 비용을 확인하세요." },
    { id: "contacts", label: "수리·긴급 연락처 저장", detail: "에이전트, 집주인 또는 주 임차인의 연락 방식을 정리하세요." },
  ] },
];

export default function PropertyInspectionChecklistPage() {
  const rentalProLive = getRentalApplicationPaymentReadiness().ready;

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "집 방문 체크리스트", path: "/property-inspection-checklist" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-12 sm:py-20"><Container>
        <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
        <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_21rem] lg:items-end">
          <div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">집을 보고 돈을 보내기 전에</p><h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-navy sm:text-6xl">방보다 먼저,<br /><span className="font-normal text-navy-light">계약과 돈의 흐름을 확인하세요.</span></h1><p className="mt-6 max-w-3xl text-base leading-8 text-muted sm:text-lg">사진으로는 보이지 않는 집 상태, 실제 생활비, 계약 상대와 Bond 처리까지 한 번에 점검하세요. 걱정되는 항목은 현재 브라우저에만 저장하고 다음 행동으로 이어갈 수 있어요.</p></div>
          <nav aria-label="이 페이지 빠른 이동" className="rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-[0_10px_28px_rgba(26,39,68,0.06)]"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">바로 시작하기</p><div className="mt-3 grid gap-2"><a href="#inspection-tool" className={actionClass("primary", "w-full justify-between")}>현장 체크 시작 <span aria-hidden="true">↓</span></a><a href="#official-rental-info" className={actionClass("secondary", "w-full justify-between")}>내 주 공식 안내 <span aria-hidden="true">↓</span></a><a href="#house-hunt-project" className={actionClass("tertiary", "justify-between")}>다음 행동 저장 <span aria-hidden="true">↓</span></a></div></nav>
        </div>
      </Container></section>

      <section className="py-12 sm:py-16"><Container>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{inspectionPhases.map((phase) => <article key={phase.step} className="flex min-h-64 flex-col rounded-3xl border-2 border-navy/10 bg-white p-5 shadow-[0_10px_28px_rgba(26,39,68,0.05)]"><div className="flex items-start justify-between"><TopicIcon name={phase.icon} /><span className="font-mono text-xs font-semibold text-gold-ink">{phase.step}</span></div><h2 className="mt-7 text-xl font-semibold text-navy">{phase.title}</h2><p className="mt-3 text-sm leading-7 text-muted">{phase.detail}</p></article>)}</div>

        <section className="mt-10 grid gap-px overflow-hidden rounded-3xl border-2 border-amber-300 bg-amber-300 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="stop-before-paying-heading"><div className="bg-amber-50 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">멈추고 다시 확인</p><h2 id="stop-before-paying-heading" className="mt-2 text-2xl font-semibold text-amber-950">하나라도 해당하면 송금하지 마세요.</h2><ul className="mt-5 space-y-3 text-sm leading-7 text-amber-950">{stopSignals.map((signal) => <li key={signal} className="flex gap-3"><span aria-hidden="true">!</span><span>{signal}</span></li>)}</ul></div><div className="bg-navy p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">그대로 보내는 핵심 질문</p><div className="mt-5 space-y-5">{bookingQuestions.map(([english, korean]) => <blockquote key={english} className="border-l-2 border-gold pl-4"><p className="text-sm font-semibold leading-6">{english}</p><p className="mt-1 text-xs leading-6 text-white/65">({korean})</p></blockquote>)}</div></div></section>

        <div id="inspection-tool" className="mt-10 scroll-mt-24"><PropertyInspectionChecklist /></div>

        <section id="official-rental-info" className="mt-10 scroll-mt-24 rounded-3xl border-2 border-navy/10 bg-[#e8efee] p-6 sm:p-8" aria-labelledby="official-rental-heading"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-ink">주·준주별 공식 출발점</p><h2 id="official-rental-heading" className="mt-2 text-3xl font-semibold text-navy">내 계약에 적용되는 규칙부터 고르세요.</h2><p className="mt-3 text-sm leading-7 text-muted">일반 렌트, 쉐어하우스, rooming·boarding·occupancy와 전대는 같은 집이어도 적용되는 계약과 Bond 절차가 다를 수 있어요. 집이 있는 지역을 고르면 해당 공식 안내만 보여드립니다.</p></div><RentalJurisdictionPicker /><p className="mt-5 text-xs leading-6 text-muted">공식 출발점 재확인: 2026-08-30. 외부 정부 페이지는 인터넷 연결이 필요하며, Hoju Compass가 내용을 실시간으로 복제하거나 법률 판단을 제공하지 않습니다.</p></section>

        <section className="mt-10 rounded-3xl border-2 border-gold/40 bg-gold/5 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><h2 className="text-xl font-semibold text-navy">방을 보러 가기 전에 통학·출퇴근 경로도 확인하세요.</h2><p className="mt-2 text-sm leading-7 text-muted">주거비와 학교·직장까지 대중교통 시간을 최대 3개 후보로 비교할 수 있습니다.</p></div><Link href="/public-transport-guide" className={actionClass("secondary", "mt-5 shrink-0 sm:mt-0")}>생활권 비교하기 <span aria-hidden="true">→</span></Link></section>

        <div id="house-hunt-project" className="mt-10 scroll-mt-24"><LocalProjectChecklist storageKey="house-hunt-project" eyebrow="방문 이후 다음 단계" title="집 구하기 프로젝트" description="지원, 계약과 입주 체크 상태를 목표일과 함께 이어서 관리하세요." groups={houseHuntGroups} dateLabel="목표 입주일" calendarTitle="새 집 입주 준비 점검" /></div>

        <section className="mt-10 overflow-hidden rounded-3xl border-2 border-navy/10 bg-white shadow-[0_10px_28px_rgba(26,39,68,0.06)]" aria-labelledby="rental-pack-next-step-heading"><div className="grid gap-6 bg-[#e8efee] p-6 lg:grid-cols-[1fr_19rem] lg:items-end sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">{rentalProLive ? "현재 이용 가능 · A$14.90 1회 결제" : "결제 설정 확인 중 · 무료 도구는 계속 이용 가능"}</p><h2 id="rental-pack-next-step-heading" className="mt-2 text-3xl font-semibold text-navy">지원할 집을 정했다면, 현장 기록을 신청 준비로 바꾸세요.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">집 상태·비용·계약 점검은 계속 무료예요. Rental Pack은 필요한 증빙의 준비 상태를 비교하고, 과도한 개인정보 없이 남은 확인과 영문 연락을 한 묶음으로 정리하는 단계예요.</p></div><Link href="/rental-application-pro?from=property-inspection-checklist" className={actionClass(rentalProLive ? "primary" : "secondary", "w-full")}>{rentalProLive ? "Rental Pack Pro 보기 · A$14.90" : "기능 차이와 준비 방식 보기"} <span aria-hidden="true">→</span></Link></div><div className="grid gap-px bg-border md:grid-cols-2"><div className="bg-surface p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">무료에서 이미 할 수 있는 일</p><h3 className="mt-2 text-lg font-semibold text-navy">방문 결과 저장·생활권 비교·다음 행동</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-muted"><li>✓ 집 상태·비용·계약 우려를 현재 브라우저에 저장</li><li>✓ 방문 요약을 복사하고 최대 3개 생활권 비교</li><li>✓ 지원·계약·입주까지 남은 일을 프로젝트로 확인</li></ul></div><div className="bg-navy p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">Rental Pack이 더하는 일</p><h3 className="mt-2 text-lg font-semibold">증빙 준비 비교·개인정보 점검·신청 묶음</h3><ul className="mt-4 space-y-2 text-sm leading-6 text-white/75"><li>✓ 필요한 증빙 8종을 준비 전·확인 필요·완료로 비교</li><li>✓ 원본 서류를 올리지 않고 과다 제출과 후속 질문 확인</li><li>✓ 영문 소개문과 남은 확인 항목을 TXT 준비 묶음으로 저장</li></ul></div></div><p className="px-6 py-4 text-xs leading-6 text-muted">이 무료 페이지에서는 결제를 시작하지 않습니다. 제품 페이지에서 현재 이용 가능 여부, 1회 가격과 구매 조건을 다시 확인한 뒤에만 Checkout으로 이동할 수 있습니다.</p></section>

        <section className="mt-8 rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">안전·법률 안내</h2><p className="mt-1">이 체크리스트는 건물·해충 검사, 감정평가 또는 법률 자문을 대신하지 않습니다. 의심스러운 전기·가스 설비나 구조 문제는 직접 시험·수리하지 말고 적격 전문가에게 확인하세요. 신분증, 은행정보나 보증금을 보내기 전 상대방과 임대 권한을 확인하고, 압박을 받으면 송금을 중단하세요.</p></section>
      </Container></section>
    </main>
    <Footer />
  </>;
}
