import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { localProjectMetadata } from "../src/lib/localProjectMetadata.ts";

const [toolsPage, directory, homeTools, helpPage] = await Promise.all([
  readFile(new URL("../src/app/tools/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ToolsDirectory.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/sections/ToolsSection.tsx", import.meta.url)),
  readFile(new URL("../src/app/help-directory/page.tsx", import.meta.url), "utf8"),
]);

for (const text of [
  "영문 목표 직무와 본인이 확인한 업무를 직접 입력",
  "수정 가능한 영문 뼈대",
  "예시 자동 번역·AI 번역 아님",
  "실시간 A4 미리보기·PDF",
]) assert.ok(toolsPage.includes(text), `the resume card is missing its real input boundary: ${text}`);
assert.doesNotMatch(toolsPage, /한국어로 적은 강점을 자연스러운 영문 초안으로 바꾸고/, "the directory must not promise removed Korean-to-English conversion");

const arrival = localProjectMetadata.find(({ key }) => key === "arrival-first-30-days");
assert.equal(arrival?.ids.length, 18, "the shared arrival project must contain 18 actual task IDs");
assert.ok(toolsPage.includes('features: ["도착 시기별 18개 항목"'), "the tools card must show the same 18-item count");

const toolsSource = toolsPage.slice(toolsPage.indexOf("const availableTools"), toolsPage.indexOf("export default function"));
const hrefs = [...toolsSource.matchAll(/href: "(\/[^"]+)"/g)].map((match) => match[1]);
assert.equal(hrefs.length, 24, "the directory must retain all 24 current tool destinations");
assert.equal(new Set(hrefs).size, 24, "every directory destination must remain unique");
assert.ok(hrefs.every((href) => href.startsWith("/") && !href.startsWith("//")), "every directory destination must remain internal");

const filterIds = [...directory.matchAll(/\{ id: "([^"]+)", label:/g)].map((match) => match[1]);
assert.deepEqual(filterIds, ["all", "arrival", "work", "money", "home", "annual", "departure"], "the seven situation filters must remain in order");
assert.match(directory, /overflow-x-auto/);
assert.match(directory, /aria-pressed=\{active===filter\.id\}/);
assert.match(directory, /focus-visible:outline-none/);

const homeToolsSource = homeTools.toString("utf8");
for (const text of [
  "지원할 공고에 내 경험 맞춰보기",
  "이력서와 공고를 이 기기에서 비교해요. 실제 경험 근거를 먼저 확인하세요.",
  "무료 공고 맞춤 점검",
  'section: "resume_job_ad_evidence", destination: "resume-job-ad-checker"',
]) assert.ok(homeToolsSource.includes(text), `the already-accurate home resume card must retain: ${text}`);

assert.ok(helpPage.includes('number: "000", href: "tel:000"'), "the emergency card must retain the 000 call action");
assert.ok(helpPage.includes("범죄가 진행 중이거나 경찰·소방·구급차가 즉시 필요한 긴급 상황"), "the 000 description must use natural emergency wording");
assert.doesNotMatch(helpPage, /범죄가 진행 중인 시간 긴급 상황/, "the malformed 000 sentence must be removed");
assert.ok(helpPage.includes("즉시 000에 전화") && helpPage.includes("Korean interpreter, please") && helpPage.includes("기기, 전화요금 명세나 연결된 다른 기기에 남을 수 있습니다"), "the existing urgency, interpreting and device-safety context must remain");

console.log("WEB44 tools-directory claims and help wording contract passed.");
