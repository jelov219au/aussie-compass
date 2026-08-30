import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [articlesSource, arrivalPage, articlePage] = await Promise.all([
  readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/arrival-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resources/[slug]/page.tsx", import.meta.url), "utf8"),
]);

const slug = "australia-bank-account-opening-guide";
const start = articlesSource.indexOf(`slug: "${slug}"`);
const end = articlesSource.indexOf('slug: "first-job-super-fund-stapled-account-guide"', start);
assert.ok(start >= 0 && end > start, "the bank article block must exist before the super article");
const bankArticle = articlesSource.slice(start, end);

for (const phrase of [
  "개설 뒤 첫 달",
  "Transaction account",
  "카드 수령과 급여 등록",
  "PayID 이름이 다르면",
  "자동출금은 금액·날짜·취소 방법",
  "급여일과 출금일 사이",
  "취소는 서비스 계약과 결제 권한",
  "첫 명세서는 입금과 출금을",
  "모르는 거래·오송금·사기",
  "ePayments Code 적용 여부",
  "Financial Claims Scheme",
  "돈이 부족해질 것 같다면",
  "은행 내부 민원에서 AFCA",
  "매년 다시 비교",
]) {
  assert.ok(bankArticle.includes(phrase), `the first-month banking flow is missing: ${phrase}`);
}

for (const operationalDetail of [
  "Direct debit",
  "Recurring payment",
  "Dishonour",
  "자동 재시도",
  "이중 납부",
  "Statement",
  "Mistaken transaction",
  "Reference number",
  "IDCARE",
  "ReportCyber",
  "Subscriber",
  "National Debt Helpline 1800 007 007",
  "Formal complaint",
  "Internal dispute resolution",
  "Receiving bank",
]) {
  assert.ok(bankArticle.includes(operationalDetail), `the bank article is missing an operational detail: ${operationalDetail}`);
}

for (const officialUrl of [
  "https://moneysmart.gov.au/banking/transaction-accounts-and-debit-cards",
  "https://moneysmart.gov.au/banking/direct-debits",
  "https://moneysmart.gov.au/banking/unauthorised-and-mistaken-transactions",
  "https://www.asic.gov.au/regulatory-resources/financial-services/epayments-code",
  "https://moneysmart.gov.au/managing-debt/financial-hardship",
  "https://www.scamwatch.gov.au/stop-check-protect/what-to-do-if-youve-been-scammed",
  "https://www.afca.org.au/make-a-complaint/banking",
  "https://www.afca.org.au/about-afca/receiving-banks-and-unauthorised-opening-of-accounts",
]) {
  assert.ok(bankArticle.includes(officialUrl), `the bank article is missing its verified source: ${officialUrl}`);
}

const sectionCount = (bankArticle.match(/\{ heading:/g) ?? []).length;
const sourceCount = (bankArticle.match(/\{ label:/g) ?? []).length;
assert.ok(sectionCount >= 15, `the bank article needs at least 15 sections, found ${sectionCount}`);
assert.ok(sourceCount >= 11, `the bank article needs at least 11 official sources, found ${sourceCount}`);
assert.ok(bankArticle.includes('readingTime: "16분"'), "the reading time must reflect the expanded guide");
assert.ok(bankArticle.includes('updatedAt: "2026-08-30"'), "the verified update date must be current");

for (const handoff of [
  'id: "bank-first-statement"',
  "첫 은행 명세서와 자동출금 대조",
  `/resources/${slug}`,
  "첫 계좌 · 첫 명세서",
  "사기 대응과 AFCA 민원까지",
]) {
  assert.ok(arrivalPage.includes(handoff), `the arrival handoff is missing: ${handoff}`);
}

assert.equal((arrivalPage.match(new RegExp(`/resources/${slug}`, "g")) ?? []).length, 1, "the arrival page should expose one deliberate bank-guide card");
assert.ok(articlePage.includes("article.sections.map"), "the public article page must render all banking sections");
assert.ok(articlePage.includes("article.sources.map"), "the public article page must render all official banking sources");

for (const source of [bankArticle, arrivalPage]) {
  assert.doesNotMatch(source, /createCheckout|checkout\/session|stripe\.|paymentReadiness|affiliate|sponsored ranking|lead capture/i, "the information cluster must stay outside commercial and payment-integration paths");
}

console.log(`BANKING_FIRST_MONTH_CLUSTER=PASS sections=${sectionCount} sources=${sourceCount}`);
