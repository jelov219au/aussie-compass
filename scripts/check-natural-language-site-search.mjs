import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSiteSearchIntent, getSiteSearchScenario, rankSiteSearchItems } from "../src/lib/siteSearch.ts";

const items = [
  { href: "/salary-calculator", type: "도구", title: "통합 급여 계산기", description: "세전·세후 급여와 세금", keywords: ["급여", "실수령액"] },
  { href: "/pay-evidence-pro", type: "도구", title: "Pay Evidence Pack Pro", description: "Payslip 차이와 증빙", keywords: ["미지급급여", "급여차이", "underpayment"] },
  { href: "/payslip-guide", type: "가이드", title: "Payslip 읽는 법", description: "Gross와 Net", keywords: ["급여명세서", "페이슬립"] },
  { href: "/underpayment-guide", type: "가이드", title: "급여가 적게 들어왔다면", description: "미지급 급여 확인과 대응 순서", keywords: ["임금체불", "underpayment", "차액"] },
  { href: "/property-inspection-checklist", type: "도구", title: "렌트 신청 전 무료 집 방문 체크리스트", description: "집 상태와 보증금 점검", keywords: ["렌트 신청", "rental application", "bond"] },
  { href: "/rental-application-pro", type: "도구", title: "Rental Pack Pro", description: "렌트 신청 자료", keywords: ["렌트 신청", "rental application"] },
  { href: "/moving-checklist", type: "도구", title: "이사 체크리스트", description: "퇴거와 보증금 반환", keywords: ["퇴거", "bond"] },
  { href: "/resources/australia-rental-moving-out-bond-refund-guide", type: "자료", title: "렌트 퇴거와 Bond 반환", description: "보증금을 돌려받지 못했을 때", keywords: ["렌트 보증금", "퇴거 분쟁"] },
  { href: "/resources/used-car-inspection-report-next-steps", type: "자료", title: "중고차 검사 보고서 다음 단계", description: "판매자 수리 약속과 독립 재확인", keywords: ["중고차", "수리 약속"] },
  { href: "/used-car-comparison", type: "도구", title: "호주 중고차 구매처·체크리스트", description: "후보와 비용 비교", keywords: ["중고차", "검사 보고서", "차량 비교"] },
  { href: "/car-purchase-pro", type: "도구", title: "Car Purchase Pack Pro — 중고차 거래노트 준비 중", description: "가격 미정·결제 미오픈", keywords: ["중고차", "수리 약속"], stateLabel: "준비 상태 · 가격 미정 · 결제 미오픈", freeHref: "/used-car-comparison", freeLabel: "무료 후보·비용 비교표 먼저 사용" },
  { href: "/resources/used-car-ppsr-purchase-day-checklist", type: "자료", title: "중고차 PPSR 구매 당일", description: "차량 비교", keywords: ["중고차", "PPSR"] },
  { href: "/leaving-australia-guide", type: "도구", title: "귀국 준비·Super DASP", description: "호주 출국 전 무료 체크", keywords: ["출국", "한국귀국"] },
  { href: "/leaving-australia-pro", type: "도구", title: "Leaving Australia Pack Pro", description: "출국 업무 후속 확인", keywords: ["귀국패키지", "출국정산"] },
  { href: "/visa-preparation-guide", type: "도구", title: "비자·신체검사 준비", description: "HAP ID와 지정 병원 예약", keywords: ["비자신청", "건강검진"] },
  { href: "/resume-builder", type: "도구", title: "무료 영문 이력서 빌더", description: "PDF", keywords: ["이력서", "resume", "CV"] },
  { href: "/resources/australia-resume-template-submission-checklist", type: "자료", title: "호주 이력서 양식", description: "체크리스트", keywords: ["이력서", "resume template"] },
  { href: "/resume-job-ad-checker", type: "도구", title: "이력서·Job Ad 공고 맞춤 점검기", description: "근거 확인", keywords: ["이력서", "ATS", "job ad"] },
  { href: "/resources/english-resume-achievement-examples", type: "자료", title: "호주 이력서 성과 문장", description: "STAR", keywords: ["이력서", "STAR 예시"] },
  { href: "/resume-pro", type: "도구", title: "Resume Pro — 공고별 이력서·커버레터", description: "지원서 저장", keywords: ["resume", "지원 상태"] },
];

