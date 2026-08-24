import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const restoreForm = await readFile(new URL("../src/components/tools/ResumeProRestoreForm.tsx", import.meta.url), "utf8");

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
