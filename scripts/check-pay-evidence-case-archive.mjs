import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

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

const fidelityDraft = {
  ...draft,
  sourceNote: "Line one\nLine two",
  requestDraft: "First request line\nSecond request line",
  periods: [
    { id: "blank", label: "1–7 September", hours: "", expectedGross: "", payslipGross: "", payslipNet: "", bankNet: "", note: "First note line\nSecond note line", shifts: [] },
    { id: "zero", label: "8–14 September", hours: "0", expectedGross: "0", payslipGross: "0", payslipNet: "0", bankNet: "0", note: "Explicit zero period", shifts: [] },
    { id: "decimal", label: "15–21 September", hours: "7.25", expectedGross: "321.55", payslipGross: "300.25", payslipNet: "250.10", bankNet: "249.95", note: "Decimal manual period", shifts: [] },
    { id: "shift", label: "22–28 September", hours: "", expectedGross: "", payslipGross: "100.00", payslipNet: "", bankNet: "", note: "Shift period", shifts: [{ id: "shift-fidelity", date: "2026-09-22", start: "09:00", end: "16:30", breakMinutes: "0", rateLabel: "Recorded rate", hourlyRate: "20.25", allowance: "", note: "Shift note line one\nShift note line two" }] },
  ],
};
const fidelityArchive = createPayEvidenceCaseArchive(fidelityDraft, new Date("2026-09-29T00:00:00.000Z"));
const fidelityRoundTrip = parsePayEvidenceCaseArchive(JSON.stringify(fidelityArchive));
assert.equal(fidelityRoundTrip.ok, true);
assert.deepEqual(fidelityRoundTrip.archive.case, fidelityDraft, "blank, explicit zero, decimals, distinct periods and multiline notes must survive archive round trip");

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
const workspaceAst = ts.createSourceFile("PayEvidenceWorkspace.tsx", workspace, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function findNode(node, predicate) { if (predicate(node)) return node; return ts.forEachChild(node, (child) => findNode(child, predicate)); }
function variableExpression(name) {
  const declaration = findNode(workspaceAst, (node) => ts.isVariableDeclaration(node) && node.name.getText(workspaceAst) === name);
  assert.ok(declaration?.initializer, `workspace helper not found: ${name}`);
  return declaration.initializer.getText(workspaceAst);
}
function functionExpression(name) {
  const declaration = findNode(workspaceAst, (node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(declaration, `workspace helper not found: ${name}`);
  return `(${declaration.getText(workspaceAst)})`;
}
function evaluate(expression, bindings = {}) {
  const javascript = ts.transpileModule(`const value = ${expression};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  return new Function(...Object.keys(bindings), `${javascript}\nreturn value;`)(...Object.values(bindings));
}
const helperNames = ["safeNumber", "minutesFromTime", "shiftHours", "shiftExpectedGross", "periodHours", "periodExpectedGross", "difference", "hasAmount", "netDifference", "netDifferenceExport", "recordedAmount", "recordedNumber", "recordedAudAmount", "periodHoursExport", "periodExpectedGrossExport", "grossDifferenceExport"];
const helpers = {};
for (const name of helperNames) helpers[name] = evaluate(functionExpression(name), helpers);
let textSummary = "";
evaluate(variableExpression("downloadSummary"), {
  draft: fidelityDraft,
  rateBasisReady: true,
  estimatedDifference: fidelityDraft.periods.reduce((sum, period) => sum + Math.max(0, helpers.difference(period)), 0),
  evidenceItems: [],
  statusLabels: {},
  safeFileName: () => "fidelity",
  saveFile: (contents, fileName, mime) => {
    assert.equal(fileName, "fidelity-pay-evidence.txt");
    assert.equal(mime, "text/plain;charset=utf-8");
    textSummary = contents;
  },
  setMessage: () => {},
  ...helpers,
})();
for (const expected of [
  "- 1–7 September | Hours Not recorded | Expected gross Not recorded | Payslip gross Not recorded | Payslip net Not recorded | Bank net Not recorded | User-entered gross comparison Not comparable | Payslip-to-bank net difference Not comparable",
  "- 8–14 September | Hours 0.00 | Expected gross A$0.00 | Payslip gross A$0.00 | Payslip net 0.00 | Bank net 0.00 | User-entered gross comparison A$0.00 | Payslip-to-bank net difference 0.00",
  "- 15–21 September | Hours 7.25 | Expected gross A$321.55 | Payslip gross A$300.25 | Payslip net 250.10 | Bank net 249.95 | User-entered gross comparison A$21.30 | Payslip-to-bank net difference 0.15",
  "- 22–28 September | Hours 7.50 | Expected gross A$151.88 | Payslip gross A$100.00 | Payslip net Not recorded | Bank net Not recorded | User-entered gross comparison A$51.88 | Payslip-to-bank net difference Not comparable",
  "Break 0.00 min | Hours 7.50 | Recorded rate A$20.25/h | Allowance Not recorded",
  "First note line\nSecond note line",
  "Shift note line one\nShift note line two",
  "First request line\nSecond request line",
]) assert.ok(textSummary.includes(expected), `TXT fidelity output missing: ${expected}`);
for (const contract of [
  "application/json,.json",
  "-pay-evidence-case.json",
  "setPendingArchive(result.archive)",
  "현재 기록을 이 백업으로 교체",
  "파일을 선택해도 즉시 복원하지 않습니다",
  "현재 기록은 변경하지 않았습니다",
]) assert.ok(workspace.includes(contract), `Pay Evidence archive UI contract is missing: ${contract}`);
assert.match(workspace, /const restoreCaseArchive = \(\) => \{[\s\S]*setDraft\(normaliseDraft\(pendingArchive\.case\)\)/);

console.log("PAY_EVIDENCE_CASE_ARCHIVE=PASS version=1 review_before_replace=true strict_validation=true originals_excluded=true fidelity=blank_vs_zero+decimals+multi_period+multiline");
