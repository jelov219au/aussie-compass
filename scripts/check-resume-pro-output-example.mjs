import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  assert.ok(name.startsWith("@/"));
  const source = readFileSync(new URL(`../src/${name.slice(2)}.ts`, import.meta.url), "utf8");
  const exports = {};
  cache.set(name, exports);
  new Function("exports", "require", ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(exports, load);
  return exports;
}
const example = load("@/lib/resumeProExample");
const output = load("@/lib/resumeProOutput");
const tracking = load("@/lib/resumeProApplicationTracking");
const source = readFileSync(new URL("../src/components/tools/ResumeProWorkspace.tsx", import.meta.url), "utf8");
function namedCode(text, name) {
  const file = ts.createSourceFile("workspace.tsx", text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function walk(node) {
    if ((ts.isFunctionDeclaration(node) || ts.isVariableDeclaration(node)) && node.name?.getText(file) === name) found = node;
    ts.forEachChild(node, walk);
  }
  walk(file);
  assert.ok(found, name);
  return ts.transpileModule(`${ts.isVariableDeclaration(found) ? "const " : ""}${found.getText(file)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}
const resume = runInNewContext(`${namedCode(source, "normaliseSavedResume")}\nnormaliseSavedResume(input);`, { input: example.resumeProExampleResume });
const draft = example.resumeProExampleDraft;
const keywords = output.extractKeywords(draft.jobAd);
const matched = keywords.filter(word => JSON.stringify(resume).toLowerCase().includes(word));
const missing = keywords.filter(word => !JSON.stringify(resume).toLowerCase().includes(word));
assert.deepEqual(missing, example.resumeProExampleMissing);
assert.equal(output.createResumeProCoverLetter(resume, draft, missing), draft.coverLetter);
let exportedBlob;
const anchor = { click() {} };
runInNewContext(`${namedCode(source, "safeFileName")}\n${namedCode(source, "downloadApplicationKit")}\ndownloadApplicationKit();`, {
  savedResume: resume, draft, matched, missing, selectedStarStory: example.resumeProExampleStarStory,
  resumeProApplicationStatusLabels: tracking.resumeProApplicationStatusLabels,
  Blob, URL: { createObjectURL(blob) { exportedBlob = blob; return "blob:fictional-output-check"; }, revokeObjectURL() {} },
  document: { createElement() { return anchor; } }, setMessage() {},
});
const kit = await exportedBlob.text();
const path = new URL("../public/downloads/resume-pro-example-application-kit.txt", import.meta.url);
if (process.argv.includes("--write")) writeFileSync(path, kit);
assert.equal(readFileSync(path, "utf8"), kit, "the existing public sample must equal the actual workspace export");
for (const value of [resume.name, resume.summary, resume.experiences[0].details.split("\n")[1], draft.coverLetter, example.resumeProExampleStarStory.action, "FICTIONAL EXAMPLE — DO NOT SUBMIT", "does not verify your claims or guarantee an interview or job"]) assert.ok(kit.includes(value), value);
assert.doesNotMatch(kit, /@|https?:\/\//);

const offer = readFileSync(new URL("../src/app/resume-pro/page.tsx", import.meta.url), "utf8");
const preview = readFileSync(new URL("../src/components/tools/ResumeProOutputPreview.tsx", import.meta.url), "utf8");
assert.ok(offer.indexOf("<ResumeProOutputPreview") < offer.indexOf("<ResumeProCheckoutForm"), "actual files must be available before checkout");
assert.ok(offer.includes("!hasActiveEntitlement && <ResumeProOutputPreview"));
assert.doesNotMatch(offer, /function TemplatePreview/);
assert.ok(preview.includes("resumeProExampleDraft.coverLetter"));
assert.ok(preview.includes("TXT·PDF는 읽고 제출할 파일") && preview.includes("JSON 백업") && preview.includes("구매 이용권은 복구 코드로 별도로"));
for (const layout of ["editorial", "professional", "technical"]) {
  const pdf = readFileSync(new URL(`../public/downloads/resume-pro-example-${layout}.pdf`, import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), "%PDF-", `missing finished ${layout} PDF`);
}

if (process.env.RESUME_BEFORE_SOURCE) {
  const before = readFileSync(process.env.RESUME_BEFORE_SOURCE, "utf8");
  for (const tone of ["clear", "warm", "concise"]) {
    let original;
    const current = { ...draft, tone };
    runInNewContext(`${namedCode(before, "sentence")}\n${namedCode(before, "createCoverLetter")}\ncreateCoverLetter();`, { savedResume: resume, draft: current, missing, setField(field, value) { assert.equal(field, "coverLetter"); original = value; }, setMessage() {} });
    assert.equal(output.createResumeProCoverLetter(resume, current, missing), original);
  }
  console.log("PASS: original cover-letter behavior preserved in all three tones");
}
if (process.env.RESUME_FIXTURE_OUT) writeFileSync(process.env.RESUME_FIXTURE_OUT, JSON.stringify({ resume: example.resumeProExampleResume, draft, star: example.resumeProExampleStarStory, kit, matched, missing }, null, 2));
console.log("PASS: public fictional sample equals real cover-letter and application-kit output");
