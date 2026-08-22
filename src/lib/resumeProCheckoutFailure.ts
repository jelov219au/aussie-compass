export type ResumeProCheckoutFailureCode =
  | "checkout_unavailable"
  | "checkout_temporarily_unavailable"
  | "checkout_failed";

export type ResumeProCheckoutFailure = {
  code: ResumeProCheckoutFailureCode;
  logCategory: "configuration" | "temporary" | "internal";
  message: string;
  retryable: boolean;
  status: 500 | 503;
};

const failures: Record<ResumeProCheckoutFailureCode, ResumeProCheckoutFailure> = {
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
  checkout_failed: {
    code: "checkout_failed",
    logCategory: "internal",
    message: "결제를 시작하지 못했어요. 청구되지 않았습니다. 문제가 계속되면 고객지원으로 알려 주세요.",
    retryable: false,
    status: 500,
  },
};

type CheckoutErrorLike = { name?: unknown; type?: unknown };

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
  if (code === "checkout_unavailable" || code === "checkout_temporarily_unavailable" || code === "checkout_failed") {
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

  const stripeType = errorLike?.type;

  if (typeof stripeType === "string" && configurationStripeErrors.has(stripeType)) {
    return failures.checkout_unavailable;
  }

  if (typeof stripeType === "string" && temporaryStripeErrors.has(stripeType)) {
    return failures.checkout_temporarily_unavailable;
  }

  return failures.checkout_failed;
}
