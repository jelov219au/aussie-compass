import nodemailer from "nodemailer";
import type Stripe from "stripe";

import type { PaymentOperatorAlertKind } from "./paymentAlertOutbox";

const defaultAlertEmail = "support@hojucompass.com";
const productionSmtpHost = "smtppro.zoho.com.au";
const productionSmtpUser = "owner@hojucompass.com";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

const productLabels = {
  resume_pro: "Resume Pro",
  rental_application_pro: "Rental Application Pack Pro",
  pay_evidence_pro: "Pay Evidence Pro",
} as const;

type AlertProductCode = keyof typeof productLabels;

function isAlertProductCode(value: string | null | undefined): value is AlertProductCode {
  return Boolean(value && Object.prototype.hasOwnProperty.call(productLabels, value));
}

type OperatorAlert = {
  subject: string;
  text: string;
};

type MailConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  to: string;
};

const paymentAlertTestAck = "SEND_ONE_MONITORED_SUPPORT_TEST";

function expandableId(value: string | { id: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
}

function referenceSuffix(value: string | null | undefined) {
  return value ? value.slice(-8) : "확인 필요";
}

function money(amount: number | null | undefined, currency: string | null | undefined) {
  if (amount == null || !currency) return "금액 확인 필요";

  try {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  } catch {
    return `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;
  }
}

function dashboardReference(event: Stripe.Event, paymentIntentId?: string) {
  const mode = event.livemode ? "live" : "test";
  return [
    `Stripe event ref: ${referenceSuffix(event.id)}`,
    `Payment intent ref: ${referenceSuffix(paymentIntentId)}`,
    `Mode: ${mode}`,
    "Stripe Dashboard에서 전체 거래 기록을 확인하세요.",
  ].join("\n");
}

function checkoutAlert(event: Stripe.Event, session: Stripe.Checkout.Session): OperatorAlert | null {
  const productCode = session.metadata?.product_code;
  if (!isAlertProductCode(productCode) || session.payment_status !== "paid") return null;

  const product = productLabels[productCode];
  const amount = money(session.amount_total, session.currency);
  const paymentIntentId = expandableId(session.payment_intent);

  return {
    subject: `[Hoju Compass] 결제 완료 · ${product} · ${amount}`,
    text: [
      "Hoju Compass Pro 결제가 완료되었습니다.",
      "",
      `상품: ${product}`,
      `결제금액: ${amount}`,
      `Checkout session ref: ${referenceSuffix(session.id)}`,
      dashboardReference(event, paymentIntentId),
      "",
      "장부에는 고객 결제액(총매출), 환불, Stripe 수수료, 실제 입금액을 각각 분리해 기록하세요.",
    ].join("\n"),
  };
}

function refundAlert(event: Stripe.Event, charge: Stripe.Charge): OperatorAlert {
  const paymentIntentId = expandableId(charge.payment_intent);
  const refunded = money(charge.amount_refunded, charge.currency);
  const original = money(charge.amount, charge.currency);
  const refundType = charge.refunded || charge.amount_refunded >= charge.amount ? "전액 환불" : "부분 환불";

  return {
    subject: `[Hoju Compass] ${refundType} · ${refunded}`,
    text: [
      `Stripe에서 ${refundType}이 확인되었습니다.`,
      "",
      `환불금액: ${refunded}`,
      `원결제금액: ${original}`,
      `Charge ref: ${referenceSuffix(charge.id)}`,
      dashboardReference(event, paymentIntentId),
      "",
      "장부에서는 총매출을 삭제하지 말고 환불액을 별도 마이너스 항목으로 기록하세요.",
    ].join("\n"),
  };
}

function refundObjectAlert(event: Stripe.Event, refund: Stripe.Refund): OperatorAlert {
  const paymentIntentId = expandableId(refund.payment_intent);
  const chargeId = expandableId(refund.charge);
  const amount = money(refund.amount, refund.currency);
  const status = refund.status ?? "확인 필요";

  return {
    subject: `[Hoju Compass] 환불 이벤트 ${status} · ${amount}`,
    text: [
      "Stripe 환불 이벤트가 확인되었습니다.",
      "",
      `환불금액: ${amount}`,
      `상태: ${status}`,
      `Refund ref: ${referenceSuffix(refund.id)}`,
      `Charge ref: ${referenceSuffix(chargeId)}`,
      dashboardReference(event, paymentIntentId),
      "",
      "Stripe Dashboard에서 환불 상태와 원거래를 확인하고, 장부에는 총매출과 환불액을 분리해 기록하세요.",
    ].join("\n"),
  };
}

function disputeAlert(event: Stripe.Event, dispute: Stripe.Dispute): OperatorAlert {
  const paymentIntentId = expandableId(dispute.payment_intent);
  const amount = money(dispute.amount, dispute.currency);

  return {
    subject: `[Hoju Compass] 결제 분쟁 ${dispute.status} · ${amount}`,
    text: [
      "Stripe 결제 분쟁 상태가 변경되었습니다.",
      "",
      `분쟁금액: ${amount}`,
      `상태: ${dispute.status}`,
      `사유: ${dispute.reason}`,
      `Dispute ref: ${referenceSuffix(dispute.id)}`,
      dashboardReference(event, paymentIntentId),
      "",
      "Stripe Dashboard에서 답변 기한과 증빙 요청을 바로 확인하세요.",
    ].join("\n"),
  };
}

function fulfillmentAttentionAlert(event: Stripe.Event): OperatorAlert {
  return {
    subject: "[Hoju Compass] 결제 처리 확인 필요",
    text: [
      "결제 후 접근 처리 전에 운영 확인이 필요한 상황이 발생했습니다.",
      "",
      dashboardReference(event),
      "",
      "새 결제를 시작하거나 접근을 수동 부여하지 말고 Stripe Dashboard와 first-sale gate 기록을 함께 확인하세요.",
    ].join("\n"),
  };
}

export function buildStripeOperatorAlert(
  event: Stripe.Event,
  alertKind?: PaymentOperatorAlertKind,
): OperatorAlert | null {
  if (alertKind === "fulfillment_attention") return fulfillmentAttentionAlert(event);

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return checkoutAlert(event, event.data.object as Stripe.Checkout.Session);
    case "charge.refunded":
      return refundAlert(event, event.data.object as Stripe.Charge);
    case "refund.created":
    case "refund.updated":
    case "refund.failed":
      return refundObjectAlert(event, event.data.object as Stripe.Refund);
    case "charge.dispute.created":
    case "charge.dispute.updated":
    case "charge.dispute.closed":
    case "charge.dispute.funds_reinstated":
      return disputeAlert(event, event.data.object as Stripe.Dispute);
    default:
      return null;
  }
}

function getMailConfig(): MailConfig | null {
  if (process.env.PAYMENT_ALERTS_ENABLED?.trim().toLowerCase() !== "true") return null;

  const password = process.env.ZOHO_SMTP_APP_PASSWORD?.trim();
  const user = process.env.ZOHO_SMTP_USER?.trim();
  const host = process.env.ZOHO_SMTP_HOST?.trim().toLowerCase() || productionSmtpHost;
  const port = Number(process.env.ZOHO_SMTP_PORT?.trim() || 465);
  const from = process.env.PAYMENT_ALERT_FROM_EMAIL?.trim() || defaultAlertEmail;
  const to = process.env.PAYMENT_ALERT_TO_EMAIL?.trim() || defaultAlertEmail;
  const publicSupportEmail = normalizeEmail(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) || defaultAlertEmail;

  if (
    !password
    || !user
    || host !== productionSmtpHost
    || port !== 465
    || !emailPattern.test(user)
    || normalizeEmail(user) !== productionSmtpUser
    || !emailPattern.test(from)
    || !emailPattern.test(to)
    || normalizeEmail(from) !== publicSupportEmail
    || normalizeEmail(to) !== publicSupportEmail
  ) return null;

  return {
    host,
    port,
    secure: port === 465,
    user,
    password,
    from,
    to,
  };
}

export function paymentAlertsConfigured() {
  return getMailConfig() !== null;
}

function createPaymentAlertTransport(config: MailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
}

export async function runPaymentAlertTransportCheck({ sendTest = false } = {}) {
  if (process.env.VERCEL_ENV !== "production" || process.env.PAYMENTS_ENABLED !== "false") {
    throw new Error("Payment alert delivery checks require Production settings with Checkout explicitly off.");
  }

  const config = getMailConfig();
  if (!config) throw new Error("Payment operator alerts are not configured.");
  if (sendTest && process.env.PAYMENT_ALERT_TEST_ACK !== paymentAlertTestAck) {
    throw new Error("The one-message delivery test was not explicitly acknowledged.");
  }

  const transporter = createPaymentAlertTransport(config);
  try {
    await transporter.verify();

    if (sendTest) {
      const checkedAt = new Date();
      await transporter.sendMail({
        from: `Hoju Compass 결제 알림 <${config.from}>`,
        to: config.to,
        replyTo: defaultAlertEmail,
        subject: "[Hoju Compass] 결제 알림 전달 테스트 — 실제 결제 아님",
        text: [
          "Hoju Compass 운영자가 요청한 단일 결제 알림 전달 테스트입니다.",
          "실제 결제, 환불 또는 고객 활동이 아닙니다.",
          "받은 편지함 도착 여부와 Reply-To가 support@hojucompass.com인지 확인하세요.",
          `요청 시각(UTC): ${checkedAt.toISOString()}`,
        ].join("\n"),
        messageId: `<payment-alert-delivery-test-${checkedAt.getTime()}@hojucompass.com>`,
      });
    }

    return { transportVerified: true as const, testSent: sendTest };
  } finally {
    transporter.close();
  }
}

export async function sendStripeOperatorAlert(
  event: Stripe.Event,
  alertKind?: PaymentOperatorAlertKind,
) {
  const alert = buildStripeOperatorAlert(event, alertKind);
  const config = getMailConfig();
  if (!alert) throw new Error("The signed Stripe event has no allowlisted operator alert.");
  if (!config) throw new Error("Payment operator alerts are not configured.");

  const transporter = createPaymentAlertTransport(config);

  try {
    await transporter.sendMail({
      from: `Hoju Compass 결제 알림 <${config.from}>`,
      to: config.to,
      replyTo: defaultAlertEmail,
      subject: alert.subject,
      text: alert.text,
      messageId: `<stripe-${alertKind ?? "event"}-${referenceSuffix(event.id)}@hojucompass.com>`,
      headers: {
        "X-Hoju-Compass-Stripe-Event-Ref": referenceSuffix(event.id),
      },
    });
  } finally {
    transporter.close();
  }

  return { outcome: "sent" as const };
}
