import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
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
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold">바로 써볼 수 있어요</p><h2 id="essential-tools-heading" className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">많이 쓰는 도구</h2><p className="mt-3 text-sm leading-6 text-muted sm:text-base">처음 오셨다면 지금 필요한 것부터 편하게 써보세요.</p></div><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">전체 도구 보기 →</Link></div>

    <TrackedLink href="/english-phrase-cards" eventName="Home Navigation" properties={{ section: "english_phrase_preview", destination: "english-phrase-cards" }} className="group relative mt-8 block overflow-hidden rounded-2xl bg-navy text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(26,39,68,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
      <span className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
      <span className="absolute right-8 top-8 h-28 w-28 rounded-full border border-gold/30" aria-hidden="true" />
      <span className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[12rem_1fr_auto] lg:items-center">
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">지금 바로 한 문장</span>
          <span className="mt-3 block text-sm leading-6 text-white/60">은행 · 집 · 직장 · 병원</span>
        </span>
        <span>
          <strong className="block text-xl leading-8 sm:text-2xl" lang="en">Sorry, could you say that more slowly?</strong>
          <span className="mt-2 block text-sm leading-6 text-white/70">죄송하지만 조금 천천히 말씀해 주실 수 있나요?</span>
        </span>
        <span className="inline-flex min-h-12 items-center justify-center border border-gold bg-gold px-5 py-3 text-sm font-semibold text-navy transition group-hover:bg-white">상황별 25개 문장 보기 <span className="ml-3 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
      </span>
    </TrackedLink>

    <ol className="mt-8 grid gap-4 sm:grid-cols-2">{essentials.map((tool)=><li key={tool.href}><TrackedLink href={tool.href} eventName="Home Navigation" properties={{ section: "essential_tools", destination: tool.href.slice(1) }} className="group grid h-full min-h-52 grid-rows-[auto_1fr_auto] rounded-2xl border border-border bg-white p-6 transition hover:-translate-y-0.5 hover:border-navy/25 hover:shadow-[0_12px_30px_rgba(26,39,68,0.06)] sm:p-7"><div className="flex items-center justify-between"><span className="text-xs text-muted">{tool.number}</span><span className="text-xs font-semibold text-gold">{tool.eyebrow}</span></div><div className="self-center py-7"><h3 className="text-2xl font-semibold tracking-tight text-navy">{tool.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted">{tool.description}</p></div><span className="flex items-center justify-between text-sm font-semibold text-navy"><span>바로 써보기</span><span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span></span></TrackedLink></li>)}</ol>
  </Container></section>;
}
