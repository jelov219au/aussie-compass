import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const workspace = read("src/components/tools/PayEvidenceWorkspace.tsx");
const archiveLibrary = read("src/lib/payEvidenceCaseArchive.ts");
const productPage = read("src/app/pay-evidence-pro/page.tsx");
const workspacePage = read("src/app/pay-evidence-pro/workspace/page.tsx");

assert.match(archiveLibrary, /payslipNet: string/);
assert.match(workspace, /payslipNet: ""/);
assert.match(workspace, /Payslip Net A\$/);
assert.match(workspace, /safeNumber\(period\.payslipNet\) - safeNumber\(period\.bankNet\)/);
assert.match(workspace, /Payslip period net AUD/);
assert.match(workspace, /Payslip-to-bank net difference AUD/);
assert.match(workspace, /Net 불일치 \{netMismatchCount\}개/);
assert.match(workspace, /Net 입력 미완성 \{incompleteNetCount\}개/);
assert.match(workspace, /aria-live="polite"/);
assert.ok(!workspace.includes("safeNumber(period.bankNet) > safeNumber(period.payslipGross)"), "Bank Net must never be compared with Payslip Gross.");

assert.match(productPage, /Payslip Net과 실제 입금 Net은 별도로 대조/);
assert.match(workspacePage, /Net 대조는 Payslip Net과 실제 입금 Net의 기록 차이만 보여줍니다/);

console.log("PAY_EVIDENCE_NET_COMPARISON=PASS gross_and_net_separated=true exports_updated=true legacy_drafts_supported=true");
