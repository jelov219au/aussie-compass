import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/app/super-guide/page.tsx", import.meta.url), "utf8");

for (const phrase of [
  "Payslip에는 있는데",
  "Payslip과 실제 입금 비교",
  "고용주·Fund에 서면 확인",
  "ATO 신고 여부 판단",
  "Fund는 순위 하나로 고르지 않기",
  "합치기 전에 보험부터 확인",
  "전화 권유·조기 인출 경계",
]) assert.ok(page.includes(phrase), `super guide is missing: ${phrase}`);

for (const question of [
  "Please confirm the super amount, payment date and fund",
  "My payslip shows super, but I cannot see the contribution",
  "Please provide the transaction reference",
  "whether any contribution was rejected or returned",
]) assert.ok(page.includes(question), `super guide copy-ready question is missing: ${question}`);

for (const source of ["ato.gov.au", "moneysmart.gov.au/how-super-works/choosing-a-super-fund", "moneysmart.gov.au/how-life-insurance-works/insurance-through-super"]) {
  assert.ok(page.includes(source), `super guide official source is missing: ${source}`);
}

assert.doesNotMatch(page, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "super content changes must remain outside payment flows");

console.log("SUPER_GUIDE_DEPTH=PASS unpaid-flow=4 copy-questions=4 fund-safety=3");
