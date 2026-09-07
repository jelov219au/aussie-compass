import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { assessLeavingDependencies } from "../src/lib/leavingAustraliaDependencies.ts";
import { assessLeavingOutcome, leavingTaskIds } from "../src/lib/leavingAustraliaOutcome.ts";

const review = assessLeavingDependencies({
  statuses: {
    bank: "done",
    dasp: "done",
    access: "todo",
  },
  settlements: [
    { id: "bond-1", kind: "Bond", label: "Rental bond", status: "followup" },
    { id: "pay-1", kind: "Final pay", label: "Last employer", status: "received" },
  ],
});

assert.deepEqual(review.bankDependencies, ["final-pay", "bond", "utilities", "tax"]);
assert.deepEqual(review.pendingSettlementIds, ["bond-1"]);
assert.deepEqual(review.daspPrerequisites, ["departed", "visa", "super"]);
assert.equal(review.accessContinuityReady, false);
assert.equal(review.bankMarkedDoneTooEarly, true);
assert.equal(review.daspMarkedDoneTooEarly, true);
assert.equal(review.totalFlags, 11);

const readyReview = assessLeavingDependencies({
  statuses: {
    "final-pay": "done",
    bond: "done",
    utilities: "done",
    bank: "done",
    access: "done",
    super: "done",
    departed: "done",
    visa: "done",
    dasp: "done",
    tax: "done",
  },
  settlements: [
    { id: "bond-1", kind: "Bond", label: "Rental bond", status: "received" },
  ],
});

assert.deepEqual(readyReview, {
  bankDependencies: [],
  pendingSettlementIds: [],
  daspPrerequisites: [],
  accessContinuityReady: true,
  bankMarkedDoneTooEarly: false,
  daspMarkedDoneTooEarly: false,
  totalFlags: 0,
});

const blankNote = { nextAction: "", contact: "", followUpOn: "", completionNote: "" };
const allApplicable = Object.fromEntries(leavingTaskIds.map(id => [id, "applicable"]));
const allNotApplicable = Object.fromEntries(leavingTaskIds.map(id => [id, "not_applicable"]));
const emptyDraft = { departureDate: "", destination: "", statuses: {}, settlements: [], questions: [] };
assert.equal(assessLeavingOutcome(emptyDraft, true).firstOutcomeReady, false, "review alone cannot unlock an empty summary");
assert.equal(assessLeavingOutcome(emptyDraft, true).missingApplicabilityIds.length, leavingTaskIds.length);

const submittedOnlyDasp = {
  ...emptyDraft,
  departureDate: "2026-09-01",
  applicability: { ...allNotApplicable, dasp: "applicable" },
  statuses: { dasp: "done" },
  taskNotes: { dasp: { ...blankNote, nextAction: "Check DASP result", followUpOn: "2026-09-15", completionNote: "Application receipt kept" } },
  settlements: [{ id: "dasp-1", kind: "DASP", label: "ATO DASP", dueDate: "", amount: "", status: "followup", note: "" }],
};
const submittedDaspOutcome = assessLeavingOutcome(submittedOnlyDasp, true);
assert(!submittedDaspOutcome.completedTaskIds.includes("dasp"), "submitted DASP is not completed before receipt");
assert(submittedDaspOutcome.moneyTasksWithoutReceivedSettlement.includes("dasp"));
assert.notEqual(submittedDaspOutcome.progress, 100);

const moneyWithoutSettlement = {
  ...emptyDraft,
  departureDate: "2026-09-01",
  applicability: { ...allNotApplicable, bond: "applicable" },
  statuses: { bond: "done" },
  taskNotes: { bond: { ...blankNote, nextAction: "Ask agent", followUpOn: "2026-09-10", completionNote: "Bond email received" } },
};
const missingMoneyOutcome = assessLeavingOutcome(moneyWithoutSettlement, true);
assert(missingMoneyOutcome.moneyTasksWithoutSettlement.includes("bond"));
assert(!missingMoneyOutcome.completedTaskIds.includes("bond"));
assert.equal(missingMoneyOutcome.firstOutcomeReady, false);

const validFirstOutcome = {
  ...moneyWithoutSettlement,
  statuses: { bond: "waiting" },
  settlements: [{ id: "bond-1", kind: "Bond", label: "Rental bond", dueDate: "", amount: "", status: "expected", note: "" }],
};
assert.equal(assessLeavingOutcome(validFirstOutcome, true).firstOutcomeReady, true);
assert.equal(assessLeavingOutcome(validFirstOutcome, false).firstOutcomeReady, false);

const fullyClosed = {
  ...emptyDraft,
  departureDate: "2026-09-01",
  applicability: allApplicable,
  statuses: Object.fromEntries(leavingTaskIds.map(id => [id, "done"])),
  taskNotes: Object.fromEntries(leavingTaskIds.map(id => [id, { ...blankNote, nextAction: "Done", followUpOn: "2026-09-10", completionNote: "Evidence checked" }])),
  settlements: Object.entries({ "final-pay": "Final pay", bond: "Bond", utilities: "Utility credit", dasp: "DASP", tax: "Tax refund" }).map(([id, kind]) => ({ id, kind, label: id, dueDate: "", amount: "", status: "received", note: "" })),
};
assert.equal(assessLeavingOutcome(fullyClosed, true).progress, 100);
assert.equal(assessLeavingOutcome(fullyClosed, false).progress, 99, "current review is required for 100%");
assert.equal(assessLeavingOutcome({ ...validFirstOutcome, applicability: undefined }, true).missingApplicabilityIds.length, leavingTaskIds.length, "legacy restores remain review-needed without data loss");

const component = await readFile(new URL("../src/components/tools/LeavingAustraliaProWorkspace.tsx", import.meta.url), "utf8");
const summary = await readFile(new URL("../src/lib/leavingAustraliaSummary.ts", import.meta.url), "utf8");
const productPage = await readFile(new URL("../src/app/leaving-australia-pro/page.tsx", import.meta.url), "utf8");

for (const contract of [
  "assessLeavingDependencies(draft)",
  "assessLeavingOutcome(draft, dependencyReviewed)",
  "reviewedDraftSignature === draftSignature",
  "if (!outcome.firstOutcomeReady)",
  "요청·신청함 / 결과 대기",
  "결과·근거 대조 완료",
  "실제 수령·최종 청구 대조 완료",
  "너무 일찍 닫지 않기",
  "호주 계좌 해지 전",
  "DASP 순서 기록",
  "해외 접근 수단",
  "CLOSURE ORDER REVIEW",
  "not a bank-closure, visa, tax, Super or DASP eligibility decision",
]) {
  assert.ok((component + summary).includes(contract), `Leaving Australia workspace must preserve: ${contract}`);
}

assert.ok(productPage.includes("퇴사·퇴거·계정 정리 순서"), "the product promise must keep ordered departure in scope");
assert.ok(productPage.includes("정산 기록"), "the product promise must keep settlement tracking in scope");
const currentAtoUrl = "https://www.ato.gov.au/individuals-and-families/your-tax-return/how-to-lodge-your-tax-return/lodge-your-tax-return-from-outside-australia";
const retiredAtoUrl = "https://www.ato.gov.au/individuals-and-families/coming-to-australia-or-going-overseas/returning-to-your-home-country";
assert.ok(productPage.includes(currentAtoUrl), "the current ATO outside-Australia lodgement link must be present");
assert.ok(!productPage.includes(retiredAtoUrl), "the retired ATO link must be removed");

console.log("Leaving Australia dependency review checks passed.");
