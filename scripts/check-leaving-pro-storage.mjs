import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import * as storage from "../src/lib/leavingAustraliaProStorage.ts";
import * as dependencies from "../src/lib/leavingAustraliaDependencies.ts";
import * as amounts from "../src/lib/leavingAustraliaProAmounts.ts";

const { readLeavingDraft, writeLeavingDraft, createLeavingArchive, parseLeavingArchive, leavingStorageKey: key, leavingArchiveMaxBytes: limit } = storage;
const ts = createRequire(import.meta.url)("typescript");
const source = await readFile(new URL("../src/components/tools/LeavingAustraliaProWorkspace.tsx", import.meta.url), "utf8");
const helperSource = await readFile(new URL("../src/lib/leavingAustraliaProStorage.ts", import.meta.url), "utf8");
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
const draft = { departureDate: "2026-09-01", destination: "Synthetic destination", statuses: { bond: "waiting" }, settlements: [{ id: "s1", kind: "Bond", label: "Synthetic bond", dueDate: "", amount: "", status: "expected", note: "" }], questions: ["Synthetic question"] };
const raw = JSON.stringify(draft);
const restored = { ...draft, destination: "Restored destination", questions: ["Restored question"] };
const archive = createLeavingArchive(restored);

const invalid = ["", "{broken", "null", "[]", "true", JSON.stringify({ ...draft, settlements: null }), JSON.stringify({ ...draft, questions: [42] }), JSON.stringify({ ...draft, statuses: { bond: "invalid" } }), JSON.stringify({ ...draft, settlements: [draft.settlements[0], draft.settlements[0]] }), JSON.stringify({ ...draft, settlements: [{ ...draft.settlements[0], note: {} }] })];
for (const original of invalid) {
  const result = readLeavingDraft(() => ({ getItem: () => original, setItem: () => assert.fail("Load must not write") }));
  assert.equal(result.kind, "blocked"); assert.equal(result.original, original);
}
assert.equal(readLeavingDraft(() => ({ getItem: () => null })).kind, "empty");
assert.deepEqual(readLeavingDraft(() => { throw new Error("denied"); }), { kind: "blocked", original: null });
const unfinished = { ...draft, retainedLocal: "keep", departureDate: "not a date", settlements: [{ ...draft.settlements[0], amount: "-1.234", note: "가".repeat(2000), retainedLocal: "keep" }] };
assert.deepEqual(readLeavingDraft(() => ({ getItem: () => JSON.stringify(unfinished) })).draft, unfinished);
assert.equal(writeLeavingDraft(() => { throw new Error("denied"); }, draft, null).kind, "failed");
assert.equal(writeLeavingDraft(() => ({ getItem: () => "other", setItem: () => assert.fail("Conflict must not write") }), draft, raw).kind, "conflict");
assert.equal(writeLeavingDraft(() => ({ getItem: () => null, setItem: () => assert.fail("Deleted data must not be recreated") }), draft, raw).kind, "conflict");
const cyclic = { ...draft }; cyclic.questions = [cyclic];
assert.equal(writeLeavingDraft(() => assert.fail("Serialize before accessing storage"), cyclic, raw).kind, "failed");
assert.deepEqual(parseLeavingArchive(createLeavingArchive(draft)), draft);
assert.deepEqual(parseLeavingArchive(createLeavingArchive(unfinished)), { ...draft, departureDate: "not a date", settlements: [{ ...draft.settlements[0], amount: "-1.234", note: "가".repeat(2000) }] });
const privateExtras = { ...draft, accessToken: "synthetic-secret", statuses: { ...draft.statuses, unknown: "done" }, settlements: [{ ...draft.settlements[0], accountNumber: "synthetic-private" }] };
const exported = createLeavingArchive(privateExtras);
assert(!exported.includes("synthetic-secret") && !exported.includes("synthetic-private") && !exported.includes("unknown"));
assert.deepEqual(parseLeavingArchive(JSON.stringify({ format: "hoju-compass-leaving-pro", version: 1, draft: privateExtras, recoveryCode: "synthetic" })), draft);
for (const value of ["{broken", "null", JSON.stringify({ format: "hoju-compass-eofy-pro", version: 1, draft }), JSON.stringify({ format: "hoju-compass-leaving-pro", version: 2, draft }), JSON.stringify({ format: "hoju-compass-leaving-pro", version: 1, draft: { ...draft, questions: null } })]) assert.throws(() => parseLeavingArchive(value));
const minimal = { ...draft, destination: "" };
const overhead = new Blob([createLeavingArchive(minimal)]).size;
const exact = createLeavingArchive({ ...minimal, destination: "x".repeat(limit - overhead) });
assert.equal(new Blob([exact]).size, limit); assert.equal(parseLeavingArchive(exact).destination.length, limit - overhead);
assert.throws(() => createLeavingArchive({ ...minimal, destination: "x".repeat(limit - overhead + 1) }));
assert.throws(() => parseLeavingArchive(exact + " "));
assert.throws(() => createLeavingArchive({ ...draft, destination: "한".repeat(Math.ceil(limit / 3)) }));

