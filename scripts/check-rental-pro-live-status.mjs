import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog = readFileSync(new URL("../src/app/pro/page.tsx", import.meta.url), "utf8");
const finder = readFileSync(new URL("../src/components/tools/ProProductFinder.tsx", import.meta.url), "utf8");

assert.match(catalog, /getRentalApplicationPaymentReadiness\(\)\.ready/);
assert.match(catalog, /status: rentalProLive \? "현재 이용 가능" : "결제 설정 확인 중"/);
assert.match(catalog, /rentalProduct && rentalProLive/);
assert.match(catalog, /Rental Pack Pro는 A\$14\.90 1회 결제로 이용할 수 있어요/);
assert.match(catalog, /<ProProductFinder resumeProLive=\{resumeProLive\} rentalProLive=\{rentalProLive\} \/>/);
assert.doesNotMatch(catalog, /status: "유료 검증 준비"/);

assert.match(finder, /rentalProLive/);
assert.match(finder, /Rental Pack Pro 보기 · A\$14\.90/);
assert.match(finder, /Rental Pack Pro는 A\$14\.90 한 번만 결제하면 돼요\. 구독은 없어요\./);

console.log("Rental Pack Pro live status follows server payment readiness across the Pro catalog and finder.");
