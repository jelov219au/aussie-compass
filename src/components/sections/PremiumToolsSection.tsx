import Link from "next/link";
import { Container } from "@/components/ui/Container";

const products = [
  {
    href: "/resume-pro",
    index: "01",
    label: "구직 준비",
    name: "Resume Pro",
    price: "A$19.90",
    summary: "이력서, 커버레터와 공고 점검을 회사별 지원 패키지로 정리합니다.",
    detail: "1회 결제 검토 · 개발판 체험 가능",
    status: "결제 테스트 중",
  },
  {
    href: "/eofy-pro",
    index: "02",
    label: "세금 준비",
    name: "EOFY Pack Pro",
    price: "A$9.90",
    summary: "소득과 공제 증빙을 한 해의 체크리스트와 회계사 전달용 요약으로 묶습니다.",
    detail: "1회 결제 검토 · 개발판 체험 가능",
    status: "기능 검증 중",
  },
  {
    href: "/rental-application-pro",
    index: "03",
    label: "집 구하기",
    name: "Rental Pack Pro",
    price: "A$14.90",
    summary: "렌트 신청 서류, 개인정보 점검과 영문 소개문을 집 후보별 패키지로 정리합니다.",
    detail: "1회 결제 검토 · 개발판 체험 가능",
    status: "기능 검증 중",
  },
  {
    href: "/leaving-australia-pro",
    index: "04",
    label: "귀국 준비",
    name: "Leaving Pack Pro",
    price: "A$12.90",
    summary: "출국 전후 업무, 마지막 정산과 확인 질문을 개인 귀국 준비 패키지로 정리합니다.",
    detail: "1회 결제 검토 · 개발판 체험 가능",
    status: "기능 검증 중",
  },
];

export function PremiumToolsSection() {
  return <section id="pro" className="scroll-mt-20 border-y border-navy/15 bg-white py-16 sm:py-20" aria-labelledby="premium-tools-heading"><Container>
    <div className="grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Hoju Compass Pro</p><h2 id="premium-tools-heading" className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-5xl">정보를 찾는 시간보다,<br /><span className="font-normal text-navy-light">준비하는 시간을 줄이는 도구.</span></h2></div><p className="text-sm leading-7 text-muted">기본 정보와 핵심 체크리스트는 무료로 유지합니다. 반복 작업을 줄이고 결과물을 묶어주는 기능만 1회 결제형 Pro로 개발합니다.</p></div>
    <ol className="mt-10 grid border-t border-navy/20 md:grid-cols-2 xl:grid-cols-4">{products.map((product, index) => <li key={product.href} className={`border-b border-navy/20 ${index % 2 === 0 ? "md:border-r" : ""} ${index < products.length - 1 ? "xl:border-r" : ""}`}><Link href={product.href} className="group grid min-h-80 grid-rows-[auto_1fr_auto] p-6 transition hover:bg-surface sm:p-8"><div className="flex items-center justify-between gap-3"><span className="font-mono text-sm text-gold">{product.index} / 04</span><span className="border border-border bg-white px-3 py-1 text-xs font-semibold text-muted">{product.status}</span></div><div className="py-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{product.label}</p><div className="mt-2 flex flex-wrap items-end justify-between gap-4"><h3 className="text-2xl font-semibold tracking-tight text-navy">{product.name}</h3><p className="text-xl font-semibold text-navy">{product.price}</p></div><p className="mt-5 max-w-xl text-sm leading-7 text-muted">{product.summary}</p><p className="mt-4 text-xs font-medium text-navy/60">{product.detail}</p></div><span className="flex items-center justify-between border-t border-border pt-5 text-sm font-semibold text-navy"><span>제품 구성 보기</span><span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link></li>)}</ol>
    <p className="mt-5 text-xs leading-5 text-muted">표시 가격과 기능은 출시 전 조정될 수 있습니다. 준비 중인 제품은 결제되지 않으며, 세무·법률·주거·취업 결과를 보장하지 않습니다.</p>
  </Container></section>;
}
