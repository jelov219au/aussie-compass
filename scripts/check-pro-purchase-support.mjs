import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript"), React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
function load(file, resolve) {
  const result = { exports: {} };
  runInNewContext(ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports: result.exports, module: result, process: { env: {} }, require: resolve });
  return result.exports;
}
const stripeDefinition = load("src/lib/resumeProStripeProduct.ts", name => assert.fail(name));
const commerce = load("src/lib/commerce.ts", name => name === "@/lib/resumeProStripeProduct" ? stripeDefinition : {});
const states = [false, false, false, false, false];
const readinessNames = ["getPaymentReadiness", "getRentalApplicationPaymentReadiness", "getPayEvidencePaymentReadiness", "getEofyPaymentReadiness", "getLeavingAustraliaPaymentReadiness"];
const facts = { ...commerce, ...Object.fromEntries(readinessNames.map((name, i) => [name, () => ({ ready: states[i] })])) };
const catalog = load("src/lib/proCatalogProducts.ts", name => { assert.equal(name, "@/lib/commerce"); return facts; });
const info = load("src/lib/proPurchaseInformation.ts", name => {
  if (name === "server-only") return {};
  if (name === "./commerce") return facts;
  if (name === "./proCatalogProducts") return catalog;
  assert.fail(name);
});
let checks = 0;
const expected = [[commerce.resumeProProduct, commerce.resumeProPurchaseTermsVersion],
  [commerce.rentalApplicationProProduct, commerce.rentalApplicationProPurchaseTermsVersion],
  [commerce.payEvidenceProProduct, commerce.payEvidenceProPurchaseTermsVersion],
  [commerce.eofyProProduct, commerce.eofyProPurchaseTermsVersion],
  [commerce.leavingAustraliaProProduct, commerce.leavingAustraliaProPurchaseTermsVersion]];
for (let active = -1; active < 5; active++) {
  states.fill(false); if (active >= 0) states[active] = true;
  const products = info.getProPurchaseInformation(); assert.equal(products.length, 5);
  products.forEach((product, i) => {
    assert.equal(product.name, expected[i][0].name); assert.equal(product.priceCents, expected[i][0].priceCents);
    assert.equal(product.termsVersion, expected[i][1]); assert.equal(product.ready, active === i);
    assert(existsSync(new URL(`../src/app${product.restoreHref}/page.tsx`, import.meta.url)));
  }); checks++;
}
states.fill(false);
const Link = ({ children, ...props }) => React.createElement("a", props, children);
let supportProps;
const resolvePage = name => {
  if (name === "react/jsx-runtime") return require(name);
  if (name === "next/link") return { default: Link };
  if (name === "@/lib/proPurchaseInformation") return info;
  if (name === "@/lib/site") return { createPageMetadata: value => value };
  if (name === "@/lib/publicSeller") return { getPublicSellerDetails: () => ({ tradingName: "Fixture", legalName: "Fixture", abn: "00000000000", email: "support@example.invalid" }) };
  if (name === "@/components/tools/PaymentSupportHelper") return { PaymentSupportHelper: props => { supportProps = props; return null; } };
  if (name === "@/components/tools/DeviceDataTransfer") return { DeviceDataTransfer: () => null };
  if (name.includes("/Container")) return { Container: ({ children }) => React.createElement("div", null, children) };
  if (name.includes("/Header")) return { Header: () => null };
  if (name.includes("/Footer")) return { Footer: () => null };
  if (name.includes("/JsonLd")) return { BreadcrumbJsonLd: () => null };
  assert.fail(name);
};
for (const page of ["purchase-information", "terms", "payment-help", "data-transfer"]) {
  const component = load(`src/app/${page}/page.tsx`, resolvePage).default;
  const html = renderToStaticMarkup(React.createElement(component));
  if (["purchase-information", "terms"].includes(page)) {
    for (const [product, version] of expected) { assert(html.includes(product.name)); assert(html.includes(`A$${(product.priceCents / 100).toFixed(2)}`)); assert(html.includes(version)); }
    assert(html.includes("Australian Consumer Law")); assert(!html.includes("Resume Pro 검증에서는"));
  }
  if (page === "purchase-information") { assert(!html.includes("결제 이용 가능")); assert(html.includes("현재 결제 미오픈")); }
  if (page === "payment-help") { for (const [product] of expected) assert(html.includes(`href="/${product.id}/restore"`)); }
  if (page === "data-transfer") { assert(html.includes("기존 기록 유지")); assert(html.includes("구매 이용권이나 복구 코드가 포함되지 않습니다")); }
  checks++;
}
assert.equal(supportProps.products.length, 7);
let cursor = 0, tree;
const hooks = [];
const helper = load("src/components/tools/PaymentSupportHelper.tsx", name => {
  if (name === "react") return {
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = value; }]; },
    useMemo: fn => fn(),
  };
  if (name === "react/jsx-runtime") return require(name);
  if (name === "next/link") return { default: Link };
  assert.fail(name);
});
const render = () => { cursor = 0; tree = helper.PaymentSupportHelper(supportProps); };
function nodes() {
  const result = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) { node.forEach(visit); return; }
    result.push(node); visit(node.props?.children);
  }
  visit(tree); return result;
}
render();
for (const product of supportProps.products) {
  nodes().find(node => node.props?.id === "payment-product").props.onChange({ target: { value: product.id } }); render();
  const template = nodes().find(node => node.props?.id === "support-template").props.value;
  const mail = new URL(nodes().find(node => node.props?.href?.startsWith("mailto:")).props.href);
  assert(template.includes(product.name)); assert.equal(mail.searchParams.get("body"), template);
  assert(mail.searchParams.get("subject").startsWith(product.name)); assert(template.includes("이용권 복구 코드"));
  const restoreLinks = nodes().filter(node => node.props?.href?.endsWith("/restore"));
  assert.equal(restoreLinks.length, product.restoreHref ? 1 : 0);
  if (product.restoreHref) assert.equal(restoreLinks[0].props.href, product.restoreHref);
  if (product.preparing) assert(nodes().some(node => node.props?.href === "/car-purchase-pro"));
  checks++;
}
// Callback remains a user-invoked mailto/clipboard action; the checks never send mail.
console.log(JSON.stringify({ status: "PASS", checks,
  scope: "Real commerce product facts/catalog/purchase mapping; independent readiness fixtures; static page rendering and actual support selection handlers. No server, browser, mail, DB or payment." }));
