"use client";

import Image from "next/image";
import Link from "next/link";
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

const taskNames: Record<string, string> = {
  "resume-pro": "이력서·지원서 준비",
  "rental-application-pro": "렌트 신청 서류",
  "pay-evidence-pro": "급여 차이·문의 자료",
  "eofy-pro": "세금 자료 정리",
  "leaving-australia-pro": "귀국 후속 정리",
  "car-purchase-pro": "중고차 거래 기록",
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
    <>
      <div className="home-pro-heading">
        <p className="home-pro-label inline-flex rounded-full px-3 py-1 text-xs font-semibold text-navy">
          Pro · 도움이 필요한 일을 골라보세요
        </p>
        <h2 id="premium-tools-heading" data-home-observe="pro" className="mt-3 text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          준비한 만큼, 한 걸음 더.
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
          준비할 일을 고르고, 어떤 자료를 만들 수 있는지 확인하세요.
        </p>

      </div>
      <div className="home-pro-explorer grid gap-5 lg:grid-cols-[0.55fr_1.45fr] lg:gap-8">
      <div className="home-pro-sidebar min-w-0">
        <div
          className="grid grid-cols-2 gap-2 lg:grid-cols-1"
          role="group"
          aria-label="Pro 도구 선택"
        >
          {products.map((item) => {
            const selected = item.id === product.id;

            return (
              <button
                key={item.id}
                type="button"
                data-home-product={item.id}
                aria-label={`${taskNames[item.id] ?? item.name} · ${item.name} · ${item.status} · ${item.price}`}
                onClick={() => setSelectedId(item.id)}
                aria-pressed={selected}
                aria-controls={panelId}
                className={`home-pro-selector min-h-14 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  selected
                    ? "border-gold bg-surface text-navy"
                    : "border-border bg-white text-muted hover:border-gold/70 hover:bg-surface"
                }`}
              >
                <span className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <span className="min-w-0">
                    <strong className="block text-sm leading-5">{taskNames[item.id] ?? item.name}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {item.live ? item.price : "준비 중"}
                    </span>
                  </span>
                  <span className={`shrink-0 text-xs font-semibold ${selected ? "text-gold-ink" : "text-muted"}`} aria-hidden="true">
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
          className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-gold-ink underline decoration-gold decoration-2 underline-offset-4 hover:text-gold"
        >
          모든 Pro 도구 비교하기 →
        </TrackedLink>
      </div>

      <div id={panelId} className="home-pro-detail flex min-w-0 flex-col rounded-2xl border border-border bg-white p-5 sm:p-7" aria-live="polite">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <TopicIcon name={product.icon} className="home-topic-icon" />
            <div className="min-w-0">
              <p className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${product.live ? "bg-[#e3f3e8] text-[#24623b]" : "bg-white text-muted"}`}>
                {product.status}
              </p>
              <h3 data-home-observe="pro_details" className="mt-2 break-words text-2xl font-semibold text-navy sm:text-3xl">{product.name}</h3>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <strong className="block text-2xl text-navy">{product.price}</strong>
            <span className="mt-1 block text-xs text-muted">{product.priceNote}</span>
          </div>
        </div>

        <div className="home-pro-outcome mt-5">
          <span className="text-xs font-semibold text-gold-ink">이 도구로 준비할 수 있어요</span>
          <strong className="mt-2 block text-base leading-7 text-navy">{product.outcome}</strong>
        </div>

        {resumeProduct ? (
          <Link href="/resume-pro?from=home-premium#result-preview-heading" className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-background p-3 text-navy hover:border-gold">
            <Image src="/downloads/resume-pro-example-editorial.png" width={708} height={1000} sizes="72px" alt="가상 지원자의 실제 이력서 PDF 첫 페이지" className="h-auto w-16 shrink-0 border border-border sm:w-18" />
            <span><strong className="block text-sm">완성된 지원서 예시 보기 →</strong><span className="mt-1 block text-xs leading-5 text-muted">가상 인물·경력으로 만든 이력서 PDF와 지원서 묶음입니다.</span></span>
          </Link>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {resumeProduct ? (
            <>
              <ResumeProCtaLink
                href="/resume-pro?from=home-premium"
                surface={resumeFunnelSurfaces.homePremium}
                context={resumeFunnelContexts.home}
                className={actionClass(product.live ? "primary" : "secondary", "home-pro-action w-full")}
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

        <details className="mt-4 rounded-xl border border-border px-4">
          <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-semibold text-navy">이용 순서 자세히 보기 <span aria-hidden="true">＋</span></summary>
          <ol className="my-3 grid gap-3 sm:grid-cols-3" aria-label="Pro 도구 이용 순서">
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
        </details>

        <p className="mt-4 text-sm leading-6 text-muted">
          {resumeProduct ? "기본 이력서·PDF는 무료예요. 회사별 커버레터와 STAR 메모를 저장하고 다시 쓸 때 Pro를 이용하세요." : "무료 안내만으로 충분하면 여기서 멈춰도 괜찮아요. 여러 건의 자료를 정리하고 다시 활용할 때 Pro를 선택하세요."}
        </p>



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
    </>
  );
}
