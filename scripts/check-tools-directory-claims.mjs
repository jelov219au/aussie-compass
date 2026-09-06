import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { localProjectMetadata } from "../src/lib/localProjectMetadata.ts";
import { filterDirectoryTools } from "../src/lib/toolsDirectorySearch.ts";

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
assert.equal(hrefs.length, 26, "the directory must expose all 26 free tool destinations");
assert.equal(new Set(hrefs).size, 26, "every directory destination must remain unique");
assert.ok(hrefs.every((href) => href.startsWith("/") && !href.startsWith("//")), "every directory destination must remain internal");
assert.equal(hrefs.filter((href) => href === "/resources/australia-job-ending-final-pay-dismissal-guide").length, 1, "the job-ending guide must appear once");
assert.equal(hrefs.filter((href) => href === "/underpayment-guide").length, 1, "the underpayment guide must appear once");

const filterIds = [...directory.matchAll(/\{ id: "([^"]+)", label:/g)].map((match) => match[1]);
assert.deepEqual(filterIds, ["all", "arrival", "work", "money", "home", "annual", "departure"], "the seven situation filters must remain in order");
assert.match(directory, /overflow-x-auto/);
assert.match(directory, /aria-pressed=\{active===filter\.id\}/);
assert.match(directory, /focus-visible:outline-none/);
assert.match(directory, /role="search" aria-label="도구 검색"/);
assert.match(directory, /이 검색창은 검색어를 저장하거나 전송하지 않아요/);
assert.match(directory, /검색 결과가 없어요/);
assert.match(directory, /전체 조건 초기화/);
assert.match(directory, /26개 모두 무료 도구·가이드|\{tools\.length\}개 모두 무료 도구·가이드/);
assert.match(directory, /href="\/pro"/);
assert.match(directory, /무료 \{tool\.kind\}/);
assert.match(directory, /\{tool\.cta\} →/);
assert.match(directory, /sm:grid-cols-\[4rem_minmax\(9rem,0\.75fr\)_minmax\(12rem,1\.25fr\)_2\.75rem\]/);
assert.match(directory, /min-h-11 shrink-0/);
assert.match(directory, /상황 필터는 옆으로 밀어 더 볼 수 있어요/);

const searchFixtures = [
  {
    href: "/used-car-comparison",
    title: "중고차 구매처·체크리스트",
    description: "PPSR와 차량 검사를 거쳐 비교해요.",
    features: ["대표 구매처 3곳"],
    eyebrow: "호주에서 첫 차 찾기",
    categories: ["home", "money"],
  },
  {
    href: "/resume-builder",
    title: "영문 이력서 빌더",
    description: "영문 이력서를 만들어요.",
    features: ["PDF 저장"],
    eyebrow: "호주 취업",
    categories: ["work"],
  },
  {
    href: "/resources/australia-job-ending-final-pay-dismissal-guide",
    title: "퇴사·해고·Final pay 가이드",
    description: "일자리가 끝났을 때 종료 유형과 마지막 급여를 확인해요.",
    features: ["Fair Work 공식 경로"],
    eyebrow: "일자리가 끝났을 때",
    categories: ["work"],
  },
  {
    href: "/underpayment-guide",
    title: "급여 차이·Underpayment 확인 가이드",
    description: "급여가 기록과 다를 때 Payslip을 맞춰봐요.",
    features: ["P.A.C.T 공식 기준"],
    eyebrow: "급여가 기록과 다를 때",
    categories: ["work", "money"],
  },
  {
    href: "/salary-calculator",
    title: "통합 급여 계산기",
    description: "급여와 세금을 계산해요.",
    features: ["급여 비교"],
    eyebrow: "급여와 세금",
    categories: ["work", "money"],
  },
  {
    href: "/tax-return-guide",
    title: "택스 리턴 준비 허브",
    description: "세금 신고와 공제 증빙을 준비해요.",
    features: ["ATO 공식 링크"],
    eyebrow: "EOFY 준비",
    categories: ["money", "annual"],
  },
  {
    href: "/property-inspection-checklist",
    title: "쉐어하우스·집 방문 체크리스트",
    description: "렌트 집을 방문해 점검해요.",
    features: ["렌트 모드"],
    eyebrow: "집 구하기",
    categories: ["home"],
  },
  {
    href: "/leaving-australia-guide",
    title: "귀국 준비·Super DASP 허브",
    description: "호주 출국 전후 할 일을 정리해요.",
    features: ["출국 전후 20개 항목"],
    eyebrow: "호주 생활 마무리",
    categories: ["departure", "money"],
  },
  {
    href: "/tax-prep-tracker",
    title: "연중 택스 리턴 준비 장부",
    description: "소득과 지출 증빙을 연중 기록해요.",
    features: ["회계연도별 기록"],
    eyebrow: "매달 10분 EOFY 준비",
    categories: ["money", "annual"],
  },
];
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "  ppsr  "), [searchFixtures[0]], "search must trim and match descriptions without reordering results");
assert.deepEqual(filterDirectoryTools(searchFixtures, "work", "이력서"), [searchFixtures[1]], "category and query must both apply");
assert.deepEqual(filterDirectoryTools(searchFixtures, "home", "이력서"), [], "a query must not escape the selected category");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "pdf"), [searchFixtures[1]], "features must be searchable case-insensitively");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", ""), searchFixtures, "an empty query must preserve the catalogue order");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "일자리 종료"), [searchFixtures[2]], "Korean multi-token job-ending search must use AND matching");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "job ending"), [searchFixtures[2]], "English job-ending aliases must resolve to the same guide");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "세금 신고"), [searchFixtures[5], searchFixtures[8]], "Korean tax-return search must rank the filing guide before the preparation tracker");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "tax return"), [searchFixtures[5], searchFixtures[8]], "English tax-return aliases must rank the filing guide before the preparation tracker");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "렌트"), [searchFixtures[6]], "rent search must resolve to the property inspection guide");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "rental inspection"), [searchFixtures[6]], "English rental-inspection search must use token AND matching");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "급여가 다름"), [searchFixtures[3]], "Korean pay-difference search must resolve to the underpayment guide");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "pay difference"), [searchFixtures[3]], "English pay-difference aliases must resolve to the underpayment guide");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "used car"), [searchFixtures[0]], "English used-car search must resolve locally");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "출국"), [searchFixtures[7]], "departure search must resolve to the leaving guide");
assert.deepEqual(filterDirectoryTools(searchFixtures, "all", "leaving australia"), [searchFixtures[7]], "English leaving-Australia search must resolve locally");

assert.deepEqual(filterDirectoryTools(searchFixtures, "work", "").slice(0, 3), [searchFixtures[2], searchFixtures[3], searchFixtures[4]], "work results must lead with job ending, underpayment and salary");
assert.deepEqual(filterDirectoryTools(searchFixtures, "home", "").slice(0, 2), [searchFixtures[6], searchFixtures[0]], "home results must lead with property inspection and used car");
assert.deepEqual(filterDirectoryTools(searchFixtures, "annual", "")[0], searchFixtures[5], "annual results must lead with tax return");
assert.deepEqual(filterDirectoryTools(searchFixtures, "departure", "")[0], searchFixtures[7], "departure results must lead with leaving Australia");

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
