import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EofyProOutputPreview } from "@/components/tools/EofyProOutputPreview";
import { getActiveEofyProEntitlement } from "@/lib/eofyProAccess";
import { EofyProCheckoutForm } from "@/components/tools/EofyProCheckoutForm";
import { Container } from "@/components/ui/Container";
import { canCreateEofyTestCheckout, getEofyPaymentReadiness } from "@/lib/commerce";
import { normalizeEofyProEntry } from "@/lib/eofyProAttribution";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "흩어진 택스 리턴 자료를 신고 전 요약으로 | EOFY Pack Pro",
  description: "호주 택스 리턴 전에 소득 자료, 공제 증빙과 세무사에게 물어볼 내용을 한눈에 볼 수 있는 준비 요약으로 정리하세요.",
  path: "/eofy-pro",
});

const features = [
  ["01", "Evidence register", "공제 후보별 금액과 날짜, 업무 관련성 메모, 증빙이 있는지를 한곳에 적어둬요."],
  ["02", "Income cross-check", "Income statement, 은행 이자, 정부 지급금 등 확인할 소득 출처를 하나씩 점검해요."],
  ["03", "Accountant handoff", "세무사에게 물어볼 질문과 확인이 필요한 항목만 짧은 전달용 요약으로 모아요."],
  ["04", "Year archive", "TFN과 영수증 원본을 올리지 않고 올해 준비 기록만 개인 백업 파일로 보관해요."],
];

const comparison = [
  ["ATO 공식 정보 한국어 설명", true, true],
  ["기본 택스 리턴 체크리스트", true, true],
  ["소득·공제 증빙 목록 작성", false, true],
  ["확인 필요 항목 자동 모아보기", false, true],
  ["회계사 전달용 요약", false, true],
  ["회계연도별 백업 패키지", false, true],
] as const;

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ access?: string; checkout?: string; from?: string | string[] }> };

