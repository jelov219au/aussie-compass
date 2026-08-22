import Stripe from "stripe";

import {
  assertResumeProStripeProduct,
  getResumeProStripeProductConfig,
} from "../src/lib/resumeProStripeProduct.ts";

const strict = process.argv.includes("--strict");
const verifyStripe = process.argv.includes("--verify-stripe");
const isProduction = process.env.VERCEL_ENV === "production";
const expectedStripeMode = isProduction ? "live" : "test";

function present(value) {
  return Boolean(value?.trim());
}

function secretMode(value) {
  const candidate = value?.trim() ?? "";
  if (/^[rs]k_test_/.test(candidate)) return "test";
  if (/^[rs]k_live_/.test(candidate)) return "live";
  return candidate ? "invalid" : "missing";
}

const abnDigits = process.env.BUSINESS_ABN?.replace(/\D/g, "") ?? "";
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ?? "";
const stripeMode = secretMode(process.env.STRIPE_SECRET_KEY);
const tradingName = process.env.BUSINESS_TRADING_NAME?.trim() || "Hoju Compass";
const entitlementDatabaseUrl = process.env.ENTITLEMENT_DB_URL?.trim()
  || process.env.ENTITLEMENT_DB_DATABASE_URL?.trim()
  || "";

const checks = [
  ["결제 스위치", process.env.PAYMENTS_ENABLED === "true", "PAYMENTS_ENABLED=true"],
  ["Stripe 키 환경", stripeMode === expectedStripeMode, `${expectedStripeMode} 모드 키`],
  ["최소 권한 Stripe 키", process.env.STRIPE_SECRET_KEY?.trim().startsWith("rk_") ?? false, "rk_ 제한 키"],
  ["Resume Pro 가격", process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim().startsWith("price_") ?? false, "price_ ID"],
  ["Resume Pro 상품", process.env.STRIPE_RESUME_PRO_PRODUCT_ID?.trim().startsWith("prod_") ?? false, "별도 prod_ ID"],
  ["Managed Payments 세금 분류", process.env.STRIPE_RESUME_PRO_TAX_CODE?.trim().startsWith("txcd_") ?? false, "승인된 txcd_ ID"],
  ["Managed Payments", process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true", "활성화"],
  ["웹훅 서명", process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_") ?? false, "whsec_ 비밀"],
  ["이용권 저장소", process.env.PAYMENTS_ENTITLEMENT_STORE === "neon", "Neon"],
  ["이용권 DB", /^postgres(?:ql)?:\/\//.test(entitlementDatabaseUrl), "Postgres 연결"],
  ["첫 판매 원자 게이트", process.env.FIRST_SALE_GATE_ENABLED === "true", "DB gate 활성화"],
  ["접근 세션 서명", (process.env.ENTITLEMENT_SESSION_SECRET?.trim().length ?? 0) >= 32, "32자 이상"],
  ["등록 사업명", tradingName.length <= 120, "Hoju Compass"],
  ["법적 판매자", present(process.env.BUSINESS_LEGAL_NAME), "고객 공개용"],
  ["ABN", /^\d{11}$/.test(abnDigits), "11자리"],
  ["지원 이메일", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail), "유효한 이메일"],
];

console.log(`Hoju Compass 결제 출시 점검 (${isProduction ? "Production" : "Preview/Local"})`);
console.log("실제 키, 개인정보, 연결 문자열은 출력하지 않습니다.\n");

for (const [label, passed, requirement] of checks) {
  console.log(`${passed ? "PASS" : "WAIT"}  ${label} — ${requirement}`);
}

const pending = checks.filter(([, passed]) => !passed).length;
console.log(`\n결과: ${checks.length - pending}/${checks.length} 통과, ${pending}개 대기`);

let stripeProductVerified = !verifyStripe;

if (verifyStripe) {
  try {
    const config = getResumeProStripeProductConfig();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY?.trim() ?? "", {
      maxNetworkRetries: 2,
      timeout: 10_000,
      telemetry: false,
    });
    const price = await stripe.prices.retrieve(config.priceId, { expand: ["product"] });
    assertResumeProStripeProduct(price, config, isProduction);
    stripeProductVerified = true;
    console.log("PASS  Stripe 원격 상품·세금 계약 — Product ID, tax code, 포함세 가격 일치");
  } catch {
    stripeProductVerified = false;
    console.log("WAIT  Stripe 원격 상품·세금 계약 — Dashboard 값 또는 읽기 권한 확인 필요");
  }
} else {
  console.log("INFO  원격 상품 검증은 --verify-stripe 옵션으로 실행합니다.");
}

if (strict && (pending > 0 || !stripeProductVerified)) process.exitCode = 1;
