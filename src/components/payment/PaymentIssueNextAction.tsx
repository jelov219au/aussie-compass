"use client";

import { useMemo, useState } from "react";

type IssueState =
  | "before_checkout"
  | "checkout_open_or_processing"
  | "verified_failure_no_charge"
  | "paid_pending_entitlement"
  | "paid_no_access"
  | "possible_duplicate"
  | "receipt_invoice_question"
  | "access_session_missing"
  | "restore_code_lost_used_or_expired"
  | "moved_device_workspace_missing"
  | "refund_requested"
  | "refund_full_confirmed"
  | "refund_partial_or_review"
  | "dispute_or_unrecognised_charge"
  | "manual_review"
  | "unknown";

type RetryAllowed = "no" | "yes_once_after_runtime_verified_no_charge_no_entitlement_retryable_failure";
type SupportRoute =
  | "same_purchase_status_check"
  | "official_product_restore"
  | "original_browser_or_data_transfer"
  | "hoju_product_access_support"
  | "receipt_or_link_transaction_support"
  | "card_issuer_security_or_dispute"
  | "terms_purchase_contact_privacy";
type PaymentNextAction =
  | "leave_checkout_open_and_check_status"
  | "recheck_same_purchase"
  | "open_product_restore"
  | "check_original_browser_workspace"
  | "open_data_transfer"
  | "open_hoju_support_template"
  | "open_receipt_link_support"
  | "contact_card_issuer_for_unrecognised_charge"
  | "open_terms"
  | "open_purchase_information"
  | "open_privacy"
  | "retry_once_after_runtime_verified_no_charge";

type PaymentIssueOutcome = {
  issue_state: IssueState;
  evidence_seen: string;
  charge_status: string;
  entitlement_status: string;
  retry_allowed: RetryAllowed;
  refund_or_access_effect: string;
  support_route: SupportRoute;
  next_action: PaymentNextAction;
};

type StateDetails = {
  label: string;
  evidence: string;
  charge: string;
  entitlement: string;
  retry: RetryAllowed;
  effect: string;
  route: SupportRoute;
  nextAction: PaymentNextAction;
  actionLabel: string;
  actionHref: string;
};

