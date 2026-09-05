import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { randomUUID } from "node:crypto";
const require = createRequire(import.meta.url), ts = require("typescript");
process.env.TZ = "Australia/Sydney";
const now = "2026-09-04T16:00:00.000Z";
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return Date.parse(now); } }
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
function load(file, resolve = name => assert.fail(name), globals = {}) {
  const record = { exports: {} };
  runInNewContext(ts.transpileModule(read(file), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: record, exports: record.exports, require: resolve, Date: FixedDate, TextEncoder, ...globals });
  return record.exports;
}
const dates = load("src/lib/lifeReminders.ts"), recordsLib = load("src/lib/taxPrepStorage.ts", () => dates), checklist = load("src/lib/taxReturnChecklist.ts");
const calendar = load("src/lib/taxTimeCalendar.ts", name => name.endsWith("lifeReminders") ? dates : recordsLib);
const fixture = { id: "record-1", date: "2026-08-12", kind: "expense", category: "기존의 다른 정상 분류", description: "안전화 · 원본 이메일", amount: 45.9, evidence: "saved", createdAt: "2026-08-12T03:00:00.000Z" };
let checks = 0;
async function test(label, fn) { await fn(); checks++; console.log(`PASS ${label}`); }
await test("local civil today and June 30 / July 1 financial year boundary", () => { assert.equal(dates.todayDate(), "2026-09-05"); assert.equal(recordsLib.financialYearStart("2026-06-30"), 2025); assert.equal(recordsLib.financialYearStart("2026-07-01"), 2026); });
await test("valid legacy full record including unfamiliar category stays unchanged", () => { const raw = JSON.stringify([fixture]); assert.equal(JSON.stringify(recordsLib.parseTaxRecords(raw)), raw); assert.equal(recordsLib.serializeTaxRecords([fixture]), raw); });
await test("entire malformed records fail without silent partial filtering", () => {
  for (const change of [{ date: "2026-02-30" }, { date: "2026-2-03" }, { amount: Infinity }, { amount: 0.001 }, { amount: -5 }, { kind: "tax" }, { evidence: "yes" }, { category: null }, { description: "x".repeat(121) }, { id: "" }, { createdAt: "today" }, { extra: true }]) assert.equal(recordsLib.parseTaxRecords(JSON.stringify([fixture, { ...fixture, id: "bad", ...change }])), null);
  assert.equal(recordsLib.parseTaxRecords(JSON.stringify([fixture, fixture])), null);
});
await test("rounding zero overflow and sum exceeding safe cents are refused", () => { for (const value of ["0.001", "1e308", "Infinity", "", "0x20", "-1"]) assert.equal(recordsLib.recordAmount(value), null); assert.equal(recordsLib.recordAmount("10.126"), 10.13); assert.equal(recordsLib.recordTotals([{ ...fixture, amount: 50000000000000 }, { ...fixture, amount: 50000000000000 }]), null); assert.equal(recordsLib.recordTotals([{ ...fixture, amount: 0.1 }, { ...fixture, amount: 0.2 }]).expenses, 0.3); });
await test("CSV neutralizes formulas including leading whitespace, tabs and line breaks", () => {
  for (const description of ["=HYPERLINK(\"https://example.test\")", "+1+1", "-1+1", "@SUM(A1)", "  =1+1", "\t=1+1", "\r\n=1+1"]) { const csv = recordsLib.taxRecordsCsv([{ ...fixture, description }]); assert(csv.includes(`"'${description.replaceAll('"', '""')}"`)); }
  assert(recordsLib.taxRecordsCsv([fixture]).startsWith("\uFEFF")); assert(recordsLib.taxRecordsCsv([fixture]).includes('"45.90"')); assert(recordsLib.taxRecordsCsv([fixture]).includes("원본 증빙을 따로 보관함"));
});
await test("checklist preserves all twelve legacy ids and rejects unknown duplicate object/null", () => {
  const ids = ["income-statement", "bank-interest", "other-income", "complex-income", "work-expenses", "home-office", "car-travel", "education-donations", "prefill-review", "lodge-choice", "deadline", "records"];
  assert.equal(JSON.stringify(checklist.taxChecklistIds), JSON.stringify(ids)); assert.equal(JSON.stringify(checklist.parseTaxChecklist(JSON.stringify(ids))), JSON.stringify(ids));
  for (const raw of ["", "null", "{}", '["unknown"]', '["records","records"]', '[1]']) assert.equal(checklist.parseTaxChecklist(raw), null);
});
await test("September 2026 recent return means 2025–26 and 2026 dates; ledger means 2026–27 and 2027", () => { assert.equal(calendar.defaultTaxYear("recent-return", "2026-09-05"), 2025); assert.equal(calendar.defaultTaxYear("current-ledger", "2026-09-05"), 2026); assert.equal(calendar.taxTimeEvents("2025")[0].date, "2026-07-25"); assert.equal(calendar.taxTimeEvents("2026")[1].date, "2027-10-15"); assert.equal(calendar.defaultTaxYear("recent-return", "2026-06-30"), 2024); assert.equal(calendar.defaultTaxYear("recent-return", "2026-07-01"), 2025); });
await test("calendar year bounds and generated ICS dates stamp uid and UTF8 fold", () => {
  for (const year of ["", "0", "2025.5", "NaN", "Infinity", "2019", "2101", "2e3", "2025\r\nUID:evil"]) { assert.equal(calendar.taxTimeEvents(year), null); assert.throws(() => calendar.taxTimeCalendar(year)); }
  const body = calendar.taxTimeCalendar("2025", new Date(now)), unfolded = body.replace(/\r\n /g, "");
  for (const value of ["UID:tax-ready-2025@hojucompass.com", "UID:tax-agent-2025@hojucompass.com", "DTSTAMP:20260904T160000Z", "DTSTART;VALUE=DATE:20260725", "DTEND;VALUE=DATE:20260726", "DTSTART;VALUE=DATE:20261015", "임의로 정한", "개인 신고 기한이 아닙니다"]) assert(unfolded.includes(value), value);
  assert.equal((body.match(/BEGIN:VEVENT/g) ?? []).length, 2); assert(!/(?<!\r)\n/.test(body)); for (const line of body.split("\r\n")) assert(Buffer.byteLength(line) <= 75);
});
const visit = node => Array.isArray(node) ? node.flatMap(visit) : node && typeof node === "object" && node.props ? [node, ...visit(node.props.children)] : [];
const text = node => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" && node.props ? typeof node.type === "function" ? text(node.type(node.props)) : text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
function mount(kind, { raw = null, failures = {}, purpose = "recent-return" } = {}) {
  const slots = [], timers = new Map(), store = new Map(), calls = [], downloads = [], blobs = new Map();
  const key = kind === "tracker" ? recordsLib.taxPrepRecordsStorageKey : checklist.taxChecklistStorageKey;
  if (raw !== null) store.set(key, raw);
  let cursor = 0, dirty = false, queued = [], tree, nextTimer = 0;
  const hooks = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial; return [slots[i], value => { const next = typeof value === "function" ? value(slots[i]) : value; if (!Object.is(slots[i], next)) { slots[i] = next; dirty = true; } }]; },
    useEffect(fn, deps) { const i = cursor++, previous = slots[i]; if (!previous || deps.some((value, j) => !Object.is(value, previous.deps[j]))) { slots[i] = { deps, cleanup: previous?.cleanup }; queued.push(() => { slots[i].cleanup?.(); slots[i].cleanup = fn(); }); } },
    useMemo(fn) { return fn(); },
  };
  const storage = { getItem(k) { if (failures.read) throw Error("denied"); return store.get(k) ?? null; }, setItem(k, value) { calls.push("write"); if (failures.write) throw Error("quota"); store.set(k, value); }, removeItem(k) { calls.push("remove"); store.delete(k); } };
  const window = { localStorage: storage, setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout(id) { timers.delete(id); }, confirm: () => !failures.cancel };
  const globals = { localStorage: storage, window, crypto: { randomUUID }, Blob,
    URL: { createObjectURL(blob) { if (failures.download) throw Error("denied"); const url = `blob:${blobs.size}`; blobs.set(url, blob); return url; }, revokeObjectURL() {} },
    document: { createElement() { return { click() { downloads.push({ filename: this.download, blob: blobs.get(this.href) }); } }; } },
  };
  const hook = load("src/lib/useLocalPlan.ts", () => hooks, globals);
  const name = { tracker: "TaxPrepTracker", checklist: "TaxReturnChecklist", reminder: "TaxTimeReminder", notice: "TaxStorageNotice" }[kind];
  const mod = load(`src/components/tools/${name}.tsx`, dep => {
    if (dep === "react") return hooks; if (dep === "react/jsx-runtime") return require(dep);
    if (dep === "@/lib/useLocalPlan") return hook;
    if (dep === "./TaxStorageNotice") return { TaxStorageNotice: props => require("react").createElement("p", {}, props.saveState) };
    if (dep === "@/lib/lifeReminders") return dates;
    if (dep === "@/lib/taxPrepStorage") return recordsLib;
    if (dep === "@/lib/taxTimeCalendar") return calendar;
    if (dep === "@/lib/taxReturnChecklist") return checklist;
    assert.fail(dep);
  }, globals);
  function render() { let loops = 0; do { assert(++loops < 30); dirty = false; cursor = 0; tree = mod[name]({ purpose, storageKey: key, storage: "blocked", saveState: "자동 저장 중지" }); const effects = queued; queued = []; effects.forEach(fn => fn()); } while (dirty); }
  const find = (type, label) => visit(tree).find(node => node.type === type && text(node).startsWith(label));
  const field = label => visit(find("label", label)).find(n => n.type === "input" || n.type === "select" || n.type === "textarea");
  render();
  return { store, key, calls, downloads, failures, text: () => text(tree), value: label => field(label).props.value,
    field(label, value) { const node = field(label); assert(node, label); node.props.onChange({ target: { value } }); render(); },
    click(label) { const button = find("button", label); assert(button, label); button.props.onClick(); render(); },
    check(label) { const input = field(label); assert(input); input.props.onChange(); render(); },
    add() { find("form", "").props.onSubmit({ preventDefault() {} }); render(); },
    flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); render(); },
  };
}
const fill = app => { app.field("날짜", "2026-09-05"); app.field("무엇이었나요?", "새 지출 · 이메일 보관"); app.field("금액 AUD", "12.34"); };
for (const [kind, validRaw] of [["tracker", JSON.stringify([fixture])], ["checklist", '["records"]']]) {
  await test(`${kind}: valid legacy mount never rewrites storage automatically`, () => { const app = mount(kind, { raw: validRaw }); app.flush(); assert.equal(app.calls.length, 0); assert.equal(app.store.get(app.key), validRaw); assert(app.text().includes("저장본 불러옴")); });
  await test(`${kind}: malformed empty null and unknown schema survive actual changes`, () => { for (const raw of ["", "{bad", "null", "{}", kind === "tracker" ? JSON.stringify([fixture, { ...fixture, id: "bad", evidence: "wrong" }]) : '["records","unknown"]']) { const app = mount(kind, { raw }); if (kind === "tracker") { fill(app); app.add(); } else app.check("모든 은행 계좌의 이자 확인"); app.flush(); assert.equal(app.store.get(app.key), raw); assert.equal(app.calls.length, 0); assert(app.text().includes("자동 저장 중지")); } });
  await test(`${kind}: storage read denial blocks writes after edits`, () => { const app = mount(kind, { raw: validRaw, failures: { read: true } }); if (kind === "tracker") { fill(app); app.add(); } else app.check("모든 은행 계좌의 이자 확인"); app.flush(); assert.equal(app.calls.length, 0); assert.equal(app.store.get(app.key), validRaw); });
  await test(`${kind}: quota leaves saved record intact and shows memory/save distinction`, () => { const app = mount(kind, { raw: validRaw, failures: { write: true } }); if (kind === "tracker") { fill(app); app.add(); } else app.check("모든 은행 계좌의 이자 확인"); app.flush(); assert.equal(app.store.get(app.key), validRaw); assert(app.text().includes("저장 실패")); assert(!app.text().includes("저장했습니다")); });
}
await test("tracker defaults to local today/current FY/missing evidence; other FY add moves visible list", () => {
  const app = mount("tracker"); assert.equal(app.value("날짜"), "2026-09-05"); assert.equal(app.value("회계연도"), 2026); assert.equal(app.value("증빙 상태"), "missing"); fill(app); app.field("날짜", "2026-06-30"); app.add(); app.flush(); assert.equal(app.value("회계연도"), 2025); assert(app.text().includes("목록으로 이동했습니다")); assert(app.text().includes("2025-07-01 ~ 2026-06-30")); assert.equal(JSON.parse(app.store.get(app.key))[0].evidence, "missing");
});
await test("tracker actual add rejects invalid date zero cents overflow and unsafe aggregate", () => {
  const app = mount("tracker"); fill(app);
  for (const value of ["", "-1", "0.001", "1e308", "0x20"]) { app.field("금액 AUD", value); app.add(); app.flush(); assert.equal(app.store.size, 0); }
  app.field("금액 AUD", "12"); app.field("날짜", "2026-02-30"); app.add(); app.flush(); assert.equal(app.store.size, 0);
  const large = mount("tracker", { raw: JSON.stringify([{ ...fixture, amount: 50000000000000 }]) }); fill(large); large.field("금액 AUD", "50000000000000"); large.add(); large.flush(); assert.equal(JSON.parse(large.store.get(large.key)).length, 1); assert(large.text().includes("합계 범위"));
});
await test("tracker failed delete preserves disk; next memory add can still export CSV", async () => {
  const raw = JSON.stringify([fixture]), app = mount("tracker", { raw, failures: { write: true } }); app.click("삭제"); app.flush(); assert.equal(app.store.get(app.key), raw); assert(!app.text().includes("안전화 · 원본 이메일")); assert(app.text().includes("저장 실패")); fill(app); app.field("무엇이었나요?", "=1+1"); app.add(); app.flush(); app.click("CSV 백업"); const csv = await app.downloads[0].blob.text(); assert(csv.includes('"\'=1+1"')); assert(!csv.includes("안전화")); assert.equal(app.store.get(app.key), raw);
});
await test("tracker CSV download failure provides memory contents for manual backup", () => { const app = mount("tracker", { raw: JSON.stringify([fixture]), failures: { download: true } }); app.click("CSV 백업"); assert(app.value("따로 보관할 CSV").includes("안전화")); assert(app.text().includes("내려받지 못했습니다")); });
await test("checklist shared-year marks require confirmation to reset and never auto-reset", () => { const app = mount("checklist", { raw: '["records"]', failures: { cancel: true } }); assert(app.text().includes("연도 공통")); assert(app.text().includes("1/12 확인 표시")); app.click("체크리스트 초기화"); app.flush(); assert.equal(app.store.get(app.key), '["records"]'); app.failures.cancel = false; app.click("체크리스트 초기화"); app.flush(); assert.equal(app.store.get(app.key), "[]"); });
await test("storage recovery shows exact damaged raw without writing and handles denied read", () => { const raw = '{damaged,"keep":1}', app = mount("notice", { raw }); app.click("기존 저장 원문 보기"); assert.equal(app.value("따로 보관할 저장 원문"), raw); assert.equal(app.calls.length, 0); app.failures.read = true; app.click("기존 저장 원문 보기"); assert(app.text().includes("저장소를 읽지 못했습니다")); assert.equal(app.store.get(app.key), raw); });
await test("reminder actual defaults previews past date and downloads 2026 or 2027 files", async () => { for (const [purpose, year, next] of [["recent-return", "2025", "2026"], ["current-ledger", "2026", "2027"]]) { const app = mount("reminder", { purpose }); assert.equal(app.value("대상 회계연도의 시작 연도"), year); assert(app.text().includes(`${next}-07-25`)); if (purpose === "recent-return") assert(app.text().includes("이미 지난 날짜")); app.click("캘린더 파일 받기"); assert.equal(app.downloads[0].filename, `tax-time-${year}-${next}.ics`); assert((await app.downloads[0].blob.text()).includes(`DTSTART;VALUE=DATE:${next}1015`)); assert(app.text().includes("달력에 자동 등록하지 않습니다")); } });
await test("reminder invalid year actual handler blocks download and valid correction recovers", () => { const app = mount("reminder"); for (const value of ["", "0", "2025.5", "NaN", "2101"]) { app.field("대상 회계연도의 시작 연도", value); app.click("캘린더 파일 받기"); assert.equal(app.downloads.length, 0); } app.field("대상 회계연도의 시작 연도", "2025"); app.click("캘린더 파일 받기"); assert.equal(app.downloads.length, 1); });
await test("reminder download failure exposes complete ICS fallback", () => { const app = mount("reminder", { failures: { download: true } }); app.click("캘린더 파일 받기"); assert(app.value("따로 보관할 캘린더 내용").includes("DTSTAMP:")); assert(app.text().includes("내려받지 못했습니다")); });
await test("guide keeps existing detail while adding educational comparison and explicit context props", () => {
  const guide = read("src/app/tax-return-guide/page.tsx"), tracker = read("src/app/tax-prep-tracker/page.tsx");
  for (const value of ["2025-07-01~2026-06-30", "$30,000", "$3,000", "$120", "$27,000", "다시 소득으로 더하지 않습니다", "$100 공제가 확정되지 않습니다", "교육용 예시", "Tax residency", "Notice of Assessment", 'purpose="recent-return"', "my.gov.au", "accessing-your-income-statement-online"]) assert(guide.includes(value), value);
  assert(tracker.includes('purpose="current-ledger"')); assert(!guide.includes("Pro 미리보기")); assert.equal(30000 - 3000, 27000); assert.equal(30000 + 120, 30120);
});
console.log(`Tax preparation boundaries: ${checks} PASS (helpers and real component handlers/effects; browser verified separately)`);
