export type ResumeProCheckoutFailureCode =
  | "checkout_already_purchased"
  | "checkout_unavailable"
  | "checkout_temporarily_unavailable"
  | "checkout_retry_later"
  | "checkout_sales_closed"
  | "checkout_support_required"
  | "checkout_failed";

export type ResumeProCheckoutFailureAction = {
  href: "#resume-pro-checkout" | "/resume-builder" | "/contact" | "/resume-pro/workspace#resume-pro-workspace";
  label: string;
};

export type ResumeProCheckoutFailure = {
  code: ResumeProCheckoutFailureCode;
  logCategory: "configuration" | "temporary" | "internal";
  message: string;
  retryable: boolean;
  status: 409 | 500 | 503;
  action?: ResumeProCheckoutFailureAction;
};

const failures: Record<ResumeProCheckoutFailureCode, ResumeProCheckoutFailure> = {
  checkout_already_purchased: {
    code: "checkout_already_purchased",
    logCategory: "configuration",
    message: "이 기기의 Resume Pro 이용권이 이미 확인됐어요. 다시 결제하지 말고 작업공간에서 계속해 주세요.",
    retryable: false,
    status: 409,
    action: { href: "/resume-pro/workspace#resume-pro-workspace", label: "작업공간에서 계속하기" },
  },
  checkout_unavailable: {
    code: "checkout_unavailable",
    logCategory: "configuration",
    message: "현재 결제 설정을 확인하고 있어 결제를 시작할 수 없어요. 카드 정보는 입력되지 않았습니다. 잠시 후 다시 확인해 주세요.",
    retryable: false,
    status: 503,
  },
  checkout_temporarily_unavailable: {
    code: "checkout_temporarily_unavailable",
    logCategory: "temporary",
    message: "Stripe 연결이 잠시 원활하지 않아 결제를 시작하지 못했어요. 청구되지 않았습니다. 잠시 후 다시 시도해 주세요.",
    retryable: true,
    status: 503,
  },
  checkout_retry_later: {
    code: "checkout_retry_later",
    logCategory: "temporary",
    message: "현재 새 결제를 잠시 쉬고 있어요. 지금은 다시 시작하지 말고, 잠시 후 이 페이지에서 확인해 주세요.",
    retryable: true,
    status: 503,
  },
  checkout_sales_closed: {
    code: "checkout_sales_closed",
    logCategory: "configuration",
    message: "현재 준비된 Resume Pro 판매가 마감돼 새 결제를 시작할 수 없어요. 무료 이력서 작성과 PDF 저장은 계속 이용할 수 있습니다.",
    retryable: false,
    status: 503,
    action: { href: "/resume-builder", label: "무료 이력서 계속 작성하기" },
  },
  checkout_support_required: {
    code: "checkout_support_required",
    logCategory: "configuration",
    message: "결제 상태를 운영자가 확인해야 해요. 지금은 새 결제를 시작하지 말아 주세요. 이전 결제 내역이 걱정되면 고객지원으로 알려 주세요.",
    retryable: false,
    status: 503,
    action: { href: "/contact", label: "고객지원으로 이동" },
  },
  checkout_failed: {
    code: "checkout_failed",
    logCategory: "internal",
    message: "결제를 시작하지 못했어요. 청구되지 않았습니다. 문제가 계속되면 고객지원으로 알려 주세요.",
    retryable: false,
    status: 500,
  },
};

type CheckoutErrorLike = { name?: unknown; type?: unknown; publicFailureCode?: unknown };

const firstSalePublicFailureCodes = new Set<ResumeProCheckoutFailureCode>([
  "checkout_retry_later",
  "checkout_sales_closed",
  "checkout_support_required",
]);

const configurationStripeErrors = new Set([
  "StripeAuthenticationError",
  "StripeInvalidRequestError",
  "StripePermissionError",
]);

const temporaryStripeErrors = new Set([
  "StripeAPIError",
  "StripeConnectionError",
  "StripeRateLimitError",
]);

export function getResumeProCheckoutFailure(code: string | null | undefined) {
  if (
    code === "checkout_already_purchased"
    || code === "checkout_unavailable"
    || code === "checkout_temporarily_unavailable"
    || code === "checkout_retry_later"
    || code === "checkout_sales_closed"
    || code === "checkout_support_required"
    || code === "checkout_failed"
  ) {
    return failures[code];
  }
  return null;
}

export function getResumeProCheckoutConfigurationFailure() {
  return failures.checkout_unavailable;
}

export function classifyResumeProCheckoutFailure(error: unknown): ResumeProCheckoutFailure {
  const errorLike = typeof error === "object" && error !== null
    ? error as CheckoutErrorLike
    : null;

  if (errorLike?.name === "ResumeProStripeProductContractError") {
    return failures.checkout_unavailable;
  }

  if (errorLike?.name === "FirstSaleGateClosedError") {
    const code = errorLike.publicFailureCode;
    if (typeof code === "string" && firstSalePublicFailureCodes.has(code as ResumeProCheckoutFailureCode)) {
      return failures[code as ResumeProCheckoutFailureCode];
    }
    return failures.checkout_unavailable;
  }

  const stripeType = errorLike?.type;

  if (typeof stripeType === "string" && configurationStripeErrors.has(stripeType)) {
    return failures.checkout_unavailable;
  }

  if (typeof stripeType === "string" && temporaryStripeErrors.has(stripeType)) {
    return failures.checkout_temporarily_unavailable;
  }

  return failures.checkout_failed;
}
