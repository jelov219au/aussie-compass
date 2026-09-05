import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { analyseResumeJobAd } from "../src/lib/resumeJobAdMatch.ts";
import {
  clearResumeJobAdProofSummary,
  readResumeJobAdEvidenceHandoff,
  readResumeJobAdProofSummary,
  saveResumeJobAdProofSummary,
} from "../src/lib/resumeJobAdProofHandoff.ts";

const punctuation = analyseResumeJobAd(
  "Used reconciliation reporting with C++, C#, .NET and Node.js in weekly work.",
  "Reconciliation. Reporting. C++. C#. .NET. Node.js. Reconciliation. Reporting. C++. C#. .NET. Node.js.",
);
const punctuationTerms = new Map(punctuation.terms.map((item) => [item.term, item]));
for (const term of ["reconciliation", "reporting", "c++", "c#", ".net", "node.js"]) {
  assert.equal(punctuationTerms.get(term)?.matched, true, `${term} should preserve its boundary and ignore terminal punctuation`);
}
assert.ok(punctuation.terms.every(({ term }) => !term.endsWith(".")), "terminal punctuation must not create duplicate terms");

const negation = analyseResumeJobAd(
  "No forklift experience. I worked in customer service.",
  "Forklift duties and forklift checks are required for this warehouse role.",
);
assert.equal(negation.terms.find(({ term }) => term === "forklift")?.matched, true, "the matcher must remain a literal phrase check and not infer negation");

const originalWindow = globalThis.window;
const installStorage = (storage) => Object.defineProperty(globalThis, "window", {
  configurable: true,
  writable: true,
  value: { sessionStorage: storage },
});
const validProof = {
  matchedCount: 1,
  missingCount: 1,
  terms: [{ term: "customer service", matched: true }, { term: "inventory management", matched: false }],
};

try {
  const normal = new Map();
  installStorage({
    getItem: (key) => normal.get(key) ?? null,
    setItem: (key, value) => normal.set(key, value),
    removeItem: (key) => normal.delete(key),
  });
  assert.equal(saveResumeJobAdProofSummary(validProof), true, "both verified session keys should enable a handoff");
  assert.ok(readResumeJobAdProofSummary() && readResumeJobAdEvidenceHandoff(), "a verified handoff should reopen");

  let writes = 0;
  const partial = new Map();
  installStorage({
    getItem: (key) => partial.get(key) ?? null,
    setItem: (key, value) => {
      writes += 1;
      if (writes === 2) throw new Error("evidence write blocked");
      partial.set(key, value);
    },
    removeItem: (key) => partial.delete(key),
  });
  assert.equal(saveResumeJobAdProofSummary(validProof), false, "a partial two-key write must fail closed");
  assert.equal(partial.size, 0, "a partial write must remove the surviving key when cleanup is available");

  const uncleared = new Map([
    ["hoju.resumeJobAdProofSummary.v1", JSON.stringify({ matchedCount: 1, missingCount: 1, checkedAt: Date.now() })],
  ]);
  installStorage({
    getItem: (key) => uncleared.get(key) ?? null,
    setItem: (key, value) => uncleared.set(key, value),
    removeItem: () => {},
  });
  assert.equal(clearResumeJobAdProofSummary(), false, "an unverified clear must report failure so the UI can block stale handoff");
} finally {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
}

const [component, handoff, continuation] = await Promise.all([
  readFile(new URL("../src/components/tools/ResumeJobAdChecker.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/resumeJobAdProofHandoff.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/ResumeJobAdProofContinuation.tsx", import.meta.url), "utf8"),
]);

assert.doesNotMatch(component, /event\.target\.value\.slice|event\.currentTarget\.value\.slice|maxLength=/, "inputs must retain the entire pasted value in memory");
assert.match(component, /resumeText\.length > MAX_LENGTH/);
assert.match(component, /jobAdText\.length > MAX_LENGTH/);
assert.match(component, /80자 이상 입력/);
assert.match(component, /자 초과/);
assert.match(component, /resumeInputRef\.current/);
assert.match(component, /jobAdInputRef\.current/);
assert.match(component, /window\.confirm\("현재 입력과 결과를 가상 예시로 바꿀까요/);
assert.match(component, /window\.confirm\("현재 입력과 결과를 모두 지울까요/);
assert.match(component, /const saved = cleared && saveResumeJobAdProofSummary\(next\)/, "only a cleared, verified real result may become an active handoff");
assert.match(component, /resultKind === "real" && handoffStatus === "ready"/);
assert.match(component, /가상 예시는 Pro에 이어지지 않아요/);
assert.match(component, /Counted stock weekly, updated the Excel inventory list and reported discrepancies to the supervisor\./);
assert.match(component, /Managed inventory budgets/);
assert.match(component, /매출 개선 20%/);
assert.match(component, /setMemoFallback\(memo\)/, "download and clipboard errors must expose the full memo");
assert.match(component, /value=\{memoFallback\}[\s\S]*readOnly/);
assert.match(component, /setShareFallback\(url\)/);
assert.match(component, /value=\{shareFallback\}[\s\S]*readOnly/);
assert.match(component, /TXT 내려받기를 요청했습니다/);
assert.doesNotMatch(component, /TXT로 저장했습니다/, "a click request must not claim the browser saved a file");
assert.doesNotMatch(component.slice(component.indexOf("function buildEvidenceMemo"), component.indexOf("function downloadEvidenceMemo")), /resumeText|jobAdText/, "the fallback memo must still exclude raw inputs");
assert.match(handoff, /return readResumeJobAdEvidenceHandoff\(\) !== null/);
assert.match(continuation, /setInterval\(refresh, 30_000\)/);
assert.match(continuation, /addEventListener\("focus", refresh\)/);
assert.match(continuation, /addEventListener\("visibilitychange", refresh\)/);

console.log("WEB42 resume Job Ad input, evidence and handoff contract passed.");
