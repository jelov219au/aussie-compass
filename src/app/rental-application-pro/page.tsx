import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "여러 호주 렌트 신청을 놓치지 않게 | Rental Pack Pro",
  description: "마음에 드는 집을 찾았을 때 준비가 늦어지지 않도록 집별 서류, 제출일, 다음 행동, 개인정보와 영문 연락을 한곳에 정리하세요.",
  path: "/rental-application-pro",
});

const features = [
  ["01", "Document readiness", "신분·지불 능력·임대 이력·레퍼런스 자료를 올리지 않고, 빠진 준비가 없는지 확인해요."],
  ["02", "Privacy guard", "TFN, 전체 거래내역이나 불필요한 신분증 번호를 보내기 전에 한 번 더 확인해요."],
  ["03", "English note", "입주일·계약기간과 생활 패턴을 바탕으로 에이전트에게 보낼 짧은 영문 소개문을 만들어요."],
  ["04", "Local pack", "서류 상태와 확인 질문, 영문 소개문을 내 기기에 한 개의 정리본으로 저장해요."],
];

const comparison = [
  ["집 방문·계약 체크리스트", true, true],
  ["주별 공식 임대 정보", true, true],
  ["렌트 신청 서류 상태 관리", false, true],
  ["개인정보 과다 제출 점검", false, true],
  ["영문 신청 소개문", false, true],
  ["집 후보별 준비 패키지 저장", false, true],
] as const;

const officialSources = [
  { name: "OAIC", title: "임대 과정의 개인정보", href: "https://www.oaic.gov.au/privacy/your-privacy-rights/more-privacy-rights/tenancy", description: "에이전트가 개인정보를 수집할 때 목적, 공개 대상과 정부 식별정보를 어떻게 다뤄야 하는지 확인합니다." },
  { name: "NSW Government", title: "렌트 찾기와 신청", href: "https://www.nsw.gov.au/housing-and-construction/renting-a-place-to-live/starting-a-residential-tenancy/finding-and-applying-for-a-rental-property", description: "신청 과정, holding fee, 허용되는 초기 비용과 rent bidding 규정을 확인합니다." },
  { name: "Consumer Affairs Victoria", title: "렌탈 신청 정보 범위", href: "https://www.consumer.vic.gov.au/housing/renting/starting-and-changing-rental-agreements/applying-signing-and-moving-in/applying-for-a-property", description: "2026년 prescribed form, 신원·재정 증빙 개수와 묻지 못하는 질문을 확인합니다." },
];

function PackPreview() {
  return <div className="border border-navy/15 bg-white p-5 shadow-[0_24px_60px_rgba(26,39,68,0.1)] sm:p-7"><div className="flex items-start justify-between border-b-2 border-navy pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">렌트 신청 준비</p><p className="mt-2 text-xl font-semibold text-navy">Carlton 후보 1</p></div><span className="font-mono text-sm text-muted">75%</span></div><div className="mt-6 grid grid-cols-3 gap-3"><div className="bg-surface p-3"><p className="text-xs text-muted">준비 완료</p><p className="mt-1 text-xl font-semibold text-navy">06</p></div><div className="bg-gold/15 p-3"><p className="text-xs text-muted">확인 필요</p><p className="mt-1 text-xl font-semibold text-navy">02</p></div><div className="bg-surface p-3"><p className="text-xs text-muted">원본 업로드</p><p className="mt-1 text-xl font-semibold text-navy">0</p></div></div><div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">개인정보 다시 확인</p><div className="mt-3 space-y-3"><div className="border-l-2 border-gold pl-3"><p className="text-sm font-semibold text-navy">은행 명세서 범위 확인</p><p className="mt-1 text-xs text-muted">거래내역 없이 지불 능력을 증명할 수 있는지 질문</p></div><div className="border-l-2 border-gold pl-3"><p className="text-sm font-semibold text-navy">레퍼런스 동의</p><p className="mt-1 text-xs text-muted">연락처 제출 전에 당사자에게 안내</p></div></div></div><p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted">예시 화면입니다. 신분증·Payslip·은행 서류의 실제 파일은 받지 않습니다.</p></div>;
}

