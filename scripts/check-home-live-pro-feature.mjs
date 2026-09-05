import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as recommendation from "../src/lib/homePremiumRecommendation.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");

function load(path, resolve) {
  const loaded = { exports: {} };
  const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports, require: resolve, process: { env: {} } });
  return loaded.exports;
}

const state = { resume: false, rental: false, pay: false, eofy: false, leaving: false };
const commerce = {
  resumeProProduct: { priceCents: 1990 },
  rentalApplicationProProduct: { priceCents: 1490 },
  payEvidenceProProduct: { priceCents: 990 },
  eofyProProduct: { priceCents: 990 },
  leavingAustraliaProProduct: { priceCents: 1290 },
  getPayEvidencePaymentReadiness: () => ({ ready: state.pay }),
  getEofyPaymentReadiness: () => ({ ready: state.eofy }),
  getLeavingAustraliaPaymentReadiness: () => ({ ready: state.leaving }),
};
const catalog = load("src/lib/proCatalogProducts.ts", (name) => {
  assert.equal(name, "@/lib/commerce");
  return commerce;
});

const Link = ({ children, ...props }) => React.createElement("a", props, children);
const component = load("src/components/sections/PremiumToolsSection.tsx", (name) => {
  if (name === "react/jsx-runtime") return require(name);
  if (name === "next/link") return { default: Link };
  if (name === "@/components/analytics/TrackedLink") return { TrackedLink: Link };
  if (name === "@/components/analytics/ResumeProProofLink") return { ResumeProProofLink: ({ children, ...props }) => React.createElement("a", { ...props, href: "/resume-job-ad-checker" }, children) };
  if (name === "@/components/analytics/ResumeFunnelAnalytics") return { ResumeProCtaLink: Link };
  if (name === "@/components/ui/Container") return { Container: ({ children, ...props }) => React.createElement("div", props, children) };
  if (name === "@/components/ui/TopicIcon") return { TopicIcon: ({ name }) => React.createElement("span", { "data-icon": name }) };
  if (name === "@/components/ui/actionStyles") return { actionClass: (_tone, value) => value };
  if (name === "@/lib/commerce") return { isResumeProLive: () => state.resume, getRentalApplicationPaymentReadiness: () => ({ ready: state.rental }) };
  if (name === "@/lib/homePremiumRecommendation") return recommendation;
  if (name === "@/lib/proCatalogProducts") return catalog;
  if (name === "@/lib/resumeFunnelAnalyticsContract") return { resumeFunnelContexts: { home: "home" }, resumeFunnelSurfaces: { homePremium: "home-premium" } };
  assert.fail(`Unexpected import: ${name}`);
});

function nodes(root) {
  const result = [];
  const visit = (node) => {
    if (node === null || node === undefined || typeof node === "boolean") return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== "object") return;
    result.push(node);
    visit(node.props?.children);
  };
  visit(root);
  return result;
}
function text(node) {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return text(node.props?.children);
}
function renderState(patch) {
  Object.assign(state, { resume: false, rental: false, pay: false, eofy: false, leaving: false }, patch);
  const products = catalog.getProCatalogProducts(state.resume, state.rental);
  const featured = recommendation.selectHomePremiumProduct(products);
  const tree = component.PremiumToolsSection();
  const allNodes = nodes(tree);
  const panel = allNodes.find((node) => node.props?.["data-home-featured-product"] !== undefined);
  return { products, featured, panel, panelNodes: nodes(panel), panelText: text(panel) };
}

const matrices = [
  [{}, null],
  [{ resume: true }, "resume-pro"],
  [{ pay: true }, "pay-evidence-pro"],
  [{ rental: true, pay: true }, "rental-application-pro"],
  [{ eofy: true }, "eofy-pro"],
  [{ leaving: true }, "leaving-australia-pro"],
];
for (const [fixture, expectedId] of matrices) {
  const result = renderState(fixture);
  assert.equal(result.products.length, 6);
  assert.equal(result.featured?.id ?? null, expectedId);
  assert.equal(result.panel.props["data-home-featured-product"], expectedId ?? "none");
  assert.notEqual(result.featured?.id, "car-purchase-pro", "Car must never be the live home feature");
}

const closed = renderState({});
assert.ok(closed.panelText.includes("지금 이용 가능한 Pro 없음"));
assert.ok(closed.panelText.includes("지금 바로 할 수 있는 무료 다음 단계"));
assert.equal(recommendation.homePremiumFreeActions.length, 3);
for (const action of recommendation.homePremiumFreeActions) {
  assert.ok(closed.panelNodes.some((node) => node.props?.href === action.href));
}
assert.ok(closed.panelNodes.some((node) => node.props?.href === "/pro"));
assert.doesNotMatch(closed.panelText, /A\$\d/, "closed fallback must not present a product price as purchasable");
assert.ok(!closed.panelNodes.some((node) => String(node.props?.href ?? "").includes("from=home-premium")), "closed fallback must not expose a purchase CTA");

const pay = renderState({ pay: true });
for (const value of ["Pay Evidence Pro", "A$9.90", "현재 이용 가능", "1회 결제 · 구독 없음", "근무시간·Payslip 차이·증빙표·영문 문의문"]) {
  assert.ok(pay.panelText.includes(value), `Pay-only panel is missing ${value}`);
}
assert.ok(pay.panelNodes.some((node) => node.props?.href === "/pay-evidence-pro"));
assert.ok(pay.panelNodes.some((node) => node.props?.href === "/underpayment-guide"));
assert.ok(!pay.panelNodes.some((node) => node.props?.entry === "home-premium"), "Pay must not reuse Resume proof analytics");

const resume = renderState({ resume: true });
assert.ok(resume.panelNodes.some((node) => node.props?.href === "/resume-pro?from=home-premium"));
assert.ok(resume.panelNodes.some((node) => node.props?.entry === "home-premium"), "Resume must retain its proof entry");
assert.ok(resume.panelNodes.some((node) => node.props?.surface === "home-premium" && node.props?.context === "home"), "Resume must retain its funnel surface and context");

console.log("WEB50 home live-product feature matrix and free fallback passed.");
