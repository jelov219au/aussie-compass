"use client";

import { useMemo, useState } from "react";

type ProductId =
  | "resume-pro"
  | "rental-application-pro"
  | "pay-evidence-pro"
  | "eofy-pro"
  | "leaving-australia-pro"
  | "car-purchase-pro";

type VisitorState =
  | "ready_to_buy"
  | "need_free_first"
  | "product_fit_unclear"
  | "already_paid_or_access_issue"
  | "refund_or_policy_question"
  | "sale_not_open";

type PurchaseNextAction = "buy" | "hold" | "use_free" | "contact_support";

type PurchaseDecisionOutcome = {
  selected_product: ProductId;
  sale_status: "on" | "off";
  price_and_tax_certainty: string;
  who_it_fits: string;
  who_should_not_buy: string;
  free_alternative: string;
  support_or_policy_route: string;
  next_action: PurchaseNextAction;
};

export type PurchaseDecisionProduct = {
  id: ProductId;
  name: string;
  href: string;
  priceAndTaxCertainty: string;
  saleStatus: "on" | "off";
  fit: string;
  notFit: string;
  freeHref: string;
  freeLabel: string;
};

const visitorStates: Array<{ id: VisitorState; label: string }> = [
  { id: "ready_to_buy", label: "맞는 제품과 조건을 확인했고 구매를 검토 중" },
  { id: "need_free_first", label: "결제 전에 무료 결과부터 확인하고 싶음" },
  { id: "product_fit_unclear", label: "이 제품이 내 상황에 맞는지 아직 모름" },
  { id: "already_paid_or_access_issue", label: "이미 결제했거나 이용권·접근 문제가 있음" },
  { id: "refund_or_policy_question", label: "환불·거래·약관을 먼저 확인해야 함" },
  { id: "sale_not_open", label: "판매가 열릴 때까지 기다리는 중" },
];

const fieldLabels: Record<keyof PurchaseDecisionOutcome, string> = {
  selected_product: "selected_product",
  sale_status: "sale_status",
  price_and_tax_certainty: "price_and_tax_certainty",
  who_it_fits: "who_it_fits",
  who_should_not_buy: "who_should_not_buy",
  free_alternative: "free_alternative",
  support_or_policy_route: "support_or_policy_route",
  next_action: "next_action",
};

function decide(product: PurchaseDecisionProduct, visitorState: VisitorState) {
  if (visitorState === "need_free_first" || visitorState === "product_fit_unclear") {
    return { action: "use_free" as const, href: product.freeHref, label: product.freeLabel, route: `free:${product.freeHref}` };
  }
  if (visitorState === "already_paid_or_access_issue") {
    return { action: "contact_support" as const, href: "/payment-help", label: "재결제하지 않고 결제·접근 상태 확인", route: "payment_help" };
  }
  if (visitorState === "refund_or_policy_question") {
    return { action: "contact_support" as const, href: "/payment-help", label: "환불·거래 상태별 다음 행동 확인", route: "payment_help_and_purchase_remedies" };
  }
  if (visitorState === "sale_not_open" || product.saleStatus === "off") {
    return { action: "hold" as const, href: product.href, label: "구매하지 않고 제품의 현재 상태 확인", route: `hold:${product.href}` };
  }
  if (visitorState === "ready_to_buy") {
    return { action: "buy" as const, href: product.href, label: "제품 설명과 기존 안전 구매 경로 확인", route: `product_purchase_page:${product.href}` };
  }
  return { action: "hold" as const, href: product.href, label: "구매 전 조건 다시 확인", route: `hold:${product.href}` };
}

export function PurchaseDecisionNextAction({ products }: { products: readonly PurchaseDecisionProduct[] }) {
  const [productId, setProductId] = useState<ProductId | "">("");
  const [visitorState, setVisitorState] = useState<VisitorState | "">("");
  const selectedProduct = products.find((product) => product.id === productId) ?? null;
  const decision = selectedProduct && visitorState ? decide(selectedProduct, visitorState) : null;
  const outcome = useMemo<PurchaseDecisionOutcome | null>(() => {
    if (!selectedProduct || !decision) return null;
    return {
      selected_product: selectedProduct.id,
      sale_status: selectedProduct.saleStatus,
      price_and_tax_certainty: selectedProduct.priceAndTaxCertainty,
      who_it_fits: selectedProduct.fit,
      who_should_not_buy: selectedProduct.notFit,
      free_alternative: selectedProduct.freeHref,
      support_or_policy_route: decision.route,
      next_action: decision.action,
    };
  }, [decision, selectedProduct]);

  return (
    <section className="mt-8 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_16px_35px_rgba(26,39,68,0.08)] sm:p-7" aria-labelledby="purchase-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Memory only · one decision</p>
      <h2 id="purchase-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">제품과 현재 상태를 고르세요.</h2>
      <p className="mt-2 text-sm leading-6 text-muted">선택값은 저장하거나 전송하지 않습니다. 가격·판매 상태를 확인한 뒤 구매, 보류, 무료 도구, 지원 중 한 행동만 보여드립니다.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label htmlFor="purchase-product" className="block text-sm font-semibold text-navy">검토할 제품
          <select id="purchase-product" value={productId} onChange={(event) => setProductId(event.target.value as ProductId | "")} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
            <option value="">제품을 선택하세요</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.saleStatus === "on" ? "판매 ON" : "판매 OFF"}</option>)}
          </select>
        </label>
        <label htmlFor="purchase-visitor-state" className="block text-sm font-semibold text-navy">현재 상태
          <select id="purchase-visitor-state" value={visitorState} onChange={(event) => setVisitorState(event.target.value as VisitorState | "")} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
            <option value="">상태를 선택하세요</option>
            {visitorStates.map((state) => <option key={state.id} value={state.id}>{state.label}</option>)}
          </select>
        </label>
      </div>

      {!outcome || !decision ? (
        <p className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy" role="status">두 항목을 고르기 전에는 구매 행동을 열지 않습니다. 맞는지 모르겠다면 무료 도구부터 확인하세요.</p>
      ) : (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">purchase_decision_next_action</p>
          <a href={decision.href} className={`mt-4 inline-flex min-h-12 w-full items-center justify-between rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-96 ${decision.action === "buy" ? "bg-gold text-navy" : "bg-navy text-white"}`}><span>{decision.label}</span><span aria-hidden="true">→</span></a>
          {outcome.sale_status === "off" && <p className="mt-3 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-900">sale_status = off · Checkout을 열지 말고 가격과 출시 상태가 확인될 때까지 기다리세요.</p>}
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {(Object.keys(fieldLabels) as Array<keyof PurchaseDecisionOutcome>).map((field) => <div key={field} className={`border p-4 ${field === "next_action" || field === "sale_status" ? "border-gold bg-gold/5" : "border-border bg-surface"}`}><dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt><dd className="mt-2 break-words text-sm font-semibold leading-6 text-navy">{outcome[field]}</dd></div>)}
          </dl>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="구매 지원과 정책 바로가기">
            <a href="/payment-help" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제·접근 지원 →</a>
            <a href="/purchase-information#remedies" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">환불·문제 해결 →</a>
            <a href="/terms" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">이용 조건 →</a>
            <a href="/privacy#payments-access" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제 데이터 경계 →</a>
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">접근은 signed webhook과 이용권 확인 뒤 제공됩니다. 30일 1회용 접근 복구 코드는 브라우저 작업 내용 백업이 아닙니다. 전액 환불 확인 시 접근은 종료되며 부분 환불·review는 상태 확인 전까지 UNKNOWN입니다.</p>
        </div>
      )}
    </section>
  );
}