// Execute the real component/helper with deterministic hooks, storage, files and timers.
// This is not a React renderer, browser, native download or physical-device acceptance test.
function mount(original = raw, initialFault = "none", componentSource = source) {
  const values = new Map([["another-product", "unchanged"]]);
  if (original !== null) values.set(key, original);
  const state = { fault: initialFault, attempts: 0, writes: 0, reads: 0, confirms: 0, answer: false, downloads: [], downloadFault: "none", requests: 0, revoked: [], updatesAfterUnmount: 0, removed: 0, onConfirm: null };
  const hooks = [], timers = new Map();
  let cursor = 0, sequence = 0, dirty = true, effects = [], tree, mounted = true;
  const equal = (left, right) => left && right && left.length === right.length && left.every((value, index) => Object.is(value, right[index]));
  const react = {
    useState(initial) {
      const index = cursor++; hooks[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [hooks[index].value, value => {
        if (!mounted) state.updatesAfterUnmount++;
        const next = typeof value === "function" ? value(hooks[index].value) : value;
        if (!Object.is(hooks[index].value, next)) { hooks[index].value = next; dirty = true; }
      }];
    },
    useRef(value) { const index = cursor++; hooks[index] ??= { current: value }; return hooks[index]; },
    useMemo(factory, deps) { const index = cursor++; if (!equal(hooks[index]?.deps, deps)) hooks[index] = { value: factory(), deps }; return hooks[index].value; },
    useEffect(effect, deps) {
      const index = cursor++;
      if (!equal(hooks[index]?.deps, deps)) effects.push(() => { hooks[index]?.cleanup?.(); hooks[index] = { deps, effect, cleanup: effect() }; });
    },
  };
  const browserWindow = {
    get localStorage() {
      if (state.fault === "denied") throw new Error("storage denied");
      return {
        getItem(name) { state.reads++; if (state.fault === "read") throw new Error("read denied"); return values.get(name) ?? null; },
        setItem(name, value) { state.attempts++; assert.equal(name, key); if (state.fault === "quota") throw new Error("quota"); values.set(name, value); state.writes++; },
      };
    },
    setTimeout(callback, delay) { timers.set(++sequence, { callback, delay }); return sequence; },
    clearTimeout(id) { timers.delete(id); },
    confirm() { state.confirms++; state.onConfirm?.(); return state.answer; },
  };
  const globals = {
    window: browserWindow, Blob, Error, URL: {
      createObjectURL(blob) { if (state.downloadFault === "url") throw new Error("URL unavailable"); state.downloads.push({ blob }); return `blob:synthetic-${state.downloads.length}`; },
      revokeObjectURL(url) { state.revoked.push(url); if (state.downloadFault === "revoke") throw new Error("cleanup denied"); },
    },
    document: {
      body: { appendChild() { if (state.downloadFault === "append") throw new Error("append denied"); } },
      createElement() {
        if (state.downloadFault === "anchor") throw new Error("anchor unavailable");
        return { click() { if (state.downloadFault === "click") throw new Error("click denied"); state.downloads.at(-1).filename = this.download; state.requests++; }, remove() { state.removed++; } };
      },
    },
    crypto: { randomUUID: () => `synthetic-${++sequence}` },
  };
  const helpers = {};
  runInNewContext(compile(helperSource), { ...globals, exports: helpers });
  const exports = {};
  runInNewContext(compile(componentSource), {
    ...globals, exports, require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
      if (name === "@/lib/leavingAustraliaProStorage") return helpers;
      if (name === "@/lib/leavingAustraliaDependencies") return dependencies;
      if (name === "@/lib/leavingAustraliaProAmounts") return amounts;
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  function settle() {
    let renders = 0;
    while (dirty) { assert(++renders < 30); dirty = false; cursor = 0; effects = []; tree = exports.LeavingAustraliaProWorkspace(); for (const effect of effects) effect(); }
  }
  const text = node => node == null || typeof node === "boolean" ? "" : typeof node !== "object" ? String(node) : Array.isArray(node) ? node.map(text).join("") : text(node.props?.children);
  function find(predicate, node = tree) {
    if (node == null || typeof node !== "object") return null;
    if (!Array.isArray(node) && predicate(node)) return node;
    for (const child of Array.isArray(node) ? node : [node.props?.children]) { const found = find(predicate, child ?? null); if (found) return found; }
    return null;
  }
  const button = label => { const node = find(node => node.type === "button" && text(node) === label); assert(node, `Button exists: ${label}`); return node; };
  settle();
  return {
    state, values, timers, find, button,
    text: () => text(tree), status: () => text(find(node => node.props?.role === "status")),
    destination: () => find(node => node.type === "input" && node.props.placeholder === "예: 한국 귀국").props.value,
    edit(value) { find(node => node.type === "input" && node.props.placeholder === "예: 한국 귀국").props.onChange({ target: { value } }); settle(); },
    editAmount(value) { find(node => node.type === "input" && node.props.inputMode === "decimal").props.onChange({ target: { value } }); settle(); },
    editSettlementStatus(value) { find(node => node.type === "select" && node.props.value === hooks[0].value.settlements[0].status).props.onChange({ target: { value } }); settle(); },
    click(label) { button(label).props.onClick(); settle(); },
    tick(delay = 350) { for (const [id, timer] of [...timers]) { if (timer.delay <= delay) { timers.delete(id); timer.callback(); } } settle(); },
    strictReplay() { const active = hooks.filter(hook => hook?.effect); for (const hook of active) hook.cleanup?.(); for (const hook of active) hook.cleanup = hook.effect(); settle(); },
    unmount() { for (const hook of hooks) hook?.cleanup?.(); mounted = false; },
    async flush() { await new Promise(resolve => setImmediate(resolve)); if (mounted) settle(); },
    select(file) { const input = find(node => node.type === "input" && node.props.type === "file"); const target = { value: "synthetic.json", files: file ? [file] : [] }; input.props.onChange({ currentTarget: target }); assert.equal(target.value, ""); settle(); },
    async review(contents = archive) { this.select({ size: new Blob([contents]).size, text: async () => contents }); await this.flush(); },
  };
}

if (process.env.LEAVING_BEFORE_SOURCE) {
  const before = await readFile(process.env.LEAVING_BEFORE_SOURCE, "utf8");
  const app = mount("{broken", "none", before); app.tick();
  assert.equal(app.values.get(key), "{broken", "Existing unreadable draft must never be overwritten by the initial empty screen");
}

for (const original of invalid) {
  const app = mount(original); app.strictReplay(); app.edit("Working draft"); app.tick();
  assert.match(app.status(), /원본 보호/); assert.equal(app.state.writes, 0); assert.equal(app.state.reads, 1);
  assert.equal(app.values.get(key), original);
  app.click("저장 원본 내려받기"); assert.equal(await app.state.downloads.at(-1).blob.text(), original);
  app.click("현재 화면으로 저장 재개"); assert.equal(app.state.writes, 0);
  app.state.answer = true; app.state.fault = "quota"; app.click("현재 화면으로 저장 재개"); app.tick();
  assert.match(app.status(), /원본 보호/); assert.equal(app.values.get(key), original);
  app.state.fault = "read"; app.click("현재 화면으로 저장 재개");
  app.state.downloads = []; app.click("저장 원본 내려받기"); assert.equal(await app.state.downloads.at(-1).blob.text(), original);
  app.state.fault = "none"; app.click("현재 화면으로 저장 재개"); app.tick();
  assert.equal(JSON.parse(app.values.get(key)).destination, "Working draft"); assert.equal(app.values.get("another-product"), "unchanged");
}
for (const fault of ["denied", "read"]) {
  const app = mount(raw, fault); app.edit("Unsaved"); app.tick(); assert.match(app.status(), /원본 보호/); assert.equal(app.values.get(key), raw);
  app.click("현재 화면으로 저장 재개"); assert.equal(app.state.confirms, 0);
  app.click("현재 기록 백업"); assert.equal(parseLeavingArchive(await app.state.downloads.at(-1).blob.text()).destination, "Unsaved");
  app.state.fault = "none"; app.state.answer = true; app.click("현재 화면으로 저장 재개"); assert.equal(JSON.parse(app.values.get(key)).destination, "Unsaved");
}
for (const original of [null, raw, JSON.stringify(unfinished)]) {
  const app = mount(original); app.strictReplay(); app.tick(); assert.equal(app.state.writes, 0); assert.equal(app.state.reads, 1);
  app.edit("Latest"); app.edit("Newest"); app.tick(); assert.equal(app.state.writes, 1); assert.equal(JSON.parse(app.values.get(key)).destination, "Newest");
  if (original === JSON.stringify(unfinished)) assert.equal(JSON.parse(app.values.get(key)).retainedLocal, "keep");
}
{
  const app = mount(); app.state.fault = "quota"; app.edit("Unsaved"); app.tick(); assert.match(app.status(), /저장 실패/); assert.equal(app.values.get(key), raw);
  app.state.fault = "none"; app.click("저장 다시 시도"); assert.equal(app.state.confirms, 0); assert.equal(JSON.parse(app.values.get(key)).destination, "Unsaved");
}
for (const external of [null, JSON.stringify(restored), "{external broken"]) {
  const app = mount(); app.edit("Unsaved"); if (external === null) app.values.delete(key); else app.values.set(key, external); app.tick();
  assert.match(app.status(), /원본 보호/); assert.equal(app.values.get(key) ?? null, external); assert.equal(app.state.writes, 0);
  app.click("현재 화면으로 저장 재개"); assert.equal(app.state.writes, 0);
  app.state.answer = true; app.state.onConfirm = () => app.values.set(key, "changed during confirmation"); app.click("현재 화면으로 저장 재개");
  assert.equal(app.values.get(key), "changed during confirmation"); assert.equal(app.state.writes, 0);
}
{
  const app = mount(); app.click("현재 순서 검토 확인"); app.edit("Pending edit"); await app.review();
  assert.equal(app.destination(), "Pending edit"); assert.equal(app.values.get(key), raw);
  app.state.fault = "quota"; app.click("확인한 백업으로 현재 기록 교체"); app.tick();
  assert.equal(app.destination(), "Pending edit"); assert.equal(app.values.get(key), raw); assert.match(app.text(), /복원 후보/);
  app.state.fault = "none"; app.click("확인한 백업으로 현재 기록 교체"); app.tick();
  assert.equal(app.destination(), restored.destination); assert.deepEqual(JSON.parse(app.values.get(key)), restored); assert.equal(app.state.writes, 1);
  app.click("귀국 준비 요약 저장"); assert.equal(app.state.requests, 0); assert.match(app.text(), /먼저 현재 기록/);
  assert.equal(mount(app.values.get(key)).destination(), restored.destination);
}
{
  const app = mount("{broken"); await app.review(); app.click("확인한 백업으로 현재 기록 교체"); assert.equal(app.values.get(key), "{broken");
  app.state.answer = true; app.click("확인한 백업으로 현재 기록 교체"); assert.deepEqual(JSON.parse(app.values.get(key)), restored);
}
for (const invalidFile of ["{broken", "{}", exact + " "]) {
  const app = mount(); await app.review(invalidFile); assert.equal(app.values.get(key), raw); assert.equal(app.destination(), draft.destination); assert(!app.text().includes("확인한 백업으로 현재 기록 교체"));
}
{
  const app = mount(); let resolve;
  app.select({ size: 1, text: () => new Promise(done => { resolve = done; }) }); await app.review(); resolve(createLeavingArchive(draft)); await app.flush();
  app.click("확인한 백업으로 현재 기록 교체"); assert.equal(app.destination(), restored.destination);
}
for (const action of ["cancel", "empty", "oversize", "unmount"]) {
  const app = mount(); let resolve;
  app.select({ size: 1, text: () => new Promise(done => { resolve = done; }) });
  if (action === "cancel") app.click("복원 검토 취소");
  if (action === "empty") app.select(null);
  if (action === "oversize") app.select({ size: limit + 1, text: () => assert.fail("Oversized file must not be read") });
  if (action === "unmount") app.unmount();
  resolve(archive); await app.flush(); assert.equal(app.values.get(key), raw); assert.equal(app.state.updatesAfterUnmount, 0);
  assert(!app.text().includes("확인한 백업으로 현재 기록 교체"));
}
{
  const app = mount(); let reject;
  app.select({ size: 1, text: () => new Promise((_, fail) => { reject = fail; }) });
  await app.review(); reject(new Error("stale read failure")); await app.flush();
  assert.match(app.text(), /복원 후보/); app.click("복원 검토 취소");
  app.select({ size: 1, text: async () => { throw new Error("current read failure"); } }); await app.flush();
  assert(!app.text().includes("확인한 백업으로 현재 기록 교체")); assert.equal(app.values.get(key), raw);
  // File metadata alone is insufficient: check the actual UTF-8 payload as well.
  app.select({ size: 1, text: async () => exact + " " }); await app.flush();
  assert(!app.text().includes("확인한 백업으로 현재 기록 교체")); assert.equal(app.values.get(key), raw);
}
{
  const app = mount(); app.click("현재 순서 검토 확인"); await app.review(); app.state.fault = "quota";
  app.click("확인한 백업으로 현재 기록 교체");
  app.click("귀국 준비 요약 저장"); assert.equal(app.state.requests, 1, "Failed restore preserves the current review acknowledgement");
  app.state.fault = "none"; app.click("확인한 백업으로 현재 기록 교체");
  app.click("귀국 준비 요약 저장"); assert.equal(app.state.requests, 1, "Successful restore requires a new review");
}
{
  const app = mount(); app.edit("한".repeat(Math.ceil(limit / 3))); app.click("현재 기록 백업");
  assert.equal(app.state.requests, 0); assert.match(app.text(), /한도를 넘었습니다/); assert.equal(app.values.get(key), raw);
  assert.equal(app.destination().length, Math.ceil(limit / 3));
  app.unmount(); app.tick(); assert.equal(app.state.writes, 0, "Unmount cancels the pending draft write");
}
for (const fault of ["url", "anchor", "append", "click"]) {
  const app = mount(); app.state.downloadFault = fault; app.click("현재 기록 백업");
  assert.equal(app.state.requests, 0); assert.equal(app.values.get(key), raw); assert.match(app.text(), /시작하지 못했습니다/);
  if (fault !== "url") assert.equal(app.state.revoked.length, 1);
  app.state.downloadFault = "none"; app.click("현재 기록 백업"); assert.deepEqual(parseLeavingArchive(await app.state.downloads.at(-1).blob.text()), draft);
  assert.equal(app.state.requests, 1); app.tick(30_000); assert.equal(app.state.revoked.length, fault === "url" ? 1 : 2);
  app.click("현재 순서 검토 확인"); app.state.downloadFault = fault; app.click("귀국 준비 요약 저장"); assert.equal(app.state.requests, 1);
  app.state.downloadFault = "none"; app.click("귀국 준비 요약 저장"); assert.equal(app.state.requests, 2);
}
{
  const app = mount(); app.state.downloadFault = "revoke"; app.click("현재 기록 백업");
  assert.equal(app.state.revoked.length, 0); app.tick(30_000); assert.equal(app.state.revoked.length, 1);
  assert.equal(app.state.requests, 1); assert.equal(app.values.get(key), raw);
}
// Amount edits use a text input so the browser cannot replace invalid text with ''.
// Exercise the real component summary/download and unchanged storage/archive paths.
for (const value of ["", "0", "bad", "1.", "1e", "-1", "1.005", "0.10", "90071992547409.90", "90071992547409.91", "90071992547409.92", "1e309"]) {
  const app = mount(); app.editAmount(value); app.tick();
  assert.equal(app.find(node => node.type === "input" && node.props.inputMode === "decimal").props.type, "text");
  const field = app.find(node => node.type === "input" && node.props.inputMode === "decimal");
  assert.equal(field.props.value, value);
  assert.equal(field.props["aria-invalid"], ["invalid", "incomplete"].includes(amounts.parseLeavingAmount(value).kind));
  for (const id of field.props["aria-describedby"].split(" ")) assert(app.find(node => node.props?.id === id));
  assert.equal(JSON.parse(app.values.get(key)).settlements[0].amount, value);
  assert(app.text().includes(amounts.describeLeavingAmount(value)));
  if (value === "0") assert(app.text().includes("A$0.00"));
  if (amounts.parseLeavingAmount(value).kind !== "valid") { assert(app.text().includes("합산 가능한 금액 없음")); assert(!app.text().includes("A$0.00")); }
  app.click("현재 순서 검토 확인"); app.click("귀국 준비 요약 저장");
  const summary = await app.state.downloads.at(-1).blob.text();
  assert(summary.includes(amounts.describeLeavingAmount(value)));
  assert(summary.includes("미수령 유효 입력 소계 · 검증 안 됨"));
  if (amounts.parseLeavingAmount(value).kind !== "valid") assert(!summary.includes("A$0.00"));
  app.click("현재 기록 백업");
  const backup = await app.state.downloads.at(-1).blob.text();
  assert.equal(parseLeavingArchive(backup).settlements[0].amount, value);
  const fresh = mount(null); await fresh.review(backup); fresh.click("확인한 백업으로 현재 기록 교체");
  assert.equal(JSON.parse(fresh.values.get(key)).settlements[0].amount, value);
  assert(fresh.text().includes(amounts.describeLeavingAmount(value)));
}
{
  const rows = ["0.10", "0.20", "", "bad", "1.", "0", "99"].map((amount, index) => ({ ...draft.settlements[0], id: `amount-${index}`, amount, status: index === 6 ? "received" : index === 1 ? "followup" : "expected" }));
  const app = mount(JSON.stringify({ ...draft, settlements: rows }));
  assert(app.text().includes("A$0.30"));
  assert(app.text().includes("미수령 6건 중 포함 3건 · 미입력 1건 · 입력 중 1건 · 오류 1건 · 수령 완료 1건은 소계 제외"));
  app.click("현재 순서 검토 확인"); app.click("귀국 준비 요약 저장");
  const summary = await app.state.downloads.at(-1).blob.text();
  assert(summary.includes("검증 안 됨: A$0.30"));
  assert(summary.includes("미수령 소계 제외 (수령 완료)"));
  app.editAmount("0.11"); app.click("귀국 준비 요약 저장");
  assert.equal(app.state.requests, 1, "Amount edit invalidates the existing review");
  app.editSettlementStatus("received"); assert(app.text().includes("A$0.20"));
  app.editSettlementStatus("followup"); assert(app.text().includes("A$0.31"));
}
{
  const app = mount(); app.editSettlementStatus("received");
  assert(app.text().includes("미수령 항목 없음"));
  app.editAmount("bad"); assert(app.text().includes('합계 미포함 · 원문 "bad"'));
}
console.log("Leaving draft protection, conflicts, archive/restore/download recovery and amount UI/summary persistence checks passed (synthetic hooks/files/storage; no browser acceptance).");
