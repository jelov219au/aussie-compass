import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  emptyInspection,
  inspectionDecisionReadiness,
  parseInspection,
  visibleInspectionGroups,
} from "../src/lib/propertyInspection.ts";

const legacy = parseInspection(JSON.stringify({
  mode: "share",
  propertyName: "역 근처 후보 A",
  statuses: { mould: "concern", windows: "ok" },
  notes: "이전 방문 메모",
}));
assert.ok(legacy, "the valid v1 inspection must restore");
assert.equal(legacy.statuses.mould, "pending", "legacy concern must become a visible pending review");
assert.deepEqual(legacy.reviewNeeded, ["mould"], "legacy concern must stay identified for review without data loss");
assert.equal(legacy.notes, "이전 방문 메모", "legacy notes must survive migration");

assert.equal(inspectionDecisionReadiness(emptyInspection).ready, false, "0 reviewed items cannot produce a first outcome");

const applyItems = visibleInspectionGroups("rent").flatMap(group => group.items);
const apply = {
  ...emptyInspection,
  mode: "rent",
  propertyName: "후보 A",
  statuses: Object.fromEntries(applyItems.map((item, index) => [item.id, index % 5 === 0 ? "not_applicable" : "ok"])),
  jurisdiction: "NSW",
  relationship: "tenant",
  officialChecked: true,
  decision: "apply",
  nextAction: "prepare_application",
};
assert.equal(inspectionDecisionReadiness(apply).ready, true, "a fully checked official-path application decision should complete");
assert.equal(inspectionDecisionReadiness({ ...apply, statuses: { ...apply.statuses, mould: "red_flag" } }).ready, false, "apply must stop on a red flag");
const oneUnanswered = { ...apply.statuses };
delete oneUnanswered.mould;
assert.equal(inspectionDecisionReadiness({ ...apply, statuses: oneUnanswered }).ready, false, "apply must stop on an unanswered item");
assert.equal(inspectionDecisionReadiness({ ...apply, officialChecked: false }).ready, false, "apply must require the selected official route");
assert.equal(inspectionDecisionReadiness({ ...apply, relationship: "unsure" }).ready, false, "an unsure agreement type cannot close as apply");

const reject = {
  ...emptyInspection,
  propertyName: "후보 B",
  statuses: { mould: "red_flag" },
  jurisdiction: "VIC",
  relationship: "sub_tenant",
  decision: "reject",
  nextAction: "stop_contact",
  rejectReason: "unresolved_condition",
};
assert.equal(inspectionDecisionReadiness(reject).ready, true, "reject needs a fixed privacy-safe reason and next action");
assert.equal(inspectionDecisionReadiness({ ...reject, rejectReason: "" }).ready, false, "reject cannot omit its the reason category");

const followUp = {
  ...emptyInspection,
  propertyName: "후보 C",
  statuses: { bills: "pending" },
  jurisdiction: "QLD",
  relationship: "unsure",
  decision: "follow_up",
  nextAction: "verify_authority",
  followUpQuestion: "계약 형태와 공과금 계산 근거를 서면으로 보내주실 수 있나요?",
  followUpRole: "property manager",
  followUpDate: "2026-09-10",
};
assert.equal(inspectionDecisionReadiness(followUp).ready, true, "follow-up must close with a question, role, date, and next action");
assert.equal(inspectionDecisionReadiness({ ...followUp, followUpDate: "" }).ready, false, "follow-up cannot omit the review date");

const [tool, picker, page] = await Promise.all([
  readFile(new URL("../src/components/tools/PropertyInspectionChecklist.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RentalJurisdictionPicker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/property-inspection-checklist/page.tsx", import.meta.url), "utf8"),
]);

for (const status of ["ok", "pending", "red_flag", "not_applicable"]) {
  assert.ok(tool.includes(`value: "${status}"`), `missing inspection status: ${status}`);
}
assert.ok(tool.includes('disabled={!readiness.ready || storage === "loading"}'), "summary copy must stay blocked until the free outcome is complete");
assert.ok(tool.includes('canContinueToRentalPack = readiness.ready && data.decision === "apply"'), "Pro must stay behind a completed apply decision");
assert.equal((tool.match(/Rental Pack Pro 보기/g) ?? []).length, 1, "the tool must present the Pro action once");
assert.equal((page.match(/rental-application-pro/g) ?? []).length, 0, "the page must not expose a second early Pro action");
for (const boundary of ["정확한 주소", "agent·집주인 이름", "사진·문서·메시지 원문", "파일명", "cloud URL", "서버나 analytics로 보내지 않고"]) {
  assert.ok(tool.includes(boundary), `missing local-only evidence boundary: ${boundary}`);
}
for (const conditionalCopy of ["Bond 제도가 이 계약 유형에 적용되는 경우", "Condition report가 적용되는 경우"]) {
  assert.ok(picker.includes(conditionalCopy), `missing agreement-aware official copy: ${conditionalCopy}`);
}
for (const jurisdiction of ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]) {
  assert.ok(picker.includes(`id: "${jurisdiction}"`), `missing official jurisdiction: ${jurisdiction}`);
}
assert.match(tool, /min-h-11|min-h-12/, "interactive controls need at least 44px targets");
assert.doesNotMatch(tool, /trackEvent|sendBeacon|fetch\(/, "the local inspection must not send item, evidence, or decision detail");

console.log("Property inspection one-home decision contract passed.");
