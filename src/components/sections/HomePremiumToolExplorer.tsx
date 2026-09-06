"use client";

import { useState } from "react";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { ResumeProProofLink } from "@/components/analytics/ResumeProProofLink";
import { ResumeProCtaLink } from "@/components/analytics/ResumeFunnelAnalytics";
import { TopicIcon, type TopicIconName } from "@/components/ui/TopicIcon";
import { actionClass } from "@/components/ui/actionStyles";
import { resumeFunnelContexts, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

type HomeProProduct = {
  id: string;
  icon: TopicIconName;
  href: string;
  name: string;
  price: string;
  live: boolean;
  outcome: string;
  free: string;
  freeHref: string;
  status: string;
  priceNote: string;
};

export function HomePremiumToolExplorer({
  products,
  initialProductId,
}: {
  products: readonly HomeProProduct[];
  initialProductId?: string;
}) {
  const [selectedId, setSelectedId] = useState(initialProductId ?? products[0]?.id ?? "");
  const product = products.find((item) => item.id === selectedId) ?? products[0];

  if (!product) return null;

  const panelId = "home-premium-product-panel";
  const resumeProduct = product.id === "resume-pro";

  return (
    <div className="grid overflow-hidden rounded-[2rem] border-2 border-navy/10 bg-white shadow-[0_20px_55px_rgba(26,39,68,0.1)] lg:grid-cols-[0.78fr_1.22fr]">
      <div className="min-w-0 bg-navy p-5 text-white sm:p-7 lg:p-8">
        <p className="inline-flex rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy">
          도움이 필요한 일을 골라보세요
        </p>
        <h2 id="premium-tools-heading" className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          어떤 준비가 필요한지 살펴보세요.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
          각 도구가 정리해 주는 내용과 무료로 먼저 할 수 있는 일, 현재 이용 가능 여부를 함께 보여드려요.
        </p>

        <div
          className="mt-6 grid snap-x snap-mandatory auto-cols-[minmax(11.5rem,76%)] grid-flow-col gap-2 overflow-x-auto pb-2 sm:auto-cols-[minmax(12.5rem,44%)] lg:grid-flow-row lg:grid-cols-1 lg:overflow-visible lg:pb-0"
          role="group"
          aria-label="Pro 도구 선택"
        >
          {products.map((item) => {
            const selected = item.id === product.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                aria-pressed={selected}
                aria-controls={panelId}
                className={`min-h-14 snap-start border-l-4 px-4 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  selected
                    ? "border-gold bg-white text-navy"
                    : "border-white/15 bg-white/[0.04] text-white hover:border-gold/70 hover:bg-white/[0.09]"
                }`}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="min-w-0">
                    <strong className="block truncate text-sm">{item.name}</strong>
                    <span className={`mt-1 block truncate text-xs ${selected ? "text-muted" : "text-white/55"}`}>
                      {item.status} · {item.price}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${selected ? "text-gold-ink" : "text-white/40"}`} aria-hidden="true">
                    {selected ? "선택됨" : "→"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <TrackedLink
          href="/pro"
          eventName="Pro Interest"
          properties={{ product: "catalog", entry: "home" }}
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-white underline decoration-gold decoration-2 underline-offset-4 hover:text-gold"
        >
          모든 Pro 도구 비교하기 →
        </TrackedLink>
      </div>

      <div id={panelId} className="flex min-w-0 flex-col bg-background p-6 sm:p-8 lg:p-10" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <TopicIcon name={product.icon} />
            <div className="min-w-0">
              <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.live ? "bg-[#e3f3e8] text-[#24623b]" : "bg-white text-muted"}`}>
                {product.status}
              </p>
              <h3 className="mt-2 break-words text-2xl font-semibold text-navy sm:text-3xl">{product.name}</h3>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <strong className="block text-2xl text-navy">{product.price}</strong>
            <span className="mt-1 block text-xs text-muted">{product.priceNote}</span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-navy/10 bg-white p-5">
          <span className="text-xs font-semibold text-gold-ink">이 도구로 준비할 수 있어요</span>
          <strong className="mt-2 block text-base leading-7 text-navy">{product.outcome}</strong>
        </div>

        <div className="mt-5">
          <p className="text-xs font-semibold text-navy">이용 순서</p>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Pro 도구 이용 순서">
            <li className="border-l-2 border-gold bg-white p-4">
              <span className="font-mono text-xs text-gold-ink">01</span>
              <strong className="mt-2 block text-sm text-navy">무료로 먼저 확인</strong>
              <p className="mt-1 text-xs leading-5 text-muted">{product.free}</p>
            </li>
            <li className="border-l-2 border-navy/20 bg-white p-4">
              <span className="font-mono text-xs text-muted">02</span>
              <strong className="mt-2 block text-sm text-navy">필요한 부분만 정리</strong>
              <p className="mt-1 text-xs leading-5 text-muted">내 상황에 맞게 항목을 채우고 빠진 내용을 확인해요.</p>
            </li>
            <li className="border-l-2 border-navy/20 bg-white p-4">
              <span className="font-mono text-xs text-muted">03</span>
              <strong className="mt-2 block text-sm text-navy">다음 행동에 활용</strong>
              <p className="mt-1 text-xs leading-5 text-muted">지원·신청·문의·확인 단계에서 정리한 내용을 활용해요.</p>
            </li>
          </ol>
        </div>

        <p className="mt-5 border-l-2 border-gold pl-4 text-sm leading-6 text-muted">
          무료 안내만으로 충분하면 여기서 멈춰도 괜찮아요. 정리 시간이 더 필요할 때만 Pro를 선택하세요.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {resumeProduct ? (
            <>
              <ResumeProCtaLink
                href="/resume-pro?from=home-premium"
                surface={resumeFunnelSurfaces.homePremium}
                context={resumeFunnelContexts.home}
                className={actionClass(product.live ? "primary" : "secondary", "w-full")}
              >
                {product.live ? `${product.name} 보기 · ${product.price}` : "준비 방식 보기"} <span aria-hidden="true">→</span>
              </ResumeProCtaLink>
              <ResumeProProofLink entry="home-premium" className={actionClass("secondary", "w-full")}>
                결제 전에 내 공고로 무료 확인 →
              </ResumeProProofLink>
            </>
          ) : (
            <>
              <TrackedLink
                href={product.href}
                eventName="Pro Interest"
                properties={{ product: product.id, entry: "home_selected" }}
                className={actionClass(product.live ? "primary" : "secondary", "w-full")}
              >
                {product.live ? `${product.name} 보기 · ${product.price}` : "준비 방식 보기"} <span aria-hidden="true">→</span>
              </TrackedLink>
              <TrackedLink
                href={product.freeHref}
                eventName="Home Navigation"
                properties={{ section: "premium_selected_free", destination: product.freeHref.slice(1) }}
                className={actionClass("secondary", "w-full")}
              >
                {product.free} <span aria-hidden="true">→</span>
              </TrackedLink>
            </>
          )}
        </div>

        {resumeProduct ? (
          <p className="mt-4 text-xs leading-5 text-muted">
            무료 확인은 로그인 없이 현재 브라우저에서만 실행되며, 이력서·공고 원문을 서버로 전송하지 않아요.
          </p>
        ) : null}
        <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted">
          표시된 가격은 1회 결제이며 구독이 아닙니다. 실제 결제 가능 여부와 최종 금액은 제품 상세와 결제 화면에서 다시 확인하세요.
        </p>
      </div>
    </div>
  );
}
