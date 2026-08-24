import Link from "next/link";

import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { Container } from "@/components/ui/Container";
import { isResumeProLive } from "@/lib/commerce";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export function PremiumToolsSection() {
  const resumeProLive = isResumeProLive();

  return (
    <section id="pro" className="scroll-mt-20 bg-surface py-16 sm:py-20" aria-labelledby="premium-tools-heading">
      <Container>
        <div className="grid overflow-hidden rounded-3xl border border-border bg-white lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-7 sm:p-10">
            <p className="text-xs font-semibold text-gold-ink">정보를 찾은 다음, 내 준비를 끝낼 때</p>
            <h2 id="premium-tools-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">반복해서 정리하는 시간은 줄이고,<br />바로 쓸 결과물을 만들어요.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">취업 지원, 렌트 신청, 급여 확인, 세금과 귀국 정리까지. 무료 정보로 먼저 확인하고, 문서와 기록이 필요할 때만 Pro를 이용하세요.</p>
            <TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home" }} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white">지금 필요한 Pro 찾기 →</TrackedLink>
          </div>
          <div className="border-t border-border bg-background p-7 sm:p-10 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-gold-ink">{resumeProLive ? "현재 이용 가능" : "무료 공고 점검은 지금 이용 가능"}</p>
                <h3 className="mt-2 text-2xl font-semibold text-navy">Resume Pro</h3>
              </div>
              <strong className="text-xl text-navy">A$19.90</strong>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">{resumeProLive ? "지원하고 싶은 공고가 생겼다면, 내 실제 경력을 회사별 이력서와 커버레터로 정리해보세요." : "판매를 기다리지 않아도 실제 이력서와 공고를 지금 비교할 수 있어요. 경력 초안은 무료 Builder에 현재 브라우저용으로 저장하세요."}</p>
            {resumeProLive ? (
              <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className="inline-flex min-h-11 items-center text-sm font-semibold text-navy">이 공고에 맞춰 지원 준비하기 →</ResumeProCtaLink>
                <ResumeProProofLink entry="home-premium" className="inline-flex min-h-11 items-center rounded-full border border-navy px-4 text-sm font-semibold text-navy transition hover:bg-white">결제 전에 내 공고로 무료 확인</ResumeProProofLink>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                <ResumeProProofLink entry="home-premium" className="inline-flex min-h-12 items-center justify-center rounded-full bg-navy px-5 text-center text-sm font-semibold text-white transition hover:bg-navy-light">결제 전에 내 공고로 무료 확인 →</ResumeProProofLink>
                <Link href="/resume-builder" className="inline-flex min-h-12 items-center justify-center rounded-full border border-navy px-5 text-center text-sm font-semibold text-navy hover:bg-white">실제 경력 초안 저장하기 →</Link>
                <ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">회사별 저장·재사용 방식 미리 보기</ResumeProCtaLink>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-muted">무료 확인은 로그인 없이 현재 브라우저에서만 실행되며, 이력서·공고 원문을 서버로 전송하지 않아요.</p>
            <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">{resumeProLive ? "A$19.90 한 번만 결제하면 돼요. 경력을 부풀리거나 취업 결과를 약속하는 도구는 아니에요." : "Resume Pro 결제는 아직 열지 않았지만, 무료 비교와 경력 저장은 바로 사용할 수 있어요."}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
