import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const checkout = await readFile(new URL("../src/app/api/checkout/resume-pro/route.ts", import.meta.url), "utf8");
const productContract = await readFile(new URL("../src/lib/resumeProStripeProduct.ts", import.meta.url), "utf8");
const commerce = await readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8");
const launchCheck = await readFile(new URL("./check-payment-launch.mjs", import.meta.url), "utf8");
const checkoutForm = await readFile(new URL("../src/components/tools/ResumeProCheckoutForm.tsx", import.meta.url), "utf8");
const attribution = await readFile(new URL("../src/lib/resumeProAttribution.ts", import.meta.url), "utf8");
const webhook = await readFile(new URL("../src/app/api/stripe/webhook/route.ts", import.meta.url), "utf8");
const purchaseVerification = await readFile(new URL("../src/lib/resumeProPurchase.ts", import.meta.url), "utf8");
const entitlementStore = await readFile(new URL("../src/lib/neonEntitlementStore.ts", import.meta.url), "utf8");
const requestSecurity = await readFile(new URL("../src/lib/requestSecurity.ts", import.meta.url), "utf8");
const contactPage = await readFile(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8");
const privacyPage = await readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8");
const paymentSupport = await readFile(new URL("../src/components/tools/PaymentSupportHelper.tsx", import.meta.url), "utf8");
const jsonLd = await readFile(new URL("../src/components/seo/JsonLd.tsx", import.meta.url), "utf8");
const jsonLdSerializer = await readFile(new URL("../src/lib/jsonLd.ts", import.meta.url), "utf8");
const offerPage = await readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8");
const purchaseInformation = await readFile(new URL("../src/app/purchase-information/page.tsx", import.meta.url), "utf8");
const termsPage = await readFile(new URL("../src/app/terms/page.tsx", import.meta.url), "utf8");
const firstSaleGate = await readFile(new URL("../src/lib/neonFirstSaleGate.ts", import.meta.url), "utf8");

for (const contract of [
  "checkout.sessions.create",
  "integration_identifier",
  "terms_accepted",
  "purchase_terms_version",
  "stripe.prices.retrieve",
  "expand: [\"product\"]",
  "assertResumeProStripeProduct",
  "managed_payments: { enabled: true }",
  "acquisition_source",
  "normalizeResumeProEntry",
  "getActiveResumeProEntitlement",
  "checkout_already_purchased",
]) {
  assert.ok(checkout.includes(contract), `Checkout safety contract is missing: ${contract}`);
}

for (const contract of [
  "STRIPE_RESUME_PRO_PRODUCT_ID",
  "STRIPE_RESUME_PRO_TAX_CODE",
  "price.product",
  "product.id === config.productId",
  "price.tax_behavior === resumeProStripeProductDefinition.taxBehavior",
  "getTaxCodeId(product) !== config.taxCode",
]) {
  assert.ok(productContract.includes(contract), `Resume Pro Stripe Product contract is missing: ${contract}`);
}

for (const contract of [
  "hasResumeProStripeProductConfig()",
  "stripeMode === expectedStripeMode && stripeProductContractConfigured",
  'process.env.STRIPE_MANAGED_PAYMENTS_ENABLED === "true"',
  'process.env.PAYMENTS_ENTITLEMENT_STORE === "neon"',
  "isEntitlementSessionConfigured()",
  "readiness.stripeConfigured",
  "supportConfigured",
  "operatorAlertsConfigured",
  "firstSaleMonitoredModeConfigured",
  "operatorMonitoringConfigured",
  "sellerDetailsConfigured && supportConfigured && operatorMonitoringConfigured",
]) {
  assert.ok(commerce.includes(contract), `Checkout readiness fail-closed contract is missing: ${contract}`);
}

for (const contract of ["--verify-stripe", "expand: [\"product\"]", "assertResumeProStripeProduct"]) {
  assert.ok(launchCheck.includes(contract), `Read-only Stripe launch verification is missing: ${contract}`);
}
assert.ok(launchCheck.includes('process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()'), "launch audit must read the configured support route");
assert.ok(launchCheck.includes('[\"지원 이메일\", /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(supportEmail)'), "launch audit must block an absent or invalid support email");

assert.ok(contactPage.includes("영수증·결제 참조의 마지막 8자"), "contact guidance must request only the final eight reference characters");
for (const paymentPrompt of [
  "구매한 제품:",
  "문제 유형(결제 확인 / 이용권 / 복구 / 환불):",
  "결제일:",
  "구매에 사용한 이메일:",
  "Stripe 영수증 또는 결제 참조(마지막 8자만):",
  "화면에 표시된 오류(민감정보 제거):",
]) assert.ok(contactPage.includes(paymentPrompt), `the contact mail draft is missing its payment-resolution prompt: ${paymentPrompt}`);
assert.ok(contactPage.includes("emailHref(seller.email, item)"), "each contact action must build its mail draft from the selected contact type");
assert.ok(contactPage.includes("...contactType.prompts.flatMap"), "the contact mail draft must render only the selected type's fixed prompts");
assert.ok(paymentSupport.includes("[있다면 각 참조의 마지막 8자만 입력]"), "support template must limit every payment reference to eight characters");
for (const prohibitedDetail of ["카드번호 전체·일부", "CVC", "영수증 전체", "이력서 원문"]) {
  assert.ok(
    contactPage.includes(prohibitedDetail) || privacyPage.includes(prohibitedDetail) || paymentSupport.includes(prohibitedDetail),
    `support guidance must prohibit collecting: ${prohibitedDetail}`,
  );
}
for (const publicSupportSurface of [contactPage, privacyPage, paymentSupport, jsonLd]) {
  assert.ok(!publicSupportSurface.includes("support@hojucompass.com"), "public support surfaces must not hardcode an email address");
}
assert.ok(jsonLd.includes("getPublicSellerDetails()") && jsonLd.includes("contactPoint: email ?"), "Organization JSON-LD must omit an unconfigured support email");
assert.ok(jsonLd.includes("serializeJsonLd(data)"), "Organization JSON-LD must use the shared safe serializer");
assert.ok(jsonLdSerializer.includes('JSON.stringify(data).replace(/</g, "\\\\u003c")'), "JSON-LD must preserve injection-safe serialization");

assert.ok(checkoutForm.includes('name="source"'), "Resume Pro Checkout must submit its allowlisted acquisition source");
for (const entry of ["article-job-search-plan", "article-achievement-examples", "article-cover-letter-checklist", "resume-builder-complete", "home-premium", "pro-finder", "pro-catalog-card"]) {
  assert.ok(attribution.includes(entry), `Resume Pro acquisition allowlist is missing: ${entry}`);
}

assert.ok(!checkout.includes("payment_method_types"), "Checkout must keep Stripe dynamic payment methods enabled");
assert.ok(!checkout.includes("automatic_tax"), "The app must not add a separate automatic-tax setting on top of Managed Payments");
assert.ok(
  checkout.indexOf("if (!allowed)") < checkout.indexOf("assertSafeStripeEnvironment()")
    && checkout.indexOf("if (!allowed)") < checkout.indexOf("stripe.prices.retrieve")
    && checkout.indexOf("if (!allowed)") < checkout.indexOf("checkout.sessions.create"),
  "incomplete readiness must stop a direct Checkout POST before every Stripe operation",
);
assert.ok(
  checkout.indexOf("await isPaymentRuntimeSchemaReady()") < checkout.indexOf("assertSafeStripeEnvironment()")
    && checkout.indexOf("await isPaymentRuntimeSchemaReady()") < checkout.indexOf("stripe.prices.retrieve")
    && checkout.indexOf("await isPaymentRuntimeSchemaReady()") < checkout.indexOf("checkout.sessions.create"),
  "an incomplete runtime migration contract must stop Checkout before every Stripe operation",
);
assert.ok(offerPage.includes("configuredCheckoutAvailable && await isPaymentRuntimeSchemaReady()"), "the public payment button must remain hidden until the runtime migration contract passes");
for (const migrationBoundary of [
  "required_runtime_functions(signature)",
  "public.consume_checkout_activation(text,text,text,text,text,text,timestamptz)",
  "public.consume_entitlement_restore_token(text,text,text,text,text,timestamptz)",
  "public.payment_operator_alert_outbox",
  "public.payment_operator_alert_from_receipt()",
  "on conflict on constraint stripe_payment_object_links_pkey do nothing",
  "readOnly: true",
  "AbortSignal.timeout(5_000)",
]) assert.ok(firstSaleGate.includes(migrationBoundary), `runtime migration readiness is missing: ${migrationBoundary}`);
assert.ok(
  checkout.indexOf("getActiveResumeProEntitlement()") < checkout.indexOf("stripe.prices.retrieve")
    && checkout.indexOf("getActiveResumeProEntitlement()") < checkout.indexOf("checkout.sessions.create"),
  "an active entitlement must stop a direct Checkout POST before every Stripe read or Session creation",
);
assert.ok(purchaseVerification.includes("(?:test|live)_"), "Purchase verification must accept both test and live Checkout Session IDs");
assert.ok(entitlementStore.includes("(?:test|live)_"), "Entitlement lookup must accept both test and live Checkout Session IDs");
for (const notice of ["/terms", "/purchase-information", "/privacy"]) {
  assert.ok(checkoutForm.includes(notice), `Checkout form must link the customer notice: ${notice}`);
}

for (const publicRoleSurface of [offerPage, purchaseInformation, termsPage]) {
  for (const roleBoundary of [
    "디지털 제품 제공과 이용권·접근·기능 지원",
    "Managed Payments Checkout에서는 Stripe의 Link가 거래상 판매자(Merchant of Record)로 표시되고 거래 단위 지원을 제공합니다",
    "Stripe는 Managed Payments를 운영하며 지원되는 국가의 간접세 계산·징수·신고·납부를 처리합니다",
    "실제 거래의 판매자 명칭, 문서 발행자와 거래 지원 경로는 최종 결제 화면과 실제 발급 문서에 명확히 표시된 경우에만",
    "명확하지 않으면 추정하지 말고 Hoju Compass 제품 지원으로 문의하세요",
    "https://docs.stripe.com/payments/managed-payments/set-up#testing",
    "https://docs.stripe.com/payments/managed-payments/how-it-works",
  ]) {
    assert.ok(publicRoleSurface.includes(roleBoundary), `public Managed Payments role guidance is missing: ${roleBoundary}`);
  }
}
assert.ok(
  offerPage.includes('aria-labelledby="resume-pro-payment-roles-heading"')
    && offerPage.includes('id="resume-pro-payment-roles-heading"'),
  "the pre-Checkout role notice must have an accessible heading",
);
assert.match(
  offerPage,
  /Stripe 공식 Checkout 역할 안내[^<]*↗<\/a>[\s\S]*Managed Payments 처리 범위[^<]*↗<\/a>/,
  "official role links must remain in a mobile-safe reading order",
);

for (const contract of [
  "webhooks.constructEvent",
  "stripe-signature",
  "maxWebhookPayloadBytes",
  "Unsupported webhook content type",
  "event.livemode !== expectsLiveEvent",
]) {
  assert.ok(webhook.includes(contract), `Webhook safety contract is missing: ${contract}`);
}

for (const contract of ["VERCEL_ENV === \"production\"", "sec-fetch-site", "maxBodyBytes", "allowedContentTypes"]) {
  assert.ok(requestSecurity.includes(contract), `Mutation-request safety contract is missing: ${contract}`);
}

console.log("Stripe Checkout and webhook safety-contract checks passed.");