const issueStates: Record<IssueState, StateDetails> = {
  before_checkout: {
    label: "Checkout 전 취소·미완료",
    evidence: "no checkout confirmation · no receipt · no final statement evidence",
    charge: "not_started_or_unknown",
    entitlement: "not_expected",
    retry: "no",
    effect: "not_requested · access_not_created",
    route: "terms_purchase_contact_privacy",
    nextAction: "open_purchase_information",
    actionLabel: "구매 조건을 확인하고 원래 제품으로 돌아가기",
    actionHref: "/purchase-information",
  },
  checkout_open_or_processing: {
    label: "Checkout가 열려 있거나 처리 중·pending",
    evidence: "checkout screen or pending statement only · final charge not proven",
    charge: "processing_or_unknown",
    entitlement: "pending_or_unknown",
    retry: "no",
    effect: "status_unknown · new checkout blocked",
    route: "same_purchase_status_check",
    nextAction: "leave_checkout_open_and_check_status",
    actionLabel: "현재 Checkout·Link 상태를 그대로 확인",
    actionHref: "#evidence-limits",
  },
  verified_failure_no_charge: {
    label: "런타임이 실패·미청구·권한 없음·retryable을 모두 확인",
    evidence: "runtime_verified_failure + no_charge + no_entitlement + retryable_true",
    charge: "runtime_verified_no_charge",
    entitlement: "runtime_verified_none",
    retry: "yes_once_after_runtime_verified_no_charge_no_entitlement_retryable_failure",
    effect: "not_requested · no_access_to_revoke",
    route: "same_purchase_status_check",
    nextAction: "retry_once_after_runtime_verified_no_charge",
    actionLabel: "원래 제품 페이지에서 한 번만 다시 시도",
    actionHref: "/pro",
  },
  paid_pending_entitlement: {
    label: "결제 성공·이용권 처리 대기",
    evidence: "verified paid provider status · entitlement not yet confirmed",
    charge: "paid",
    entitlement: "pending",
    retry: "no",
    effect: "paid_but_access_pending · do_not_repay",
    route: "same_purchase_status_check",
    nextAction: "recheck_same_purchase",
    actionLabel: "같은 결제 완료 화면에서 제품 열기 재확인",
    actionHref: "#payment-support-helper-heading",
  },
  paid_no_access: {
    label: "결제 성공이 확인됐지만 접근 없음",
    evidence: "verified paid status · current access missing",
    charge: "paid",
    entitlement: "missing_or_not_bound",
    retry: "no",
    effect: "access_requires_restore_or_support · do_not_repay",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "Hoju 제품·접근 지원 템플릿 열기",
    actionHref: "#payment-support-helper-heading",
  },
  possible_duplicate: {
    label: "중복 결제가 의심됨",
    evidence: "two receipts or statement entries suspected · duplicate not yet proven",
    charge: "possible_multiple_charges",
    entitlement: "keep_current_state_until_verified",
    retry: "no",
    effect: "review_required · do_not_repay_or_auto_dispute",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "각 참조 마지막 8자만으로 확인 요청",
    actionHref: "#payment-support-helper-heading",
  },
  receipt_invoice_question: {
    label: "영수증·인보이스·거래 지원 문의",
    evidence: "receipt or Link Activity status · not proof of Hoju entitlement",
    charge: "provider_document_status_only",
    entitlement: "unknown",
    retry: "no",
    effect: "not_requested",
    route: "receipt_or_link_transaction_support",
    nextAction: "open_receipt_link_support",
    actionLabel: "문서의 판매자·발행자·지원 경로 확인",
    actionHref: "#support-role-boundary",
  },
  access_session_missing: {
    label: "이 기기의 접근 세션이 만료·누락",
    evidence: "purchased product known · current signed access missing",
    charge: "do_not_recheck_by_new_payment",
    entitlement: "may_exist_server_side",
    retry: "no",
    effect: "restore_or_support · workspace_must_not_be_deleted",
    route: "official_product_restore",
    nextAction: "open_product_restore",
    actionLabel: "제품별 공식 이용권 복구 선택",
    actionHref: "#product-restore-routes",
  },
  restore_code_lost_used_or_expired: {
    label: "복구 코드를 분실·사용·만료",
    evidence: "restore result only · raw restore code must stay in official form",
    charge: "no_new_charge_needed",
    entitlement: "existing_status_requires_support_check",
    retry: "no",
    effect: "restore_code_state_does_not_prove_refund",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "복구 코드를 보내지 않고 접근 지원 요청",
    actionHref: "#payment-support-helper-heading",
  },
  moved_device_workspace_missing: {
    label: "기기를 옮긴 뒤 작성 내용이 없음",
    evidence: "access and browser-local workspace checked separately",
    charge: "payment_not_the_workspace_store",
    entitlement: "may_be_active_or_restorable",
    retry: "no",
    effect: "payment_restore_does_not_restore_workspace",
    route: "original_browser_or_data_transfer",
    nextAction: "open_data_transfer",
    actionLabel: "원래 브라우저와 데이터 백업 확인",
    actionHref: "/data-transfer",
  },
  refund_requested: {
    label: "환불을 요청했지만 완료 확인 전",
    evidence: "request or email only · provider completion not proven",
    charge: "paid_or_under_review",
    entitlement: "current_status_must_be_rechecked",
    retry: "no",
    effect: "requested_not_complete",
    route: "receipt_or_link_transaction_support",
    nextAction: "open_purchase_information",
    actionLabel: "환불 조건과 현재 거래 지원 경로 확인",
    actionHref: "/purchase-information",
  },
  refund_full_confirmed: {
    label: "전액 환불 완료가 provider/runtime에서 확인됨",
    evidence: "verified full refund status",
    charge: "fully_refunded",
    entitlement: "revoked",
    retry: "no",
    effect: "full_confirmed_revoke",
    route: "terms_purchase_contact_privacy",
    nextAction: "open_purchase_information",
    actionLabel: "환불 완료와 이용 종료 조건 확인",
    actionHref: "/purchase-information",
  },
  refund_partial_or_review: {
    label: "부분 환불·refund review 상태",
    evidence: "partial amount or refund event under review",
    charge: "partially_refunded_or_review",
    entitlement: "unknown_status_dependent",
    retry: "no",
    effect: "partial_or_refund_event_review",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "접근 상태를 추정하지 않고 확인 요청",
    actionHref: "#payment-support-helper-heading",
  },
  dispute_or_unrecognised_charge: {
    label: "분쟁·기억나지 않는 결제",
    evidence: "unrecognised statement or verified dispute status",
    charge: "dispute_or_unrecognised",
    entitlement: "revoke_or_grant_depends_on_verified_dispute_status",
    retry: "no",
    effect: "open_or_lost_revoke · won_or_funds_reinstated_grant · otherwise_unknown",
    route: "card_issuer_security_or_dispute",
    nextAction: "contact_card_issuer_for_unrecognised_charge",
    actionLabel: "카드 발급사·공식 사기 도움 경로 확인",
    actionHref: "/help-directory",
  },
  manual_review: {
    label: "결제·환불·이용권 manual review",
    evidence: "provider or Hoju review status only",
    charge: "under_review",
    entitlement: "manual_review",
    retry: "no",
    effect: "status_unknown_until_verified",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "같은 거래로 상태 확인 요청",
    actionHref: "#payment-support-helper-heading",
  },
  unknown: {
    label: "어느 상태인지 모름",
    evidence: "success URL, screenshot, history, receipt and statement not yet reconciled",
    charge: "unknown",
    entitlement: "unknown",
    retry: "no",
    effect: "status_unknown",
    route: "hoju_product_access_support",
    nextAction: "open_hoju_support_template",
    actionLabel: "최소 증거 범주로 상태 확인 요청",
    actionHref: "#payment-support-helper-heading",
  },
};

