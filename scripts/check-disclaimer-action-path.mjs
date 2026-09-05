import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const page = readFileSync(resolve("src/app/disclaimer/page.tsx"), "utf8");

for (const value of [
  "정보 이용과 면책 안내",
  "이 사이트 결과를 실제 결정에 쓰기 전 4단계",
  "적용 지역·기준연도·마지막 확인일",
  "날짜·금액·고용형태",
  "같은 용어·기간·금액 기준",
  "결제·제출·서명·송금 전에 멈추고",
  "페이지 주소, 확인 시각, 달랐던 문장과 공식 원문",
]) assert.ok(page.includes(value), `common verification flow is missing: ${value}`);

for (const title of ["일반 정보", "계산 결과", "공식 정보 우선", "외부 링크", "서비스·지역 정보", "긴급 상황"]) {
  assert.ok(page.includes(`title: "${title}"`), `disclaimer section is missing: ${title}`);
}

for (const value of [
  "비자 제출, 계약 서명, 세금 신고, 의료 판단이나 임금 분쟁",
  "Gross는 Gross와, Net은 은행 입금액과 비교",
  "적용일·지역·개인 조건",
  "스크린샷이나 참조번호",
  "외부 페이지가 열린 것만으로 신청·예약·등록이 완료된 것은 아니므로",
  "ABN과 해당 작업에 필요한 면허",
  "포함·제외 항목, GST, 일정, 서면 조건과 현장 상태",
  "호주 긴급전화 000",
]) assert.ok(page.includes(value), `section action is missing: ${value}`);

const routes = ["/search", "/help-directory", "/contact", "/editorial-policy"];
for (const route of routes) {
  assert.ok(page.includes(`"${route}"`), `action link is missing: ${route}`);
  assert.ok(existsSync(resolve(`src/app${route}/page.tsx`)), `action route does not exist: ${route}`);
}

assert.ok(page.includes("개인정보·민감정보를 제거한 뒤 정정 템플릿"));
assert.ok(page.includes("페이지 개정일: 2026년 9월 5일"));
assert.ok(page.includes("이 날짜는 연결된 자료 전체의 사실 확인일을 뜻하지 않습니다"));
assert.doesNotMatch(page, /2025–26|2026–27|A\$\d|\d+%|\d+일 안/, "disclaimer must not duplicate a rate, price, deadline or fixed policy period");

console.log("WEB49 actionable disclaimer verification flow passed.");
