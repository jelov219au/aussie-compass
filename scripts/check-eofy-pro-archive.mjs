import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { createEofyArchive, parseEofyArchive } from "../src/lib/eofyProArchive.ts";

const component = await readFile(new URL("../src/components/tools/EofyProWorkspace.tsx", import.meta.url), "utf8");
const archiveSource = await readFile(new URL("../src/lib/eofyProArchive.ts", import.meta.url), "utf8");
const productPage = await readFile(new URL("../src/app/eofy-pro/page.tsx", import.meta.url), "utf8");
const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");

const draft = {
  taxYear: "2025–26",
  incomeStatuses: { employment: "ready", interest: "review" },
  expenses: [{
    id: "expense-1",
    category: "재택근무",
    description: "업무용 인터넷 사용 기록",
    date: "2026-05-31",
    amount: "120.50",
    workUse: "40",
    evidence: "calculation",
    reimbursed: false,
    note: "월별 업무 사용 기록과 대조",
  }],
  questions: ["고정 요율과 실제 비용 방식 중 어떤 기록을 확인해야 하나요?"],
};

const archive = createEofyArchive(draft, "2026-08-30T05:00:00.000Z");
assert.equal(archive.format, "hoju-compass-eofy-pro-archive");
assert.equal(archive.version, 1);
assert.deepEqual(archive.privacy, { receiptFilesIncluded: false, credentialsIncluded: false });
assert.deepEqual(parseEofyArchive(archive)?.draft, draft);

const serialized = JSON.stringify(archive);
for (const prohibited of ["receiptFile", "receiptImage", "bankAccount", "myGovPassword", "tfn"]) {
  assert.equal(serialized.includes(`"${prohibited}":`), false, `Archive must not contain ${prohibited}`);
}

const mutate = (change) => {
  const candidate = structuredClone(archive);
  change(candidate);
  return candidate;
};

for (const invalid of [
  mutate((value) => { value.version = 2; }),
  mutate((value) => { value.privacy.receiptFilesIncluded = true; }),
  mutate((value) => { value.draft.taxYear = "2025-26"; }),
  mutate((value) => { value.draft.incomeStatuses.unknown = "ready"; }),
  mutate((value) => { value.draft.incomeStatuses.employment = "done"; }),
  mutate((value) => { value.draft.expenses[0].date = "31/05/2026"; }),
  mutate((value) => { value.draft.expenses[0].amount = "10000000"; }),
  mutate((value) => { value.draft.expenses[0].workUse = "101"; }),
  mutate((value) => { value.draft.expenses.push(structuredClone(value.draft.expenses[0])); }),
]) assert.equal(parseEofyArchive(invalid), null, "Unsafe or malformed EOFY archive must fail closed");

for (const contract of [
  "createEofyArchive(draft)",
  "parseEofyArchive(JSON.parse(await file.text()))",
  "file.size > 512 * 1024",
  "setPendingArchive(archive)",
  "아직 현재 작업은 바뀌지 않았습니다",
  "검토한 백업으로 교체",
]) assert.ok(component.includes(contract), `EOFY archive UI contract is missing: ${contract}`);

for (const privacyContract of ["receiptFilesIncluded: false", "credentialsIncluded: false"]) {
  assert.ok(archiveSource.includes(privacyContract), `EOFY archive privacy contract is missing: ${privacyContract}`);
}

assert.ok(productPage.includes("회계연도별 백업 패키지"), "EOFY product page must promise the year archive outcome");
assert.ok(packageSource.includes('"test:eofy-pro-archive"'), "EOFY archive contract must be runnable from package scripts");

console.log("EOFY Pack Pro versioned year archive and two-step restore checks passed.");
