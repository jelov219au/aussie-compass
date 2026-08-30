import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, jurisdictionPicker] = await Promise.all([
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalJurisdictionPicker.tsx", import.meta.url), "utf8"),
]);

for (const phase of ["방문 전", "현장에서", "송금 전에", "입주 첫날"]) {
  assert.ok(page.includes(phase), `the rental decision sequence is missing: ${phase}`);
}
for (const boundary of ["하나라도 해당하면 송금하지 마세요", "그대로 보내는 핵심 질문", "Condition report", "Bond"]) {
  assert.ok(page.includes(boundary), `the inspection safety layer is missing: ${boundary}`);
}
assert.ok(page.includes("<RentalJurisdictionPicker />"), "the page must expose a selected-jurisdiction official path");
assert.ok(page.includes("getRentalApplicationPaymentReadiness().ready"), "the Rental CTA must use the existing server readiness contract");
assert.ok(page.includes("Rental Pack Pro 보기 · A$14.90") && page.includes("기능 차이와 준비 방식 보기"), "the Rental CTA must have live and safe fallback labels");
assert.ok(!page.includes("/api/checkout/rental-application-pro"), "the free inspection page must not start Checkout directly");

for (const region of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(jurisdictionPicker.includes(`id: "${region}"`), `the official picker is missing ${region}`);
}
for (const officialHost of ["nsw.gov.au", "consumer.vic.gov.au", "rta.qld.gov.au", "consumerprotection.wa.gov.au", "sa.gov.au", "cbos.tas.gov.au", "act.gov.au", "consumeraffairs.nt.gov.au"]) {
  assert.ok(jurisdictionPicker.includes(officialHost), `the official picker is missing ${officialHost}`);
}
assert.ok(jurisdictionPicker.includes('id="rental-jurisdiction"') && jurisdictionPicker.includes('aria-live="polite"'), "the jurisdiction interaction needs an accessible label and live result");
assert.ok(jurisdictionPicker.includes("min-h-12"), "the jurisdiction action needs a 48px mobile target");

console.log("Property inspection depth and jurisdiction contract passed.");
