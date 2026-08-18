import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { sectionIds } from "@/lib/utils";

const essentials = [
  { number: "01", href: "/salary-calculator", eyebrow: "일과 급여", title: "통합 급여 계산기", description: "세전·세후 급여와 Super, 전체 보상 패키지를 한 번에 확인합니다." },
  { number: "02", href: "/arrival-checklist", eyebrow: "호주 도착", title: "첫 30일 정착", description: "전화·교통, 은행, TFN과 첫 직장 준비를 순서대로 진행합니다." },
  { number: "03", href: "/property-inspection-checklist", eyebrow: "집 구하기", title: "집 방문 체크리스트", description: "쉐어하우스와 렌트의 상태, 비용과 계약 조건을 현장에서 확인합니다." },
  { number: "04", href: "/resume-builder", eyebrow: "취업 준비", title: "영문 이력서 빌더", description: "호주식 문장 예시와 디자인 선택으로 이력서를 완성합니다." },
];

export function ToolsSection() {
  return <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-16 sm:py-24" aria-labelledby="essential-tools-heading"><Container>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><h2 id="essential-tools-heading" className="text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">많이 찾는 도구</h2><p className="mt-3 text-sm leading-6 text-muted sm:text-base">처음 온 사람도 바로 사용할 수 있는 핵심 도구만 골랐습니다.</p></div><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">전체 도구 보기 →</Link></div>

    <ol className="mt-8 grid gap-4 sm:grid-cols-2">{essentials.map((tool)=><li key={tool.href}><Link href={tool.href} className="group grid h-full min-h-52 grid-rows-[auto_1fr_auto] rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[0_12px_30px_rgba(26,39,68,0.06)] sm:p-7"><div className="flex items-center justify-between"><span className="text-xs text-muted">{tool.number}</span><span className="text-xs font-semibold text-gold">{tool.eyebrow}</span></div><div className="self-center py-7"><h3 className="text-2xl font-semibold tracking-tight text-navy">{tool.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted">{tool.description}</p></div><span className="flex items-center justify-between text-sm font-semibold text-navy"><span>도구 열기</span><span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link></li>)}</ol>
  </Container></section>;
}
