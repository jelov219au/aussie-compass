import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";
const require = createRequire(import.meta.url), ts = require("typescript"), load = localTypeScriptLoader();
let available = false;
function page(name) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`src/app/car-purchase-pro/${name}/page.tsx`, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { module: mod, exports: mod.exports, require(dependency) {
    if (dependency === "react/jsx-runtime") return require(dependency);
    if (dependency === "next/link") return { default: "a" };
    if (dependency === "@/lib/carPurchaseProRuntime") return { isCarPurchaseAccessAvailable: async () => available };
    if (dependency === "@/lib/carPurchaseProActivationClient") return load("src/lib/carPurchaseProActivationClient.ts");
    if (dependency.startsWith("@/components/")) { const key = dependency.split("/").at(-1); return { [key]: key }; }
    throw Error("Unexpected page dependency " + dependency);
  } });
  assert.equal(mod.exports.dynamic, "force-dynamic");
  assert.equal(mod.exports.metadata.robots.index, false);
  assert.equal(mod.exports.metadata.referrer, "no-referrer");
  return mod.exports.default;
}
function elements(node, type) {
  if (Array.isArray(node)) return node.flatMap(child => elements(child, type));
  if (!node || typeof node !== "object") return [];
  return [...(node.type === type ? [node] : []), ...elements(node.props?.children, type)];
}
const success = page("success"), restore = page("restore");
let checks = 0;
for (const ready of [false, true]) {
  available = ready;
  for (const sessionId of [undefined, "cs_test_synthetic", "invalid-reference"]) {
    const tree = await success({ searchParams: Promise.resolve({ session_id: sessionId }) });
    const [form] = elements(tree, "CarPurchaseProActivationForm");
    assert.equal(form.props.enabled, ready);
    assert.equal(form.props.initialSessionId, sessionId === "cs_test_synthetic" ? sessionId : undefined);
    assert.equal(form.props.invalidReference, sessionId === "invalid-reference");
    checks++;
  }
  const [panel] = elements(await restore(), "CarPurchaseProRecoveryPanel");
  assert.equal(panel.props.enabled, ready); checks++;
}
console.log(`PASS Car access pages: ${checks} server-render cases; availability controls activation/recovery, invalid payment references retained as invalid, no indexing/referrer caching. No browser or external calls.`);
