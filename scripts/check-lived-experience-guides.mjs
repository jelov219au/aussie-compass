import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/resources/LivedExperienceGuides.tsx", "utf8");

for (const unsupported of [
  "실제로 살면서",
  "처음 호주에 왔을 때 남겨둔 기록",
  "내 기록",
  "사용자 경험",
  "규정과 숫자는 지금의 공식 자료로 다시 확인",
]) {
  assert.ok(!source.includes(unsupported), `unsupported provenance or blanket review claim remains: ${unsupported}`);
}

for (const expected of [
  "처음 정착할 때 자주 막히는 네 장면",
  "체크리스트와 연결 가이드에서 반복되는 첫 행동",
  "적용 지역과 업데이트일, 공식 출처는 연결된 글에서 함께 확인",
  "천천히 다시 말해 달라고 먼저 요청",
  "비용·날짜·다음 행동은 문자나 이메일로 받아두는",
  "짐을 풀거나 수리하기 전에 사진부터",
  "Condition Report",
  "Bond의 공식 처리 경로",
  "수수료와 신원 확인 조건부터 비교",
  "보안 설정",
  "첫 Statement에서 실제 부과 내역",
  "근무시간과 시급으로 Gross부터",
  "Payslip의 Net Pay가 실제 은행 입금액과 같은지 비교",
]) {
  assert.ok(source.includes(expected), `missing concrete first action: ${expected}`);
}

const hrefs = [...source.matchAll(/href: "([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(hrefs, [
  "/resources/australia-arrival-english-clarifying-phrases",
  "/resources/rental-condition-report-bond-first-week-australia",
  "/resources/australia-bank-account-opening-guide",
  "/payslip-guide",
]);
assert.equal(new Set(hrefs).size, 4);
assert.match(source, /<ol className="[^"]*"/);
assert.match(source, /min-h-64/);
assert.match(source, /focus-visible:ring-2/);

const resourcesPage = fs.readFileSync("src/app/resources/page.tsx", "utf8");
assert.ok(resourcesPage.includes("<LivedExperienceGuides />"));

const disclaimer = fs.readFileSync("src/app/disclaimer/page.tsx", "utf8");
for (const marker of ["일반 정보", "법률", "세무", "이민"]) assert.ok(disclaimer.includes(marker), `WEB49 disclaimer marker missing: ${marker}`);

console.log("WEB52 honest first-settlement guide provenance contract passed");
