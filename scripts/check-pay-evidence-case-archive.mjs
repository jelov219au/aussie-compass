import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createPayEvidenceCaseArchive,
  MAX_PAY_EVIDENCE_ARCHIVE_BYTES,
  parsePayEvidenceCaseArchive,
  PAY_EVIDENCE_ARCHIVE_FORMAT,
  PAY_EVIDENCE_ARCHIVE_VERSION,
} from "../src/lib/payEvidenceCaseArchive.ts";

const draft = {
  employerLabel: "Cafe A",
  employmentType: "Casual",
  rateBasisType: "award",
  rateBasisCheckedOn: "2026-08-30",
  sourceNote: "Restaurant Award, classification to confirm",
  periods: [{
    id: "period-1",
    label: "1–14 August",
    hours: "",
    expectedGross: "",
    payslipGross: "1020.50",
    payslipNet: "842.10",
    bankNet: "842.10",
    note: "Check Saturday rate",
    shifts: [{ id: "shift-1", date: "2026-08-08", start: "09:00", end: "17:30", breakMinutes: "30", rateLabel: "Saturday", hourlyRate: "32.25", allowance: "0", note: "Roster saved separately" }],
  }],
  evidence: { hours: "ready", roster: "review", basis: "ready" },
  requestType: "followup",
  requestDraft: "Please confirm the recorded hours.",
};

const archive = createPayEvidenceCaseArchive({ ...draft, tfn: "must-not-export" }, new Date("2026-08-30T03:00:00.000Z"));
assert.equal(archive.format, PAY_EVIDENCE_ARCHIVE_FORMAT);
assert.equal(archive.version, PAY_EVIDENCE_ARCHIVE_VERSION);
assert.equal(archive.exportedAt, "2026-08-30T03:00:00.000Z");
assert.ok(!("tfn" in archive.case), "the archive writer must copy only approved case fields");

const roundTrip = parsePayEvidenceCaseArchive(JSON.stringify(archive));
assert.equal(roundTrip.ok, true);
assert.deepEqual(roundTrip.archive.case, draft);

for (const invalid of [
  { ...archive, format: "unknown-format" },
  { ...archive, version: 2 },
  { ...archive, case: { ...archive.case, bankAccountNumber: "123" } },
  { ...archive, case: { ...archive.case, evidence: { ...archive.case.evidence, unknown: "ready" } } },
  { ...archive, case: { ...archive.case, periods: [{ ...archive.case.periods[0], shifts: [archive.case.periods[0].shifts[0], archive.case.periods[0].shifts[0]] }] } },
]) assert.equal(parsePayEvidenceCaseArchive(JSON.stringify(invalid)).ok, false, "invalid or unknown archive data must fail closed");

const oversized = JSON.stringify({ ...archive, padding: "x".repeat(MAX_PAY_EVIDENCE_ARCHIVE_BYTES) });
assert.equal(parsePayEvidenceCaseArchive(oversized).ok, false, "oversized archives must fail before restore");

const workspace = readFileSync(new URL("../src/components/tools/PayEvidenceWorkspace.tsx", import.meta.url), "utf8");
for (const contract of [
  "application/json,.json",
  "-pay-evidence-case.json",
  "setPendingArchive(result.archive)",
  "현재 기록을 이 백업으로 교체",
  "파일을 선택해도 즉시 복원하지 않습니다",
  "현재 기록은 변경하지 않았습니다",
]) assert.ok(workspace.includes(contract), `Pay Evidence archive UI contract is missing: ${contract}`);
assert.match(workspace, /const restoreCaseArchive = \(\) => \{[\s\S]*setDraft\(normaliseDraft\(pendingArchive\.case\)\)/);

console.log("PAY_EVIDENCE_CASE_ARCHIVE=PASS version=1 review_before_replace=true strict_validation=true originals_excluded=true");
