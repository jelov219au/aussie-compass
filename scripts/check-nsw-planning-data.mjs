import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  createDemoNswPlanningSnapshot,
  createLiveNswPlanningSnapshot,
  createUnavailableNswPlanningSnapshot,
  parseTfnswRailAlerts,
  parseTfnswRoadworks,
} from "../src/lib/nswPlanningData.ts";

const [provider, route, documentation, packageJson, railPlanner, railPage] = await Promise.all([
  readFile(new URL("../src/lib/nswPlanningDataProvider.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/nsw-planning-snapshot/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../docs/nsw-official-planning-data.md", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../src/components/tools/RailWorkAlertPlanner.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/rail-work-alerts/page.tsx", import.meta.url), "utf8"),
]);

const demo = createDemoNswPlanningSnapshot("2026-08-26T00:00:00.000Z");
assert.equal(demo.status, "demo");
assert.equal(demo.officialRealtime, false);
assert.equal(demo.schemaVersion, 2);
assert.ok(demo.notices.every((notice) => notice.title.startsWith("[데모]")));
assert.match(demo.notice, /실제.*아니며/);
assert.ok(demo.sources.every((source) => source.freshnessStatus === "NOT_COLLECTED"));

const rail = parseTfnswRailAlerts({
  infos: { current: [{ id: "fixture-rail", subtitle: "Trackwork", content: "Use replacement buses", timestamps: { validity: {} } }] },
});
assert.equal(rail?.[0]?.category, "rail");
assert.equal(rail?.[0]?.sourceUrl, "https://transportnsw.info/alerts#/train");
assert.equal(parseTfnswRailAlerts({ infos: { current: [{ content: "missing title" }] } }), null);

const roadworks = parseTfnswRoadworks({
  type: "FeatureCollection",
  features: [{ type: "Feature", id: 42, properties: { headline: "Roadwork", description: "One lane closed" } }],
});
assert.equal(roadworks?.[0]?.category, "roadwork");
assert.equal(roadworks?.[0]?.sourceUrl, "https://www.livetraffic.com/");
assert.equal(parseTfnswRoadworks({ type: "FeatureCollection", features: [{ type: "Feature", properties: {} }] }), null);

const retrievedAt = "2026-08-26T01:02:03.000Z";
const live = createLiveNswPlanningSnapshot(rail ?? [], roadworks ?? [], retrievedAt);
assert.equal(live.status, "live");
assert.equal(live.officialRealtime, true);
assert.match(live.notice, /원본 갱신 시각은 확인되지 않았습니다/);
assert.equal(live.sources.length, 2);
for (const source of live.sources) {
  assert.equal(source.sourceUpdatedAt, null);
  assert.equal(source.collectedAt, retrievedAt);
  assert.equal(source.expectedRefreshInterval, null);
  assert.equal(source.freshnessStatus, "FRESHNESS_UNKNOWN");
  assert.equal(source.licenceReviewStatus, "review_required");
  assert.equal(source.licenceName, null);
  assert.equal(source.licenceUrl, null);
  assert.equal(source.attributionText, null);
  assert.match(source.sourceUrl, /^https:\/\/opendata\.transport\.nsw\.gov\.au\/data\/dataset\//);
  assert.ok(source.transformationSummary);
  assert.ok(source.hojuInterpretation);
  assert.ok(source.limitations);
  assert.equal(source.errorReportPath, "/contact");
}

const unavailable = createUnavailableNswPlanningSnapshot(retrievedAt);
assert.equal(unavailable.status, "unavailable");
assert.ok(unavailable.sources.every((source) => source.freshnessStatus === "SOURCE_UNAVAILABLE"));

for (const boundary of [
  'import "server-only"',
  'process.env.NSW_TRANSPORT_DATA_MODE === "live"',
  "process.env.NSW_TRANSPORT_API_KEY",
  'Authorization: `apikey ${apiKey}`',
  'cache: "force-cache"',
  "next: { revalidate }",
  'redirect: "error"',
  "AbortSignal.timeout(5_000)",
  "maximumResponseBytes = 1_000_000",
  "minimumLiveReadIntervalMs = 1_000",
  "liveReadInFlight",
  'new URL("/v1/tp/add_info"',
  'new URL("/v1/live/hazards/roadwork/open"',
  "createUnavailableNswPlanningSnapshot",
]) assert.ok(provider.includes(boundary), `NSW provider is missing fail-closed boundary: ${boundary}`);
assert.doesNotMatch(provider, /console\.|Authorization[^\n]*(?:log|print)|[?&](?:key|token)=/i);

for (const routeBoundary of [
  'export const dynamic = "force-dynamic"',
  'snapshot.status === "unavailable" ? 503 : 200',
  '"Cache-Control": "private, no-store, max-age=0"',
  '"X-Hoju-Data-Mode": snapshot.status',
]) assert.ok(route.includes(routeBoundary), `NSW route is missing response boundary: ${routeBoundary}`);
assert.doesNotMatch(route, /export async function (?:POST|PUT|PATCH|DELETE)|request\.(?:json|formData)|searchParams/);
assert.doesNotMatch(
  `${railPlanner}\n${railPage}`,
  /\/api\/nsw-planning-snapshot|fetch\(|officialRealtime|X-Hoju-Data-Mode/,
  "the current public rail workspace must remain link-only and must not consume fixture or live provider output",
);

for (const documentationBoundary of [
  "officialRealtime=false",
  "officialRealtime=true",
  "never silently substitutes demo data",
  "Schema version 2",
  "FRESHNESS_UNKNOWN",
  "licenceReviewStatus=review_required",
  "5 requests per second and 60,000 per day",
  "GTFS-R alternative",
  "Protocol Buffers decoder",
  "Enabling live mode, adding an environment value and deploying are separate operator actions",
]) assert.ok(documentation.includes(documentationBoundary), `NSW planning documentation is missing: ${documentationBoundary}`);

assert.ok(packageJson.includes('"test:nsw-planning-data"'), "the NSW planning contract must have a package script");
assert.ok(packageJson.includes("npm run test:nsw-planning-data"), "the full quality gate must include the NSW planning contract");

console.log("NSW official planning provider, demo labelling and fail-closed contracts passed.");
