import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, component, data] = await Promise.all([
  readFile(new URL("../src/app/help-directory/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/HelpDirectory.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/data/helpDirectory.ts", import.meta.url), "utf8"),
]);
const implementation = `${page}\n${component}\n${data}`;

for (const id of [
  "immediate_danger", "medical_non_emergency", "mental_health_crisis",
  "family_sexual_violence", "housing_homelessness", "food_essentials",
  "migration", "general_legal", "work_pay", "interpreter",
  "poison_exposure", "debt_scam",
]) assert.ok(data.includes(`id: "${id}"`), `fixed situation is missing: ${id}`);

for (const contact of [
  ["000", "infrastructure.gov.au/media-communications/phone/triple-zero/how-call-triple-zero-000"],
  ["13 11 14", "lifeline.org.au/about-us/our-services"],
  ["1800 022 222", "healthdirect.gov.au/how-healthdirect-can-help-you"],
  ["13 11 26", "healthdirect.gov.au/pesticides"],
  ["1800 737 732", "1800respect.org.au/calling-1800respect"],
  ["131 450", "tisnational.gov.au"],
  ["13 13 94", "fairwork.gov.au"],
  ["1800 007 007", "ndh.org.au"],
  ["Emergency Relief", "dss.gov.au/emergency-support/emergency-relief"],
  ["homelessness", "servicesaustralia.gov.au/homelessness"],
  ["Home Affairs", "immi.homeaffairs.gov.au"],
  ["Legal Aid", "ag.gov.au/legal-system/legal-assistance-services"],
  ["Scamwatch", "scamwatch.gov.au/report-a-scam"],
]) {
  assert.ok(implementation.includes(contact[0]) && implementation.toLowerCase().includes(contact[1].toLowerCase()), `verified contact is missing: ${contact[0]}`);
}

for (const field of ["이용할 때", "이 서비스가 아닌 경우", "시간 · 지역", "이용 조건", "연결되지 않을 때", "통역", "청각·언어 접근", "공식 출처 확인"]) {
  assert.ok(component.includes(field), `matched_help_next_action field is missing: ${field}`);
}

for (const phrase of ["약 5초", "최대 60초", "TIS를 먼저 거치지", "TTY", "106", "모든 이동통신망", "검색 결과가 없어요", "검색 지우기", "이름·주소·전화번호·위기 상세"]) {
  assert.ok(implementation.includes(phrase), `safety or privacy guidance is missing: ${phrase}`);
}

assert.match(component, /useState<HelpSituationId \| null>/, "selection must stay in volatile React state");
assert.doesNotMatch(implementation, /localStorage|sessionStorage|URLSearchParams|navigator\.geolocation|\btrack\s*\(/, "sensitive selection or search must not be persisted, located, or sent to analytics");
assert.doesNotMatch(implementation, /createCheckout|stripe\.checkout|PAYMENTS_ENABLED|paymentReadiness/i, "help directory changes must remain outside payment flows");

console.log("HELP_DIRECTORY_DEPTH=PASS situations=12 matched-help=true local-search=true sensitive-analytics=0");
