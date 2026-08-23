import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ProProductFinder } from "@/components/tools/ProProductFinder";
import { Container } from "@/components/ui/Container";
import { isResumeProLive } from "@/lib/commerce";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "취업·렌트·급여·세금 준비 도구 비교 | Hoju Compass Pro", description: "호주 취업 지원, 렌트 신청, 급여 확인, 택스 리턴과 귀국 정리에서 반복 작업을 줄이고 바로 쓸 결과물을 만드는 Pro 도구를 비교하세요.", path: "/pro" });

function getProducts(resumeProLive: boolean) {
  return [
    { index: "01", href: "/resume-pro", label: "구직 준비", name: "Resume Pro", price: "A$19.90", status: resumeProLive ? "현재 이용 가능" : "결제 설정 확인 중", outcome: "지원 공고별 이력서·커버레터·제출 전 점검", free: "무료 이력서 작성·PDF", freeHref: "/resume-builder" },
    { index: "02", href: "/rental-application-pro?from=pro-hub", label: "집 구하기", name: "Rental Pack Pro", price: "A$14.90", status: "유료 검증 준비", outcome: "신청 서류·개인정보·영문 소개문 준비", free: "무료 집 방문·계약 체크", freeHref: "/property-inspection-checklist" },
    { index: "03", href: "/pay-evidence-pro", label: "급여 확인", name: "Pay Evidence Pro", price: "A$9.90", status: "기능 검증 중", outcome: "근무시간·Payslip 차이·증빙표·영문 문의문", free: "무료 급여 문제 대응 순서", freeHref: "/underpayment-guide" },
    { index: "04", href: "/eofy-pro", label: "세금 준비", name: "EOFY Pack Pro", price: "A$9.90", status: "기능 검증 중", outcome: "흩어진 소득·공제 자료와 세무사 질문 요약", free: "무료 택스 리턴 정보", freeHref: "/tax-return-guide" },
    { index: "05", href: "/leaving-australia-pro", label: "귀국 준비", name: "Leaving Pack Pro", price: "A$12.90", status: "기능 검증 중", outcome: "Bond·마지막 급여·세금·DASP 후속 확인", free: "무료 귀국·DASP 가이드", freeHref: "/leaving-australia-guide" },
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
  const products = getProducts(resumeProLive);

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Hoju Compass Pro", path: "/pro" }]} /><Header /><main>
    <section className="border-b border-navy/15 py-12 sm:py-20"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Hoju Compass Pro</p><h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-navy [word-break:keep-all] sm:text-7xl">혼자 준비하느라 쓰는 시간을,<br /><span className="font-normal text-navy-light">조금 덜어드릴게요.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">해야 할 일은 무료 안내에서 먼저 확인하세요. 문서나 정리본이 필요할 때만 내 상황에 맞는 Pro 도구를 골라 이용할 수 있어요.</p></div><aside className="border-l-2 border-gold pl-6 text-sm leading-7 text-muted"><strong className="block text-navy">{resumeProLive ? "Resume Pro는 지금 이용할 수 있어요" : "Resume Pro 결제 설정을 확인하고 있어요"}</strong>{resumeProLive ? "나머지 도구는 기능을 검증하고 있으며, 결제·이용권·환불 흐름까지 확인한 뒤 하나씩 열겠습니다." : "기능과 무료 대안은 지금 살펴볼 수 있어요. 결제와 구매 복구까지 안전하게 확인된 도구부터 차례로 열겠습니다."}</aside></div></Container></section>
    <section className="py-14 sm:py-20"><Container><ProProductFinder resumeProLive={resumeProLive} /></Container></section>
    <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><div className="grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Pro 도구 한눈에 보기</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">내게 필요한 것만 골라서.</h2></div><p className="text-sm leading-7 text-muted">{resumeProLive ? "Resume Pro는 A$19.90 1회 결제로 이용할 수 있어요. " : "Resume Pro는 결제 설정을 확인하고 있어요. "}나머지 금액은 검토 중인 예정 가격이며 현재 결제되지 않습니다.</p></div><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2 xl:grid-cols-3">{products.map((product, index) => <li key={product.href} className={`border-b border-navy/20 ${index % 2 === 0 ? "md:border-r" : ""} xl:border-r-0 ${index % 3 !== 2 ? "xl:border-r" : ""}`}><article className="flex h-full min-h-80 flex-col p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm text-gold-ink">{product.index} / 05</span><span className="border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{product.status}</span></div><p className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{product.label}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><h3 className="text-2xl font-semibold text-navy">{product.name}</h3><p className="text-xl font-semibold text-navy">{product.price}</p></div><p className="mt-5 text-sm leading-7 text-muted">{product.outcome}</p><p className="mt-3 text-xs text-navy/60">무료로 이용 가능: {product.free}</p><div className="mt-auto flex flex-wrap gap-4 pt-8"><Link href={product.href} className="border-b-2 border-gold text-sm font-semibold text-navy">{product.href === "/resume-pro" && resumeProLive ? "시작하기" : "자세히 살펴보기"}</Link><Link href={product.freeHref} className="ml-auto text-sm font-medium text-muted hover:text-navy">무료 도구</Link></div></article></li>)}</ol></Container></section>
    <section className="py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-ink">Pro를 만드는 기준</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">무료로 볼 정보와, 비용을 받을 기능을 분명히 나눴어요.</h2><dl className="mt-9 grid gap-px bg-border md:grid-cols-2">{principles.map(([title, detail]) => <div key={title} className="bg-surface p-6 sm:p-8"><dt className="text-xl font-semibold text-navy">{title}</dt><dd className="mt-3 text-sm leading-7 text-muted">{detail}</dd></div>)}</dl></Container></section>
    <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">무료 도구는 그대로</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Pro를 이용하지 않아도 괜찮아요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">기본 정보와 계산기, 체크리스트는 Pro 출시와 관계없이 계속 무료로 이용할 수 있어요.</p></div><Link href="/tools" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">무료 도구 살펴보기 →</Link></Container></section>
  </main><Footer /></>;
}
