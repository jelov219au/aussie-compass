const strict = process.argv.includes("--strict");
const productArgument = process.argv.find((argument) => argument.startsWith("--product="));
const selectedProduct = productArgument?.slice("--product=".length) || "resume-pro";

if (!new Set(["resume-pro", "rental-application-pro"]).has(selectedProduct)) {
  console.error("Unknown payment product. Use --product=resume-pro or --product=rental-application-pro.");
  process.exit(2);
}

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
const productChecks = selectedProduct === "rental-application-pro"
  ? [
      ["Rental Pack Pro 스위치", process.env.RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED === "true", "RENTAL_APPLICATION_PRO_PAYMENTS_ENABLED=true"],
      ["Rental Pack Pro 가격", process.env.STRIPE_RENTAL_APPLICATION_PRO_PRICE_ID?.trim().startsWith("price_") ?? false, "price_ ID"],
    ]
  : [
      ["Resume Pro 가격", process.env.STRIPE_RESUME_PRO_PRICE_ID?.trim().startsWith("price_") ?? false, "price_ ID"],
    ];

const checks = [
  ["결제 스위치", process.env.PAYMENTS_ENABLED === "true", "PAYMENTS_ENABLED=true"],
  ["Stripe 키 환경", stripeMode === expectedStripeMode, `${expectedStripeMode} 모드 키`],
  ["최소 권한 Stripe 키", process.env.STRIPE_SECRET_KEY?.trim().startsWith("rk_") ?? false, "rk_ 제한 키"],
  ...productChecks,
  ["Managed Payments", process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true", "활성화"],
  ["웹훅 서명", process.env.STRIPE_WEBHOOK_SECRET?.trim().startsWith("whsec_") ?? false, "whsec_ 비밀"],
  ["이용권 저장소", process.env.PAYMENTS_ENTITLEMENT_STORE === "neon", "Neon"],
  ["이용권 DB", /^postgres(?:ql)?:\/\//.test(entitlementDatabaseUrl), "Postgres 연결"],
  ["접근 세션 서명", (process.env.ENTITLEMENT_SESSION_SECRET?.trim().length ?? 0) >= 32, "32자 이상"],
  ["등록 사업명", tradingName.length <= 120, "Hoju Compass"],
  ["법적 판매자", present(process.env.BUSINESS_LEGAL_NAME), "고객 공개용"],
  ["ABN", /^\d{11}$/.test(abnDigits), "11자리"],
  ["지원 이메일", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail), "유효한 이메일"],
];

console.log(`Hoju Compass ${selectedProduct} 결제 출시 점검 (${isProduction ? "Production" : "Preview/Local"})`);
console.log("실제 키, 개인정보, 연결 문자열은 출력하지 않습니다.\n");

for (const [label, passed, requirement] of checks) {
  console.log(`${passed ? "PASS" : "WAIT"}  ${label} — ${requirement}`);
}

const pending = checks.filter(([, passed]) => !passed).length;
console.log(`\n결과: ${checks.length - pending}/${checks.length} 통과, ${pending}개 대기`);

if (strict && pending > 0) process.exitCode = 1;