export default async function EofyProPage({ searchParams }: Props) {
  const { access, checkout, from } = await searchParams;
  const paymentReadiness = getEofyPaymentReadiness();
  const testCheckoutAvailable = canCreateEofyTestCheckout();
  const checkoutAvailable = paymentReadiness.ready || testCheckoutAvailable;
  const hasActiveEntitlement = Boolean(await getActiveEofyProEntitlement());
  const requiresBuyerRecovery = !hasActiveEntitlement && (access === "required" || access === "released" || checkout === "checkout_support_required" || checkout === "checkout_already_purchased");
  const canOfferCheckout = checkoutAvailable && !hasActiveEntitlement && !requiresBuyerRecovery;
  const entry = normalizeEofyProEntry(Array.isArray(from) ? from[0] : from ?? null);

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "택스 리턴 준비", path: "/tax-return-guide" }, { name: "EOFY Pack Pro", path: "/eofy-pro" }]} />
    <Header />
    <main>
      <section className="border-b border-navy/15 py-12 sm:py-20"><Container>
        <Link href="/tax-return-guide" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 무료 택스 리턴 가이드로 돌아가기</Link>
        {access === "required" && !hasActiveEntitlement && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">이 기기의 EOFY Pack Pro 이용권을 다시 확인해야 합니다. 다시 결제하지 말고 1회용 복구 코드 또는 고객지원 확인 순서를 이용해 주세요.</div>}
        {access === "released" && !hasActiveEntitlement && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status"><p>이 기기의 EOFY Pack Pro 접근을 안전하게 해제했습니다. 구매 이용권은 유지됩니다.</p><Link href="/data-transfer#eofy-delete-heading" className="mt-3 inline-flex min-h-11 items-center font-semibold underline decoration-gold underline-offset-4">EOFY 로컬 기록 삭제</Link></div>}
        {checkout === "cancelled" && <div className="mt-5 border-l-2 border-navy/40 bg-white p-4 text-sm leading-6 text-navy" role="status">Stripe 결제 창에서 돌아왔습니다. 상태가 불명확하면 다시 결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}
        {checkout === "checkout_already_purchased" && <div className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy" role="status">기존 구매 안내로 돌아왔습니다. 다시 결제하지 말고 {hasActiveEntitlement ? <Link href="/eofy-pro/workspace" className="font-semibold underline decoration-gold underline-offset-4">작업공간에서 계속해 주세요</Link> : <Link href="/eofy-pro/restore" className="font-semibold underline decoration-gold underline-offset-4">이용권 복구 순서를 확인하세요</Link>}.</div>}
        {(checkout === "checkout_retry_later" || checkout === "checkout_sales_closed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">다른 결제 확인 또는 통제된 첫 결제가 진행 중입니다. 새 결제를 시작하지 말고 잠시 뒤 확인해 주세요.</div>}
        {(checkout === "checkout_unavailable" || checkout === "checkout_support_required" || checkout === "checkout_failed") && <div className="mt-5 border-l-2 border-gold bg-white p-4 text-sm leading-6 text-navy" role="alert">현재 결제를 안전하게 시작할 수 없습니다. Stripe 화면을 이미 봤다면 재결제하지 말고 <Link href="/payment-help" className="font-semibold underline decoration-gold underline-offset-4">결제 상태 확인 순서</Link>를 이용하세요.</div>}
        {hasActiveEntitlement && <p role="status" className="mt-5 border-l-2 border-emerald-600 bg-white p-4 text-sm leading-6 text-navy">이 기기의 EOFY Pack Pro 이용권을 확인했습니다. 다시 결제하지 말고 저장한 작업을 계속하세요.</p>}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">EOFY Pack Pro</p><h1 className="mt-4 text-3xl font-semibold leading-[1.08] tracking-[-0.035em] text-navy [word-break:keep-all] sm:text-6xl">어떤 자료가 있는지,<br /><span className="font-normal text-navy-light">무엇을 확인할지 한눈에.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">직접 보관한 소득 자료와 지출 증빙의 목록·준비 상태·확인 질문을 정리하세요. 원본 파일을 업로드하지 않고, 등록 세무사에게 전달할 TXT와 작업 복원용 JSON을 만들어요.</p></div><aside className="border-l-2 border-gold pl-6">{hasActiveEntitlement || requiresBuyerRecovery ? <><p className="font-semibold text-navy">{hasActiveEntitlement ? "이용권 확인 완료" : "기존 구매 이용권 복구"}</p><p className="mt-2 text-sm leading-6 text-muted">다시 결제하지 말고 {hasActiveEntitlement ? "작업공간에서 준비 기록을 이어가세요." : "복구 코드나 고객지원 확인 순서를 이용하세요."}</p></> : <><p className="text-sm font-semibold text-muted">{checkoutAvailable ? "1회 가격" : "결제 미오픈"}</p><p className="mt-2 text-4xl font-semibold tracking-tight text-navy">A$9.90</p><p className="mt-2 text-sm leading-6 text-muted">구독 없이 한 회계연도의 준비 내용을 정리하는 방식이에요.</p></>}</aside></div>
        <div className="mt-10 flex flex-wrap gap-3">{hasActiveEntitlement ? <Link href="/eofy-pro/workspace" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">저장한 작업 계속하기 →</Link> : <Link href="/tax-return-guide" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-light">무료 체크리스트 사용</Link>}<Link href="/eofy-pro/restore" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 text-sm font-semibold text-navy">이용권 복구</Link>{!checkoutAvailable && <span className="inline-flex min-h-12 items-center border border-border bg-white px-5 text-sm font-semibold text-muted">외부 결제 설정 전</span>}</div>
        {!hasActiveEntitlement && <EofyProOutputPreview />}
        {canOfferCheckout && <div id="eofy-pro-checkout" className="mt-5 scroll-mt-24"><EofyProCheckoutForm testMode={testCheckoutAvailable} entry={entry} /></div>}
        <p className="mt-4 text-xs leading-5 text-muted">{hasActiveEntitlement ? "이 기기의 이용권이 확인됐습니다. 작업공간에서 기록을 계속 정리하세요." : requiresBuyerRecovery ? "이미 구매했다면 다시 결제하지 말고 이용권 복구를 사용하세요. 기록의 JSON 복원과 구매 이용권 복구는 별도입니다." : testCheckoutAvailable ? "현재 버튼은 Stripe 테스트 환경 전용이며 실제 카드 청구는 없습니다." : canOfferCheckout ? "결제는 Stripe의 보안 결제 페이지에서 진행되며 결제와 이용권 확인 뒤 작업 공간을 열 수 있어요." : "결제는 Stripe·Neon 설정과 출시 승인이 완료될 때까지 닫혀 있습니다."}</p>
      </Container></section>

      {!hasActiveEntitlement && <details className="border-b border-navy/15"><summary className="mx-auto flex min-h-14 max-w-6xl cursor-pointer items-center px-5 py-4 text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">기능·무료 도구와의 비교 자세히 보기</summary>
      <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">택스 리턴 준비 순서</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">매년 반복되는 준비를 네 단계로 줄였어요.</h2><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2">{features.map(([number, eyebrow, title], index) => <li key={number} className={`min-h-56 border-b border-navy/20 p-6 sm:p-8 ${index % 2 === 0 ? "md:border-r" : ""}`}><div className="flex items-center justify-between"><span className="font-mono text-sm text-[#806515]">{number} / 04</span><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{eyebrow}</span></div><h3 className="mt-9 text-xl font-semibold text-navy">{title}</h3></li>)}</ol></Container></section>

      <section className="py-14 sm:py-20"><Container><div className="grid gap-10 lg:grid-cols-[18rem_1fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#806515]">무료 정보는 그대로</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">정보는 무료로,<br />개인 정리는 Pro로.</h2><p className="mt-4 text-sm leading-6 text-muted">신고 일정과 ATO 원문 설명, 기본 체크리스트는 계속 무료로 볼 수 있어요.</p></div><div className="min-w-0 overflow-x-auto border-t border-navy/20"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b border-navy/20"><th className="px-3 py-4 font-semibold text-navy sm:px-4">기능</th><th className="w-16 px-2 py-4 text-center font-semibold text-navy sm:w-28">무료</th><th className="w-16 bg-gold/10 px-2 py-4 text-center font-semibold text-navy sm:w-28">Pro</th></tr></thead><tbody>{comparison.map(([label, free, pro]) => <tr key={label} className="border-b border-border"><th className="px-3 py-4 font-medium text-navy sm:px-4">{label}</th><td className="px-2 py-4 text-center text-muted"><span className="sr-only">{free ? "포함" : "미포함"}</span><span aria-hidden="true">{free ? "✓" : "—"}</span></td><td className="bg-gold/10 px-2 py-4 text-center font-semibold text-navy"><span className="sr-only">{pro ? "포함" : "미포함"}</span><span aria-hidden="true">{pro ? "✓" : "—"}</span></td></tr>)}</tbody></table></div></div></Container></section>

      </details>}

      <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">민감한 정보는 조심스럽게</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">TFN과 영수증 원본은 받지 않아요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">민감한 세금 문서를 서버에 올리지 않고, 지금 사용하는 기기에서 준비 목록과 요약만 만들 수 있도록 구성했어요.</p></div><Link href="/tax-return-guide" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">무료 택스 가이드 →</Link></Container></section>

      <section className="bg-amber-50 py-8"><Container><div className="border border-amber-300 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">제품 범위 안내</h2><p className="mt-1">EOFY Pack Pro는 신고 대행, 환급액 계산, 공제 가능 여부 판정 또는 세무 자문을 제공하지 않습니다. 실제 신고와 세무 판단은 ATO 또는 TPB 등록 세무사에게 확인해야 합니다.</p></div></Container></section>
    </main>
    <Footer />
  </>;
}
