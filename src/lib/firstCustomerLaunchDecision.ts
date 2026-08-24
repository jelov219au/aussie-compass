import "server-only";

import type { FirstCustomerLaunchDecision } from "./firstCustomerLaunchPolicy";

export type { FirstCustomerLaunchDecision } from "./firstCustomerLaunchPolicy";

export const firstCustomerLaunchDecision = {
  status: "no_go",
  auditedAt: "2026-08-24",
  approvedAt: null,
  validUntil: null,
  blockers: [
    "Production post-migration paid-event·activation·restore functional rehearsal",
    "Stripe live business profile의 공개 support email",
    "분리된 최소권한 live runtime key와 Account-Read-only audit key",
    "승인된 Neon endpoint pin을 포함한 target-environment strict audit",
    "실 SMTP 전송 확인과 Production 결제·환불 alert 수신 증거",
    "실제 Managed Payments Checkout·영수증의 판매자·발행자·거래 지원 문구 확인",
    "등록 세무사와 ABN·GST·Managed Payments 장부 처리 확인",
    "전용 live 회계 읽기 키를 사용한 accounting preflight PASS",
  ],
} as const satisfies FirstCustomerLaunchDecision;
