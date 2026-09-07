import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const cache = new Map();
function load(name, parent = resolve(root, "src/lib/entry.ts")) {
  let path = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(parent), name);
  if (!extname(path)) path += ".ts";
  if (cache.has(path)) return cache.get(path);
  const exports = {};
  cache.set(path, exports);
  const source = readFileSync(path, "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function("exports", "require", compiled)(exports, (dependency) => load(dependency, path));
  return exports;
}
const example = load("@/lib/eofyProExample");
const output = load("@/lib/eofyProOutput");
const archive = load("@/lib/eofyProArchive");
const handoff = load("@/lib/eofyProHandoff");
const source = readFileSync(resolve(root, "src/components/tools/EofyProWorkspace.tsx"), "utf8");
const normaliseNewlines = (value) => value.replace(/\r\n/g, "\n");

function namedCode(source, name) {
  const file = ts.createSourceFile("workspace.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function walk(node) {
    if ((ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node)) && node.name?.getText(file) === name) found = node;
    ts.forEachChild(node, walk);
  }
  walk(file);
  assert.ok(found, name);
  return ts.transpileModule(`${ts.isVariableDeclaration(found) ? "const " : ""}${found.getText(file)};`, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
}

async function actualDownload(source, draft, reviewed, before = false) {
  let blob;
  const amounts = draft.expenses.map(item => archive.getEofyAmountCents(item.amount));
  const amountTotals = { cents: amounts.reduce((sum, cents) => sum + (cents ?? 0), 0), excluded: amounts.filter(cents => cents === null).length };
  const documents = draft.documents ?? [];
  const documentArchiveIssues = documents.map(archive.getEofyDocumentArchiveIssues);
  const documentsToReview = documents.filter((item, index) => item.status !== "ready" || !item.label.trim() || !item.checkedOn || documentArchiveIssues[index].length);
  const definitions = before ? ["incomeSources", "statusLabels", "evidenceLabels", "recordedAmountLabel"].map(name => namedCode(source, name)).join("\n") : "";
  runInNewContext(`${definitions}\n${namedCode(source, "downloadSummary")}\ndownloadSummary();`, {
    draft, handoffReviewed: reviewed, handoffReview: handoff.assessEofyHandoff(draft), amountTotals, candidateTotal: amountTotals.cents / 100,
    documents, documentArchiveIssues, documentsToReview, getEofyAmountCents: archive.getEofyAmountCents,
    createEofyPreparationSummary: output.createEofyPreparationSummary, Blob,
    requestDownload(value) { blob = value; return true; }, setMessage() {},
  });
  return blob ? blob.text() : null;
}

