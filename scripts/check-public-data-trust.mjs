import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, planner, contract, privacy, terms, disclaimer, contact, packageSource] = await Promise.all([
  readFile(new URL("../src/app/public-transport-guide/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/CommuteHousingPlanner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../docs/public-data-trust-contract.md", import.meta.url), "utf8"),
  readFile(new URL("../src/app/privacy/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/terms/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/disclaimer/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/contact/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);
const compactContract = contract.replace(/\s+/g, " ");

for (const field of [
  "source_name",
  "source_url",
  "source_record_title",
  "source_updated_at",
  "collected_at",
  "expected_refresh_interval",
  "data_status",
  "licence_name",
  "licence_url",
  "attribution_text",
  "transformation_summary",
  "hoju_interpretation",
  "limitations",
  "error_report_path",
]) assert.ok(contract.includes(field), `public data trust contract is missing field: ${field}`);

for (const status of ["CURRENT", "FRESHNESS_UNKNOWN", "STALE", "NOT_COLLECTED", "SOURCE_UNAVAILABLE", "ERROR"]) {
  assert.ok(contract.includes(status), `public data trust contract is missing fail-closed status: ${status}`);
}

for (const boundary of [
  "원본 갱신 시각과 별도",
  "포털 기본값 추정 금지",
  "이전 성공 값을 조용히 최신처럼 재사용하지 않는다",
  "공식 출처",
  "Hoju Compass 해석",
  "공식 앱",
  "데이터셋별 metadata",
  "단순 링크는 데이터 재게시나 라이선스 승계를 뜻하지 않는다",
]) assert.ok(compactContract.includes(boundary), `public data trust contract is missing boundary: ${boundary}`);

for (const publicCopy of [
  "주·준주별 공식 교통기관 링크",
  "외부 링크 전용 · 데이터 미수집",
  "원본 갱신 시각",
  "데이터셋을 복사·재게시하지 않습니다",
  "Hoju Compass 해석",
  "공식 앱·제휴·보증을 뜻하지 않습니다",
  "오래됐거나 열리지 않거나 내용이 다르면",
]) assert.ok(page.includes(publicCopy), `public transport page is missing data-trust copy: ${publicCopy}`);

assert.ok(!page.includes("주·준주별 교통카드와 공식 요금"), "a link-only page must not imply it displays verified official fares");
assert.ok(!page.includes("fetch(") && !planner.includes("fetch("), "the current link-only guide must not silently collect agency datasets");
assert.ok(planner.includes("사용자가 직접 입력") || planner.includes("직접 입력"), "the planner must identify user-entered values as the calculation source");

assert.ok(privacy.includes("외부 사이트와 Google Maps") && privacy.includes("검색어·출발지·목적지"), "privacy copy must disclose external map-query transfer");
assert.ok(terms.includes("연결된 정부기관 또는 전문가의 최신 안내"), "terms must keep official-current-source precedence");
assert.ok(disclaimer.includes("외부 사이트의 내용, 가용성") && disclaimer.includes("치안 통계와 지도 검색"), "disclaimer must cover source availability and regional-data limits");
for (const correctionPrompt of [
  "오류를 확인한 시각:",
  "공식 출처 화면의 갱신일·라이선스 표시(있다면):",
  "스크린샷 원본이나 개인정보는 보내지 않아도 됩니다",
]) assert.ok(contact.includes(correctionPrompt), `content correction support is missing: ${correctionPrompt}`);

const packageJson = JSON.parse(packageSource);
assert.equal(packageJson.scripts["test:public-data-trust"], "node scripts/check-public-data-trust.mjs");
assert.ok(packageJson.scripts["quality:gate"].includes("npm run test:public-data-trust"), "quality gate must run the public data trust contract");

console.log("Public government and transport data trust contract passed.");
