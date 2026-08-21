import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "중고차 구매 당일 실수를 줄이는 준비 패키지 | Car Buy Pack Pro",
  description: "호주 중고차 후보의 첫해 비용, PPSR·Rego·사전검사 확인 상태와 판매자 질문을 한곳에서 정리하세요.",
  path: "/car-buy-pro",
});

const features = [
  ["01", "True first-year cost", "구매가뿐 아니라 이전 비용, 검사, 보험, Rego, 예상 수리와 연료비까지 첫해 지출로 묶어요."],
  ["02", "Stop-before-payment", "VIN, PPSR, Rego와 독립 검사가 남아 있으면 송금 전에 다시 확인할 항목으로 보여줘요."],
  ["03", "Seller questions", "개인 판매·딜러·경매에 맞춰 아직 확인하지 못한 내용을 영어 질문으로 정리해요."],
  ["04", "Purchase handoff", "후보별 비용과 확인 상태를 개인 결정 요약과 백업 파일로 남겨요."],
] as const;

const comparison = [
  ["최대 3대 첫해 비용 비교", true, true],
  ["PPSR·Rego 공식 확인 링크", true, true],
  ["판매 형태별 핵심 확인 표시", false, true],
  ["수리 여유금·예산 초과 경고", false, true],
  ["미확인 항목 기반 영문 질문", false, true],
  ["결정 요약·개인 백업", false, true],
] as const;

function DecisionPreview() {
  return <div className="border border-navy/15 bg-white p-5 shadow-[0_24px_60px_rgba(26,39,68,0.1)] sm:p-7" aria-label="Car Buy Pack Pro 결과물 예시">
    <div className="flex items-start justify-between border-b-2 border-navy pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Vehicle decision brief</p><p className="mt-2 text-xl font-semibold text-navy">후보 B · 추가 확인</p></div><span className="font-mono text-sm text-muted">02 / 03</span></div>
    <div className="mt-6 grid grid-cols-3 gap-3"><div className="bg-surface p-3"><p className="text-xs text-muted">구매가</p><p className="mt-1 text-lg font-semibold text-navy">$8,900</p></div><div className="bg-surface p-3"><p className="text-xs text-muted">첫해 합계</p><p className="mt-1 text-lg font-semibold text-navy">$13,240</p></div><div className="bg-gold/15 p-3"><p className="text-xs text-muted">확인 완료</p><p className="mt-1 text-lg font-semibold text-navy">6 / 8</p></div></div>
    <div className="mt-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Before payment</p><div className="mt-3 space-y-3"><div className="border-l-2 border-amber-500 pl-3"><p className="text-sm font-semibold text-navy">독립 사전검사 확인 필요</p><p className="mt-1 text-xs text-muted">정비 상태와 즉시 수리비를 반영한 뒤 다시 비교</p></div><div className="border-l-2 border-gold pl-3"><p className="text-sm font-semibold text-navy">보험 개시 시각 확인</p><p className="mt-1 text-xs text-muted">차량 인수 전에 보험사에서 직접 확인</p></div></div></div>
    <p className="mt-7 border-t border-border pt-4 text-xs leading-5 text-muted">예시 화면입니다. VIN, 번호판과 판매자 개인정보는 입력하거나 서버에 올리지 않아요.</p>
  </div>;
}

export default function CarBuyProPage() {
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "중고차 비교", path: "/used-car-comparison" }, { name: "Car Buy Pack Pro", path: "/car-buy-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-12 sm:py-20"><Container>
        <Link href="/used-car-comparison" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 중고차 비교표로 돌아가기</Link>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Car Buy Pack Pro · 개발 프리뷰</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">싼 차를 고르는 것보다,<br /><span className="font-normal text-navy-light">잘못 살 가능성을 줄여요.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">차량 가격만 보고 서두르지 않도록 첫해 비용과 구매 직전 확인을 같은 화면에 모았어요. 아직 확인하지 못한 내용은 판매자에게 보낼 영어 질문으로 바로 정리할 수 있어요.</p></div><aside className="border-l-2 border-gold pl-6"><p className="text-sm font-semibold text-muted">검토 중인 1회 가격</p><p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$14.90</p><p className="mt-2 text-sm leading-6 text-muted">한 번의 차량 구매 결정을 정리하는 방식이며 구독은 없어요.</p></aside></div>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/used-car-comparison" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">무료 비교표 사용</Link><span className="inline-flex min-h-12 items-center border border-border bg-white px-5 text-sm font-semibold text-muted">Pro 작업 공간 출시 준비 중</span></div>
      </Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매가 밖의 숫자까지</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">싸게 보이는 차가<br />정말 덜 드는 차인지 확인해요.</h2><p className="mt-4 text-sm leading-7 text-muted">보험, Rego, 이전 비용과 바로 필요한 수리까지 넣으면 후보의 순서가 달라질 수 있어요. 계산 결과가 차량 가치를 판정하지는 않지만, 내가 감당할 지출을 놓치지 않게 도와줘요.</p></div><DecisionPreview /></div></Container></section>

      <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 결정 네 단계</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">광고를 저장한 순간부터 인수 직전까지.</h2><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">{features.map(([number, eyebrow, title], index) => <li key={number} className={`min-h-60 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-sm text-gold">{number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</span></div><h3 className="mt-9 text-xl font-semibold leading-8 text-navy">{title}</h3></li>)}</ol></Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[18rem_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 정보는 그대로</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">확인 방법은 무료로,<br />내 결정 정리는 Pro로.</h2><p className="mt-4 text-sm leading-6 text-muted">PPSR, VIN, Rego와 기본 비용 비교는 계속 무료로 사용할 수 있어요.</p></div><div className="min-w-0 overflow-x-auto border-t border-navy/20"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy sm:px-4">기능</th><th className="w-16 px-2 py-4 text-center font-semibold text-navy sm:w-28">무료</th><th className="w-16 bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:w-28">Pro</th></tr></thead><tbody>{comparison.map(([label, free, pro]) => <tr key={label} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy sm:px-4">{label}</th><td className="px-2 py-4 text-center text-muted"><span className="sr-only">{free ? "포함" : "미포함"}</span><span aria-hidden="true">{free ? "✓" : "—"}</span></td><td className="bg-gold/10 px-2 py-4 text-center font-semibold text-navy"><span className="sr-only">{pro ? "포함" : "미포함"}</span><span aria-hidden="true">{pro ? "✓" : "—"}</span></td></tr>)}</tbody></table></div></div></Container></section>

      <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">차량 식별정보는 받지 않아요</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">VIN과 판매자 정보 없이도 결정 기준은 정리할 수 있어요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">후보 별칭과 예상 비용, 확인 여부만 현재 브라우저에 저장합니다. PPSR 인증서, 차량 검사서와 거래 서류 원본은 본인이 별도로 보관해야 해요.</p></div><Link href="/resources/used-car-ppsr-purchase-day-checklist" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">구매 당일 가이드 →</Link></Container></section>

      <section className="bg-amber-50 py-8"><Container><div className="border border-amber-300 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">제품 범위 안내</h2><p className="mt-1">Car Buy Pack Pro는 차량 가치 평가, 기계 검사, 금융·보험 추천 또는 법률 자문을 제공하지 않습니다. 구매 전 PPSR, 관할 등록기관, 보험사와 독립 정비사를 통해 실제 정보를 직접 확인하세요. 딜러와 개인 판매 구매에 적용되는 권리는 다를 수 있습니다.</p></div></Container></section>
    </main>
    <Footer />
  </>;
}
