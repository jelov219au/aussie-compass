import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Execute the real local diagnostics with synthetic inputs only. Never inherit
// payment credentials or Node preload options from the operator's environment.
const readinessFixture = {
  SystemRoot: process.env.SystemRoot ?? "",
  PAYMENTS_ENABLED: "true",
  EOFY_PRO_PAYMENTS_ENABLED: "true",
  LEAVING_AUSTRALIA_PRO_PAYMENTS_ENABLED: "true",
  STRIPE_WEBHOOK_SECRET: "whsec_readiness_fixture",
  STRIPE_EOFY_PRO_PRICE_ID: "price_eofy_fixture",
  STRIPE_LEAVING_AUSTRALIA_PRO_PRICE_ID: "price_leaving_fixture",
  STRIPE_MANAGED_PAYMENTS_ENABLED: "true",
  STRIPE_RESUME_PRO_PRICE_ID: "price_resume_fixture",
  STRIPE_RESUME_PRO_PRODUCT_ID: "prod_resume_fixture",
  STRIPE_RESUME_PRO_TAX_CODE: "txcd_fixture",
  PAYMENTS_ENTITLEMENT_STORE: "neon",
  FIRST_SALE_GATE_ENABLED: "true",
  ENTITLEMENT_DB_URL: "postgresql://fixture.invalid/unused",
  ENTITLEMENT_SESSION_SECRET: "synthetic-session-fixture-not-a-secret".repeat(2),
  BUSINESS_LEGAL_NAME: "Fictional readiness fixture",
  BUSINESS_ABN: "00000000000",
  NEXT_PUBLIC_SUPPORT_EMAIL: "fixture@example.invalid",
  FIRST_SALE_MONITORED_MODE_ENABLED: "true",
  FIRST_SALE_MONITORED_MODE_OWNER_ACK: "SINGLE_FIRST_SALE_MANUAL_MONITORING_APPROVED",
};

for (const script of ["check-eofy-launch-readiness.mjs", "check-leaving-australia-launch-readiness.mjs"]) {
  for (const deployment of ["production", "preview"]) {
    for (const prefix of ["sk", "rk"]) {
      for (const mode of ["live", "test"]) {
        const key = `${prefix}_${mode}_SyntheticReadinessFixture`;
        const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
          env: { ...readinessFixture, VERCEL_ENV: deployment, STRIPE_SECRET_KEY: ` ${key} ` },
          encoding: "utf8", timeout: 5000, windowsHide: true,
        });
        const expectedMode = deployment === "production" ? "live" : "test";
        assert.equal(result.error, undefined, `${script} must finish without a process error.`);
        assert.equal(result.status, mode === expectedMode ? 0 : 2, `${script}: ${deployment} must accept only ${expectedMode} ${prefix} keys.`);
        assert.ok(!result.stdout.includes(key), "Readiness diagnostics must not print the key.");
        assert.ok(!result.stderr, "Readiness diagnostics must not emit secret-bearing errors.");
      }
    }
  }
  for (const key of ["", "pk_live_SyntheticPublicFixture", "not-a-key"]) {
    const rejected = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
      env: { ...readinessFixture, VERCEL_ENV: "production", STRIPE_SECRET_KEY: key },
      encoding: "utf8", timeout: 5000, windowsHide: true,
    });
    assert.equal(rejected.status, 2, `${script} must reject missing, public and malformed server keys.`);
  }
  const missing = spawnSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
    env: { SystemRoot: process.env.SystemRoot ?? "" },
    encoding: "utf8", timeout: 5000, windowsHide: true,
  });
  assert.equal(missing.status, 2, `${script} must keep missing configuration unready.`);
  assert.ok(missing.stdout.includes("STRIPE_SECRET_KEY"));
}

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const finder = await read("../src/components/tools/ProProductFinder.tsx");
const entitlementContract = await read("../src/lib/productEntitlementContract.ts");
const webhook = await read("../src/app/api/stripe/webhook/route.ts");

