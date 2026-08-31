import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { sectionIds } from "@/lib/utils";

const essentials = [
  { number: "01", icon: "arrival" as const, href: "/arrival-checklist", eyebrow: "호주 도착", title: "첫 30일 정착", description: "유심부터 은행·TFN까지 차근차근.", action: "체크 시작" },
  { number: "02", icon: "visa" as const, href: "/visa-preparation-guide", eyebrow: "출국 준비", title: "비자 준비", description: "비자 절차와 지정 병원을 확인해요.", action: "준비 순서" },
  { number: "03", icon: "home" as const, href: "/property-inspection-checklist", eyebrow: "집 구하기", title: "집 방문 체크", description: "현장에서 놓치기 쉬운 것들을 체크해요.", action: "집 보러 가기" },
  { number: "04", icon: "work" as const, href: "/resume-builder", eyebrow: "취업 준비", title: "영문 이력서", description: "경험을 정리하고 PDF로 준비해요.", action: "무료로 만들기" },
];

export function ToolsSection() {
  return <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-8 sm:py-16" aria-labelledby="essential-tools-heading"><Container>
    <div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-gold-ink">바로 써볼 수 있어요</p><h2 id="essential-tools-heading" className="mt-2 text-xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">처음이라면 여기부터</h2></div><Link href="/tools" className={actionClass("tertiary", "shrink-0")}>전체 도구 <span aria-hidden="true">→</span></Link></div>

    <ol className="mt-6 grid grid-cols-2 gap-3 sm:gap-5">{essentials.map((tool)=><li key={tool.href}><TrackedLink href={tool.href} eventName="Home Navigation" properties={{ section: "essential_tools", destination: tool.href.slice(1) }} className="group grid h-full grid-rows-[auto_1fr_auto] rounded-2xl border border-navy/15 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_40px_rgba(26,39,68,0.11)] sm:p-7"><div className="flex flex-wrap items-center gap-2"><TopicIcon name={tool.icon} size="sm" /><span className="text-xs font-semibold text-gold-ink">{tool.eyebrow}</span></div><div className="py-4"><h3 className="text-base font-semibold tracking-tight text-navy sm:text-2xl">{tool.title}</h3><p className="mt-2 max-w-md text-xs leading-5 text-muted sm:text-sm sm:leading-6">{tool.description}</p></div><span className="flex min-h-11 items-center justify-between gap-1 border-t border-border pt-2 text-xs font-semibold text-navy sm:text-sm"><span>{tool.action}</span><span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">→</span></span></TrackedLink></li>)}</ol>

    <TrackedLink href="/english-phrase-cards" eventName="Home Navigation" properties={{ section: "english_phrase_preview", destination: "english-phrase-cards" }} className="group relative mt-8 block overflow-hidden rounded-2xl bg-navy text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(26,39,68,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
      <span className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10" aria-hidden="true" />
      <span className="absolute right-8 top-8 h-28 w-28 rounded-full border border-gold/30" aria-hidden="true" />
      <span className="relative grid gap-4 p-5 sm:p-8 lg:grid-cols-[12rem_1fr_auto] lg:items-center">
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-gold">지금 바로 한 문장</span>
          <span className="mt-1 block text-xs leading-5 text-white/70">은행 · 집 · 직장 · 병원</span>
        </span>
        <span>
          <strong className="block text-lg leading-7 sm:text-2xl" lang="en">Sorry, could you say that more slowly?</strong>
          <span className="mt-2 block text-sm leading-6 text-white/70">죄송하지만 조금 천천히 말씀해 주실 수 있나요?</span>
        </span>
        <span className="inline-flex min-h-12 items-center justify-center border border-gold bg-gold px-5 py-3 text-sm font-semibold text-navy transition group-hover:bg-white">상황별 25개 문장 보기 <span className="ml-3 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
      </span>
    </TrackedLink>
    <TrackedLink href="/resume-job-ad-checker" eventName="Home Navigation" properties={{ section: "resume_job_ad_evidence", destination: "resume-job-ad-checker" }} className="group mt-4 block rounded-2xl border border-navy/20 bg-surface transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
      <span className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[11rem_1fr_auto] lg:items-center">
        <span><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">지원할 Job Ad가 있다면</span><span className="mt-2 block text-xs leading-5 text-muted">입력 원문 서버 전송 없음</span></span>
        <span><strong className="block text-lg text-navy sm:text-xl">지원할 공고에 내 경험 맞춰보기</strong><span className="mt-2 block text-sm leading-6 text-muted">이력서와 공고를 이 기기에서 비교해요. 실제 경험 근거를 먼저 확인하세요.</span></span>
        <span className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-gold group-hover:text-navy">무료 공고 맞춤 점검 <span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
      </span>
    </TrackedLink>
  </Container></section>;
}
