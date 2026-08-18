import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { sectionIds } from "@/lib/utils";

const essentials = [
  { number: "01", href: "/salary-calculator", eyebrow: "일과 급여", title: "통합 급여 계산기", description: "시급이나 연봉을 넣으면 세전·세후 급여와 Super를 함께 볼 수 있어요." },
  { number: "02", href: "/arrival-checklist", eyebrow: "호주 도착", title: "첫 30일 정착", description: "전화와 교통부터 은행, TFN, 첫 직장 준비까지 순서대로 챙겨보세요." },
  { number: "03", href: "/property-inspection-checklist", eyebrow: "집 구하기", title: "집 방문 체크리스트", description: "집을 보러 간 자리에서 상태와 비용, 계약 조건을 하나씩 확인할 수 있어요." },
  { number: "04", href: "/resume-builder", eyebrow: "취업 준비", title: "영문 이력서 빌더", description: "막막한 영문 문장은 예시를 참고하고, 내게 맞는 디자인으로 정리해보세요." },
];

export function ToolsSection() {
  return <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-16 sm:py-24" aria-labelledby="essential-tools-heading"><Container>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold">바로 써볼 수 있어요</p><h2 id="essential-tools-heading" className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">많이 쓰는 도구</h2><p className="mt-3 text-sm leading-6 text-muted sm:text-base">처음 오셨다면 아래 네 가지부터 편하게 써보세요.</p></div><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">전체 도구 보기 →</Link></div>

    <ol className="mt-8 grid gap-4 sm:grid-cols-2">{essentials.map((tool)=><li key={tool.href}><Link href={tool.href} className="group grid h-full min-h-52 grid-rows-[auto_1fr_auto] rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[0_12px_30px_rgba(26,39,68,0.06)] sm:p-7"><div className="flex items-center justify-between"><span className="text-xs text-muted">{tool.number}</span><span className="text-xs font-semibold text-gold">{tool.eyebrow}</span></div><div className="self-center py-7"><h3 className="text-2xl font-semibold tracking-tight text-navy">{tool.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted">{tool.description}</p></div><span className="flex items-center justify-between text-sm font-semibold text-navy"><span>바로 써보기</span><span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link></li>)}</ol>
  </Container></section>;
}
