import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import * as recommendation from "../src/lib/homePremiumRecommendation.ts";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

function load(path, resolve) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(read(path), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports, require: resolve });
  return loaded.exports;
}

const state = { pay: false, eofy: false, leaving: false };
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

const matrices = [
  [{}, false, false, null],
  [{}, true, false, "resume-pro"],
  [{ pay: true }, false, false, "pay-evidence-pro"],
  [{ pay: true }, false, true, "rental-application-pro"],
  [{ eofy: true }, false, false, "eofy-pro"],
  [{ leaving: true }, false, false, "leaving-australia-pro"],
];

for (const [packState, resumeLive, rentalLive, expectedId] of matrices) {
  Object.assign(state, { pay: false, eofy: false, leaving: false }, packState);
  const products = catalog.getProCatalogProducts(resumeLive, rentalLive);
  const featured = recommendation.selectHomePremiumProduct(products);
  assert.equal(products.length, 6);
  assert.equal(featured?.id ?? null, expectedId);
  assert.notEqual(featured?.id, "car-purchase-pro", "Car must never be selected as a live home product");
}

const products = catalog.getProCatalogProducts(true, true);
const car = products.find((product) => product.id === "car-purchase-pro");
assert.equal(car?.live, false);
assert.equal(car?.price, "가격 미정");

const server = read("src/components/sections/PremiumToolsSection.tsx");
const explorer = read("src/components/sections/HomePremiumToolExplorer.tsx");
for (const contract of [
  "selectHomePremiumProduct(products)",
  "initialProductId={featuredProduct?.id}",
]) assert.ok(server.includes(contract), `server selection contract missing: ${contract}`);
for (const contract of [
  'useState(initialProductId ?? products[0]?.id ?? "")',
  "products.find((item) => item.id === selectedId)",
  "onClick={() => setSelectedId(item.id)}",
  "aria-pressed={selected}",
  "product.live ?",
  '"준비 방식 보기"',
  '<ResumeProProofLink entry="home-premium"',
  'surface={resumeFunnelSurfaces.homePremium}',
  'context={resumeFunnelContexts.home}',
  'properties={{ product: product.id, entry: "home_selected" }}',
]) assert.ok(explorer.includes(contract), `interactive home contract missing: ${contract}`);

console.log("Home Pro selection, live priority, Resume funnel, and Car closed-state contracts passed.");
