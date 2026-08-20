import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";

export function PremiumToolsSection() {
  return <section id="pro" className="scroll-mt-20 bg-surface py-16 sm:py-20" aria-labelledby="premium-tools-heading"><Container>
    <div className="grid overflow-hidden rounded-3xl border border-border bg-white lg:grid-cols-[1.1fr_0.9fr]">
      <div className="p-7 sm:p-10"><p className="text-xs font-semibold text-gold">조금 더 든든한 준비가 필요할 때</p><h2 id="premium-tools-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">혼자 준비하기 막막했던 일,<br />하나씩 함께해요.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">이력서부터 렌트 지원, EOFY 정리까지. 복잡한 준비 과정을 순서대로 따라가며 필요한 결과물을 직접 만들 수 있습니다.</p><TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home" }} className="mt-7 inline-flex min-h-11 items-center rounded-full bg-navy px-5 text-sm font-semibold text-white">Pro 도구 살펴보기 →</TrackedLink></div>
      <div className="border-t border-border bg-background p-7 sm:p-10 lg:border-l lg:border-t-0"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold text-gold">현재 결제 테스트 중</p><h3 className="mt-2 text-2xl font-semibold text-navy">Resume Pro</h3></div><strong className="text-xl text-navy">A$19.90</strong></div><p className="mt-5 text-sm leading-7 text-muted">이력서, 커버레터와 공고 점검을 회사별 지원 패키지로 정리합니다.</p><TrackedLink href="/resume-pro" eventName="Pro Interest" properties={{ product: "resume_pro", entry: "home" }} className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-navy">제품 구성 보기 →</TrackedLink><p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-muted">표시 가격과 기능은 출시 전 조정될 수 있으며 취업 결과를 보장하지 않습니다.</p></div>
    </div>
  </Container></section>;
}
