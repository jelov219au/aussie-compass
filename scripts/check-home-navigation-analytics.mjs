import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as recommendation from "../src/lib/homePremiumRecommendation.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sources = {
  trackedLink: read("src/components/analytics/TrackedLink.tsx"),
  tools: read("src/components/sections/ToolsSection.tsx"),
  route: read("src/components/sections/PersonalRouteFinder.tsx"),
  premium: read("src/components/sections/PremiumToolsSection.tsx"),
  trust: read("src/components/sections/HomeTrustBar.tsx"),
};

assert.match(sources.trackedLink, /onClick=\{\(\) => \{\s*try \{\s*track\(eventName, properties\);\s*\} catch \{[\s\S]*Navigation must remain independent/, "TrackedLink must isolate analytics failures from navigation");

for (const contract of [
  [sources.tools, 'href="/tools" eventName="Home Navigation" properties={{ section: "essential_tools", destination: "tools" }}'],
  [sources.route, 'href="/tools" eventName="Home Navigation" properties={{ section: "route_finder", destination: "tools" }}'],
  [sources.route, 'href="/my-compass" eventName="Home Navigation" properties={{ section: "route_finder", destination: "my_compass" }}'],
  [sources.premium, 'eventName="Pro Interest" properties={{ product: product.id, entry: "home_catalog" }}'],
  [sources.premium, 'eventName="Pro Interest" properties={{ product: featuredProduct.id, entry: "home_featured" }}'],
  [sources.premium, 'eventName="Home Navigation" properties={{ section: "premium_featured_free", destination: featuredProduct.freeHref.slice(1) }}'],
  [sources.premium, 'eventName="Home Navigation" properties={{ section: "premium_closed_free", destination: action.href.slice(1) }}'],
  [sources.premium, 'eventName="Pro Interest" properties={{ product: "catalog", entry: "home_closed" }}'],
  [sources.trust, 'eventName="Home Navigation" properties={{ section: "trust", destination: "editorial-policy" }}'],
  [sources.trust, 'eventName="Home Navigation" properties={{ section: "trust", destination: item.href.slice(1) }}'],
]) assert.ok(contract[0].includes(contract[1]), `missing analytics contract: ${contract[1]}`);

for (const action of ["save_plan", "view_saved_plan", "view_current_recommendations", "mark_step_complete", "mark_step_incomplete", "share_recommendations", "download_reminder"]) {
  assert.ok(sources.route.includes(`"${action}"`), `missing fixed Route Plan Action: ${action}`);
}
assert.match(sources.route, /track\("Route Plan Action", \{ action, stage, concern \}\)/);
assert.doesNotMatch(sources.route, /Route Plan Saved|\{ destination, route:|route:\s*`\$\{stage\}/, "route analytics must use separate fixed categories and one plan-action event");
assert.match(sources.route, /track\("Route Recommendation Opened", \{ destination, stage, concern \}\)/);

const allowedKeys = new Set(["section", "destination", "action", "product", "entry", "stage", "concern"]);
const analyticsBlocks = Object.values(sources).flatMap((source) => [
  ...[...source.matchAll(/properties=\{\{([\s\S]*?)\}\}/g)].map((match) => match[1]),
  ...[...source.matchAll(/track\([^,]+,\s*\{([^}]*)\}\)/g)].map((match) => match[1]),
]);
for (const block of analyticsBlocks) {
  for (const match of block.matchAll(/\b([A-Za-z][A-Za-z0-9]*)\s*:/g)) assert.ok(allowedKeys.has(match[1]), `analytics property is not allowed: ${match[1]}`);
  assert.doesNotMatch(block, /search|query|text|content|note|amount|price|email|cookie|entitlement|raw|storage|url|value/i, "analytics properties must not expose user input, commerce state, storage or URLs");
}

function load(path, resolve) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(read(path), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports, require: resolve, process: { env: {} } });
  return loaded.exports;
}

const state = { resume: false, rental: false, pay: false, eofy: false, leaving: false };
const commerce = {
  resumeProProduct: { priceCents: 1990 }, rentalApplicationProProduct: { priceCents: 1490 }, payEvidenceProProduct: { priceCents: 990 }, eofyProProduct: { priceCents: 990 }, leavingAustraliaProProduct: { priceCents: 1290 },
  getPayEvidencePaymentReadiness: () => ({ ready: state.pay }), getEofyPaymentReadiness: () => ({ ready: state.eofy }), getLeavingAustraliaPaymentReadiness: () => ({ ready: state.leaving }),
};
const catalog = load("src/lib/proCatalogProducts.ts", (name) => name === "@/lib/commerce" ? commerce : assert.fail(`Unexpected catalog import: ${name}`));
const Anchor = ({ children, ...props }) => React.createElement("a", props, children);
const component = load("src/components/sections/PremiumToolsSection.tsx", (name) => {
  if (name === "react/jsx-runtime") return require(name);
  if (name === "@/components/analytics/TrackedLink") return { TrackedLink: Anchor };
  if (name === "@/components/analytics/ResumeProProofLink") return { ResumeProProofLink: ({ children, ...props }) => React.createElement("a", { ...props, href: "/resume-job-ad-checker" }, children) };
  if (name === "@/components/analytics/ResumeFunnelAnalytics") return { ResumeProCtaLink: Anchor };
  if (name === "@/components/ui/Container") return { Container: ({ children, ...props }) => React.createElement("div", props, children) };
  if (name === "@/components/ui/TopicIcon") return { TopicIcon: ({ name: icon }) => React.createElement("span", { "data-icon": icon }) };
  if (name === "@/components/ui/actionStyles") return { actionClass: (_tone, value) => value };
  if (name === "@/lib/commerce") return { isResumeProLive: () => state.resume, getRentalApplicationPaymentReadiness: () => ({ ready: state.rental }) };
  if (name === "@/lib/homePremiumRecommendation") return recommendation;
  if (name === "@/lib/proCatalogProducts") return catalog;
  if (name === "@/lib/resumeFunnelAnalyticsContract") return { resumeFunnelContexts: { home: "home" }, resumeFunnelSurfaces: { homePremium: "home-premium" } };
  assert.fail(`Unexpected component import: ${name}`);
});
const nodes = (root) => {
  const result = [];
  const visit = (node) => {
    if (node === null || node === undefined || typeof node === "boolean") return;
    if (Array.isArray(node)) return node.forEach(visit);
    if (typeof node !== "object") return;
    result.push(node); visit(node.props?.children);
  };
  visit(root); return result;
};
const render = (patch) => {
  Object.assign(state, { resume: false, rental: false, pay: false, eofy: false, leaving: false }, patch);
  return nodes(component.PremiumToolsSection());
};
const events = (tree, name, properties) => tree.filter((node) => node.props?.eventName === name && Object.entries(properties).every(([key, value]) => node.props?.properties?.[key] === value));

const closed = render({});
assert.equal(events(closed, "Pro Interest", { entry: "home_catalog" }).length, 6, "all six catalog status links need one event definition");
assert.equal(events(closed, "Home Navigation", { section: "premium_closed_free" }).length, 3, "the three closed-state free actions need one event each");
assert.equal(events(closed, "Pro Interest", { product: "catalog", entry: "home_closed" }).length, 1);
const pay = render({ pay: true });
assert.equal(events(pay, "Pro Interest", { product: "pay-evidence-pro", entry: "home_featured" }).length, 1);
assert.equal(events(pay, "Home Navigation", { section: "premium_featured_free", destination: "underpayment-guide" }).length, 1);
const resume = render({ resume: true });
assert.equal(events(resume, "Pro Interest", { product: "resume-pro", entry: "home_featured" }).length, 0, "Resume CTA must keep only its existing funnel event");
assert.equal(events(resume, "Home Navigation", { section: "premium_featured_free" }).length, 0, "Resume proof must keep only its existing proof event");
assert.equal(resume.filter((node) => node.props?.surface === "home-premium" && node.props?.context === "home").length, 1);
assert.equal(resume.filter((node) => node.props?.entry === "home-premium").length, 1);

console.log("HOME_NAVIGATION_ANALYTICS=PASS mappings=10 route_actions=7 closed_catalog=6 closed_free=3 pay_featured=2 resume_duplicates=0 forbidden_properties=0");