const fieldLabels: Record<keyof PaymentIssueOutcome, string> = {
  issue_state: "issue_state",
  evidence_seen: "evidence_seen",
  charge_status: "charge_status",
  entitlement_status: "entitlement_status",
  retry_allowed: "retry_allowed",
  refund_or_access_effect: "refund_or_access_effect",
  support_route: "support_route",
  next_action: "next_action",
};

export function PaymentIssueNextAction() {
  const [issueState, setIssueState] = useState<IssueState | "">("");
  const outcome = useMemo<PaymentIssueOutcome | null>(() => {
    if (!issueState) return null;
    const details = issueStates[issueState];
    return {
      issue_state: issueState,
      evidence_seen: details.evidence,
      charge_status: details.charge,
      entitlement_status: details.entitlement,
      retry_allowed: details.retry,
      refund_or_access_effect: details.effect,
      support_route: details.route,
      next_action: details.nextAction,
    };
  }, [issueState]);
  const selected = issueState ? issueStates[issueState] : null;

  return (
    <section className="mt-8 rounded-2xl border-2 border-navy bg-white p-5 shadow-[0_16px_35px_rgba(26,39,68,0.08)] sm:p-7" aria-labelledby="payment-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Memory only · Stop repaying first</p>
      <h2 id="payment-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">상태를 고르고 재결제 가능 여부를 확인하세요.</h2>
      <p className="mt-3 max-w-4xl text-sm leading-7 text-muted">이 선택은 URL·브라우저 저장소·쿠키·파일·메일·분석으로 보내거나 저장하지 않습니다. 결제 참조·금액·이메일·증빙 원문은 입력받지 않습니다.</p>

      <label htmlFor="payment-issue-state" className="mt-5 block max-w-3xl text-sm font-semibold text-navy">현재 확인된 상태
        <select id="payment-issue-state" value={issueState} onChange={(event) => setIssueState(event.target.value as IssueState | "")} className="mt-2 min-h-12 w-full rounded-lg border border-navy/25 bg-white px-3 text-sm font-medium text-navy">
          <option value="">상태를 선택하세요</option>
          {(Object.keys(issueStates) as IssueState[]).map((id) => <option key={id} value={id}>{issueStates[id].label}</option>)}
        </select>
      </label>

      {!outcome || !selected ? <p className="mt-5 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy" role="status">상태를 직접 고르기 전에는 재결제를 허용하지 않습니다. 같은 제품의 새 Checkout을 열지 마세요.</p> : (
        <div className="mt-6" aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">payment_issue_next_action</p>
          <a href={selected.actionHref} className={`mt-4 inline-flex min-h-12 w-full items-center justify-between rounded-lg px-5 text-sm font-semibold sm:w-auto sm:min-w-96 ${selected.retry === "no" ? "bg-navy text-white" : "bg-gold text-navy"}`}><span>{selected.actionLabel}</span><span aria-hidden="true">→</span></a>
          {selected.retry !== "no" ? <p className="mt-3 border-l-2 border-gold bg-gold/5 px-4 py-3 text-sm leading-6 text-navy">이 재시도는 runtime이 미청구 + entitlement 없음 + retryable failure를 모두 확인한 경우에만 한 번 허용됩니다. 일반 오류·URL·statement·사용자 기억으로는 열리지 않습니다.</p> : <p className="mt-3 border-l-2 border-red-700 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-900">retry_allowed = no · 결제·환불·이용권 상태가 정리될 때까지 재결제를 중지하세요.</p>}
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {(Object.keys(fieldLabels) as Array<keyof PaymentIssueOutcome>).map((field) => <div key={field} className={`border p-4 ${field === "next_action" || field === "retry_allowed" ? "border-gold bg-gold/5" : "border-border bg-surface"}`}><dt className="font-mono text-xs text-muted">{fieldLabels[field]}</dt><dd className="mt-2 break-words text-sm font-semibold leading-6 text-navy">{outcome[field]}</dd></div>)}
          </dl>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="결제 지원 정책 바로가기">
            <a href="/terms" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">이용조건 →</a>
            <a href="/purchase-information" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내 →</a>
            <a href="/contact" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">최소 정보로 문의 →</a>
            <a href="/privacy#payments-access" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">결제 데이터 경계 →</a>
          </div>
        </div>
      )}

      <div id="evidence-limits" className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4" aria-label="증거별 확인 한계">
        {[
          ["성공 URL·화면", "서명된 결제나 이용권 증명이 아님"],
          ["은행 statement", "pending은 최종 청구 증명이 아님"],
          ["영수증·Link", "거래 상태와 Hoju 이용권은 별도"],
          ["접근·workspace", "이용권 복구와 로컬 자료 복구는 별도"],
        ].map(([title, body]) => <div key={title} className="border-l-2 border-gold bg-surface px-3 py-3"><strong className="block text-sm text-navy">{title}</strong><span className="mt-1 block text-xs leading-5 text-muted">{body}</span></div>)}
      </div>
    </section>
  );
}
