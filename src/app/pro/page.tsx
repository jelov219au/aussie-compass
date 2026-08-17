import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { ProProductFinder } from "@/components/tools/ProProductFinder";
import { Container } from "@/components/ui/Container";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "Hoju Compass Pro 도구 비교 | Hoju Compass", description: "Resume, Rental, 급여 증빙, EOFY와 귀국 준비 Pro 개발판의 기능·가격·무료 대안을 한곳에서 비교하세요.", path: "/pro" });

const products = [
  { index: "01", href: "/resume-pro", label: "구직 준비", name: "Resume Pro", price: "A$19.90", status: "결제 검증 중", outcome: "회사별 커버레터·공고 키워드 점검", free: "무료 이력서 작성·PDF", freeHref: "/resume-builder" },
  { index: "02", href: "/rental-application-pro", label: "집 구하기", name: "Rental Pack Pro", price: "A$14.90", status: "출시 준비 중", outcome: "서류 상태·개인정보 점검·영문 소개문", free: "무료 집 방문·계약 체크", freeHref: "/property-inspection-checklist" },
  { index: "03", href: "/pay-evidence-pro", label: "급여 확인", name: "Pay Evidence Pro", price: "A$12.90", status: "출시 준비 중", outcome: "Gross 차이·증빙·영문 확인 요청문", free: "무료 급여 문제 대응 순서", freeHref: "/underpayment-guide" },
  { index: "04", href: "/eofy-pro", label: "세금 준비", name: "EOFY Pack Pro", price: "A$9.90", status: "출시 준비 중", outcome: "소득·공제 후보·회계사 전달 요약", free: "무료 택스 리턴 정보", freeHref: "/tax-return-guide" },
  { index: "05", href: "/leaving-australia-pro", label: "귀국 준비", name: "Leaving Pack Pro", price: "A$12.90", status: "출시 준비 중", outcome: "출국 업무·마지막 정산·질문 인계", free: "무료 귀국·DASP 가이드", freeHref: "/leaving-australia-guide" },
] as const;

const principles = [
  ["무료 정보는 계속 무료", "권리, 공식 출처, 기본 계산기와 핵심 체크리스트를 Pro 뒤로 옮기지 않습니다."],
  ["결과물이 생길 때만 Pro", "회사별 지원서, 증빙 패키지, 정산 요약처럼 반복 작업을 줄이는 기능만 구분합니다."],
  ["구독보다 1회 결제 우선", "워홀·유학생이 특정 시기에만 쓰는 도구는 월 구독보다 프로젝트 단위 가격을 먼저 검토합니다."],
  ["민감정보를 덜 받는 구조", "TFN, 여권, 계좌번호와 원본 서류를 서버에 모으지 않는 개발판부터 검증합니다."],
] as const;

export default function ProPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Hoju Compass Pro", path: "/pro" }]} /><Header /><main>
    <section className="border-b border-navy/15 py-12 sm:py-20"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem] lg:items-end"><div className="max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Hoju Compass Pro</p><h1 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-navy [word-break:keep-all] sm:text-7xl">정보를 파는 대신,<br /><span className="font-normal text-navy-light">준비 시간을 줄입니다.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg">무료 가이드로 무엇을 해야 하는지 확인하고, Pro 작업 공간에서 실제 제출·상담·정산용 결과물을 빠르게 준비하는 구조입니다.</p></div><aside className="border-l-2 border-gold pl-6 text-sm leading-7 text-muted"><strong className="block text-navy">제품 구성 미리보기</strong>기능과 무료 대안은 지금 확인할 수 있습니다. 실제 작업 공간은 안전한 결제 권한 확인을 마친 뒤 순차 공개합니다.</aside></div></Container></section>
    <section className="py-14 sm:py-20"><Container><ProProductFinder /></Container></section>
    <section className="border-y border-navy/15 bg-white py-14 sm:py-20"><Container><div className="grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Five focused workspaces</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-5xl">필요한 순간에 하나씩.</h2></div><p className="text-sm leading-7 text-muted">가격은 호주달러 기준 1회 결제 후보입니다. 기능 구성은 공개하되 작업 공간은 결제 권한 복구와 환불·분쟁 처리가 검증된 제품부터 엽니다.</p></div><ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2 xl:grid-cols-3">{products.map((product, index) => <li key={product.href} className={`border-b border-navy/20 ${index % 2 === 0 ? "md:border-r" : ""} xl:border-r-0 ${index % 3 !== 2 ? "xl:border-r" : ""}`}><article className="flex h-full min-h-80 flex-col p-6 sm:p-8"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm text-gold">{product.index} / 05</span><span className="border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted">{product.status}</span></div><p className="mt-9 text-xs font-semibold uppercase tracking-[0.14em] text-gold">{product.label}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><h3 className="text-2xl font-semibold text-navy">{product.name}</h3><p className="text-xl font-semibold text-navy">{product.price}</p></div><p className="mt-5 text-sm leading-7 text-muted">{product.outcome}</p><p className="mt-3 text-xs text-navy/60">무료 유지: {product.free}</p><div className="mt-auto flex flex-wrap gap-4 pt-8"><Link href={product.href} className="border-b-2 border-gold text-sm font-semibold text-navy">제품 구성 보기</Link><Link href={product.freeHref} className="ml-auto text-sm font-medium text-muted hover:text-navy">무료 도구</Link></div></article></li>)}</ol></Container></section>
    <section className="py-14 sm:py-20"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Product principles</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy">유료화의 경계를 먼저 공개합니다.</h2><dl className="mt-9 grid gap-px bg-border md:grid-cols-2">{principles.map(([title, detail]) => <div key={title} className="bg-surface p-6 sm:p-8"><dt className="text-xl font-semibold text-navy">{title}</dt><dd className="mt-3 text-sm leading-7 text-muted">{detail}</dd></div>)}</dl></Container></section>
    <section className="bg-navy py-12 text-white sm:py-16"><Container className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Free stays useful</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">출시 전에도 무료 도구는 그대로 이용하세요.</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">기본 정보, 계산기와 체크리스트는 Pro 출시 여부와 관계없이 계속 무료로 제공합니다.</p></div><Link href="/tools" className="inline-flex min-h-12 items-center justify-center bg-gold px-5 text-sm font-semibold text-navy hover:bg-white">무료 도구 찾기 →</Link></Container></section>
  </main><Footer /></>;
}
