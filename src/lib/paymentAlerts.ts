import nodemailer from "nodemailer";
import type Stripe from "stripe";

const defaultAlertEmail = "support@hojucompass.com";

const productLabels = {
  resume_pro: "Resume Pro",
  rental_application_pro: "Rental Application Pack Pro",
  pay_evidence_pro: "Pay Evidence Pro",
  car_buy_pro: "Car Buy Pack Pro",
  eofy_pro: "EOFY Pack Pro",
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

function expandableId(value: string | { id: string } | null | undefined) {
  if (!value) return undefined;
  return typeof value === "string" ? value : value.id;
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
    `Stripe event: ${event.id}`,
    `Payment intent: ${paymentIntentId ?? "확인 필요"}`,
    `Mode: ${mode}`,
  ].join("\n");
}

function checkoutAlert(event: Stripe.Event, session: Stripe.Checkout.Session): OperatorAlert | null {
  const productCode = session.metadata?.product_code;
  if (!isAlertProductCode(productCode) || session.payment_status !== "paid") return null;

  const product = productLabels[productCode];
  const amount = money(session.amount_total, session.currency);
  const paymentIntentId = expandableId(session.payment_intent);
  const customerEmail = session.customer_details?.email ?? session.customer_email ?? "확인 필요";

  return {
    subject: `[Hoju Compass] 결제 완료 · ${product} · ${amount}`,
    text: [
      "Hoju Compass Pro 결제가 완료되었습니다.",
      "",
      `상품: ${product}`,
      `결제금액: ${amount}`,
      `고객 이메일: ${customerEmail}`,
      `Checkout session: ${session.id}`,
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
      `Charge: ${charge.id}`,
      dashboardReference(event, paymentIntentId),
      "",
      "장부에서는 총매출을 삭제하지 말고 환불액을 별도 마이너스 항목으로 기록하세요.",
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
      `Dispute: ${dispute.id}`,
      dashboardReference(event, paymentIntentId),
      "",
      "Stripe Dashboard에서 답변 기한과 증빙 요청을 바로 확인하세요.",
    ].join("\n"),
  };
}

export function buildStripeOperatorAlert(event: Stripe.Event): OperatorAlert | null {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return checkoutAlert(event, event.data.object as Stripe.Checkout.Session);
    case "charge.refunded":
      return refundAlert(event, event.data.object as Stripe.Charge);
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
  const user = process.env.ZOHO_SMTP_USER?.trim() || defaultAlertEmail;
  const host = process.env.ZOHO_SMTP_HOST?.trim() || "smtppro.zoho.com";
  const port = Number(process.env.ZOHO_SMTP_PORT?.trim() || 465);

  if (!password || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  return {
    host,
    port,
    secure: port === 465,
    user,
    password,
    from: process.env.PAYMENT_ALERT_FROM_EMAIL?.trim() || user,
    to: process.env.PAYMENT_ALERT_TO_EMAIL?.trim() || defaultAlertEmail,
  };
}

export function paymentAlertsConfigured() {
  return getMailConfig() !== null;
}

export async function sendStripeOperatorAlert(event: Stripe.Event) {
  const alert = buildStripeOperatorAlert(event);
  const config = getMailConfig();
  if (!alert || !config) return { outcome: "skipped" as const };

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: `Hoju Compass 결제 알림 <${config.from}>`,
    to: config.to,
    replyTo: defaultAlertEmail,
    subject: alert.subject,
    text: alert.text,
    messageId: `<stripe-${event.id}@hojucompass.com>`,
    headers: {
      "X-Hoju-Compass-Stripe-Event": event.id,
    },
  });

  return { outcome: "sent" as const };
}