export default function RentalApplicationProPage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "집 방문 체크리스트", path: "/property-inspection-checklist" }, { name: "Rental Application Pack Pro", path: "/rental-application-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-12 sm:py-20"><Container><Link href="/property-inspection-checklist" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 집 방문 체크리스트로 돌아가기</Link><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Rental Application Pack Pro</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">한 집에 지원할 때마다,<br /><span className="font-normal text-navy-light">안전한 준비 패키지 하나.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">필요 서류의 준비 상태를 확인하고, 과도한 개인정보 요청을 한 번 더 점검하고, 에이전트에게 보낼 영문 소개문까지 정리합니다.</p></div><aside className="border-l-2 border-gold pl-6"><p className="text-sm font-semibold text-muted">검토 중인 1회 가격</p><p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$14.90</p><p className="mt-2 text-sm leading-6 text-muted">구독 없이 반복해서 집 후보별 패키지를 만드는 방식입니다.</p></aside></div><div className="mt-10 flex flex-wrap gap-3"><Link href="/property-inspection-checklist" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">무료 체크리스트 사용</Link><span className="inline-flex min-h-12 items-center border border-border bg-white px-5 text-sm font-semibold text-muted">Pro 작업 공간 출시 준비 중</span></div></Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">많이 보내는 것보다, 필요한 것만</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">신청 서류가 많다고<br />꼭 유리한 것은 아니에요.</h2><p className="mt-4 text-sm leading-7 text-muted">경쟁이 치열하더라도 TFN이나 은행 로그인처럼 렌트 신청에 필요하지 않은 정보까지 보낼 이유는 없어요. 왜 필요한 정보인지, 어떻게 보관되는지 한 번 더 확인할 수 있게 구성했어요.</p></div><PackPreview /></div></Container></section>

      <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">집을 본 뒤 신청까지</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">네 단계로 차근차근 준비해요.</h2><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">{features.map(([number, eyebrow, title], index) => <li key={number} className={`min-h-56 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-sm text-gold">{number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</span></div><h3 className="mt-9 text-xl font-semibold leading-8 text-navy">{title}</h3></li>)}</ol></Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[18rem_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 도구는 그대로</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">집 점검은 무료로,<br />신청 정리는 Pro로.</h2><p className="mt-4 text-sm leading-6 text-muted">집 상태와 계약, 공식 정보는 계속 무료로 확인할 수 있어요.</p></div><div className="min-w-0 overflow-x-auto border-t border-navy/20"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy sm:px-4">기능</th><th className="w-16 px-2 py-4 text-center font-semibold text-navy sm:w-28">무료</th><th className="w-16 bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:w-28">Pro</th></tr></thead><tbody>{comparison.map(([label, free, pro]) => <tr key={label} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy sm:px-4">{label}</th><td className="px-2 py-4 text-center text-muted"><span className="sr-only">{free ? "포함" : "미포함"}</span><span aria-hidden="true">{free ? "✓" : "—"}</span></td><td className="bg-gold/10 px-2 py-4 text-center font-semibold text-navy"><span className="sr-only">{pro ? "포함" : "미포함"}</span><span aria-hidden="true">{pro ? "✓" : "—"}</span></td></tr>)}</tbody></table></div></div></Container></section>

      <section className="border-t border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">신청 전에 살펴본 공식 자료</p><h2 className="mt-2 text-2xl font-semibold text-navy">렌트 신청 전에 확인해 두면 좋아요</h2><ul className="mt-6 grid gap-px bg-border lg:grid-cols-3">{officialSources.map((source) => <li key={source.href} className="bg-surface"><a href={source.href} target="_blank" rel="noreferrer" className="group flex h-full min-h-64 flex-col p-6 transition hover:bg-white"><span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{source.name}</span><strong className="mt-3 text-xl text-navy">{source.title}</strong><span className="mt-4 text-sm leading-7 text-muted">{source.description}</span><span className="mt-auto pt-6 text-sm font-semibold text-navy">공식 원문 열기 <span className="transition group-hover:translate-x-1">↗</span></span></a></li>)}</ul></Container></section>

      <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">내 정보는 내 기기에</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">원본 서류를 올리지 않고도 준비할 수 있어요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">준비 상태와 소개문은 현재 브라우저에만 저장해요. 실제 신청서와 파일은 이용 중인 에이전트의 공식 채널에서 직접 제출해 주세요.</p></div><Link href="/property-inspection-checklist" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">무료 집 점검 도구 →</Link></Container></section>
    </main>
    <Footer />
  </>;
}