assert.equal(await actualDownload(source, example.eofyExampleDraft, false), null, "unreviewed work must not export a handoff");
assert.equal(await actualDownload(source, example.eofyExampleDraft, true), example.eofyExampleSummary);
assert.deepEqual(archive.parseEofyArchive(example.eofyExampleArchive).draft, example.eofyExampleDraft);
assert.deepEqual(example.eofyExampleArchive.privacy, { receiptFilesIncluded: false, credentialsIncluded: false });
const publicSummary = resolve(root, "public/downloads/eofy-pro-example-summary.txt");
const publicArchive = resolve(root, "public/downloads/eofy-pro-example-archive.json");
if (process.argv.includes("--write")) {
  writeFileSync(publicSummary, example.eofyExampleSummary);
  writeFileSync(publicArchive, JSON.stringify(example.eofyExampleArchive, null, 2));
}
assert.equal(normaliseNewlines(readFileSync(publicSummary, "utf8")), normaliseNewlines(example.eofyExampleSummary));
assert.deepEqual(JSON.parse(readFileSync(publicArchive, "utf8")), example.eofyExampleArchive);
for (const text of ["FICTIONAL EXAMPLE", "INDIVIDUAL DOCUMENT RECORDS (2; 1 to review)", "EXPENSE CANDIDATES (2)", "A$175.50", "This is not the deductible amount.", ...example.eofyExampleDraft.questions]) assert.ok(example.eofyExampleSummary.includes(text), text);
assert.doesNotMatch(example.eofyExampleSummary, /@|https?:\/\//);

if (process.env.EOFY_BEFORE_SOURCE) {
  const before = readFileSync(process.env.EOFY_BEFORE_SOURCE, "utf8");
  const zero = { taxYear: "2025–26", incomeStatuses: {}, expenses: [], questions: [] };
  const cases = [example.eofyExampleDraft, zero, { ...zero, emptySections: { expenses: true, documents: true } }, { ...example.eofyExampleDraft, expenses: [{ ...example.eofyExampleDraft.expenses[0], amount: "" }, { ...example.eofyExampleDraft.expenses[1], amount: "0" }] }];
  for (const draft of cases) assert.equal(output.createEofyPreparationSummary(draft), await actualDownload(before, draft, true, true), "shared formatter must preserve the actual previous exporter");
  console.log("PASS: previous actual TXT output preserved for populated, zero-record, confirmed-zero and blank/zero-amount cases");
}
const offer = readFileSync(resolve(root, "src/app/eofy-pro/page.tsx"), "utf8");
const preview = readFileSync(resolve(root, "src/components/tools/EofyProOutputPreview.tsx"), "utf8");
const device = readFileSync(resolve(root, "src/components/tools/DeviceDataTransfer.tsx"), "utf8");
assert.ok(offer.indexOf("<EofyProOutputPreview") < offer.indexOf("<EofyProCheckoutForm"));
assert.ok(offer.includes("const canOfferCheckout = checkoutAvailable && !hasActiveEntitlement && !requiresBuyerRecovery;"));
assert.ok(offer.includes("{canOfferCheckout && <div") && offer.includes("!hasActiveEntitlement && <EofyProOutputPreview"));
assert.doesNotMatch(offer, /function DocumentPreview|영수증은 안전하게/);
assert.ok(preview.includes("eofyExampleSummary") && preview.includes("TXT는 전달용이고 JSON은 작업 복원용"));
assert.ok(device.includes('panel.id === "eofy-pro" ? "eofy-delete-heading"'));

// Render the actual offer with isolated entitlement/readiness fixtures. No cookies,
// database, checkout request or payment credentials are used by this test.
const nativeRequire = createRequire(import.meta.url);
const offerCode = ts.transpileModule(offer, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const wrap = ({ children, ...props }) => createElement("div", props, children);
const queryCases = [{}, { access: "required" }, { access: "released" }, { checkout: "checkout_already_purchased" }, { checkout: "checkout_support_required" }];
let renderedCases = 0;
for (const mode of ["closed", "test", "live"]) {
  for (const active of [false, true]) {
    const offerModule = {};
    const mocks = {
      "react/jsx-runtime": nativeRequire("react/jsx-runtime"),
      "next/link": { default: ({ children, ...props }) => createElement("a", props, children) },
      "@/components/layout/Footer": { Footer: () => null },
      "@/components/layout/Header": { Header: () => null },
      "@/components/seo/JsonLd": { BreadcrumbJsonLd: () => null },
      "@/components/ui/Container": { Container: wrap },
      "@/components/tools/EofyProOutputPreview": { EofyProOutputPreview: () => createElement("section", { id: "fixture-public-output" }) },
      "@/components/tools/EofyProCheckoutForm": { EofyProCheckoutForm: ({ testMode }) => createElement("form", { action: "/fixture-checkout", "data-test-mode": testMode }) },
      "@/lib/eofyProAccess": { getActiveEofyProEntitlement: async () => active ? { productCode: "eofy_pro" } : null },
      "@/lib/commerce": { getEofyPaymentReadiness: () => ({ ready: mode === "live" }), canCreateEofyTestCheckout: () => mode === "test" },
      "@/lib/eofyProAttribution": { normalizeEofyProEntry: () => "direct" },
      "@/lib/site": { createPageMetadata: () => ({}) },
    };
    new Function("exports", "require", offerCode)(offerModule, (name) => {
      assert.ok(Object.hasOwn(mocks, name), `unexpected offer dependency: ${name}`);
      return mocks[name];
    });
    for (const query of queryCases) {
      const html = renderToStaticMarkup(await offerModule.default({ searchParams: Promise.resolve(query) }));
      const checkoutExpected = mode !== "closed" && !active && !Object.keys(query).length;
      assert.equal(html.includes('action="/fixture-checkout"'), checkoutExpected, JSON.stringify({ mode, active, query }));
      assert.equal(html.includes('id="fixture-public-output"'), !active);
      if (checkoutExpected) assert.ok(html.indexOf('id="fixture-public-output"') < html.indexOf('action="/fixture-checkout"'));
      if (active) assert.ok(html.includes("저장한 작업 계속하기"));
      else if (Object.keys(query).length) assert.ok(html.includes("기존 구매 이용권 복구") && html.includes('href="/eofy-pro/restore"'));
      renderedCases++;
    }
  }
}
console.log(`PASS: ${renderedCases} rendered offer states preserve purchase/entitlement/recovery boundaries`);
if (process.env.EOFY_FIXTURE_OUT) writeFileSync(process.env.EOFY_FIXTURE_OUT, JSON.stringify({ draft: example.eofyExampleDraft, summary: example.eofyExampleSummary, archive: example.eofyExampleArchive }, null, 2));
console.log("PASS: public EOFY TXT/JSON match actual export, review/entitlement boundaries and recovery links");
