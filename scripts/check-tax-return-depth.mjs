import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/tax-return-guide/page.tsx", import.meta.url), "utf8");
const checklist = await readFile(new URL("../src/components/tools/TaxReturnChecklist.tsx", import.meta.url), "utf8");

for (const phrase of [
  "비자와 Tax residency는 같은 말이 아니에요",
  "세금을 뗐어도 환급은 보장되지 않아요",
  "제출이 끝이 아니라 결과를 대조해요",
  "Notice of Assessment",
  "Amendment",
]) assert.ok(page.includes(phrase), `tax return guide is missing: ${phrase}`);

for (const question of [
  "why I am being treated as an Australian resident or foreign resident",
  "Which Australian and overseas income records",
  "each deduction and the record supporting it",
  "your total fee, any extra charges",
  "final return and Notice of Assessment",
]) assert.ok(page.includes(question), `tax return copy-ready question is missing: ${question}`);

assert.ok((page.match(/source: "(Australian Taxation Office|Tax Practitioners Board)"/g) ?? []).length >= 7, "tax return guide needs verified official entry points");
assert.ok(checklist.includes("Income statement가 Tax ready") && checklist.includes("투자·가상자산·임대·해외 소득"), "tax checklist must cover pre-fill readiness and complex income");
assert.doesNotMatch(`${page}\n${checklist}`, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "tax content changes must remain outside payment flows");

console.log("TAX_RETURN_DEPTH=PASS official-sources>=7 copy-questions=5 post-lodgment=true");
