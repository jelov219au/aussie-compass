import Link from "next/link";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { sectionIds } from "@/lib/utils";

const essentials = [
  { number: "01", icon: "arrival" as const, href: "/arrival-checklist", eyebrow: "호주 도착", title: "첫 30일 정착", description: "전화와 교통부터 은행, TFN, 첫 직장 준비까지 순서대로 챙겨보세요.", action: "23개 항목 체크 시작" },
  { number: "02", icon: "visa" as const, href: "/visa-preparation-guide", eyebrow: "출국 준비", title: "비자·신체검사 준비", description: "신청 경로와 비용, 지정 병원을 공식 사이트에서 확인하는 순서를 알아보세요.", action: "공식 확인 순서 보기" },
  { number: "03", icon: "home" as const, href: "/property-inspection-checklist", eyebrow: "집 구하기", title: "집 방문 체크리스트", description: "집을 보러 간 자리에서 상태와 비용, 계약 조건을 하나씩 확인할 수 있어요.", action: "현장 체크 시작" },
  { number: "04", icon: "work" as const, href: "/resume-builder", eyebrow: "취업 준비", title: "영문 이력서 빌더", description: "내 실제 경험을 브라우저에 저장하고, PDF와 백업 파일로 내보내 다음 지원에도 다시 사용하세요.", action: "무료 이력서 만들기" },
];

export function ToolsSection() {
  return <section id={sectionIds.tools} className="scroll-mt-20 bg-background py-16 sm:py-24" aria-labelledby="essential-tools-heading"><Container>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold-ink">바로 써볼 수 있어요</p><h2 id="essential-tools-heading" className="mt-2 text-3xl font-semibold tracking-[-0.025em] text-navy sm:text-4xl">처음이라면 여기부터</h2><p className="mt-3 text-sm leading-6 text-muted sm:text-base">도착과 정착, 집, 일자리 준비처럼 지금 필요한 순서부터 편하게 시작하세요.</p></div><Link href="/tools" className={actionClass("tertiary")}>전체 도구 보기 <span aria-hidden="true">→</span></Link></div>

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

    <ol className="mt-8 grid gap-5 sm:grid-cols-2">{essentials.map((tool)=><li key={tool.href}><TrackedLink href={tool.href} eventName="Home Navigation" properties={{ section: "essential_tools", destination: tool.href.slice(1) }} className="group grid h-full min-h-64 grid-rows-[auto_1fr_auto] overflow-hidden rounded-3xl border-2 border-navy/10 bg-white p-6 shadow-[0_10px_28px_rgba(26,39,68,0.06)] transition hover:-translate-y-1 hover:border-gold hover:shadow-[0_18px_40px_rgba(26,39,68,0.11)] sm:p-7"><div className="flex items-start justify-between gap-4"><TopicIcon name={tool.icon} /><span className="rounded-full bg-surface px-3 py-1.5 text-xs font-semibold text-gold-ink">{tool.number} · {tool.eyebrow}</span></div><div className="py-7"><h3 className="text-2xl font-semibold tracking-tight text-navy">{tool.title}</h3><p className="mt-3 max-w-md text-sm leading-6 text-muted">{tool.description}</p></div><span className="flex min-h-12 items-center justify-between rounded-xl bg-navy px-5 text-sm font-semibold text-white transition group-hover:bg-navy-light"><span>{tool.action}</span><span className="text-lg transition group-hover:translate-x-1" aria-hidden="true">→</span></span></TrackedLink></li>)}</ol>

    <TrackedLink href="/resume-job-ad-checker" eventName="Home Navigation" properties={{ section: "resume_job_ad_evidence", destination: "resume-job-ad-checker" }} className="group mt-4 block border border-navy/20 bg-surface transition hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2">
      <span className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[11rem_1fr_auto] lg:items-center">
        <span><span className="block text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">지원할 Job Ad가 있다면</span><span className="mt-2 block text-xs leading-5 text-muted">입력 원문 서버 전송 없음</span></span>
        <span><strong className="block text-lg text-navy sm:text-xl">키워드를 넣기 전에 실제 경험 근거부터 확인하세요</strong><span className="mt-2 block text-sm leading-6 text-muted">현재 이력서와 공고 문구를 로컬에서 비교하고, 다음에 답할 근거 질문을 최대 3개로 좁혀 드립니다.</span></span>
        <span className="inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-gold group-hover:text-navy">무료 공고 맞춤 점검 <span className="ml-2 transition group-hover:translate-x-1" aria-hidden="true">→</span></span>
      </span>
    </TrackedLink>
  </Container></section>;
}
