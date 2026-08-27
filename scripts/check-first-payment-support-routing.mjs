import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [operationsPacket, accountingRunbook, paymentHelp, paymentSupportHelper] = await Promise.all([
  readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8"),
  readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8"),
  readFile(new URL("../src/app/payment-help/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PaymentSupportHelper.tsx", import.meta.url), "utf8"),
]);

const compactPacket = operationsPacket.replace(/\s+/g, " ");
const compactAccounting = accountingRunbook.replace(/\s+/g, " ");

for (const heading of [
  "## 3. 첫 문의 최소 응대 런북",
  "### 역할과 접수 원칙",
  "### 허용하는 최소 식별자",
  "### 문의 분기표",
  "## 4. 상황별 처리 카드",
  "## 5. 24시간 마감 인계",
]) assert.ok(operationsPacket.includes(heading), `first-payment packet is missing heading: ${heading}`);

for (const route of [
  "Hoju Compass 제품 지원",
  "Managed Payments 거래 지원",
  "결제 완료·접근 미부여",
  "영수증·인보이스·거래 문의",
  "중복 결제 주장",
  "환불·ACL 문제",
  "개인정보 삭제 요청",
]) assert.ok(operationsPacket.includes(route), `first-payment packet is missing support route: ${route}`);

for (const boundary of [
  "첫 실제 문서에서 확인하지 않은 사업자명은 티켓이나 고객 답변에서 추정하지 않는다",
  "자동 환불, 환불 완료, 법률상 결론, 즉시 삭제 또는 세금 문서의 법적 성격을 약속하지 않는다",
  "실제 외부 답변·환불·삭제는 owner 승인과 원본 시스템 절차를 따른다",
  "같은 상품을 다시 결제하지 말아 주세요",
  "단일 거래의 중복 웹훅을 중복 청구로 보지 않는다",
  "현재 환불이 완료된 것은 아닙니다",
  "실제 환불 전 Stripe·이용권·장부를 변경하지 않는다",
  "현재 단계에서 삭제가 완료된 것은 아닙니다",
  "고객 이메일 본문은 티켓에 복사하지 않는다",
]) assert.ok(compactPacket.includes(boundary), `first-payment support boundary is missing: ${boundary}`);

for (const forbiddenData of [
  "카드번호 전체·일부",
  "CVC",
  "은행계좌·은행 화면 전체",
  "비밀번호·인증번호",
  "TFN",
  "신분증·비자 사본",
  "이력서·커버레터 원문",
  "복구 코드",
  "API key",
  "webhook secret",
  "전체 Stripe/webhook payload",
]) assert.ok(operationsPacket.includes(forbiddenData), `first-payment privacy denylist is missing: ${forbiddenData}`);

for (const accountingBoundary of [
  "접근 복구는 별도 매출이나 환불이 아니다",
  "요청만으로 장부를 바꾸지 않는다",
  "원 gross sale을 보존하고 refund/credit document와 연결한 음수 매출 조정을 기록한다",
  "payout을 매출로 잡지 않고",
  "고객 이름·이메일·주소·카드 정보는 회계 워크북과 일반 운영 로그에 복사하지 않는다",
]) assert.ok(compactPacket.includes(accountingBoundary), `support-to-accounting boundary is missing: ${accountingBoundary}`);

for (const accountingContract of [
  "gross customer sales",
  "refunds and disputes",
  "payouts received in the business bank account",
  "remaining Stripe ending balance",
  "Do not add customer names, email addresses, card details, ABNs or secret keys to the workbook",
]) assert.ok(compactAccounting.includes(accountingContract), `accounting runbook is missing: ${accountingContract}`);

assert.ok(paymentHelp.includes("같은 제품을 다시 결제하기 전에"));
assert.ok(paymentHelp.includes("최소 정보로 제품 지원을 준비하세요"));
for (const mobileScenario of [
  "결제 완료 여부를 확인하고 싶음",
  "중복 결제가 의심됨",
  "영수증·인보이스 또는 거래 지원 문의",
  "결제했는데 이용권이 열리지 않음",
  "환불 또는 제품 문제 해결 요청",
]) assert.ok(paymentSupportHelper.includes(mobileScenario), `mobile support helper is missing scenario: ${mobileScenario}`);
assert.ok(paymentSupportHelper.includes("같은 결제를 다시 하지 않기"));
assert.ok(paymentSupportHelper.includes("다시 결제하거나 영수증·인보이스 원문·링크를 보내지 말고, 결제 참조 마지막 8자와 대략적인 결제 시각·시간대로 Hoju Compass 제품 지원에 문의하기"));
assert.ok(paymentSupportHelper.includes("4영업시간 이내 확인 결과 또는 다음 조치를 안내하는 것을 목표"));
assert.ok(!paymentSupportHelper.includes("코드가 없다면 구매 증빙으로 지원 요청"));
assert.ok(paymentSupportHelper.includes("각 결제 참조는 전체 값 대신 마지막 8자만 기록"));
assert.ok(paymentSupportHelper.includes("판매자·문서 발행자·거래 지원 경로가 명확한 경우만 확인하고, 불명확하면 추정하지 않기"));
assert.ok(paymentSupportHelper.includes("환불 요청은 환불 완료가 아님을 확인"));
assert.ok(paymentSupportHelper.includes("[있다면 각 참조의 마지막 8자만 입력]"));
assert.ok(
  paymentSupportHelper.includes('aria-live="polite"')
    && paymentSupportHelper.includes('aria-atomic="true"')
    && paymentSupportHelper.includes('aria-label={`${selected.label} 확인 순서`}'),
  "mobile scenario changes must be announced with an accessible name",
);
for (const forbiddenCollection of ["카드번호 전체·일부", "CVC", "영수증 전체", "신분증 사본"]) {
  assert.ok(paymentSupportHelper.includes(forbiddenCollection), `support helper must keep its denylist: ${forbiddenCollection}`);
}

console.log("First-payment refund, access and support routing contract passed.");
