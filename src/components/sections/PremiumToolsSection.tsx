import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { Container } from "@/components/ui/Container";
import { TopicIcon } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { getRentalApplicationPaymentReadiness, isResumeProLive } from "@/lib/commerce";
import { homePremiumFreeActions, selectHomePremiumProduct } from "@/lib/homePremiumRecommendation";
import { getProCatalogProducts } from "@/lib/proCatalogProducts";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export function PremiumToolsSection() {
  const resumeProLive = isResumeProLive();
  const products = getProCatalogProducts(resumeProLive, getRentalApplicationPaymentReadiness().ready);
  const featuredProduct = selectHomePremiumProduct(products);

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
                <TrackedLink href={`/pro#${product.id}`} eventName="Pro Interest" properties={{ product: product.id, entry: "home_catalog" }} className="block min-h-11 py-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
                  <strong className="text-sm text-white">{product.name}</strong>
                  <span className="mt-1 block text-sm leading-6 text-white/85">{product.outcome}</span>
                  <span className="mt-1 block text-xs leading-5 text-white/70">{product.status} · {product.price} · {product.priceNote}</span>
                </TrackedLink>
              </li>)}
            </ul>
            <TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home" }} className={actionClass("darkSecondary", "mt-6 w-full sm:w-auto")}>결과물·무료 대안·가격 비교 <span aria-hidden="true">→</span></TrackedLink>
          </div>
          <div className="bg-background p-7 sm:p-10" data-home-featured-product={featuredProduct?.id ?? "none"}>
            {featuredProduct ? <>
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex min-w-0 items-center gap-4"><TopicIcon name={featuredProduct.icon} /><div className="min-w-0"><p className="inline-flex rounded-full bg-[#e3f3e8] px-3 py-1 text-xs font-semibold text-[#24623b]">{featuredProduct.status}</p><h3 className="mt-2 break-words text-3xl font-semibold text-navy">{featuredProduct.name}</h3></div></div>
                <div className="text-left sm:text-right"><strong className="block text-2xl text-navy">{featuredProduct.price}</strong><span className="mt-1 block text-xs text-muted">{featuredProduct.priceNote}</span></div>
              </div>
              <p className="mt-5 text-sm leading-7 text-muted">현재 이용 가능한 Pro 중 먼저 확인할 수 있는 작업 공간입니다. 결제 전에 남기는 결과물과 무료 대안을 함께 비교하세요.</p>
              <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5" aria-label={`${featuredProduct.name} 결과물`}><span className="text-xs font-semibold text-gold-ink">남기는 결과물</span><strong className="mt-2 block text-base leading-7 text-navy">{featuredProduct.outcome}</strong></div>
              {featuredProduct.id === "resume-pro" ? <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ResumeProCtaLink href="/resume-pro?from=home-premium" surface={resumeFunnelSurfaces.homePremium} context={resumeFunnelContexts.home} className={actionClass("primary", "w-full")}>{featuredProduct.name} 보기 · {featuredProduct.price} <span aria-hidden="true">→</span></ResumeProCtaLink>
                <ResumeProProofLink entry="home-premium" className={actionClass("secondary", "w-full")}>결제 전에 내 공고로 무료 확인 →</ResumeProProofLink>
              </div> : <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <TrackedLink href={featuredProduct.href} eventName="Pro Interest" properties={{ product: featuredProduct.id, entry: "home_featured" }} className={actionClass("primary", "w-full")}>{featuredProduct.name} 상세 · {featuredProduct.price} <span aria-hidden="true">→</span></TrackedLink>
                <TrackedLink href={featuredProduct.freeHref} eventName="Home Navigation" properties={{ section: "premium_featured_free", destination: featuredProduct.freeHref.slice(1) }} className={actionClass("secondary", "w-full")}>{featuredProduct.free} <span aria-hidden="true">→</span></TrackedLink>
              </div>}
              {featuredProduct.id === "resume-pro" && <p className="mt-4 text-xs leading-5 text-muted">무료 확인은 로그인 없이 현재 브라우저에서만 실행되며, 이력서·공고 원문을 서버로 전송하지 않아요.</p>}
              <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">표시된 가격은 1회 결제이며 구독이 아닙니다. 실제 결제 가능 여부와 최종 금액은 제품 상세와 결제 화면에서 다시 확인하세요.</p>
            </> : <div>
              <p className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">지금 이용 가능한 Pro 없음</p>
              <h3 className="mt-3 text-3xl font-semibold text-navy">지금 바로 할 수 있는 무료 다음 단계</h3>
              <p className="mt-5 text-sm leading-7 text-muted">결제를 기다리지 않고 현재 상황의 기록과 질문부터 준비할 수 있어요. 아래 도구는 제출·신고·구매를 대신 완료하지 않습니다.</p>
              <ul className="mt-6 divide-y divide-border border-y border-border" aria-label="지금 이용 가능한 무료 다음 단계">{homePremiumFreeActions.map((action)=><li key={action.href}><TrackedLink href={action.href} eventName="Home Navigation" properties={{ section: "premium_closed_free", destination: action.href.slice(1) }} className="grid min-h-20 gap-1 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"><strong className="text-sm text-navy">{action.title}</strong><span className="text-xs leading-5 text-muted">{action.outcome} →</span></TrackedLink></li>)}</ul>
              <TrackedLink href="/pro" eventName="Pro Interest" properties={{ product: "catalog", entry: "home_closed" }} className={actionClass("secondary", "mt-6 w-full")}>준비 중인 Pro 상태 비교 <span aria-hidden="true">→</span></TrackedLink>
            </div>}
          </div>
        </div>
      </Container>
    </section>
  );
}
