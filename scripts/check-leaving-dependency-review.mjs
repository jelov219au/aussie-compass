import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { assessLeavingDependencies } from "../src/lib/leavingAustraliaDependencies.ts";

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

const component = await readFile(new URL("../src/components/tools/LeavingAustraliaProWorkspace.tsx", import.meta.url), "utf8");
const productPage = await readFile(new URL("../src/app/leaving-australia-pro/page.tsx", import.meta.url), "utf8");

for (const contract of [
  "assessLeavingDependencies(draft)",
  "reviewedDraftSignature === draftSignature",
  "if (!dependencyReviewed)",
  "너무 일찍 닫지 않기",
  "호주 계좌 해지 전",
  "DASP 순서 기록",
  "해외 접근 수단",
  "CLOSURE ORDER REVIEW",
  "not a bank-closure, visa, tax, Super or DASP eligibility decision",
]) {
  assert.ok(component.includes(contract), `Leaving Australia workspace must preserve: ${contract}`);
}

assert.ok(productPage.includes("Ordered departure"), "the product promise must keep ordered departure in scope");
assert.ok(productPage.includes("Settlement tracker"), "the product promise must keep settlement tracking in scope");

console.log("Leaving Australia dependency review checks passed.");
