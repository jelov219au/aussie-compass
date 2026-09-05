import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { execFileSync } from "node:child_process";
const require = createRequire(import.meta.url), ts = require("typescript");
process.env.TZ = "Australia/Sydney";
class FixedDate extends Date { constructor(...args) { super(...(args.length ? args : ["2026-09-04T16:00:00Z"])); } }
const read = file => readFileSync(new URL("../" + file, import.meta.url), "utf8");
function load(file, resolve = name => assert.fail(name), globals = {}, extra = "") {
  const m = { exports: {} };
  runInNewContext(ts.transpileModule(read(file) + extra, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, { module: m, exports: m.exports, require: resolve, Date: FixedDate, URL, ...globals });
  return m.exports;
}
const dates = load("src/lib/lifeReminders.ts"), registry = load("src/lib/railWorkAlerts.ts"), property = load("src/lib/propertyInspection.ts"), rail = load("src/lib/railWorkWatch.ts", name => name.endsWith("lifeReminders") ? dates : registry), handoff = load("src/lib/rentalReadyNowHandoff.ts");
const visit = { mode: "share", propertyName: "방 A", statuses: { mould: "concern", windows: "ok", rent: "ok" }, notes: "수리 완료 증거 요청 · 금요일 답변" };
const area = { id: "old-123", label: "면접역", place: "Richmond Station", state: "VIC", lastCheckedAt: "2026-09-04", checks: { official: true, dates: true, alternative: true, accessibility: true } };
let checks = 0;
async function test(name, fn) { await fn(); checks++; console.log("PASS " + name); }
await test("valid v1 inspection and rail serialize without changes", () => {
  for (const [value, parse, serialize] of [[visit, property.parseInspection, property.serializeInspection], [[area], rail.parseWatchAreas, rail.serializeWatchAreas]]) {
    const raw = JSON.stringify(value); assert.equal(JSON.stringify(parse(raw)), raw); assert.equal(serialize(value), raw);
  }
});
await test("inspection rejects whole malformed schema and unknown status or mode", () => {
  for (const patch of [{ mode: "bad" }, { statuses: { mould: true } }, { statuses: { unknown: "ok" } }, { statuses: [] }, { notes: 2 }, { propertyName: "x".repeat(61) }, { extra: true }]) assert.equal(property.parseInspection(JSON.stringify({ ...visit, ...patch })), null);
  for (const raw of ["", "null", "[]", "{bad"]) assert.equal(property.parseInspection(raw), null);
});
await test("buy costs are separate and hidden rental statuses survive switching", () => {
  const buy = property.visibleInspectionGroups("buy").flatMap(g => g.items).map(i => i.id);
  for (const id of ["rent", "bills", "bond", "agreement", "extra-fees"]) assert(!buy.includes(id));
  for (const id of ["purchase-price", "ongoing-costs", "contract-review", "inspection-docs", "building-docs"]) assert(buy.includes(id));
  assert.equal(property.parseInspection(JSON.stringify({ ...visit, mode: "buy" })).statuses.rent, "ok");
  for (const mode of ["share", "rent"]) assert(property.visibleInspectionGroups(mode).flatMap(g => g.items).some(i => i.id === "rent"));
});
await test("summary preserves good concern and unchecked lists plus full notes", () => {
  const summary = property.inspectionSummary(visit);
  for (const value of ["쉐어하우스", "방 A", "창문·방충망·환기", "곰팡이·습기·물 얼룩", "콘센트 위치와 상태", visit.notes]) assert(summary.includes(value), value);
  assert(property.inspectionSummary({ ...visit, statuses: {} }).includes("아직 우려 표시 없음"));
  assert(!property.inspectionSummary({ ...visit, mode: "buy" }).includes("정확한 주세"));
});
await test("rail rejects truthy unknown checks impossible dates duplicates and over-five", () => {
  for (const patch of [{ checks: { ...area.checks, other: true } }, { checks: [] }, { checks: { ...area.checks, official: "yes" } }, { checks: { official: true } }, { lastCheckedAt: "2026-02-30" }, { reviewStartedAt: "2026-2-03" }, { state: "WA" }, { extra: true }]) assert.equal(rail.parseWatchAreas(JSON.stringify([{ ...area, ...patch }])), null);
  assert.equal(rail.parseWatchAreas(JSON.stringify([area, area])), null);
  assert.equal(rail.parseWatchAreas(JSON.stringify(Array.from({ length: 6 }, (_, i) => ({ ...area, id: "id-" + i })))), null);
  assert.equal(rail.checkedCount({ ...area, checks: { ...area.checks, extra: true } }), 4);
});
await test("old four checks cannot become today's completion without explicit new review", () => {
  assert.equal(rail.completeRailReview(area), null);
  const started = rail.startRailReview(area);
  assert.equal(started.lastCheckedAt, "2026-09-04"); assert.equal(started.reviewStartedAt, "2026-09-05"); assert.equal(rail.checkedCount(started), 0); assert.equal(rail.completeRailReview(started), null);
  const ready = { ...started, checks: { ...area.checks } };
  assert.equal(rail.completeRailReview(ready).lastCheckedAt, "2026-09-05"); assert.equal(rail.completeRailReview(ready, "2026-09-06"), null); assert.equal(area.lastCheckedAt, "2026-09-04");
});
await test("Google query is encoded with place state Australia and VIC has both official paths", () => {
  assert.equal(new URL(rail.railMapHref({ ...area, place: "Richmond & East" })).searchParams.get("query"), "Richmond & East VIC Australia railway station");
  assert(registry.RAIL_WORK_ALERT_SOURCES.VIC.href.includes("bigbuild")); assert.equal(registry.RAIL_WORK_ALERT_JOURNEY_PLANNERS.VIC.href, "https://transport.vic.gov.au/");
});
const nodes = node => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === "object" && node.props ? [node, ...nodes(node.props.children)] : [];
const text = node => Array.isArray(node) ? node.map(text).join("") : node && typeof node === "object" && node.props ? text(node.props.children) : node == null || typeof node === "boolean" ? "" : String(node);
function renderRail(seed, cancel = false) {
  let data = structuredClone(seed), updates = 0, message = "";
  const hooks = { useEffect() {}, useMemo: fn => fn(), useState: initial => [initial, next => { if (typeof next === "string") message = next; }] };
  const mod = load("src/components/tools/RailWorkAlertPlanner.tsx", dep => {
    if (dep === "react") return hooks; if (dep === "react/jsx-runtime") return require(dep); if (dep === "next/link") return { default: "a" };
    if (dep === "@/lib/useLocalPlan") return { useLocalPlan: () => ({ data, update: next => { updates++; data = typeof next === "function" ? next(data) : next; }, storage: "ready", saveState: "loaded" }) };
    if (dep === "./TaxStorageNotice") return { TaxStorageNotice: () => null }; if (dep === "@/lib/railWorkAlerts") return registry; if (dep === "@/lib/railWorkWatch") return rail; if (dep === "@/lib/lifeReminders") return dates; assert.fail(dep);
  }, { window: { confirm: () => !cancel } });
  return { click(label) { const button = nodes(mod.RailWorkAlertPlanner()).find(n => n.type === "button" && text(n).startsWith(label)); assert(button); button.props.onClick(); }, data: () => data, updates: () => updates, message: () => message };
}
await test("actual rail finish handler refuses previous and incomplete checks even if button bypassed", () => {
  for (const fixture of [area, rail.startRailReview(area)]) { const app = renderRail([fixture]); app.click("4항목 검토"); assert.equal(app.updates(), 0); assert(app.message().includes("4개 항목을 모두")); }
});
await test("actual start/delete cancel preserve record and explicit start retains previous date", () => {
  const app = renderRail([area], true); app.click("이번 출발 점검 시작"); app.click("삭제"); assert.equal(app.updates(), 0);
  const start = renderRail([area]); start.click("이번 출발 점검 시작"); assert.equal(start.data()[0].lastCheckedAt, area.lastCheckedAt); assert.equal(rail.checkedCount(start.data()[0]), 0);
});
await test("actual completed review writes today only after four fresh checks", () => {
  const app = renderRail([{ ...rail.startRailReview(area), checks: { ...area.checks } }]); app.click("4항목 검토"); assert.equal(app.updates(), 1); assert.equal(app.data()[0].lastCheckedAt, "2026-09-05");
});
await test("existing handoff includes label and counts only and expires after 24 hours", () => {
  const value = handoff.createRentalReadyNowHandoff({ propertyLabel: visit.propertyName, mode: visit.mode, reviewedCount: 3, concernCount: 1 }, 1000000000), raw = JSON.stringify(value);
  assert.equal(value.propertyLabel, visit.propertyName); assert(!raw.includes(visit.notes)); assert(!raw.includes("statuses"));
  assert.equal(handoff.createRentalReadyNowHandoff({ propertyLabel: "B", mode: "buy", reviewedCount: 1, concernCount: 0 }), null);
  assert.equal(handoff.parseRentalReadyNowHandoff(raw, value.createdAt + 24 * 60 * 60 * 1000 + 1), null);
});
await test("NSW narrow copy leaves seven other rule objects byte-equivalent", () => {
  const before = execFileSync("git", ["show", "HEAD:src/components/tools/DriverLicenceGuide.tsx"], { encoding: "utf8" }), after = read("src/components/tools/DriverLicenceGuide.tsx");
  const tail = s => { const normalized = s.replaceAll("\r\n", "\n"); return normalized.slice(normalized.indexOf('    id: "vic"')).split("\n];")[0]; };
  assert(tail(before).includes('id: "nt"')); assert.equal(tail(after), tail(before));
  for (const value of ["뉴질랜드 운전면허 소지자", "JP가 인증한 사본", "복사본을 받지 않는다고", "2025년 3월 1일 전에", "시드니 한국 총영사관", "2026-09-05", "2026-08-31", "transfer-an-overseas-driver-licence"]) assert(after.includes(value), value);
  assert(!after.includes("또는 뉴질랜드 시민은"));
});
console.log(`Property rail and NSW checks: ${checks} PASS`);
