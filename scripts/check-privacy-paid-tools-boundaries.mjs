import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path) => readFileSync(resolve(path), "utf8");
const privacy = read("src/app/privacy/page.tsx");
const terms = read("src/app/terms/page.tsx");
const purchase = read("src/app/purchase-information/page.tsx");
const purchaseFacts = read("src/lib/proPurchaseInformation.ts");
const transfer = read("src/components/tools/DeviceDataTransfer.tsx");

const soldProducts = [
  "Resume Pro",
  "Rental Application Pack Pro",
  "Pay Evidence Pack Pro",
  "EOFY Pack Pro",
  "Leaving Australia Pack Pro",
];
for (const product of soldProducts) {
  assert.ok(privacy.includes(product), `privacy must name the isolated sold product: ${product}`);
  assert.ok(terms.includes(product), `terms must describe the sold product: ${product}`);
}

for (const boundary of [
  "한 제품의 이용권·쿠키가 다른 제품을 열지 않습니다",
  "서버 이용권 데이터베이스에는 이 작업 공간 원문을 저장하지 않습니다",
  "Car Purchase Pack Pro에는 현재 구매 이용권이나 접근 쿠키를 발급하지 않습니다",
  "구매 이용권, 접근 쿠키, 복구 코드·해시·nonce와 결제 증빙은 이 백업에 포함되지 않고 파일로 이동하거나 복구되지 않습니다",
  "서버 업로드나 자동 동기화가 없습니다",
  "급여·세금·렌트·출국·중고차 메모",
  'href="/data-transfer"',
  'href="/payment-help"',
  "2026년 9월 5일",
]) assert.ok(privacy.includes(boundary), `privacy boundary is missing: ${boundary}`);

for (const preservedPrivacyScope of [
  "YouTube 영상",
  "구직 준비 경험 설문",
  "이메일 문의",
  "삭제 요청과 기록 보존",
  "호스팅과 익명 방문 통계",
  "페이지 주소는 전송 전에 모든 검색어와 기타 URL 쿼리 값을 제거합니다",
]) assert.ok(privacy.includes(preservedPrivacyScope), `existing privacy scope changed or disappeared: ${preservedPrivacyScope}`);

for (const boundary of [
  "한 제품의 이용권·접근 쿠키·복구 코드는 다른 Pro 제품을 열지 않습니다",
  "Car Purchase Pack Pro는 가격·구매 조건 준비 중이고 결제 미오픈이므로 현재 구매 이용권을 제공하지 않습니다",
  "도구별 PDF·TXT·archive",
  "데이터 백업·이전",
  "구매 이용권·접근 쿠키·복구 코드나 nonce가 포함되지 않으며",
  "제품별 결제·접근 복구 절차",
  "임금 지급이나 체불 여부를 판정·보장하거나 신고를 대행하지 않습니다",
  "세금 신고 결과·공제 가능 여부·환급액을 판정하거나 신고를 대행하지 않습니다",
  "Bond 반환, 마지막 급여 또는 DASP 처리를 판정·보장하거나 대신 신청하지 않습니다",
]) assert.ok(terms.includes(boundary), `terms boundary is missing: ${boundary}`);

for (const route of ["/data-transfer", "/payment-help", "/purchase-information", "/privacy"]) {
  assert.ok(existsSync(resolve(`src/app${route}/page.tsx`)), `linked route does not exist: ${route}`);
}

assert.ok(purchase.includes("Car Purchase Pack Pro는 가격·구매 조건 준비 중이며 이 가격표에 포함되지 않습니다"));
for (const fact of [
  "resumeProProduct",
  "rentalApplicationProProduct",
  "payEvidenceProProduct",
  "eofyProProduct",
  "leavingAustraliaProProduct",
]) assert.ok(purchaseFacts.includes(fact), `purchase source is missing ${fact}`);
assert.doesNotMatch(purchaseFacts, /carPurchase|car-purchase/i, "unpriced Car must not enter the five-product purchase source of truth");
assert.equal((purchaseFacts.match(/termsVersion:/g) ?? []).length, 5, "terms versions must continue to come from the five mapped commerce products");
assert.ok(transfer.includes("구매 이용권·활성화·복구 정보는 포함하지 않습니다"));
assert.ok(transfer.includes("Car workspace 자체 JSON archive"));

console.log("WEB48 privacy, terms, local workspace, backup, and entitlement boundaries passed.");
