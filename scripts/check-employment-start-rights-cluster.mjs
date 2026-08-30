import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const articles = readFileSync(resolve("src/data/articles.ts"), "utf8");

const articleBlock = (slug) => {
  const slugIndex = articles.indexOf(`slug: "${slug}"`);
  assert.ok(slugIndex >= 0, `${slug} article must exist`);
  const start = articles.lastIndexOf("\n  {", slugIndex);
  const end = articles.indexOf("\n  },", slugIndex);
  assert.ok(start >= 0 && end > start, `${slug} article block must be readable`);
  return articles.slice(start, end + 5);
};

const offer = articleBlock("australia-job-scam-red-flags");
const trial = articleBlock("unpaid-trial-shift-australia-guide");
const contractor = articleBlock("abn-employee-or-contractor-australia");
const payslip = articleBlock("first-payslip-checklist-australia");
const cluster = [offer, trial, contractor, payslip];

for (const block of cluster) {
  assert.match(block, /updatedAt: "2026-08-30"/, "each employment-start article must show the verification date");
  assert.doesNotMatch(block, /Stripe|Checkout|결제하기|추천 수수료/, "public rights content must stay independent of payment or referral flows");
}

assert.match(offer, /법적 고용주 이름·ABN/, "the offer check must identify the legal employer");
assert.match(offer, /Award·Enterprise agreement와 Classification/, "the offer check must capture the pay instrument and classification");
assert.match(offer, /Who is the legal employer/, "the offer check must include a copy-ready English question");
assert.match(offer, /Information statements/, "the offer path must link to current employee information statements");
assert.match(offer, /relatedSlugs: \["unpaid-trial-shift-australia-guide", "abn-employee-or-contractor-australia", "first-payslip-checklist-australia"\]/, "the verified offer must lead into the employment-start decision path");

assert.match(trial, /빈 일자리의 기술 확인/, "the trial check must identify a real vacant role and skills assessment");
assert.match(trial, /직접 감독/, "the trial check must explain direct supervision");
assert.match(trial, /고객 응대·청소·재고·마감/, "the trial check must distinguish productive work from a skills demonstration");
assert.match(trial, /which parts of the trial are unpaid/, "the trial check must include a copy-ready scope and pay question");
assert.match(trial, /Probation은 무급기간이 아니에요/, "the trial check must distinguish paid probation from an unpaid trial");

assert.match(contractor, /ABN 보유 여부 하나만으로 결정되지 않아요/, "the contractor check must reject ABN-only classification");
assert.match(contractor, /Whole of relationship test/, "the contractor check must explain the current whole-relationship test");
assert.match(contractor, /Start of relationship test/, "the contractor check must retain the alternative test boundary");
assert.match(contractor, /Super guarantee/, "the contractor check must keep super as a separate decision");
assert.match(contractor, /which test did you use/, "the contractor check must include a copy-ready status question");
assert.match(contractor, /find-help-for\/independent-contractors"/, "the contractor check must use the current Fair Work hub");

assert.match(payslip, /첫 Shift 전에 비교 기준부터 저장하세요/, "the payslip check must start the evidence trail before work");
assert.match(payslip, /실제 주된 업무/, "the payslip check must classify by duties rather than title alone");
assert.match(payslip, /예상액과 실제액/, "the payslip check must create an expected-versus-actual comparison");
assert.match(payslip, /corrected payslip and back payment/, "the payslip check must request correction and back pay in writing");
assert.match(payslip, /고용주가 Visa를 취소할 권한은 없어요/, "the underpayment path must state the visa-threat boundary");
assert.match(payslip, /award-classifications/, "the payslip check must link the official classification guidance");
assert.match(payslip, /my-pay-doesnt-seem-right/, "the payslip check must link the official resolution path");

console.log("Employment-start rights content cluster contract passed.");