const products = [
  {
    name: "EOFY Pack Pro",
    slug: "eofy-pro",
    code: "eofy_pro",
    price: "A$9.90",
    amount: 990,
    finderKey: "tax",
    pageReadiness: "getEofyPaymentReadiness",
    testReadiness: "canCreateEofyTestCheckout",
    checkoutForm: "EofyProCheckoutForm",
    activeEntitlement: "getActiveEofyProEntitlement",
    accessCookie: "setEofyProAccessCookie",
    accessPayload: "getEofyProAccessPayload",
    webhookCode: "EOFY_FIRST_SALE_PRODUCT_CODE",
    disclaimer: "공제 가능 여부 판정 또는 세무 자문을 제공하지 않습니다",
  },
  {
    name: "Leaving Australia Pack Pro",
    slug: "leaving-australia-pro",
    code: "leaving_australia_pro",
    price: "A$12.90",
    amount: 1290,
    finderKey: "leave",
    pageReadiness: "getLeavingAustraliaPaymentReadiness",
    testReadiness: "canCreateLeavingAustraliaTestCheckout",
    checkoutForm: "LeavingAustraliaProCheckoutForm",
    activeEntitlement: "getActiveLeavingAustraliaProEntitlement",
    accessCookie: "setLeavingAustraliaProAccessCookie",
    accessPayload: "getLeavingAustraliaProAccessPayload",
    webhookCode: "LEAVING_AUSTRALIA_FIRST_SALE_PRODUCT_CODE",
    disclaimer: "이 도구는 비자 종료, DASP 자격·세율, 세법상 거주 상태",
  },
];

assert.ok(
  finder.includes("표시 가격은 검토 중이며 이 제품은 현재 결제되지 않아요."),
  "Catalog review copy may describe availability, but it must not replace server readiness checks.",
);

for (const product of products) {
  const [offer, checkoutForm, checkout, success, activate, restore, release, workspace] = await Promise.all([
    read(`../src/app/${product.slug}/page.tsx`),
    read(`../src/components/tools/${product.checkoutForm}.tsx`),
    read(`../src/app/api/checkout/${product.slug}/route.ts`),
    read(`../src/app/${product.slug}/success/page.tsx`),
    read(`../src/app/api/${product.slug}/access/activate/route.ts`),
    read(`../src/app/api/${product.slug}/restore/route.ts`),
    read(`../src/app/api/${product.slug}/access/release/route.ts`),
    read(`../src/app/${product.slug}/workspace/page.tsx`),
  ]);

  const finderEntry = new RegExp(
    `${product.finderKey}: \\{ href: "/${product.slug}"[^\\n]+price: "${product.price.replace("$", "\\$")}"`,
  );
  assert.match(finder, finderEntry, `${product.name} must remain discoverable at its exact current price.`);

  for (const value of [product.pageReadiness, product.testReadiness, product.checkoutForm, product.price, `/${product.slug}/restore`]) {
    assert.ok(offer.includes(value), `${product.name} offer is missing: ${value}`);
  }
  assert.ok(`${offer}\n${workspace}`.includes(product.disclaimer), `${product.name} must retain its professional-judgment limitation.`);

  assert.ok(checkoutForm.includes(`action="/api/checkout/${product.slug}"`), `${product.name} form must post to its own checkout route.`);
  assert.ok(checkoutForm.includes('method="post"') && checkoutForm.includes(product.price), `${product.name} form must retain POST and exact one-time price copy.`);
  assert.ok(checkout.includes(`/${product.slug}/success?session_id={CHECKOUT_SESSION_ID}`), `${product.name} checkout must retain its success route.`);
  assert.ok(checkout.includes(`/${product.slug}?checkout=cancelled`), `${product.name} checkout must retain its cancel route.`);
  assert.ok(checkout.includes('billing_model: "one_time"') && checkout.includes("checkout.sessions.create"), `${product.name} must remain a one-time Checkout Session.`);

  assert.ok(success.includes(`findActiveByCheckoutSession(session.id, "${product.code}")`), `${product.name} success must require its own entitlement.`);
  assert.ok(activate.includes(`productCode: "${product.code}"`) && activate.includes(product.accessCookie), `${product.name} activation must set only its own signed access.`);
  assert.ok(restore.includes(`productCode: "${product.code}"`) && restore.includes(`/${product.slug}/workspace`), `${product.name} restore must consume only its own token.`);
  assert.ok(release.includes(`productCode: "${product.code}"`) && release.includes(product.accessPayload), `${product.name} release must target only its own access session.`);

  assert.ok(workspace.includes('const accessProtected = process.env.NODE_ENV === "production";'), `${product.name} workspace must stay protected in Production.`);
  assert.ok(workspace.includes(`if (accessProtected && !await ${product.activeEntitlement}())`), `${product.name} Production workspace must require an active entitlement.`);
  assert.ok(workspace.includes(`redirect("/${product.slug}?access=required")`), `${product.name} denied access must return to its own offer.`);

  assert.ok(
    entitlementContract.includes(`${product.code}: { currency: "aud", amountTotal: ${product.amount} }`),
    `${product.name} webhook amount must remain isolated at ${product.price}.`,
  );
  assert.ok(webhook.includes(product.webhookCode), `${product.name} must remain recognized by the signed webhook flow.`);
}

