import type Stripe from "stripe";

export class FirstSalePaymentIntentContractError extends Error {
  constructor() {
    super("The first-sale PaymentIntent does not match the paid Checkout contract.");
    this.name = "FirstSalePaymentIntentContractError";
  }
}

function expandableId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function verifyFirstSalePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
  expected: {
    paymentIntentId: string;
    customerId: string;
    livemode: boolean;
    currency: "aud";
    amountCents: 1990 | 1490;
  },
) {
  const customerId = expandableId(paymentIntent.customer);
  const chargeId = expandableId(paymentIntent.latest_charge);

  if (
    !/^pi_[A-Za-z0-9]+$/.test(expected.paymentIntentId)
    || !/^cus_[A-Za-z0-9]+$/.test(expected.customerId)
    || paymentIntent.id !== expected.paymentIntentId
    || !/^pi_[A-Za-z0-9]+$/.test(paymentIntent.id)
    || paymentIntent.livemode !== expected.livemode
    || paymentIntent.currency.toLowerCase() !== expected.currency
    || paymentIntent.amount !== expected.amountCents
    || paymentIntent.status !== "succeeded"
    || customerId !== expected.customerId
    || chargeId === null
    || !/^ch_[A-Za-z0-9]+$/.test(chargeId)
  ) {
    throw new FirstSalePaymentIntentContractError();
  }

  return chargeId;
}
