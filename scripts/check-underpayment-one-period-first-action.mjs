import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, copyButton, footer] = await Promise.all([
  readFile(new URL("../src/app/underpayment-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/underpayment-guide/CopyTextButton.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/layout/Footer.tsx", import.meta.url), "utf8"),
]);

for (const text of [
  "one_pay_period_next_contact",
  "급여기간 하나 고정하기",
  "시급·Award 근거 확인하기",
  "Roster·Timesheet와 실제 근무 맞추기",
  "기대 Gross와 Payslip Gross 비교하기",
  "Payslip Net과 은행 Net 맞추기",
  "차이 종류와 다음 연락 하나 정하기",
  "ready_to_ask",
  "blocked_with_request",
  "resolved_and_verified",
  "escalation_ready",
  "unknown / 비교 불가",
  "A$0 차이로 바꾸지 않습니다",
]) assert.ok(page.includes(text), `missing one-period outcome contract: ${text}`);

for (const href of [
  "https://calculate.fairwork.gov.au/",
  "/award-guide",
  "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips",
  "https://www.fairwork.gov.au/pay-and-wages/paying-wages/record-keeping",
  "https://www.fairwork.gov.au/workplace-problems/fixing-a-workplace-problem/get-our-help-with-a-workplace-problem",
  "https://www.fairwork.gov.au/tools-and-resources/language-help/korean",
  "https://www.fairwork.gov.au/find-help-for/visa-holders-migrants",
  "https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator",
  "https://www.ato.gov.au/calculators-and-tools/super-report-unpaid-super-contributions-from-my-employer",
]) assert.ok(page.includes(href), `missing official or free route: ${href}`);

assert.ok(page.includes("TIS 13 14 50") && page.includes("Fair Work Infoline 13 13 94"), "language support path must be explicit");
assert.ok(page.includes("Please send me my payslip and time and wage records"), "the short records request must be copyable");
assert.ok(page.includes("자료 요청문 복사") && page.includes("급여 문의문 복사"), "both copy actions must be visible");
assert.ok(copyButton.includes("navigator.clipboard.writeText(text)"), "copying must stay in the browser without analytics");
assert.doesNotMatch(copyButton + page, /trackEvent|analytics|gtag|posthog/i, "the guide must not collect pay or document analytics");

assert.match(page, /표를 좌우로 밀어 비교할 자료와 질문까지 확인하세요/);
assert.match(page, /표를 좌우로 밀어 다음 확인과 남길 자료까지 확인하세요/);
assert.match(page, /href="\/guides"[\s\S]*?min-h-11/);
assert.match(page, /Fair Work Payslip 안내[\s\S]*?<\/a>/);
assert.ok((page.match(/href="\/pay-evidence-pro"/g) ?? []).length === 1, "Pay Evidence Pro CTA must appear exactly once");
assert.ok(page.indexOf('id="official-help-heading"') < page.indexOf('id="pay-evidence-pro-cta"'), "official help must appear before Pro");
assert.ok(page.indexOf("Award 확인하기") < page.indexOf('id="pay-evidence-pro-cta"'), "free Award and Payslip actions must appear before Pro");
assert.ok(page.includes("여러 기간의 차이·증빙 상태를 반복 저장하고 전달용 파일로 묶어야 할 때만"), "Pro boundary must be limited to repeated multi-period work");
assert.match(footer, /footerLinks\.map[\s\S]*?min-h-11/);
assert.match(footer, /supportLinks\.map[\s\S]*?min-h-11/);

console.log("Underpayment one-pay-period first-action contract passed.");
