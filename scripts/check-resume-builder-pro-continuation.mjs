import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { summarizeResumeBuilderDraft } from "../src/lib/resumeBuilderDraftSummary.ts";

const [component, page, deviceStorage, packageSource] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeBuilderDraftContinuation.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeProDeviceStorage.ts", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);

const privateFixture = {
  name: "PRIVATE_NAME_MARKER",
  title: "Barista",
  phone: "PRIVATE_PHONE_MARKER",
  email: "PRIVATE_EMAIL_MARKER",
  summary: "PRIVATE_SUMMARY_MARKER",
  skills: "Customer service, POS\nTeamwork",
  experiences: [
    { role: "Barista", company: "PRIVATE_COMPANY_MARKER", details: "PRIVATE_ACHIEVEMENT_MARKER" },
    { role: "", company: "Cafe", details: "Stock control" },
    { role: "", company: "", details: "" },
  ],
};
const summary = summarizeResumeBuilderDraft(JSON.stringify(privateFixture));
assert.deepEqual(summary, { essentialCount: 7, experienceCount: 2, skillCount: 3 });
const summaryOutput = JSON.stringify(summary);
for (const marker of ["PRIVATE_NAME_MARKER", "PRIVATE_PHONE_MARKER", "PRIVATE_EMAIL_MARKER", "PRIVATE_SUMMARY_MARKER", "PRIVATE_COMPANY_MARKER", "PRIVATE_ACHIEVEMENT_MARKER"]) {
  assert.ok(!summaryOutput.includes(marker), `the local summary leaked ${marker}`);
}

for (const invalid of [null, "", "not-json", "[]", "{}", '{"experiences":[],"skills":""}']) {
  assert.equal(summarizeResumeBuilderDraft(invalid), null, "empty or invalid drafts must stay hidden");
}

const oversized = {
  name: "Saved",
  skills: Array.from({ length: 80 }, (_, index) => `skill-${index}`).join(","),
  experiences: Array.from({ length: 45 }, (_, index) => ({ role: `role-${index}` })),
};
assert.deepEqual(
  summarizeResumeBuilderDraft(JSON.stringify(oversized)),
  { essentialCount: 3, experienceCount: 30, skillCount: 50 },
  "count-only summaries must remain bounded",
);

assert.ok(deviceStorage.includes('resumeStorageKey = "aussie-compass-resume-v1"'));
assert.ok(component.includes("window.localStorage.getItem(resumeStorageKey)"), "the continuation must read only the established local Builder draft");
assert.ok(page.includes("<ResumeBuilderDraftContinuation checkoutAvailable={canOfferCheckout}"), "the private continuation is not connected to the offer page");
for (const copy of [
  "이 기기에 저장된 무료 이력서를 확인했어요.",
  "이름과 경력을 다시 입력하지 않아도 됩니다.",
  "이력서 원문·이름·연락처는 서버, URL 또는 분석 이벤트로 보내지 않습니다.",
]) assert.ok(component.includes(copy), `the reassurance copy is missing: ${copy}`);

for (const forbiddenBoundary of ["@vercel/analytics", "track(", "fetch(", "sendBeacon", "XMLHttpRequest", "sessionStorage", "URLSearchParams"]) {
  assert.ok(!component.includes(forbiddenBoundary), `local draft state must not cross a boundary: ${forbiddenBoundary}`);
}
for (const privateField of [".name", ".phone", ".email", ".summary", ".company", ".details"]) {
  assert.ok(!component.includes(privateField), `the component must never render a private draft field: ${privateField}`);
}

assert.ok(packageSource.includes('"test:resume-builder-pro-continuation": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/check-resume-builder-pro-continuation.mjs"'));
console.log("Local Builder-to-Pro continuation contract passed.");
