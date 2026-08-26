"use client";

import { useMemo, useState } from "react";

const issues = {
  payment: {
    label: "결제 완료 여부를 확인하고 싶음",
    steps: ["추가 결제를 하지 않기", "기존 결제 완료 화면이나 영수증에서 완료 상태 확인", "상태가 불명확하면 결제 참조 마지막 8자만으로 Hoju Compass 제품 지원에 문의"],
  },
  pending: {
    label: "결제했는데 이용권이 열리지 않음",
    steps: ["같은 결제를 다시 하지 않기", "결제 완료 탭에서 제품 열기 다시 시도", "Stripe 영수증의 결제일과 제품명 확인"],
  },
  duplicate: {
    label: "중복 결제가 의심됨",
    steps: ["추가 결제를 하지 않고 서로 다른 결제 완료 화면이나 영수증이 있는지 확인", "각 결제 참조는 전체 값 대신 마지막 8자만 기록", "두 결제가 모두 완료됐다고 단정하지 말고 Hoju Compass 제품 지원에 확인 요청"],
  },
  document: {
    label: "영수증·인보이스 또는 거래 지원 문의",
    steps: ["기존 문서만 열고 문서 원문이나 링크를 첨부하지 않기", "판매자·문서 발행자·거래 지원 경로가 명확한 경우만 확인하고, 불명확하면 추정하지 않기", "문서 종류와 결제 참조 마지막 8자만으로 Hoju Compass 제품 지원에 문의"],
  },
  access: {
    label: "이 기기의 접근이 만료되거나 사라짐",
    steps: ["저장해 둔 1회용 복구 코드 사용", "코드가 없다면 구매 증빙으로 지원 요청", "공용 기기라면 작업 후 접근 해제"],
  },
  recovery: {
    label: "복구 코드를 분실하거나 이미 사용함",
    steps: ["다른 기기에서 아직 작업 공간이 열리는지 확인", "열린 기기에서 새 복구 코드 생성", "모든 기기에서 접근할 수 없다면 지원 요청"],
  },
  refund: {
    label: "환불 또는 제품 문제 해결 요청",
    steps: ["환불 요청은 환불 완료가 아님을 확인", "문제가 발생한 기능·시각과 기대한 결과를 실제 결과와 구분해 설명", "구매 이메일·결제일·제품명과 함께 지원 요청"],
  },
  unknown: {
    label: "기억나지 않는 결제 또는 보안 우려",
    steps: ["Stripe 영수증에 표시된 판매자와 금액을 확인하고, 판매자가 명확하지 않으면 그 점 기록", "Hoju Compass 지원 채널에 즉시 문의", "본인 결제가 아니라면 카드 발급사에도 신속히 알리기"],
  },
} as const;

type IssueKey = keyof typeof issues;

const products = {
  resume_pro: "Resume Pro",
  rental_application_pro: "Rental Application Pack Pro",
} as const;

type ProductKey = keyof typeof products;

export function PaymentSupportHelper({ supportEmail }: { supportEmail: string | null }) {
  const [product, setProduct] = useState<ProductKey>("resume_pro");
  const [issue, setIssue] = useState<IssueKey>("payment");
  const [status, setStatus] = useState("");
  const selected = issues[issue];
  const productLabel = products[product];
  const template = useMemo(() => [
    `Hoju Compass ${productLabel} 지원 요청`,
    "",
    `문제 유형: ${selected.label}`,
    "결제일: [직접 입력]",
    "구매에 사용한 이메일: [직접 입력]",
    "Stripe 영수증 또는 결제 참조: [있다면 각 참조의 마지막 8자만 입력]",
    "발생한 문제: [개인정보를 제외하고 설명]",
    "이미 시도한 방법: [직접 입력]",
    "",
    "카드번호 전체·일부, CVC, 비밀번호, 영수증 전체, 신분증 사본은 포함하지 않았습니다.",
  ].join("\n"), [productLabel, selected]);

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(template);
      setStatus("문의 템플릿을 복사했습니다. 빈칸을 직접 확인한 뒤 보내세요.");
    } catch {
      setStatus("자동 복사가 되지 않았습니다. 아래 문구를 직접 선택해 복사하세요.");
    }
  }

  const mailHref = supportEmail
    ? `mailto:${supportEmail}?subject=${encodeURIComponent(`${productLabel} 지원 요청 — ${selected.label}`)}&body=${encodeURIComponent(template)}`
    : null;

  return (
    <section className="border border-navy/15 bg-white p-5 sm:p-7" aria-labelledby="payment-support-helper-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Support request helper</p>
      <h2 id="payment-support-helper-heading" className="mt-2 text-2xl font-semibold text-navy">문제 유형에 맞는 문의를 준비하세요.</h2>
      <label className="mt-6 block text-sm font-semibold text-navy" htmlFor="payment-product">구매한 제품</label>
      <select id="payment-product" value={product} onChange={(event) => setProduct(event.target.value as ProductKey)} className="mt-2 min-h-12 w-full border border-border bg-surface px-3 text-sm text-navy outline-none focus:border-gold">
        {Object.entries(products).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <label className="mt-5 block text-sm font-semibold text-navy" htmlFor="payment-issue">현재 상황</label>
      <select id="payment-issue" value={issue} onChange={(event) => setIssue(event.target.value as IssueKey)} className="mt-2 min-h-12 w-full border border-border bg-surface px-3 text-sm text-navy outline-none focus:border-gold">
        {Object.entries(issues).map(([value, item]) => <option key={value} value={value}>{item.label}</option>)}
      </select>
      <ol className="mt-5 space-y-3" aria-live="polite" aria-atomic="true" aria-label={`${selected.label} 확인 순서`}>
        {selected.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-6 text-muted"><span className="font-mono text-gold">0{index + 1}</span><span>{step}</span></li>)}
      </ol>
      <label className="mt-6 block text-sm font-semibold text-navy" htmlFor="support-template">복사할 문의 템플릿</label>
      <textarea id="support-template" readOnly value={template} className="mt-2 min-h-64 w-full resize-y border border-border bg-surface p-3 text-sm leading-6 text-navy" />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={copyTemplate} className="inline-flex min-h-11 items-center justify-center bg-navy px-4 py-2 text-sm font-semibold text-white">문의 문구 복사</button>
        {mailHref && <a href={mailHref} className="inline-flex min-h-11 items-center justify-center border border-navy px-4 py-2 text-sm font-semibold text-navy">메일 앱에서 작성</a>}
      </div>
      {!supportEmail && <p className="mt-4 border-l-2 border-gold bg-surface p-4 text-sm leading-6 text-muted">공식 지원 이메일은 라이브 결제 전에 공개됩니다. 지금은 템플릿만 준비할 수 있습니다.</p>}
      {status && <p className="mt-3 text-sm leading-6 text-muted" role="status">{status}</p>}
    </section>
  );
}
