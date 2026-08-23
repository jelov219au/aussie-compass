import "server-only";

export type FirstCustomerLaunchDecision = {
  status: "go" | "no_go";
  auditedAt: string;
  blockers: readonly string[];
};

export const firstCustomerLaunchDecision = {
  status: "no_go",
  auditedAt: "2026-08-24",
  blockers: [
    "Production entitlement-link forward fix와 post-migration rehearsal",
    "Stripe live business profile의 공개 support email",
    "분리된 최소권한 live runtime key와 Account-Read-only audit key",
    "승인된 Neon endpoint pin을 포함한 target-environment strict audit",
    "Production 결제·환불 alert와 activation·release·restore 통제 리허설",
    "실제 Managed Payments Checkout·영수증의 판매자·발행자·거래 지원 문구 확인",
    "등록 세무사와 ABN·GST·Managed Payments 장부 처리 확인",
    "전용 live 회계 읽기 키를 사용한 accounting preflight PASS",
  ],
} as const satisfies FirstCustomerLaunchDecision;
