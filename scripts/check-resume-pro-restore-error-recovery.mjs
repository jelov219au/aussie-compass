import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [restorePage, restoreForm] = await Promise.all([
  readFile(new URL("../src/app/resume-pro/restore/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeProRestoreForm.tsx", import.meta.url), "utf8"),
]);

assert.ok(restorePage.includes("getActiveResumeProEntitlement()"), "the restore page must recognise an already connected device");
assert.match(restorePage, /hasActiveEntitlement \? \([\s\S]*복구 코드를 다시 입력할 필요가 없습니다\.[\s\S]*href="\/resume-pro\/workspace#resume-pro-workspace"[\s\S]*\) : \([\s\S]*<ResumeProRestoreForm initialStatus=\{status\}/, "active access must bypass restore input for the fixed protected workspace destination");
assert.ok(restorePage.includes("새 결제나 복구를 진행하지 말고"), "active access must explicitly prevent duplicate purchase and restore actions");
assert.ok(restorePage.includes("작업공간에서도 이용권을 다시 확인합니다."), "the direct continuation must preserve the protected workspace boundary");
assert.doesNotMatch(restorePage, /href=\{[^}]*resume-pro\/workspace|redirect\([^)]*resume-pro\/workspace/, "restore continuation must not accept or construct an arbitrary destination");

for (const contract of [
  "useRef<HTMLTextAreaElement>(null)",
  'if (notice !== "invalid") return;',
  "codeInputRef.current?.focus()",
  "codeInputRef.current?.select()",
  'id="resume-pro-restore-notice"',
  'aria-atomic="true"',
  'aria-invalid={notice === "invalid"}',
  'aria-describedby={notice === "invalid" ? "resume-pro-restore-notice" : undefined}',
  'if (notice === "invalid") setNotice("idle")',
]) assert.ok(restoreForm.includes(contract), `the invalid restore-code recovery is missing: ${contract}`);

assert.match(restoreForm, /ref=\{codeInputRef\}[\s\S]*id="restore-code"[\s\S]*aria-invalid=\{notice === "invalid"\}/, "the focused field must be the field exposed as invalid");
assert.match(restoreForm, /role=\{notice === "invalid" \? "alert" : "status"\}[\s\S]*aria-live="polite"/, "invalid and non-invalid restore outcomes need an announced status");
assert.match(restoreForm, /min-h-12 w-full[\s\S]*sm:w-auto/, "the restore action needs a full-width mobile target and compact desktop width");

for (const notice of ["invalid", "used", "released", "refunded", "review", "unavailable"]) {
  assert.match(restoreForm, new RegExp(`${notice}: [^\\n]*다시 결제하지 마세요`), `the ${notice} outcome must block repurchase before recovery guidance`);
}

assert.doesNotMatch(restoreForm, /sessionStorage\.setItem\([^\n]*code|localStorage|\/api\/checkout|track\(|sendBeacon/, "restore error recovery must not store the code, restart checkout or add analytics");

console.log("Resume Pro invalid restore-code focus and error contract passed.");