// Regression: listing and selected recommendations must follow the server's
// readiness result, including each product being independently unavailable.
const { createRequire } = await import("node:module");
const { runInNewContext } = await import("node:vm");
const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const jsxRuntime = require("react/jsx-runtime");
const catalogSource = await read("../src/lib/proCatalogProducts.ts");
const catalogPage = await read("../src/app/pro/page.tsx");
const Link = ({ href, children }) => React.createElement("a", { href }, children);
const empty = () => null;
const wrap = ({ children }) => React.createElement("div", null, children);
function evaluate(source, imports) {
  const loaded = { exports: {} };
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } }).outputText;
  runInNewContext(code, { module: loaded, exports: loaded.exports, require: (name) => {
    assert.ok(name in imports, `Unexpected test import: ${name}`);
    return imports[name];
  } });
  return loaded.exports;
}
const uiImports = {
  "react/jsx-runtime": jsxRuntime,
  "next/link": Link,
  "@/components/analytics/ResumeFunnelAnalytics": { ResumeProCtaLink: Link },
  "@/components/analytics/ResumeProProofLink": { ResumeProProofLink: Link },
  "@/components/ui/actionStyles": { actionClass: () => "" },
  "@/lib/resumeFunnelAnalyticsContract": { resumeFunnelContexts: {}, resumeFunnelSurfaces: {} },
};
for (let bits = 0; bits < 8; bits++) {
  const ready = { pay: Boolean(bits & 1), tax: Boolean(bits & 2), leave: Boolean(bits & 4) };
  const commerce = {
    resumeProProduct: { priceCents: 1990 }, rentalApplicationProProduct: { priceCents: 1490 },
    payEvidenceProProduct: { priceCents: 990 }, eofyProProduct: { priceCents: 990 }, leavingAustraliaProProduct: { priceCents: 1290 },
    getPayEvidencePaymentReadiness: () => ({ ready: ready.pay }),
    getEofyPaymentReadiness: () => ({ ready: ready.tax }),
    getLeavingAustraliaPaymentReadiness: () => ({ ready: ready.leave }),
    isResumeProLive: () => true, getRentalApplicationPaymentReadiness: () => ({ ready: true }),
  };
  const catalog = evaluate(catalogSource, { "@/lib/commerce": commerce });
  for (const [situation, slug] of [["pay", "pay-evidence-pro"], ["tax", "eofy-pro"], ["leave", "leaving-australia-pro"]]) {
    const Finder = evaluate(finder, { ...uiImports, react: { useState: () => [situation, () => {}] } }).ProProductFinder;
    let received;
    const Page = evaluate(catalogPage, {
      ...uiImports, "@/lib/commerce": commerce, "@/lib/proCatalogProducts": catalog,
      "@/components/layout/Footer": { Footer: empty }, "@/components/layout/Header": { Header: empty },
      "@/components/seo/JsonLd": { BreadcrumbJsonLd: empty }, "@/components/ui/Container": { Container: wrap },
      "@/components/ui/TopicIcon": { TopicIcon: empty }, "@/lib/site": { createPageMetadata: () => ({}) },
      "@/components/tools/ProProductFinder": { ProProductFinder: (props) => { received = props; return React.createElement(Finder, props); } },
    }).default;
    const html = renderToStaticMarkup(React.createElement(Page));
    const card = html.match(new RegExp(`<article id="${slug}"[\\s\\S]*?</article>`))?.[0];
    assert.ok(card, `${slug} card must render`);
    assert.equal(card.includes("현재 이용 가능"), ready[situation], `${slug} badge must match readiness`);
    assert.equal(card.includes("결제 미오픈"), !ready[situation], `${slug} price note must match readiness`);
    assert.equal(received.packAvailability[situation], ready[situation], `${slug} readiness must reach the client finder`);
    const selected = renderToStaticMarkup(React.createElement(Finder, received));
    assert.equal(selected.includes("한 번만 결제하면 돼요"), ready[situation], `${slug} selected purchase copy must match readiness`);
    assert.equal(selected.includes("이 제품은 현재 결제되지 않아요"), !ready[situation], `${slug} selected closed copy must match readiness`);
    assert.ok(selected.includes(`href="/${slug}"`), `${slug} must link to its own offer`);
  }
}
console.log("EOFY/Leaving sales contracts and 24 rendered catalog/finder availability scenarios passed.");
