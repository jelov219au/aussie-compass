import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { Container } from "@/components/ui/Container";
import { isResumeProLive } from "@/lib/commerce";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export function PremiumToolsSection() {
  const resumeProLive = isResumeProLive();

  return <section id="pro" className="scroll-mt-20 bg-surface py-16 sm:py-20" aria-labelledby="premium-tools-heading"><Container>
    <div className="grid overflow-hidden rounded-3xl border border-border bg-white lg:grid-cols-[1.1fr_0.9fr]">
      <div className="p-7 sm:p-10"><p className="text-xs font-semibold text-gold-ink">정보를 찾은 다음, 내 준비를 끝낼 때</p><h2 id="premium-tools-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">반복해서 정리하는 시간은 줄이고,<br />바로 쓸 결과물을 만들어요.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">취업 지원, 렌트 신청, 급여 확인, 세금과 귀국 정리까지. 무료 정보로 먼저 확인하고, 문서와 기록이 필요할 때만 Pro를 이용하세요.</p><TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home" }} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white">지금 필요한 Pro 찾기 →</TrackedLink></div>
      <div className="border-t border-border bg-background p-7 sm:p-10 lg:border-l lg:border-t-0"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold text-gold-ink">{resumeProLive ? "현재 이용 가능" : "출시 준비 중"}</p><h3 className="mt-2 text-2xl font-semibold text-navy">Resume Pro</h3></div><strong className="text-xl text-navy">A$19.90</strong></div><p className="mt-5 text-sm leading-7 text-muted">지원하고 싶은 공고가 생겼다면, 내 실제 경력을 회사별 이력서와 커버레터로 정리해보세요.</p><div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center"><ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">{resumeProLive ? "이 공고에 맞춰 지원 준비하기 →" : "지원 준비 방식 보기 →"}</ResumeProCtaLink><ResumeProProofLink entry="home-premium" className="inline-flex min-h-11 items-center rounded-full border border-navy px-4 text-sm font-semibold text-navy transition hover:bg-white">결제 전에 내 공고로 무료 확인</ResumeProProofLink></div><p className="mt-4 text-xs leading-5 text-muted">무료 확인은 로그인 없이 현재 브라우저에서만 실행되며, 이력서·공고 원문을 서버로 전송하지 않아요.</p><p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">{resumeProLive ? "A$19.90 한 번만 결제하면 돼요. 경력을 부풀리거나 취업 결과를 약속하는 도구는 아니에요." : "결제와 이용 준비를 마치면 판매를 시작할게요. 취업 결과를 보장하는 상품은 아니에요."}</p></div>
    </div>
  </Container></section>;
}
