import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const component = await readFile(new URL("../src/components/tools/DriverLicenceGuide.tsx", import.meta.url), "utf8");
const page = await readFile(new URL("../src/app/overseas-driver-licence-guide/page.tsx", import.meta.url), "utf8");

for (const state of ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"]) {
  assert.ok(component.includes(state), `driver licence selector is missing: ${state}`);
}

for (const phrase of [
  "주·준주 선택",
  "지금 할 일:",
  "한국은 비인정 국가",
  "해외면허 전환 실기평가",
  "provisional 면허",
  "interim 면허",
]) assert.ok(component.includes(phrase), `driver licence state guidance is missing: ${phrase}`);

for (const question of [
  "Could you confirm the last date I can legally drive",
  "Is my Korean licence treated as recognised or non-recognised",
  "Which translation or International Driving Permit will you accept?",
  "what happens to my driving authority if I do not pass?",
  "every original document I need to bring",
]) assert.ok(page.includes(question), `driver licence copy-ready question is missing: ${question}`);

assert.ok((component.match(/id: "(nsw|vic|qld|wa|sa|tas|act|nt)"/g) ?? []).length === 8, "driver licence guide needs all eight jurisdictions");
assert.match(component, /<select[\s\S]*value=\{selectedId\}/, "jurisdiction choice must be an explicit select control");
assert.ok(page.includes("CTP와 차량 손해 보장") && page.includes("moneysmart.gov.au/car-insurance"), "licence guide must separate legal driving authority from vehicle insurance cover");
assert.doesNotMatch(`${component}\n${page}`, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "driver licence content changes must remain outside payment flows");

console.log("DRIVER_LICENCE_DEPTH=PASS jurisdictions=8 selector=select copy-questions=5 insurance-separated=true");