const cases = [
  ["급여가 적게 들어왔어요", "pay-underpayment", ["/underpayment-guide", "/pay-evidence-pro", "/payslip-guide"]],
  ["렌트 보증금을 못 받았어요", "bond-exit", ["/resources/australia-rental-moving-out-bond-refund-guide", "/moving-checklist", "/property-inspection-checklist"]],
  ["중고차 검사 후 수리 약속", "used-car-follow-up", ["/resources/used-car-inspection-report-next-steps", "/used-car-comparison", "/car-purchase-pro", "/resources/used-car-ppsr-purchase-day-checklist"]],
  ["호주 떠나기 전에 뭐 해야 해요", "leaving-australia", ["/leaving-australia-guide", "/leaving-australia-pro"]],
  ["비자 신체검사 예약이 늦어요", "visa-medical", ["/visa-preparation-guide"]],
];

for (const [query, scenario, order] of cases) {
  assert.equal(getSiteSearchScenario(query), scenario, `${query} scenario`);
  assert.deepEqual(rankSiteSearchItems(items, query).slice(0, order.length).map(({ href }) => href), order, `${query} result order`);
}

assert.equal(rankSiteSearchItems(items, "렌트 보증금을 못 받았어요")[0]?.href, "/resources/australia-rental-moving-out-bond-refund-guide");
assert.notEqual(rankSiteSearchItems(items, "렌트 보증금을 못 받았어요")[0]?.href, "/rental-application-pro");
assert.equal(rankSiteSearchItems(items, "  VISA · 신체검사 / 예약  ")[0]?.href, "/visa-preparation-guide", "spacing, punctuation and case should be tolerated");
for (const weakQuery of ["가", "해요", "호주 뭐 해야 해요"]) {
  assert.equal(rankSiteSearchItems(items, weakQuery).length, 0, `${weakQuery} must not expose nearly the whole index`);
}
assert.equal(getSiteSearchIntent("Resume Pro"), "resume-pro-direct");
assert.equal(rankSiteSearchItems(items, "Resume Pro")[0]?.href, "/resume-pro");
assert.deepEqual(rankSiteSearchItems(items, "이력서").slice(0, 5).map(({ href }) => href), [
  "/resume-builder",
  "/resources/australia-resume-template-submission-checklist",
  "/resume-job-ad-checker",
  "/resources/english-resume-achievement-examples",
  "/resume-pro",
]);

const searchPage = readFileSync(resolve("src/app/search/page.tsx"), "utf8");
const searchComponent = readFileSync(resolve("src/components/search/SiteSearch.tsx"), "utf8");
const homeSearch = readFileSync(resolve("src/components/sections/HomeSearch.tsx"), "utf8");
for (const value of ["/car-purchase-pro", "가격 미정·결제 미오픈", "무료 후보·비용 비교표 먼저 사용", "/used-car-comparison"]) {
  assert.ok(searchPage.includes(value), `search index is missing ${value}`);
}
for (const value of ["급여", "Bond", "중고차", "비자 신체검사", "전체 목록 보기", "data-search-product-state", "data-search-free-path", "지금 상황에 맞는 추천 순서"]) {
  assert.ok(searchComponent.includes(value), `search UI is missing ${value}`);
}
assert.match(homeSearch, /catch \{\s*setTransferError\(true\);\s*return;/, "blocked storage must stop navigation and analytics");
assert.match(homeSearch, /입력한 내용은 그대로 두었습니다/);
assert.match(homeSearch, /href="\/search"/);
assert.doesNotMatch(homeSearch, /\/search\?q=|URLSearchParams|location\.|clipboard|console\.|sendBeacon|fetch\(/, "home fallback must not copy or transmit the raw query");
assert.match(searchComponent, /catch \{\s*\/\/ The search page remains usable/);
assert.match(searchComponent, /onChange=\{\(event\) => setQuery\(event\.target\.value\)\}/);

for (const href of ["/underpayment-guide", "/pay-evidence-pro", "/moving-checklist", "/property-inspection-checklist", "/used-car-comparison", "/car-purchase-pro", "/leaving-australia-guide", "/leaving-australia-pro", "/visa-preparation-guide"]) {
  assert.ok(existsSync(resolve(`src/app${href}/page.tsx`)), `missing real route ${href}`);
}

console.log("WEB47 natural-language search, safe transfer fallback, and Car pre-sale contract passed.");
