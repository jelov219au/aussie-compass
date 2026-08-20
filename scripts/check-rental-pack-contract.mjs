import { readFile } from "node:fs/promises";
import process from "node:process";

const workspace = await readFile(new URL("../src/components/tools/RentalApplicationWorkspace.tsx", import.meta.url), "utf8");
const publicPage = await readFile(new URL("../src/app/rental-application-pro/page.tsx", import.meta.url), "utf8");
const printStyles = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8");

const contracts = [
  [workspace.includes('version: 2'), "versioned local workspace"],
  [workspace.includes('parsed.version === 2') && workspace.includes('coverNote'), "legacy single-application migration"],
  [workspace.includes('MAX_APPLICATIONS = 20'), "bounded multi-property tracker"],
  [workspace.includes('Reusable profile') && workspace.includes('privacyChecks'), "reusable profile and privacy checklist"],
  [workspace.includes('application:') && workspace.includes('inspection:') && workspace.includes('followUp:'), "three message templates"],
  [workspace.includes('application-pack.txt') && workspace.includes('application/json;charset=utf-8'), "per-property and whole-workspace exports"],
  [workspace.includes('restoreBackup') && workspace.includes('백업 복원') && workspace.includes('candidate.version !== 2'), "validated whole-workspace restore"],
  [workspace.includes('nextActionStatus') && workspace.includes('일 지남') && workspace.includes('다음 행동 ·'), "relative due-action warnings"],
  [workspace.includes('id="rental-application-print"') && printStyles.includes('#rental-application-print'), "print-to-PDF output"],
  [publicPage.includes('결제 미오픈') && publicPage.includes('최대 20개 집 후보'), "honest pre-sale public copy"],
];

const failed = contracts.filter(([passed]) => !passed);
if (failed.length) {
  for (const [, name] of failed) console.error(`FAIL: ${name}`);
  process.exit(1);
}

for (const [, name] of contracts) console.log(`PASS: ${name}`);
