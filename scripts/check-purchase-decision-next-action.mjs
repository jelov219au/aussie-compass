import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, component, purchaseInfo, commerce, resumeStripe, rentalCheckout, payCheckout, eofyCheckout, leavingCheckout] = await Promise.all([
  readFile(new URL("../src/app/purchase-information/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/payment/PurchaseDecisionNextAction.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/proPurchaseInformation.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/commerce.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProStripeProduct.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/checkout/rental-application-pro/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/checkout/pay-evidence-pro/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/checkout/eofy-pro/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/checkout/leaving-australia-pro/route.ts", import.meta.url), "utf8"),
]);

const exactFields = [
  "selected_product",
  "sale_status",
  "price_and_tax_certainty",
  "who_it_fits",
  "who_should_not_buy",
  "free_alternative",
  "support_or_policy_route",
  "next_action",
];
const outcomeType = component.match(/type PurchaseDecisionOutcome = \{([\s\S]*?)\n\};/)?.[1] ?? "";
const declaredFields = [...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]);
assert.deepEqual(declaredFields, exactFields, "purchase outcome must keep the exact ordered 8-field contract");
assert.match(component, /type PurchaseNextAction = "buy" \| "hold" \| "use_free" \| "contact_support";/);

const products = [
  ["resume-pro", "A$19.90", "/resume-job-ad-checker"],
  ["rental-application-pro", "A$14.90", "/property-inspection-checklist"],
  ["pay-evidence-pro", "A$9.90", "/underpayment-guide"],
  ["eofy-pro", "A$9.90", "/tax-return-guide"],
  ["leaving-australia-pro", "A$12.90", "/leaving-australia-guide"],
];
for (const [id, price, freeRoute] of products) {
  assert.ok(page.includes(`"${id}"`), `missing decision product: ${id}`);
  assert.ok(page.includes(freeRoute), `missing free route for ${id}: ${freeRoute}`);
  assert.ok(commerce.includes(`id: "${id}"`));
  assert.ok(page.includes("product.price"), `purchase decision must receive the commerce-derived ${price} price`);
}
assert.ok(purchaseInfo.includes("product.priceCents"), "displayed prices must derive from the commerce product contract");
assert.ok(resumeStripe.includes('taxBehavior: "inclusive"'));
for (const checkout of [rentalCheckout, payCheckout, eofyCheckout, leavingCheckout]) assert.ok(checkout.includes('price.tax_behavior === "inclusive"'));
assert.ok(page.includes("tax_inclusive_verified"), "known products must disclose the verified inclusive tax behavior");

assert.match(page, /id: "car-purchase-pro"[\s\S]*?priceAndTaxCertainty: "price_unknown · tax_unknown · launch_unknown"[\s\S]*?saleStatus: "off"/);
assert.ok(component.includes('visitorState === "sale_not_open" || product.saleStatus === "off"'));
assert.ok(component.includes('visitorState === "ready_to_buy"'));
assert.ok(component.includes('action: "buy" as const, href: product.href'));

for (const boundary of [
  "signed webhook과 이용권 확인 뒤 제공됩니다",
  "30일 1회용 접근 복구 코드는 브라우저 작업 내용 백업이 아닙니다",
  "전액 환불 확인 시 접근은 종료되며 부분 환불·review는 상태 확인 전까지 UNKNOWN입니다",
]) assert.ok(component.includes(boundary), `missing access/refund boundary: ${boundary}`);

for (const route of ["/payment-help", "/purchase-information#remedies", "/terms", "/privacy#payments-access"]) {
  assert.ok(component.includes(route), `missing first-decision support/policy route: ${route}`);
}
for (const forbiddenMechanism of [
  "localStorage",
  "sessionStorage",
  "document.cookie",
  "indexedDB",
  "fetch(",
  "sendBeacon",
  "track(",
  "capture(",
  "<input",
  "<textarea",
  "navigator.clipboard",
  "mailto:",
]) assert.ok(!component.includes(forbiddenMechanism), `memory-only purchase selector must not use: ${forbiddenMechanism}`);

assert.match(component, /useState<ProductId \| "">\(""\)/);
assert.match(component, /useState<VisitorState \| "">\(""\)/);
const h1Position = page.indexOf("<h1");
const outcomePosition = page.indexOf("<PurchaseDecisionNextAction");
const summaryPosition = page.indexOf('aria-label="Pro 제품 구매 요약"');
assert.ok(h1Position >= 0 && outcomePosition > h1Position && summaryPosition > outcomePosition, "purchase decision must lead the page immediately after H1");

console.log("Purchase-information purchase-decision next-action contract passed.");
