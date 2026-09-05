import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync(new URL("../src/app/pro/page.tsx", import.meta.url), "utf8");
const finder = readFileSync(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8");
const products = readFileSync(new URL("../src/lib/proCatalogProducts.ts", import.meta.url), "utf8");

assert.match(catalog, /getRentalApplicationPaymentReadiness\(\)\.ready/);
assert.match(catalog, /getProCatalogProducts\(resumeProLive, rentalProLive\)/);
assert.match(catalog, /<ProProductFinder resumeProLive=\{resumeProLive\} rentalProLive=\{rentalProLive\} packAvailability=\{packAvailability\} \/>/);
assert.match(products, /id: "rental-application-pro"[^\n]+price: formatPrice\(rentalApplicationProProduct\.priceCents\), live: rentalProLive/);
assert.match(products, /status: [^\n]+product\.live \? "현재 이용 가능"/);
assert.doesNotMatch(`${catalog}\n${products}`, /status: "유료 검증 준비"/);

assert.match(finder, /rentalProLive/);
assert.match(finder, /home: \{ href: "\/rental-application-pro\?from=pro-hub", name: "Rental Pack Pro", price: "A\$14\.90"/);
assert.match(finder, /situation === "home" \? rentalProLive/);
assert.match(finder, /selectedProductLive \? `\$\{product\.name\}는 \$\{product\.price\} 한 번만 결제하면 돼요\. 구독은 없어요\.`/);

console.log("Rental Pack Pro live status follows server payment readiness across the Pro catalog and finder.");
