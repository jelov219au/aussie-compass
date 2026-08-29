import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [offerPage, handoff, freeTool, packageConfig] = await Promise.all([
  readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/rentalReadyNowHandoff.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/PropertyInspectionChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8").then(JSON.parse),
]);

assert.ok(offerPage.includes('entry === "property-inspection-checklist"'), "the handoff explanation must only appear on the free-inspection entry");
for (const copy of [
  "유효한 무료 방문 결과가 있으면 집 구분명과 점검 집계만 이어집니다.",
  "현재 브라우저에 최대 24시간 보관된 결과",
  "Pro 작업공간에서 한 번 가져옵니다.",
  "방문 메모와 세부 체크 결과는 옮기지 않으며",
  "원본 서류나 개인정보를 새로 수집하지 않습니다.",
]) assert.ok(offerPage.includes(copy), `the pre-purchase handoff boundary is missing: ${copy}`);

assert.ok(handoff.includes("24 * 60 * 60 * 1000"), "the 24-hour offer copy must match the implemented handoff lifetime");
assert.ok(freeTool.includes('router.push("/rental-application-pro?from=property-inspection-checklist")'), "the free result must reach the entry that explains the handoff");
assert.ok(offerPage.includes('aria-labelledby="rental-free-handoff-heading"'), "the handoff section needs an accessible name");
assert.doesNotMatch(offerPage, /방문 메모와 세부 체크 결과(?:도|까지) 이어/, "the offer must not imply raw free-tool detail transfer");
assert.equal(
  packageConfig.scripts["test:rental-offer-handoff"],
  "node scripts/check-rental-offer-handoff-copy.mjs",
  "the Rental handoff copy contract must remain directly runnable",
);
assert.match(
  packageConfig.scripts["quality:gate"],
  /(?:^| && )npm run test:rental-offer-handoff(?: && |$)/,
  "quality:gate must include the Rental handoff copy regression contract",
);

console.log("Rental pre-purchase free-result handoff copy contract passed.");
