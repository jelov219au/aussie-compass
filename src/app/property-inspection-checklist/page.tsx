import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { PropertyInspectionChecklist } from "@/components/tools/PropertyInspectionChecklist";
import { LocalProjectChecklist, type ProjectGroup } from "@/components/tools/LocalProjectChecklist";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 쉐어하우스·렌트 집 방문 체크리스트 | Hoju Compass", description: "Flatmates·Facebook에서 찾은 쉐어하우스부터 일반 렌트와 주택 구매까지, 집 방문 때 확인할 상태·비용·계약·안전 항목을 점검하세요.", path: "/property-inspection-checklist" });

const stateLinks = [
  ["NSW", "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live"], ["VIC", "https://www.consumer.vic.gov.au/housing/renting"], ["QLD", "https://www.rta.qld.gov.au/"], ["WA", "https://www.consumerprotection.wa.gov.au/renting-home"], ["SA", "https://www.sa.gov.au/topics/housing/renting-and-letting"], ["TAS", "https://www.cbos.tas.gov.au/topics/housing/renting"], ["ACT", "https://www.justice.act.gov.au/renting-and-occupancy-laws"], ["NT", "https://consumeraffairs.nt.gov.au/for-consumers/residential-tenancies"],
];

const houseHuntGroups: ProjectGroup[] = [
  { title: "후보 정리", items: [
    { id: "save-ad", label: "광고와 연락 내용 보관", detail: "가격·포함 비용·입주일이 바뀌는 경우를 대비하세요." },
    { id: "compare-commute", label: "총 주거비와 출퇴근 비교", detail: "주세뿐 아니라 공과금, 교통비와 이동 시간을 함께 보세요." },
    { id: "inspect", label: "현장 방문과 우려 항목 재확인", detail: "사진만 보고 송금하지 말고 가능하면 직접 방문하세요." },
  ]},
  { title: "지원 준비", items: [
    { id: "documents", label: "필요 서류 범위 확인", detail: "필요한 정보만 안전한 공식 채널로 제출하세요." },
    { id: "references", label: "레퍼런스 사전 동의", detail: "연락처를 제출하기 전 해당 사람에게 알려주세요." },
    { id: "scam-check", label: "상대방과 임대 권한 확인", detail: "급한 송금이나 과도한 개인정보 요구는 멈추고 검증하세요." },
  ]},
  { title: "계약·결제", items: [
    { id: "written-agreement", label: "서면 계약 검토", detail: "기간, 비용, 퇴거 통지와 책임을 확인하세요." },
    { id: "bond-process", label: "관할 지역 보증금 절차 확인", detail: "개인 계좌 송금 전 공식 처리 방식을 확인하세요." },
    { id: "receipts", label: "모든 결제 증빙 보관", detail: "보증금, 선불 임대료와 열쇠 비용의 영수증을 보관하세요." },
  ]},
  { title: "입주", items: [
    { id: "condition-report", label: "Condition report와 사진 완료", detail: "기존 손상·오염·계량기 상태를 기한 내 기록하세요." },
    { id: "keys", label: "열쇠·출입장치 인수", detail: "받은 개수와 분실 시 비용을 확인하세요." },
    { id: "contacts", label: "수리·긴급 연락처 저장", detail: "에이전트, 집주인 또는 주 임차인의 연락 방식을 정리하세요." },
  ]},
];

export default function PropertyInspectionChecklistPage() { return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "집 방문 체크리스트", path: "/property-inspection-checklist" }]} /><Header /><main className="py-12 sm:py-16"><Container>
  <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link><div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">호주 집 구하기 프로젝트</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">쉐어하우스 방문, 사진보다 더 많이 확인하세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">Flatmates나 Facebook에서 마음에 드는 방을 찾았다면 현장에서 집 상태, 생활 규칙, 실제 비용과 계약 관계를 확인해야 합니다. 쉐어·렌트·구매 유형에 맞춰 체크하고 우려 항목만 다시 모아보세요.</p></div>
  <div className="my-8 grid gap-4 md:grid-cols-3"><article className="rounded-2xl border border-gold/40 bg-gold/5 p-5"><h2 className="font-semibold text-navy">방문 전</h2><p className="mt-2 text-sm leading-6 text-muted">광고 화면을 보관하고 혼자라면 방문 장소와 시간을 지인에게 공유하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">현장에서</h2><p className="mt-2 text-sm leading-6 text-muted">허락받고 사진을 찍으며 물, 창문, 잠금장치와 가전을 직접 확인하세요.</p></article><article className="rounded-2xl border border-border bg-white p-5"><h2 className="font-semibold text-navy">송금 전에</h2><p className="mt-2 text-sm leading-6 text-muted">계약 상대와 임대 권한, 서면 조건, 보증금 공식 처리 방법을 확인하세요.</p></article></div>
  <PropertyInspectionChecklist />
  <section className="mt-8 border-y border-navy/20 bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">다음 단계 · Pro 미리보기</p><h2 className="mt-2 text-xl font-semibold text-navy">마음에 드는 집을 찾았다면 신청 패키지를 준비하세요</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">원본 서류를 업로드하지 않고 준비 상태, 개인정보 주의점과 영문 소개문을 정리하는 제품 구성을 확인할 수 있습니다.</p></div><Link href="/rental-application-pro" className="mt-4 inline-flex min-h-11 shrink-0 items-center bg-navy px-4 text-sm font-semibold text-white sm:mt-0">Rental Pack 구성 보기 &rarr;</Link></section>
  <section className="mt-8 rounded-2xl border border-gold/40 bg-gold/5 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6"><div><h2 className="text-xl font-semibold text-navy">방을 보러 가기 전에 통학 경로부터 확인하세요</h2><p className="mt-2 text-sm leading-6 text-muted">주거비와 학교·직장까지 대중교통 시간을 최대 3개 후보로 비교할 수 있습니다.</p></div><Link href="/public-transport-guide" className="mt-4 inline-flex min-h-11 shrink-0 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white sm:mt-0">생활권 비교하기 &rarr;</Link></section>
  <div className="mt-10"><LocalProjectChecklist storageKey="house-hunt-project" eyebrow="방문 이후 다음 단계" title="집 구하기 프로젝트" description="후보 비교부터 지원, 계약과 입주 기록까지 이어서 관리하세요." groups={houseHuntGroups} dateLabel="목표 입주일" calendarTitle="새 집 입주 준비 점검" /></div>
  <section className="mt-10 rounded-2xl bg-navy p-6 text-white sm:p-8"><h2 className="text-xl font-semibold">주·준주별 공식 임대 정보</h2><p className="mt-2 text-sm leading-6 text-white/70">임대·전대·보증금·최소 주거 기준은 지역과 계약 형태에 따라 다릅니다. 집이 위치한 지역의 공식 안내를 선택하세요.</p><ul className="mt-5 flex flex-wrap gap-2">{stateLinks.map(([name,href]) => <li key={name}><a href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold hover:bg-white/10">{name} &rarr;</a></li>)}</ul></section>
  <section className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">안전·법률 안내</h2><p className="mt-1">이 체크리스트는 건물·해충 검사, 감정평가 또는 법률 자문을 대신하지 않습니다. 의심스러운 전기·가스 설비나 구조 문제는 직접 시험·수리하지 말고 적격 전문가에게 확인하세요. 신분증, 은행정보나 보증금을 보내기 전 상대방과 임대 권한을 확인하고, 압박을 받으면 송금을 중단하세요.</p></section>
</Container></main><Footer /></>; }
