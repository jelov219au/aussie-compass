import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const [catalogSource, page, finder, purchaseInfo, carPage] = await Promise.all([
  read("../src/lib/proCatalogProducts.ts"),
  read("../src/app/pro/page.tsx"),
  read("../src/components/tools/ProProductFinder.tsx"),
  read("../src/app/purchase-information/page.tsx"),
  read("../src/app/car-purchase-pro/page.tsx"),
]);

const readiness = { pay: false, tax: false, leave: false };
const commerce = {
  resumeProProduct: { priceCents: 1990 },
  rentalApplicationProProduct: { priceCents: 1490 },
  payEvidenceProProduct: { priceCents: 990 },
  eofyProProduct: { priceCents: 990 },
  leavingAustraliaProProduct: { priceCents: 1290 },
  getPayEvidencePaymentReadiness: () => ({ ready: readiness.pay }),
  getEofyPaymentReadiness: () => ({ ready: readiness.tax }),
  getLeavingAustraliaPaymentReadiness: () => ({ ready: readiness.leave }),
};
const loaded = { exports: {} };
const code = ts.transpileModule(catalogSource, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
runInNewContext(code, { module: loaded, exports: loaded.exports, require: (name) => {
  assert.equal(name, "@/lib/commerce");
  return commerce;
} });
const { getProCatalogProducts } = loaded.exports;

for (let mask = 0; mask < 32; mask += 1) {
  const resume = Boolean(mask & 1);
  const rental = Boolean(mask & 2);
  readiness.pay = Boolean(mask & 4);
  readiness.tax = Boolean(mask & 8);
  readiness.leave = Boolean(mask & 16);
  const products = getProCatalogProducts(resume, rental);
  assert.equal(products.length, 6, "the catalog should contain five existing products plus one Car preparation card");
  const car = products.find(({ id }) => id === "car-purchase-pro");
  assert.deepEqual(JSON.parse(JSON.stringify(car)), {
    id: "car-purchase-pro",
    index: "06",
    icon: "search",
    href: "/car-purchase-pro",
    label: "중고차 구매",
    name: "Car Purchase Pack Pro",
    price: "가격 미정",
    live: false,
    review: false,
    unpriced: true,
    outcome: "검사 뒤 질문·판매자 수리 약속과 증빙·독립 재확인·최종 결정 기록",
    free: "무료 중고차 후보·비용 비교",
    freeHref: "/used-car-comparison",
    status: "가격·구매 조건 준비 중",
    priceNote: "결제 미오픈",
  });
  const expectedLive = [resume, rental, readiness.pay, readiness.tax, readiness.leave].filter(Boolean).length;
  assert.equal(products.filter(({ live }) => live).length, expectedLive, "Car must never change the five-product live count");
  assert.equal(products.find(({ id }) => id === "pay-evidence-pro")?.price, "A$9.90");
}

for (const value of [
  "중고차 구매에서 반복 작업을 줄이는 Pro 도구의 결과물과 판매 준비 상태",
  "‘가격 미정’ 또는 ‘결제 미오픈’인 도구는 아직 구매할 수 없습니다",
  "products.filter((product) => product.live)",
]) assert.ok(page.includes(value), `Pro catalog page is missing: ${value}`);

for (const value of [
  'type Situation = "job" | "home" | "pay" | "tax" | "leave" | "car"',
  'label: "중고차 구매를 검토 중"',
  'href: "/car-purchase-pro"',
  'price: "가격 미정"',
  'freeHref: "/used-car-comparison"',
  "가격·구매 조건 준비 중이며 결제 미오픈입니다",
  'situation === "car" ? false',
]) assert.ok(finder.includes(value), `Car finder contract is missing: ${value}`);

for (const existing of [
  'job: { href: "/resume-pro", name: "Resume Pro", price: "A$19.90"',
  'home: { href: "/rental-application-pro?from=pro-hub", name: "Rental Pack Pro", price: "A$14.90"',
  'pay: { href: "/pay-evidence-pro", name: "Pay Evidence Pro", price: "A$9.90"',
  'tax: { href: "/eofy-pro", name: "EOFY Pack Pro", price: "A$9.90"',
  'leave: { href: "/leaving-australia-pro", name: "Leaving Pack Pro", price: "A$12.90"',
]) assert.ok(finder.includes(existing), `existing finder entry changed: ${existing}`);

assert.ok(purchaseInfo.includes("Car Purchase Pack Pro는 가격·구매 조건 준비 중이며 이 가격표에 포함되지 않습니다"));
assert.ok(carPage.includes("가격은 미정이며 아직 구매할 수 없습니다"));
assert.ok(carPage.includes('href="/used-car-comparison#vehicle-comparison-heading"'));
assert.ok(carPage.includes('href="/resources/used-car-inspection-report-next-steps"'));
assert.ok(carPage.includes('process.env.NODE_ENV === "development"'));
assert.doesNotMatch(`${catalogSource}\n${finder}`, /car-purchase-pro\/restore|checkout\/car-purchase|CarPurchase.*Checkout|구매 가능/);

console.log("WEB46 Car Pro discovery and pre-sale status contract passed across 32 readiness combinations.");
