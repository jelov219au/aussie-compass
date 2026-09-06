import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";

const load = localTypeScriptLoader();
const { countUnknownCompassRecords, deriveMyCompassNextAction, myCompassDueState, rankMyCompassCandidates, readMyCompassActionRecords } = load("src/lib/myCompassNextAction.ts");

const [lib, dashboard, reading, page] = await Promise.all([
  readFile(new URL("../src/lib/myCompassNextAction.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/dashboard/MyCompassDashboard.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/dashboard/ResourceReadingProgress.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/my-compass/page.tsx", import.meta.url), "utf8"),
]);

const exactFields = ["source_state", "selected_tool", "applicability", "status", "due_state", "due_or_recheck", "official_route", "tool_return", "next_action"];
const outcomeType = lib.match(/export type MyCompassNextActionOutcome = \{([\s\S]*?)\n\};/)?.[1] ?? "";
assert.deepEqual([...outcomeType.matchAll(/^\s{2}([a-z_]+):/gm)].map((match) => match[1]), exactFields);

const now = new Date("2026-09-07T12:00:00+10:00");
assert.equal(myCompassDueState(null, now), "no_comparable_date");
assert.equal(myCompassDueState("2026-02-30", now), "invalid_date");
assert.equal(myCompassDueState("2026-09-06", now), "overdue");
assert.equal(myCompassDueState("2026-09-07", now), "due_today");
assert.equal(myCompassDueState("2026-09-14", now), "due_next_7_days");
assert.equal(myCompassDueState("2026-09-15", now), "later");

const candidate = (toolId, date, nextAction = "review_in_tool") => ({ toolId, applicability: "applicable", status: "user_checked", dueOrRecheck: date, officialRoute: "none", toolReturn: `/${toolId}`, nextAction });
const ordered = rankMyCompassCandidates([
  candidate("none", null), candidate("later", "2026-10-01"), candidate("soon", "2026-09-10"), candidate("today", "2026-09-07"), candidate("overdue", "2026-09-01"),
], now);
assert.deepEqual(ordered.map((item) => item.toolId), ["overdue", "today", "soon", "later", "none"]);

const empty = deriveMyCompassNextAction({ sources: [], candidates: [], issues: [], unknownRecordCount: 0, storageUnavailable: false, now });
assert.deepEqual(JSON.parse(JSON.stringify(empty)), { source_state: "empty", selected_tool: "none", applicability: "unconfirmed", status: "not_started", due_state: "no_comparable_date", due_or_recheck: "none", official_route: "none", tool_return: "/tools", next_action: "open_start_selector" });

const one = deriveMyCompassNextAction({ sources: [{ toolId: "arrival-first-30-days", href: "/arrival-checklist", active: true, activityStatus: "user_checked" }], candidates: [], issues: [], unknownRecordCount: 0, storageUnavailable: false, now });
assert.equal(one.source_state, "one_valid");
assert.equal(one.applicability, "unconfirmed");
assert.equal(one.status, "user_checked");
assert.equal(one.due_state, "no_comparable_date", "check count and generic target date must not become a legal due date");
assert.equal(one.next_action, "review_in_tool");

const multiple = deriveMyCompassNextAction({ sources: [
  { toolId: "arrival-first-30-days", href: "/arrival-checklist", active: true, activityStatus: "user_checked" },
  { toolId: "visa-preparation-project", href: "/visa-preparation-guide", active: true, activityStatus: "user_checked" },
], candidates: [candidate("later", "2026-10-01"), candidate("overdue", "2026-09-01", "open_official_route_then_return")], issues: [], unknownRecordCount: 0, storageUnavailable: false, now });
assert.equal(multiple.source_state, "multiple_valid");
assert.equal(multiple.selected_tool, "overdue");
assert.equal(multiple.due_state, "overdue");

for (const outcome of [
  deriveMyCompassNextAction({ sources: [], candidates: [], issues: [{ toolId: "arrival-first-30-days", title: "Arrival", href: "/arrival-checklist", detail: "preserved", status: "invalid" }], unknownRecordCount: 1, storageUnavailable: false, now }),
  deriveMyCompassNextAction({ sources: [], candidates: [], issues: [], unknownRecordCount: 0, storageUnavailable: true, now }),
]) {
  assert.equal(outcome.status, "invalid_needs_review");
  assert.equal(outcome.next_action, "repair_local_record");
}

const raw = JSON.stringify({ version: 1, stage: "before_7_days", applicability: { final_pay: "applicable" }, task: "final_pay", jurisdiction: "", status: "awaiting_confirmation", recheckDate: "2026-09-08", evidence: "receipt_saved" });
const writes = [];
const read = readMyCompassActionRecords(() => ({ getItem: (key) => key === "leaving-departure-next-action-v1" ? raw : null, setItem: (...args) => writes.push(args) }));
assert.equal(read.candidates.length, 1);
assert.equal(read.candidates[0].status, "awaiting_external_confirmation");
assert.equal(read.candidates[0].dueOrRecheck, "2026-09-08");
assert.match(read.candidates[0].officialRoute.href, /^https:\/\//);
assert.equal(writes.length, 0);

const storageKeys = ["arrival-first-30-days", "aussie-compass-unknown-legacy-v0", "third-party"];
const unknown = countUnknownCompassRecords({ length: storageKeys.length, key: (index) => storageKeys[index] ?? null });
assert.deepEqual(JSON.parse(JSON.stringify(unknown)), { count: 1, unavailable: false });

for (const marker of ["data-my-compass-next-action", "my_compass_next_action", "구매 이용권·복구 코드는 별도", 'href="/data-transfer"', 'href="/payment-help"', 'href="/install"', "9개 판정 필드 보기", "원문과 알 수 없는 이전 기록을 변경·삭제하지 않았습니다"]) assert.ok(dashboard.includes(marker), marker);
assert.doesNotMatch(dashboard, /\btrack\(|@vercel\/analytics|fetch\(|XMLHttpRequest|sendBeacon|URLSearchParams|location\.(?:href|search)|sessionStorage\.setItem|localStorage\.setItem/);
assert.doesNotMatch(lib, /setItem|removeItem|clear\(|fetch\(|sendBeacon|document\.cookie/);
assert.match(reading, /min-h-11 flex-1/);
assert.doesNotMatch(`${dashboard}\n${reading}\n${page}`, /text-white\/45/);
assert.doesNotMatch(page, /text-gold"/);
assert.match(`${dashboard}\n${reading}\n${page}`, /text-gold-ink/);
assert.match(page, /<MyCompassDashboard resourceArticles=\{resourceArticles\} \/>/);

console.log("My Compass first-visit next-action, due ordering, recovery and privacy contract passed.");
