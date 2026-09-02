import Link from "next/link";

import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { getRentalApplicationPaymentReadiness, isResumeProLive } from "@/lib/commerce";
import { getProCatalogProducts } from "@/lib/proCatalogProducts";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export function PremiumToolsSection() {
  const resumeProLive = isResumeProLive();
  const products = getProCatalogProducts(resumeProLive, getRentalApplicationPaymentReadiness().ready);
  const readyNowPrimaryClass = actionClass("primary", "min-h-12 w-full");
  const readyNowSecondaryClass = actionClass("secondary", "min-h-12 w-full");

  return (
    <section id="pro" className="scroll-mt-20 bg-surface py-16 sm:py-20" aria-labelledby="premium-tools-heading">
      <Container>
        <div className="grid overflow-hidden rounded-[2rem] border-2 border-navy/10 bg-white shadow-[0_20px_55px_rgba(26,39,68,0.1)] lg:grid-cols-[0.86fr_1.14fr]">
          <div className="bg-navy p-7 text-white sm:p-10">
            <p className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-ink">정보를 찾은 다음, 내 준비를 끝낼 때</p>
            <h2 id="premium-tools-heading" className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">정보를 읽은 다음,<br /><span className="text-gold">제출할 결과물까지.</span></h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/70 sm:text-base">기본 정보와 점검은 무료로 이용하세요. 공고별 문서와 기록을 반복해서 준비할 때만 Pro를 선택하면 됩니다.</p>
            <ul className="mt-7 divide-y divide-white/15 border-y border-white/15" aria-label="필요한 Pro 결과물 고르기">
              {products.map((product) => <li key={product.id}>
                <Link href={`/pro#${product.id}`} className="block min-h-11 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                  <strong className="text-sm text-white">{product.name}</strong>
                  <span className="mt-1 block text-sm leading-6 text-white/85">{product.outcome}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/70">{product.status} · {product.price} · {product.priceNote}</span>
                </Link>
              </li>)}
            </ul>
            <TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home" }} className={actionClass("darkSecondary", "mt-6 w-full sm:w-auto")}>결과물·무료 대안·가격 비교 <span aria-hidden="true">→</span></TrackedLink>
          </div>
          <div className="bg-background p-7 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-center gap-4"><TopicIcon name="document" /><div><p className="inline-flex rounded-full bg-[#e3f3e8] px-3 py-1 text-xs font-semibold text-[#24623b]">{resumeProLive ? "현재 이용 가능" : "무료 공고 점검은 지금 이용 가능"}</p><h3 className="mt-2 text-3xl font-semibold text-navy">Resume Pro</h3></div></div>
              <div className="text-right"><strong className="block text-2xl text-navy">A$19.90</strong><span className="mt-1 block text-xs text-muted">1회 결제 · 구독 없음</span></div>
            </div>
            <p className="mt-5 text-sm leading-7 text-muted">{resumeProLive ? "지원하고 싶은 공고가 생겼다면, 내 실제 경력을 회사별 이력서와 커버레터로 정리해보세요." : "판매를 기다리지 않아도 실제 이력서와 공고를 지금 비교할 수 있어요. 경력 초안은 무료 Builder에 현재 브라우저용으로 저장하세요."}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-label="Resume Pro 결과물">
              {["공고별 이력서", "커버레터", "STAR 면접 메모"].map((item, index) => <div key={item} className="rounded-2xl border border-navy/10 bg-white p-4"><span className="font-mono text-xs text-gold-ink">0{index + 1}</span><strong className="mt-3 block text-sm text-navy">{item}</strong><span className="mt-1 block text-xs leading-5 text-muted">회사별로 저장하고 다시 수정</span></div>)}
            </div>
            {resumeProLive ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className={actionClass("primary", "w-full")}>Resume Pro 보기 · A$19.90 <span aria-hidden="true">→</span></ResumeProCtaLink>
                <ResumeProProofLink entry="home-premium" className={actionClass("secondary", "w-full")}>내 공고로 먼저 무료 점검</ResumeProProofLink>
              </div>
            ) : (
              <div className="mt-6 grid gap-3">
                <ResumeProProofLink entry="home-premium" data-touch-target="min-h-12" className={readyNowPrimaryClass}>결제 전에 내 공고로 무료 확인 →</ResumeProProofLink>
                <Link href="/resume-builder" data-touch-target="min-h-12" className={readyNowSecondaryClass}>실제 경력 초안 저장하기 →</Link>
                <ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className={actionClass("tertiary", "justify-self-center")}>회사별 저장·재사용 방식 미리 보기</ResumeProCtaLink>
              </div>
            )}
            <p className="mt-4 text-xs leading-5 text-muted">무료 확인은 로그인 없이 현재 브라우저에서만 실행되며, 이력서·공고 원문을 서버로 전송하지 않아요.</p>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">{resumeProLive ? "경력을 부풀리거나 취업 결과를 약속하는 도구는 아니에요." : "Resume Pro 결제는 아직 열지 않았지만, 무료 비교와 경력 저장은 바로 사용할 수 있어요."}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
