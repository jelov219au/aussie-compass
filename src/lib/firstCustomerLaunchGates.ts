export const firstCustomerLaunchGateManifest = [
  {
    id: "production_runtime_preflight",
    phase: "pre_payment",
    label: "Production 필수 설정 복원·same-SHA payments-off 재배포 후 exact-SHA 통합 preflight PASS",
  },
  {
    id: "managed_payments_dashboard_review",
    phase: "pre_payment",
    label: "Managed Payments 약관·계정 활성화·Resume Pro Product 세금코드 eligibility·API baseline 수동 확인",
  },
  {
    id: "least_privilege_live_keys",
    phase: "pre_payment",
    label: "서로 다른 최소권한 live runtime·Account audit·Balance Transactions accounting 3-key 권한 증명",
  },
  {
    id: "payment_refund_mailbox_receipts",
    phase: "pre_payment",
    label: "post-migration 통제 결제·전액 환불의 webhook→outbox→실 mailbox 1회 수신 증거",
  },
  {
    id: "production_payment_path_rehearsal",
    phase: "pre_payment",
    label: "same-SHA payments-off Production의 reservation·webhook·activation·release·restore 기능 rehearsal PASS",
  },
  {
    id: "controlled_payment_reconciliation",
    phase: "pre_payment",
    label: "통제 live 결제·수수료·환불·잔액·payout/bank reconciliation 또는 source-verified-none",
  },
  {
    id: "single_sale_owner_approval",
    phase: "pre_payment",
    label: "모든 pre-payment 증거 검토 후 60분 이내 단일 판매 소유자 승인",
  },
  {
    id: "actual_customer_document_review",
    phase: "post_first_payment",
    label: "실제 첫 고객 Checkout·영수증·인보이스의 판매자·발행자·거래 지원 문구 확인",
  },
  {
    id: "registered_tax_agent_handoff",
    phase: "post_first_payment",
    label: "첫 결제 자료에 기반한 등록 세무사 ABN·GST·Managed Payments 장부 처리 handoff",
  },
  {
    id: "post_payment_evidence_windows",
    phase: "post_first_payment",
    label: "15분·24시간·첫 payout 증거와 두 번째 판매 승인",
  },
] as const;

export function getFirstCustomerPrePaymentBlockers() {
  return firstCustomerLaunchGateManifest
    .filter((gate) => gate.phase === "pre_payment")
    .map((gate) => gate.label);
}
