import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "EOFY Pack Pro 미리보기 | Hoju Compass",
  description: "호주 택스 리턴 준비 자료를 체크리스트, 증빙 목록과 회계사 전달용 요약으로 정리하는 EOFY Pack Pro를 확인하세요.",
  path: "/eofy-pro",
});

const features = [
  ["01", "Evidence register", "공제 후보별 금액, 날짜, 업무 관련성 메모와 증빙 보유 여부를 한곳에 기록합니다."],
  ["02", "Income cross-check", "Income statement, 은행 이자, 정부 지급금 등 확인해야 할 소득 출처를 빠짐없이 점검합니다."],
  ["03", "Accountant handoff", "회계사에게 물어볼 질문과 확인이 필요한 항목만 간결한 전달용 요약으로 묶습니다."],
  ["04", "Year archive", "민감한 원본 파일을 업로드하지 않고 올해 준비 기록을 개인 백업 파일로 보관합니다."],
];

const comparison = [
  ["ATO 공식 정보 한국어 설명", true, true],
  ["기본 택스 리턴 체크리스트", true, true],
  ["소득·공제 증빙 목록 작성", false, true],
  ["확인 필요 항목 자동 모아보기", false, true],
  ["회계사 전달용 요약", false, true],
  ["회계연도별 백업 패키지", false, true],
] as const;

function DocumentPreview() {
  return <div className="border border-navy/15 bg-white p-5 shadow-[0_24px_60px_rgba(26,39,68,0.1)] sm:p-7" aria-label="EOFY Pack Pro 결과물 예시">
    <div className="flex items-start justify-between border-b-2 border-navy pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">EOFY summary</p><p className="mt-2 text-xl font-semibold text-navy">2025–26 준비 현황</p></div><span className="font-mono text-sm text-muted">DRAFT</span></div>
    <div className="mt-6 grid grid-cols-3 gap-3"><div className="bg-surface p-3"><p className="text-xs text-muted">소득 출처</p><p className="mt-1 text-xl font-semibold text-navy">03</p></div><div className="bg-surface p-3"><p className="text-xs text-muted">공제 후보</p><p className="mt-1 text-xl font-semibold text-navy">07</p></div><div className="bg-gold/15 p-3"><p className="text-xs text-muted">확인 필요</p><p className="mt-1 text-xl font-semibold text-navy">02</p></div></div>
    <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Accountant questions</p><div className="mt-3 space-y-3"><div className="border-l-2 border-gold pl-3"><p className="text-sm font-semibold text-navy">재택근무 비용 계산 방식</p><p className="mt-1 text-xs text-muted">근무 기록 42일 · 인터넷 사용분 확인 필요</p></div><div className="border-l-2 border-gold pl-3"><p className="text-sm font-semibold text-navy">두 번째 고용주 Income statement</p><p className="mt-1 text-xs text-muted">Tax ready 상태 최종 확인 필요</p></div></div></div>
    <p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted">예시 화면입니다. TFN, 계좌번호와 영수증 원본은 결과 요약에 포함하지 않습니다.</p>
  </div>;
}

export default function EofyProPage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "택스 리턴 준비", path: "/tax-return-guide" }, { name: "EOFY Pack Pro", path: "/eofy-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-12 sm:py-20"><Container>
        <Link href="/tax-return-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 택스 리턴 가이드로 돌아가기</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">EOFY Pack Pro / Product preview</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">영수증은 안전하게,<br /><span className="font-normal text-navy-light">준비 상태는 한 묶음으로.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">소득 자료와 공제 증빙의 존재 여부를 정리하고, 확인이 필요한 질문만 모아 직접 신고 또는 등록 세무사 상담 전에 활용하는 준비 도구입니다.</p></div><aside className="border-l-2 border-gold pl-6"><p className="text-sm font-semibold text-muted">검토 중인 1회 가격</p><p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$9.90</p><p className="mt-2 text-sm leading-6 text-muted">구독 없이 회계연도 준비 패키지 1개를 만드는 방식입니다.</p></aside></div>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/eofy-pro/workspace" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">개발판 무료 체험</Link><Link href="/tax-return-guide" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 text-sm font-semibold text-navy">무료 체크리스트 사용</Link><span className="inline-flex min-h-12 items-center border border-border bg-white px-5 text-sm font-semibold text-muted">결제 없음</span></div>
      </Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">A clean handoff</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">회계사가 필요한 건<br />자료보다 먼저, 맥락입니다.</h2><p className="mt-4 text-sm leading-7 text-muted">원본 영수증과 금융자료는 본인이 안전하게 보관하고, 어떤 자료가 있으며 무엇을 확인해야 하는지 요약합니다. 복잡한 세무 판단은 대신하지 않습니다.</p></div><DocumentPreview /></div></Container></section>

      <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Preparation workflow</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">매년 반복되는 네 단계를 짧게.</h2><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">{features.map(([number, eyebrow, title], index) => <li key={number} className={`min-h-56 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-sm text-gold">{number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</span></div><h3 className="mt-9 text-xl font-semibold text-navy">{title}</h3></li>)}</ol></Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[18rem_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Free stays free</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">정보는 무료,<br />정리는 Pro.</h2><p className="mt-4 text-sm leading-6 text-muted">신고 일정, ATO 원문 설명과 기본 체크리스트는 계속 무료로 제공합니다.</p></div><div className="min-w-0 overflow-x-auto border-t border-navy/20"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy sm:px-4">기능</th><th className="w-16 px-2 py-4 text-center font-semibold text-navy sm:w-28">무료</th><th className="w-16 bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:w-28">Pro</th></tr></thead><tbody>{comparison.map(([label, free, pro]) => <tr key={label} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy sm:px-4">{label}</th><td className="px-2 py-4 text-center text-muted"><span className="sr-only">{free ? "포함" : "미포함"}</span><span aria-hidden="true">{free ? "✓" : "—"}</span></td><td className="bg-gold/10 px-2 py-4 text-center font-semibold text-navy"><span className="sr-only">{pro ? "포함" : "미포함"}</span><span aria-hidden="true">{pro ? "✓" : "—"}</span></td></tr>)}</tbody></table></div></div></Container></section>

      <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Privacy first</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">TFN과 영수증 원본은 받지 않는 방향으로.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">개발 프리뷰는 민감한 세금 문서를 서버에 업로드하지 않고, 사용자의 기기에서 준비 목록과 요약을 만듭니다.</p></div><Link href="/eofy-pro/workspace" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">개발판 열기 →</Link></Container></section>

      <section className="bg-amber-50 py-8"><Container><div className="border border-amber-300 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">제품 범위 안내</h2><p className="mt-1">EOFY Pack Pro는 신고 대행, 환급액 계산, 공제 가능 여부 판정 또는 세무 자문을 제공하지 않습니다. 실제 신고와 세무 판단은 ATO 또는 TPB 등록 세무사에게 확인해야 합니다.</p></div></Container></section>
    </main>
    <Footer />
  </>;
}
