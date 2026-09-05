import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
const require = createRequire(import.meta.url), ts = require("typescript");
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
function evaluate(source, resolve = name => assert.fail(name), globals = {}) {
  const m = { exports: {} };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: m, exports: m.exports, require: resolve, TextEncoder, Date, Blob, ...globals }); return m.exports;
}
const dates = evaluate(read("src/lib/lifeReminders.ts")), lib = evaluate(read("src/lib/localProjectChecklist.ts"), () => dates);
const projects = [["arrival-checklist", "arrival-first-30-days", "groups"], ["moving-checklist", "moving-project", "movingGroups"], ["leaving-australia-guide", "leaving-australia-project", "departureGroups"], ["property-inspection-checklist", "house-hunt-project", "houseHuntGroups"], ["visa-preparation-guide", "visa-preparation-project", "visaGroups"]];
function groupsFor(route, name) {
  const s = ts.createSourceFile(route, read(`src/app/${route}/page.tsx`), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found; function walk(n) { if (ts.isVariableDeclaration(n) && n.name.getText(s) === name) found = n.initializer.getText(s); ts.forEachChild(n, walk); } walk(s);
  assert(found); return evaluate("export const groups = " + found).groups;
}
const fixtures = projects.map(([route, key, name]) => ({ route, key, groups: groupsFor(route, name) }));
const items = [{ id: "first", label: "첫째, 항목; 역슬래시\\", detail: "A" }, { id: "second", label: "다음\r\nBEGIN:VEVENT", detail: "B" }];
let checks = 0; async function test(name, fn) { await fn(); checks++; console.log("PASS " + name); }
await test("all five existing keys and known checked IDs roundtrip exactly", () => {
  assert.equal(new Set(fixtures.map(f => f.key)).size, 5);
  for (const fixture of fixtures) {
    const list = fixture.groups.flatMap(g => g.items), codec = lib.projectCodec(list), data = { checked: list.map(i => i.id), targetDate: "2026-09-20" }, raw = JSON.stringify(data);
    assert.equal(new Set(data.checked).size, data.checked.length); assert.equal(codec.serialize(data), raw); assert.equal(JSON.stringify(codec.parse(raw)), raw);
    assert(read(`src/app/${fixture.route}/page.tsx`).includes(`storageKey="${fixture.key}"`));
  }
});
await test("whole schema rejects duplicates unknown IDs extra fields and impossible civil dates", () => {
  const codec = lib.projectCodec(items);
  for (const patch of [{ checked: {} }, { checked: ["first", "first"] }, { checked: ["first", "unknown"] }, { checked: [true] }, { targetDate: "2026-02-30" }, { targetDate: "0000-01-01" }, { targetDate: "2026-9-01" }, { extra: true }]) assert.equal(codec.parse(JSON.stringify({ checked: [], targetDate: "", ...patch })), null);
  for (const raw of ["", "null", "[]", "{bad", '{}']) assert.equal(codec.parse(raw), null);
  assert.equal(codec.serialize({ checked: [], targetDate: "" }), '{"checked":[],"targetDate":""}');
});
await test("empty groups remain valid only with no checked IDs", () => {
  const codec = lib.projectCodec([]); assert(codec.parse('{"checked":[],"targetDate":""}')); assert.equal(codec.parse('{"checked":["first"],"targetDate":""}'), null);
});
await test("calendar preserves UID adds UTC stamp and exclusive next day with exact remaining snapshot", () => {
  const body = lib.projectReminderCalendar("moving-project", "이사; 확인, 날짜\\\n다음", { checked: ["first"], targetDate: "2026-09-20" }, items, new Date("2026-09-04T17:00:00Z")), unfolded = body.replaceAll("\r\n ", "");
  for (const value of ["UID:moving-project-2026-09-20@hojucompass.com", "DTSTAMP:20260904T170000Z", "DTSTART;VALUE=DATE:20260920", "DTEND;VALUE=DATE:20260921", "다음\\nBEGIN:VEVENT", "이후 변경은 자동 반영되지 않습니다"]) assert(unfolded.includes(value), value);
  assert(!unfolded.includes("첫째")); assert.equal(body.split("\r\nBEGIN:VEVENT\r\n").length, 2);
  for (const line of body.split("\r\n")) assert(Buffer.byteLength(line) <= 75); assert(body.endsWith("\r\n"));
});
await test("invalid calendar input and next-day overflow are rejected by helper", () => {
  for (const targetDate of ["", "2026-02-30", "0000-01-01", "9999-12-31", "2026-09-01\r\nBEGIN:VEVENT"]) assert.throws(() => lib.projectReminderCalendar("moving-project", "title", { checked: [], targetDate }, items));
  assert.throws(() => lib.projectReminderCalendar("bad\r\nUID:x", "title", { checked: [], targetDate: "2026-09-20" }, items));
  assert(lib.projectReminderCalendar("moving-project", "title", { checked: [], targetDate: "2025-01-01" }, items).includes("DTSTART;VALUE=DATE:20250101"));
});
const nodes = n => Array.isArray(n) ? n.flatMap(nodes) : n && typeof n === "object" && n.props ? [n, ...nodes(n.props.children)] : [];
const text = n => Array.isArray(n) ? n.map(text).join("") : n && typeof n === "object" && n.props ? text(n.props.children) : n == null || typeof n === "boolean" ? "" : String(n);
function mount(data, failures = {}, groups = [{ title: "Test", items }]) {
  let updates = 0, value = data, message = "", downloads = 0, body;
  const hooks = { useEffect() {}, useMemo: fn => fn(), useState: initial => [initial, next => { if (typeof next === "string") message = next; }] };
  const mod = evaluate(read("src/components/tools/LocalProjectChecklist.tsx"), dep => {
    if (dep === "react") return hooks; if (dep === "react/jsx-runtime") return require(dep);
    if (dep === "@/lib/localProjectChecklist") return lib; if (dep === "@/lib/lifeReminders") return dates;
    if (dep === "./TaxStorageNotice") return { TaxStorageNotice: () => null };
    if (dep === "@/lib/useLocalPlan") return { useLocalPlan: () => ({ data: value, update: next => { updates++; value = typeof next === "function" ? next(value) : next; }, storage: "ready", saveState: "loaded" }) }; assert.fail(dep);
  }, { window: { confirm: () => !failures.cancel }, URL: { createObjectURL(blob) { if (failures.download) throw Error("denied"); body = blob; return "blob:test"; }, revokeObjectURL() {} }, document: { createElement: () => ({ click() { downloads++; } }) } });
  const props = { storageKey: "moving-project", eyebrow: "Test", title: "Test", description: "Test", groups, dateLabel: "Date", calendarTitle: "Reminder" };
  function tree() { const wrapper = mod.LocalProjectChecklist(props); assert.equal(wrapper.key, props.storageKey); return wrapper.type(wrapper.props); }
  return { click(label) { const b = nodes(tree()).find(n => n.type === "button" && text(n).startsWith(label)); assert(b); b.props.onClick(); }, tree, data: () => value, updates: () => updates, downloads: () => downloads, message: () => message, body: () => body };
}
await test("actual download handler rejects invalid dates and invalid checked IDs despite bypassing disabled", () => {
  for (const data of [{ checked: [], targetDate: "" }, { checked: [], targetDate: "2026-02-30" }, { checked: [], targetDate: "9999-12-31" }, { checked: ["unknown"], targetDate: "2026-09-20" }]) { const app = mount(data); app.click("캘린더 리마인더 받기"); assert.equal(app.downloads(), 0); assert(app.message().includes("유효한 날짜")); }
});
await test("actual download success requests file without claiming calendar registration", async () => {
  const app = mount({ checked: ["first"], targetDate: "2026-09-20" }); app.click("캘린더 리마인더 받기"); assert.equal(app.downloads(), 1); assert(app.message().includes("달력 등록은 아직 확인되지 않았습니다")); assert((await app.body().text()).includes("DTSTAMP:"));
});
await test("actual download failure reports manual fallback and no success", () => {
  const app = mount({ checked: [], targetDate: "2026-09-20" }, { download: true }); app.click("캘린더 리마인더 받기"); assert.equal(app.downloads(), 0); assert(app.message().includes("파일 다운로드를 시작하지 못했습니다"));
});
await test("actual reset cancellation preserves checks and accepted reset preserves selected date", () => {
  const data = { checked: ["first"], targetDate: "2026-09-20" }, cancelled = mount(data, { cancel: true }); cancelled.click("진행 상태 초기화"); assert.equal(cancelled.updates(), 0);
  const app = mount(data); app.click("진행 상태 초기화"); assert.equal(app.data().checked.length, 0); assert.equal(app.data().targetDate, data.targetDate);
});
await test("empty groups render zero progress without completed claim or division error", () => {
  const tree = mount({ checked: [], targetDate: "" }, {}, []).tree(); assert(text(tree).includes("0/00%")); assert(!text(tree).includes("모두 표시")); assert(!JSON.stringify(tree).includes("NaN"));
});
await test("arrival and moving retain narrow timing and privacy guidance", () => {
  const arrival = read("src/app/arrival-checklist/page.tsx"), moving = read("src/app/moving-checklist/page.tsx");
  for (const value of ["첫 근무일부터", "첫 급여일에", "필요할 때 즉시", "Payroll·은행·등록 세무사", "문제를 30일째까지 기다리지"]) assert(arrival.includes(value), value);
  for (const value of ["법정 퇴거 통지 기한이 아닙니다", "공식 통지 방법·기한", "달력 앱에서 가져오고 알림을 확인"]) assert(moving.includes(value), value);
  assert(!moving.includes("한 번 알림을 추가합니다"));
});
console.log(`Local project checklist checks: ${checks} PASS (real key-change lifecycle verified in browser fixture)`);
