import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { sectionIds } from "@/lib/utils";

const essentials = [
  { number: "01", href: "/salary-calculator", eyebrow: "일과 급여", title: "통합 급여 계산기", description: "세전·세후 급여와 Super, 전체 보상 패키지를 한 번에 확인합니다.", tone: "navy" },
  { number: "02", href: "/arrival-checklist", eyebrow: "호주 도착", title: "첫 30일 정착", description: "전화·교통, 은행, TFN과 첫 직장 준비를 순서대로 진행합니다.", tone: "gold" },
  { number: "03", href: "/public-transport-guide", eyebrow: "집과 이동", title: "통학 생활권 비교", description: "주거비와 학교·직장까지 실제 이동시간을 후보별로 비교합니다.", tone: "plain" },
  { number: "04", href: "/resume-builder", eyebrow: "취업 준비", title: "영문 이력서 빌더", description: "호주식 문장 예시와 디자인 선택으로 이력서를 완성합니다.", tone: "plain" },
  { number: "05", href: "/tax-return-guide", eyebrow: "세금", title: "택스 리턴 준비", description: "EOFY 자료와 공제 증빙, 공식 신고 일정을 빠짐없이 챙깁니다.", tone: "plain" },
  { number: "06", href: "/leaving-australia-guide", eyebrow: "귀국", title: "귀국·DASP 가이드", description: "렌트와 계정을 정리하고 출국 후 Super 환급을 준비합니다.", tone: "plain" },
];

export function ToolsSection() {
  return <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-16 sm:py-24" aria-labelledby="essential-tools-heading"><Container>
    <div className="grid gap-8 border-b border-navy/20 pb-8 lg:grid-cols-[1fr_20rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Selected toolkit</p><h2 id="essential-tools-heading" className="mt-3 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-5xl">가장 필요한 도구부터.</h2></div><p className="text-sm leading-6 text-muted">호주 생활의 주요 순간마다 하나씩 골랐습니다. 모든 도구는 회원가입 없이 사용할 수 있습니다.</p></div>

    <ol className="grid border-b border-navy/20 lg:grid-cols-2">{essentials.map((tool,index)=><li key={tool.href} className={`border-border ${index%2===0?"lg:border-r":""} ${index<essentials.length-2?"border-b":"max-lg:border-b"}`}><Link href={tool.href} className={`group grid min-h-56 grid-rows-[auto_1fr_auto] p-6 transition sm:p-8 ${tool.tone==="navy"?"bg-navy text-white hover:bg-navy-light":tool.tone==="gold"?"bg-gold/12 text-navy hover:bg-gold/20":"hover:bg-white"}`}><div className="flex items-center justify-between"><span className={`font-mono text-sm ${tool.tone==="navy"?"text-gold":"text-muted"}`}>{tool.number} / 06</span><span className={`text-xs font-semibold uppercase tracking-[0.16em] ${tool.tone==="navy"?"text-white/55":"text-gold"}`}>{tool.eyebrow}</span></div><div className="self-center py-8"><h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{tool.title}</h3><p className={`mt-3 max-w-md text-sm leading-6 ${tool.tone==="navy"?"text-white/65":"text-muted"}`}>{tool.description}</p></div><span className="flex items-center justify-between text-sm font-semibold"><span>도구 열기</span><span className="text-xl transition group-hover:translate-x-1" aria-hidden="true">→</span></span></Link></li>)}</ol>
    <div className="mt-7 flex justify-end"><Link href="/tools" className="inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">16개 전체 도구 보기 <span className="ml-3" aria-hidden="true">→</span></Link></div>
  </Container></section>;
}
