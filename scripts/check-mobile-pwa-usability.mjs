import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

// Execute real component handlers with isolated hook/event doubles. This verifies
// state transitions, not browser layout, React hydration or an OS install dialog.
async function harness(path, name) {
  const source = await read(path);
  const slots = [];
  const listeners = new Map();
  const cleanups = [];
  const analytics = [];
  let cursor = 0;
  let focusCount = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [slots[index], (next) => { slots[index] = typeof next === "function" ? next(slots[index]) : next; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in slots)) {
        slots[index] = true;
        cleanups.push(effect());
      }
    },
  };
  const jsx = (type, props) => ({ type, props });
  const testModule = { exports: {} };
  const imports = {
    react: hooks,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@vercel/analytics": { track: (...args) => analytics.push(args) },
    "next/link": "a",
    "@/content": { getContent: () => ({ brand: { name: "HojuCompass" }, nav: { tools: "도구", guides: "가이드" } }) },
    "@/components/ui/Container": { Container: "div" },
  };
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText, {
    module: testModule, exports: testModule.exports,
    require: (id) => {
      assert.ok(id in imports, `Unexpected import ${id}`);
      return imports[id];
    },
    window: {
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); },
    },
  });
  function nodes(node) {
    if (Array.isArray(node)) return node.flatMap(nodes);
    if (!node || typeof node !== "object") return [];
    return [node, ...nodes(node.props?.children)];
  }
  return {
    render() {
      cursor = 0;
      const tree = nodes(testModule.exports[name]());
      for (const node of tree) {
        if (node.props?.ref) node.props.ref.current = { focus: () => { focusCount++; } };
      }
      return tree;
    },
    emit: (type, event = {}) => listeners.get(type)?.(event),
    cleanup: () => cleanups.forEach((fn) => fn?.()),
    listeners, analytics,
    focusCount: () => focusCount,
  };
}

const find = (tree, type) => tree.find((node) => node.type === type);
const text = (node) => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" ? text(node.props?.children) : node ?? "";
const touchSize = (node) => assert.match(node.props.className, /min-h-1[12]/, "Action needs a 44px+ minimum height");

const header = await harness("src/components/layout/Header.tsx", "Header");
let tree = header.render();
assert.match(text(find(tree, "button")), /메뉴/);
assert.equal(find(tree, "button").props["aria-expanded"], false);
find(tree, "button").props.onClick();
tree = header.render();
assert.equal(find(tree, "button").props["aria-expanded"], true);
assert.match(text(find(tree, "button")), /닫기/);
assert.match(tree.find((node) => node.props?.id === "mobile-menu").props.className, /100dvh.*overflow-y-auto/);
for (const action of tree.filter((node) => ["a", "button"].includes(node.type))) touchSize(action);
let prevented = false;
find(tree, "header").props.onKeyDown({ key: "Escape", preventDefault: () => { prevented = true; } });
assert.equal(prevented, true);
assert.equal(header.focusCount(), 1);
assert.equal(find(header.render(), "button").props["aria-expanded"], false);
find(header.render(), "button").props.onClick();
tree = header.render();
tree.find((node) => node.props?.href === "/resume-builder").props.onClick();
assert.equal(find(header.render(), "button").props["aria-expanded"], false);

const picker = await harness("src/components/tools/VehicleInspectionProviderPicker.tsx", "VehicleInspectionProviderPicker");
tree = picker.render();
assert.equal(find(tree, "article"), undefined);
const select = find(tree, "select");
assert.equal(select.props["aria-controls"], "inspection-pathway");
touchSize(select);
const expectedHosts = { NSW: "www.mynrma.com.au", VIC: "www.racv.com.au", QLD: "www.racq.com.au", WA: "rac.com.au", SA: "www.raa.com.au", TAS: "www.ract.com.au", ACT: "www.mynrma.com.au", NT: "www.aant.com.au" };
assert.equal(tree.filter((node) => node.type === "option").length, 9);
for (const [region, host] of Object.entries(expectedHosts)) {
  select.props.onChange({ target: { value: region } });
  tree = picker.render();
  assert.equal(tree.filter((node) => node.type === "article").length, 1);
  const link = find(tree, "a");
  assert.equal(new URL(link.props.href).hostname, host);
  assert.equal(link.props.target, "_blank");
  assert.equal(link.props.rel, "noreferrer");
  assert.match(text(link), /새 창/);
  assert.equal(link.props["aria-describedby"], "inspection-return-help");
  assert.match(text(tree.find((node) => node.props?.id === "inspection-return-help")), /다시 선택/);
  touchSize(link);
  if (["NSW", "ACT"].includes(region)) assert.match(text(find(tree, "article")), /visual and non-mechanical/);
}
select.props.onChange({ target: { value: "" } });
assert.equal(find(picker.render(), "article"), undefined);

for (const outcome of ["accepted", "dismissed", "prompt-error", "choice-error"]) {
  const install = await harness("src/components/pwa/InstallAppButton.tsx", "InstallAppButton");
  tree = install.render();
  assert.equal(find(tree, "button"), undefined, "No inert install button before a browser offer");
  assert.equal(find(tree, "a").props.href, "#manual-install");
  let prompts = 0;
  let release;
  const wait = new Promise((resolve) => { release = resolve; });
  install.emit("beforeinstallprompt", {
    preventDefault() {},
    async prompt() { prompts++; await wait; if (outcome === "prompt-error") throw new Error("synthetic"); },
    get userChoice() { return outcome === "choice-error" ? Promise.reject(new Error("synthetic")) : Promise.resolve({ outcome }); },
  });
  tree = install.render();
  const button = find(tree, "button");
  touchSize(button);
  const pending = button.props.onClick();
  await button.props.onClick();
  assert.equal(prompts, 1, "Rapid clicks must not reuse a single-use prompt");
  assert.equal(find(install.render(), "button").props.disabled, true);
  release();
  await pending;
  tree = install.render();
  assert.equal(find(tree, "button"), undefined);
  assert.equal(install.focusCount(), 1);
  const status = tree.find((node) => node.props?.role === "status");
  assert.match(text(status), outcome === "accepted" ? /설치 요청/ : outcome === "dismissed" ? /취소/ : /열지 못했습니다/);
  install.emit("appinstalled");
  assert.match(text(install.render().find((node) => node.props?.role === "status")), /추가되었습니다/);
  install.cleanup();
  assert.equal(install.listeners.size, 0, "Remove both global listeners on unmount");
}

const page = await read("src/app/install/page.tsx");
assert.match(page, /id="manual-install" tabIndex=\{-1\}/);
for (const boundary of ["기기·브라우저·설치본별", 'href="/data-transfer"', "구매 권한은 백업으로 이전되지", "오프라인 재실행", "항상 설치형 앱으로 열리는 것은 아닙니다", "iphea86e5236", "ipad8f1f7a29", "9658361"]) {
  assert.ok(page.includes(boundary), `Missing install boundary: ${boundary}`);
}
console.log("Mobile/PWA handler and source contracts passed: menu, eight regions, install fallback/accept/dismiss/errors/double-click/cleanup. Actual device and viewport verification are separate.");
