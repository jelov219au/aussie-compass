import Link from "next/link";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ProProductFinder } from "@/components/tools/ProProductFinder";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { getRentalApplicationPaymentReadiness, isResumeProLive } from "@/lib/commerce";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "취업·렌트·급여·세금 준비 도구 비교 | Hoju Compass Pro", description: "호주 취업 지원, 렌트 신청, 급여 확인, 택스 리턴과 귀국 정리에서 반복 작업을 줄이고 바로 쓸 결과물을 만드는 Pro 도구를 비교하세요.", path: "/pro" });

function getProducts(resumeProLive: boolean, rentalProLive: boolean) {
  return [
    { index: "01", icon: "work" as const, href: "/resume-pro?from=pro-catalog-card", label: "구직 준비", name: "Resume Pro", price: "A$19.90", status: resumeProLive ? "현재 이용 가능" : "결제 설정 확인 중", outcome: "지원 공고별 이력서·커버레터·STAR 면접 메모", free: "무료 이력서·공고 근거 점검", freeHref: "/resume-job-ad-checker" },
    { index: "02", icon: "home" as const, href: "/rental-application-pro?from=pro-hub", label: "집 구하기", name: "Rental Pack Pro", price: "A$14.90", status: rentalProLive ? "현재 이용 가능" : "결제 설정 확인 중", outcome: "신청 서류·개인정보·영문 소개문 준비", free: "무료 집 방문·계약 체크", freeHref: "/property-inspection-checklist" },
    { index: "03", icon: "document" as const, href: "/pay-evidence-pro", label: "급여 확인", name: "Pay Evidence Pro", price: "A$9.90", status: "기능 검증 중", outcome: "근무시간·Payslip 차이·증빙표·영문 문의문", free: "무료 급여 문제 대응 순서", freeHref: "/underpayment-guide" },
    { index: "04", icon: "money" as const, href: "/eofy-pro", label: "세금 준비", name: "EOFY Pack Pro", price: "A$9.90", status: "기능 검증 중", outcome: "흩어진 소득·공제 자료와 세무사 질문 요약", free: "무료 택스 리턴 정보", freeHref: "/tax-return-guide" },
    { index: "05", icon: "arrival" as const, href: "/leaving-australia-pro", label: "귀국 준비", name: "Leaving Pack Pro", price: "A$12.90", status: "기능 검증 중", outcome: "Bond·마지막 급여·세금·DASP 후속 확인", free: "무료 귀국·DASP 가이드", freeHref: "/leaving-australia-guide" },
  ] as const;
}

const principles = [
  ["꼭 필요한 정보에는 가격표를 붙이지 않아요", "권리와 공식 출처, 기본 계산기와 핵심 체크리스트는 누구나 계속 무료로 볼 수 있어요."],
  ["시간을 아껴주는 기능만 Pro로 나눠요", "회사별 지원서나 증빙 정리처럼, 여러 번 손이 가는 준비를 덜어주는 기능만 유료로 구분해요."],
  ["잠깐 쓰는 도구에 매달 결제를 요구하지 않아요", "워홀이나 유학 생활 중 특정 시기에만 필요한 도구는 구독보다 1회 결제를 우선으로 생각해요."],
  ["민감한 정보는 처음부터 덜 받아요", "TFN, 여권, 계좌번호와 원본 서류를 서버에 모으지 않아도 쓸 수 있는 방식부터 만들고 있어요."],
] as const;

