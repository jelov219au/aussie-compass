export type ResumeProPerformancePaymentInput = {
  status: string | null;
  paymentStatus: string | null;
  productCode: string | null;
  currency: string | null;
  amountTotal: number | null;
  expectedCurrency: string;
  expectedAmountTotal: number;
  paymentIntentStatus: string | null;
  chargePaid: boolean | null;
  amountRefunded: number | null;
};

export type ResumeProPaymentTotals = {
  paidCheckouts: number;
  fullRefunds: number;
  retainedPayments: number;
  grossRevenueCents: number;
  refundedCents: number;
  netRevenueCents: number;
};

export function emptyResumeProPaymentTotals(): ResumeProPaymentTotals {
  return {
    paidCheckouts: 0,
    fullRefunds: 0,
    retainedPayments: 0,
    grossRevenueCents: 0,
    refundedCents: 0,
    netRevenueCents: 0,
  };
}

export function classifyResumeProPerformancePayment(
  input: ResumeProPerformancePaymentInput,
): ResumeProPaymentTotals | null {
  const isPaidResumePro = input.status === "complete"
    && input.paymentStatus === "paid"
    && input.productCode === "resume_pro"
    && input.currency === input.expectedCurrency
    && input.amountTotal === input.expectedAmountTotal;
  if (!isPaidResumePro) return null;

  if (
    input.paymentIntentStatus !== "succeeded"
    || input.chargePaid !== true
    || !Number.isInteger(input.amountRefunded)
    || (input.amountRefunded ?? -1) < 0
  ) {
    throw new Error("Paid Checkout refund evidence is unavailable.");
  }

  const amountTotal = input.amountTotal ?? 0;
  const refundedCents = Math.min(amountTotal, input.amountRefunded ?? 0);
  const fullRefunded = refundedCents === amountTotal;
  return {
    paidCheckouts: 1,
    fullRefunds: fullRefunded ? 1 : 0,
    retainedPayments: fullRefunded ? 0 : 1,
    grossRevenueCents: amountTotal,
    refundedCents,
    netRevenueCents: amountTotal - refundedCents,
  };
}

export function addResumeProPaymentTotals(
  left: ResumeProPaymentTotals,
  right: ResumeProPaymentTotals,
): ResumeProPaymentTotals {
  return {
    paidCheckouts: left.paidCheckouts + right.paidCheckouts,
    fullRefunds: left.fullRefunds + right.fullRefunds,
    retainedPayments: left.retainedPayments + right.retainedPayments,
    grossRevenueCents: left.grossRevenueCents + right.grossRevenueCents,
    refundedCents: left.refundedCents + right.refundedCents,
    netRevenueCents: left.netRevenueCents + right.netRevenueCents,
  };
}
