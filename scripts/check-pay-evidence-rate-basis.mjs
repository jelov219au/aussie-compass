import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workspace = readFileSync(new URL("../src/components/tools/PayEvidenceWorkspace.tsx", import.meta.url), "utf8");

for (const contract of [
  'rateBasisType: "unsure"',
  'rateBasisCheckedOn: ""',
  'employmentType: "Unsure"',
  'draft.evidence.basis === "ready"',
  "공유 기준 준비 완료",
  "공유 기준 확인 필요",
  "Rate basis checked on",
  "Share readiness",
  "I am not presenting the difference as verified",
]) assert.ok(workspace.includes(contract), `Pay Evidence rate-basis contract is missing: ${contract}`);

assert.match(workspace, /rateBasisReady = draft\.rateBasisType !== "unsure"[\s\S]*draft\.sourceNote\.trim\(\)[\s\S]*rateBasisCheckedOn[\s\S]*draft\.evidence\.basis === "ready"/);
assert.ok(!workspace.includes('employmentType: "Casual"'), "Pay Evidence must not default the user's employment type to Casual.");

console.log("PAY_EVIDENCE_RATE_BASIS=PASS dated_basis_required=true share_status_exported=true default_employment_unsure=true");