export default function ProPage() {
  const resumeProLive = isResumeProLive();
  const rentalProLive = getRentalApplicationPaymentReadiness().ready;
  const products = getProducts(resumeProLive, rentalProLive);
  const availabilityTitle = resumeProLive && rentalProLive
    ? "Resume Pro와 Rental Pack Pro는 지금 이용할 수 있어요"
    : rentalProLive
      ? "Rental Pack Pro는 지금 이용할 수 있어요"
      : resumeProLive
        ? "Resume Pro는 지금 이용할 수 있어요"
        : "Pro 결제 설정을 확인하고 있어요";
  const availabilityDetail = resumeProLive && rentalProLive
    ? "두 도구 모두 1회 결제로 이용할 수 있어요. 다른 Pro 도구는 결제·이용권·환불 흐름을 확인한 뒤 차례로 열겠습니다."
    : "기능과 무료 대안은 지금 살펴볼 수 있어요. 결제와 구매 복구까지 안전하게 확인된 도구부터 차례로 열겠습니다.";
  const priceSummary = resumeProLive && rentalProLive
    ? "Resume Pro는 A$19.90, Rental Pack Pro는 A$14.90 1회 결제로 이용할 수 있어요. "
    : resumeProLive
      ? "Resume Pro는 A$19.90 1회 결제로 이용할 수 있어요. "
      : rentalProLive
        ? "Rental Pack Pro는 A$14.90 1회 결제로 이용할 수 있어요. "
        : "현재 Pro 결제 설정을 확인하고 있어요. ";

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Hoju Compass Pro", path: "/pro" }]} /><Header /><main>
    <section className="border-b border-navy/15 py-12 sm:py-20"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Hoju Compass Pro</p><h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-navy [word-break:keep-all] sm:text-7xl">혼자 준비하느라 쓰는 시간을,<br /><span className="font-normal text-navy-light">조금 덜어드릴게요.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">해야 할 일은 무료 안내에서 먼저 확인하세요. 문서나 정리본이 필요할 때만 내 상황에 맞는 Pro 도구를 골라 이용할 수 있어요.</p></div><aside className="border-l-2 border-gold pl-6 text-sm leading-7 text-muted"><strong className="block text-navy">{availabilityTitle}</strong>{availabilityDetail}</aside></div></Container></section>
    <section className="py-14 sm:py-20"><Container><ProProductFinder resumeProLive={resumeProLive} rentalProLive={rentalProLive} /></Container></section>
    <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><div className="grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Pro 도구 한눈에 보기</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">결과물과 이용 상태를 한눈에.</h2></div><p className="text-sm leading-7 text-muted">{priceSummary}나머지 금액은 검토 중인 예정 가격이며 현재 결제되지 않습니다.</p></div><ol className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{products.map((product) => { const resumeProduct = product.name === "Resume Pro"; const rentalProduct = product.name === "Rental Pack Pro"; const liveProduct = (resumeProduct && resumeProLive) || (rentalProduct && rentalProLive); return <li key={product.href}><article className={`flex h-full min-h-[25rem] flex-col overflow-hidden rounded-3xl border-2 bg-background shadow-[0_10px_28px_rgba(26,39,68,0.06)] ${liveProduct ? "border-gold" : "border-navy/10"}`}><div className="flex items-start justify-between gap-4 bg-[#e8efee] p-6"><TopicIcon name={product.icon} /><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${liveProduct ? "bg-[#e3f3e8] text-[#24623b]" : "bg-white text-muted"}`}>{product.status}</span></div><div className="flex flex-1 flex-col p-6"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{product.index} · {product.label}</p><div className="mt-3 flex flex-wrap items-end justify-between gap-4"><h3 className="text-2xl font-semibold text-navy">{product.name}</h3><div className="text-right"><p className="text-xl font-semibold text-navy">{product.price}</p><p className="text-[0.68rem] text-muted">예정 또는 현재 1회 가격</p></div></div><p className="mt-5 text-sm leading-7 text-muted">{product.outcome}</p><div className="mt-5 rounded-2xl border border-navy/10 bg-white p-4"><span className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">항상 무료</span><p className="mt-1 text-sm font-semibold text-navy">{product.free}</p></div><div className="mt-auto grid gap-3 pt-7">{resumeProduct ? <ResumeProCtaLink href="/resume-pro?from=pro-catalog-card" surface={resumeFunnelSurfaces.proCatalogCard} context={resumeFunnelContexts.proCatalog} className={actionClass(liveProduct ? "primary" : "secondary", "w-full")}>{liveProduct ? `Resume Pro 보기 · ${product.price}` : "기능 자세히 보기"} <span aria-hidden="true">→</span></ResumeProCtaLink> : <Link href={product.href} className={actionClass(liveProduct ? "primary" : "secondary", "w-full")}>{liveProduct ? `${product.name} 보기 · ${product.price}` : "준비 방식 살펴보기"} <span aria-hidden="true">→</span></Link>}{resumeProduct ? <ResumeProProofLink entry="pro-catalog-card" className={actionClass("tertiary", "justify-self-center")}>내 공고로 무료 점검</ResumeProProofLink> : <Link href={product.freeHref} className={actionClass("tertiary", "justify-self-center")}>무료 도구 먼저 보기</Link>}</div></div></article></li>; })}</ol></Container></section>
    <section className="py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Pro를 만드는 기준</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">무료로 볼 정보와, 비용을 받을 기능을 분명히 나눴어요.</h2><dl className="mt-9 grid gap-px bg-border md:grid-cols-2">{principles.map(([title, detail]) => <div key={title} className="bg-surface p-6 sm:p-8"><dt className="text-xl font-semibold text-navy">{title}</dt><dd className="mt-3 text-sm leading-7 text-muted">{detail}</dd></div>)}</dl></Container></section>
    <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 도구는 그대로</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Pro를 이용하지 않아도 괜찮아요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">기본 정보와 계산기, 체크리스트는 Pro 출시와 관계없이 계속 무료로 이용할 수 있어요.</p></div><Link href="/tools" className={actionClass("darkSecondary")}>무료 도구 살펴보기 <span aria-hidden="true">→</span></Link></Container></section>
  </main><Footer /></>;
}
