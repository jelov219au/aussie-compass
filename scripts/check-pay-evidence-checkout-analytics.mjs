import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";

// Execute the real component and submit handler. Every network, timer, analytics
// and navigation boundary is fake; this never creates a Checkout Session.
const source = readFileSync(new URL("../src/components/tools/PayEvidenceProCheckoutForm.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX,
} }).outputText;
const endpoint = "https://example.invalid/api/checkout/pay-evidence-pro";
const destination = "https://checkout.stripe.com/c/pay/cs_test_fictional";
const find = (node, predicate) => {
  if (!node || typeof node !== "object") return undefined;
  if (predicate(node)) return node;
  for (const child of [node.props?.children].flat(Infinity)) {
    const match = find(child, predicate);
    if (match) return match;
  }
};

function harness({ respond, analyticsThrows = false } = {}) {
  const state = [], refs = [], timers = new Map(), requests = [], events = [], navigations = [], order = [];
  let stateIndex = 0, refIndex = 0, timerIndex = 0;
  const exports = {};
  const form = { action: endpoint };
  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = typeof value === "function" ? value(state[index]) : value; }];
    },
    useRef(initial) { const index = refIndex++; return refs[index] ??= { current: initial }; },
  };
  const jsx = (type, props) => ({ type, props });
  runInNewContext(compiled, {
    exports, URL, AbortController,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
      if (name === "next/link") return { default: "a" };
      if (name === "@vercel/analytics") return { track(name, data) {
        order.push("analytics"); events.push({ name, data: JSON.parse(JSON.stringify(data)) });
        if (analyticsThrows) throw new Error("Fictional analytics failure");
      } };
      throw new Error(`Unexpected dependency: ${name}`);
    },
    FormData: class extends FormData {
      constructor(received) { super(); assert.equal(received, form); this.set("source", "direct"); this.set("terms_accepted", "yes"); }
    },
    fetch: async (url, options) => {
      assert.equal(url, endpoint); assert.equal(options.method, "POST");
      assert.equal(options.headers.Accept, "application/json");
      assert.equal(options.body.get("terms_accepted"), "yes");
      requests.push(options); order.push("request");
      return respond ? respond(options) : Response.json({ checkoutUrl: destination });
    },
    window: {
      setTimeout(callback, milliseconds) { assert.equal(milliseconds, 45_000); timers.set(++timerIndex, callback); return timerIndex; },
      clearTimeout(id) { timers.delete(id); },
      location: { assign(url) { navigations.push(url); order.push("navigate"); } },
    },
  });
  const render = () => { stateIndex = 0; refIndex = 0; return exports.PayEvidenceProCheckoutForm({ testMode: false, entry: "direct" }); };
  const accept = () => { find(render(), node => node.type === "input" && node.props.type === "checkbox").props.onChange({ target: { checked: true } }); };
  const submit = tree => tree.props.onSubmit({ currentTarget: form, preventDefault() {} });
  const button = () => find(render(), node => node.type === "button");
  return { render, accept, submit, button, requests, events, navigations, timers, order };
}

const initial = harness();
assert.equal(initial.render().props.action, "/api/checkout/pay-evidence-pro");
assert.equal(initial.render().props.method, "post");
assert.equal(initial.button().props.disabled, true);
await initial.submit(initial.render());
assert.equal(initial.requests.length, 0);

let resolveRequest;
const success = harness({ respond: () => new Promise(resolve => { resolveRequest = resolve; }) });
success.accept();
const sameRender = success.render();
const first = success.submit(sameRender);
await success.submit(sameRender);
assert.equal(success.requests.length, 1, "same-render repeated submits must not create duplicate requests");
assert.equal(success.button().props.disabled, true);
assert.equal(success.button().props["aria-busy"], true);
assert.equal(success.events.length, 0, "submitting is not confirmed Checkout entry");
resolveRequest(Response.json({ checkoutUrl: destination }));
await first;
assert.deepEqual(success.order, ["request", "analytics", "navigate"]);
assert.deepEqual(success.events, [{ name: "Checkout Started", data: { product: "pay_evidence_pro", entry: "direct" } }]);
assert.deepEqual(success.navigations, [destination]);
assert.equal(success.timers.size, 0);
await success.submit(success.render());
assert.equal(success.requests.length, 1, "navigation pending must stay locked");

const failures = [
  ["server failure", () => Response.json({ checkoutUrl: destination }, { status: 503 })],
  ["bad JSON", () => new Response("not json")],
  ["missing destination", () => Response.json({})],
  ["non-string", () => Response.json({ checkoutUrl: { url: destination } })],
  ...["http://checkout.stripe.com/c/pay/fake", "https://checkout.stripe.com.evil.invalid/c/pay/fake", "https://evil.invalid", "https://user:secret@checkout.stripe.com/c/pay/fake", "https://checkout.stripe.com:444/c/pay/fake", "/relative", "javascript:alert(1)"].map(url => [url, () => Response.json({ checkoutUrl: url })]),
  ["network failure", () => { throw new Error("Fictional offline failure"); }],
];
for (const [name, respond] of failures) {
  const failed = harness({ respond }); failed.accept(); await failed.submit(failed.render());
  assert.equal(failed.events.length, 0, `${name}: no checkout event`);
  assert.equal(failed.navigations.length, 0, `${name}: no navigation`);
  assert.equal(failed.timers.size, 0, `${name}: timer cleanup`);
  assert.equal(failed.button().props.disabled, false, `${name}: explicit retry remains available`);
  const status = find(failed.render(), node => node.props?.role === "status");
  assert.ok(status, `${name}: visible failure status`);
  assert.ok(find(status, node => node.props?.href === "/payment-help"));
}

const timeout = harness({ respond: ({ signal }) => new Promise((resolve, reject) => {
  signal.addEventListener("abort", () => reject(new Error("Fictional timeout")), { once: true });
}) });
timeout.accept(); const pending = timeout.submit(timeout.render());
for (const callback of timeout.timers.values()) callback();
await pending;
assert.equal(timeout.requests[0].signal.aborted, true);
assert.equal(timeout.events.length, 0);
assert.equal(timeout.navigations.length, 0);
assert.equal(timeout.timers.size, 0);
assert.equal(timeout.button().props.disabled, false);

const analytics = harness({ analyticsThrows: true }); analytics.accept(); await analytics.submit(analytics.render());
assert.deepEqual(analytics.navigations, [destination], "analytics failure must not strand a verified checkout");
console.log(`Pay Evidence real submit handler passed: consent, duplicate/navigation lock, confirmed event order, ${failures.length} failure cases, timeout and analytics failure; external requests: 0.`);
