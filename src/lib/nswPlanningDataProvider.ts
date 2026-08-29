import "server-only";

import {
  createDemoNswPlanningSnapshot,
  createLiveNswPlanningSnapshot,
  createUnavailableNswPlanningSnapshot,
  parseTfnswRailAlerts,
  parseTfnswRoadworks,
  type NswPlanningSnapshot,
} from "@/lib/nswPlanningData";

const officialApiOrigin = "https://api.transport.nsw.gov.au";
const maximumResponseBytes = 1_000_000;
const minimumLiveReadIntervalMs = 1_000;
let liveReadInFlight: Promise<NswPlanningSnapshot> | null = null;
let lastLiveReadStartedAt = 0;

type NextServerRequestInit = RequestInit & { next: { revalidate: number } };

function sydneyDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.day}-${value.month}-${value.year}`;
}

function assertOfficialApiUrl(url: URL) {
  if (url.origin !== officialApiOrigin || url.protocol !== "https:") throw new Error("unapproved_official_data_origin");
}

async function fetchOfficialJson(url: URL, apiKey: string, revalidate: number): Promise<unknown> {
  assertOfficialApiUrl(url);
  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json, application/geo+json", Authorization: `apikey ${apiKey}` },
    cache: "force-cache",
    next: { revalidate },
    redirect: "error",
    signal: AbortSignal.timeout(5_000),
  } satisfies NextServerRequestInit);

  if (!response.ok) throw new Error("official_data_http_failure");
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("json")) throw new Error("official_data_content_type_failure");
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > maximumResponseBytes) throw new Error("official_data_response_too_large");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maximumResponseBytes) throw new Error("official_data_response_too_large");
  return JSON.parse(text) as unknown;
}

async function readLiveSnapshot(apiKey: string): Promise<NswPlanningSnapshot> {
  const railUrl = new URL("/v1/tp/add_info", officialApiOrigin);
  railUrl.search = new URLSearchParams({
    outputFormat: "rapidJSON",
    coordOutputFormat: "EPSG:4326",
    filterDateValid: sydneyDate(),
    filterPublicationStatus: "current",
    filterMOTType: "1",
  }).toString();
  const roadworkUrl = new URL("/v1/live/hazards/roadwork/open", officialApiOrigin);

  const [railPayload, roadworkPayload] = await Promise.all([
    fetchOfficialJson(railUrl, apiKey, 30),
    fetchOfficialJson(roadworkUrl, apiKey, 60),
  ]);
  const rail = parseTfnswRailAlerts(railPayload);
  const roadworks = parseTfnswRoadworks(roadworkPayload);
  if (!rail || !roadworks) throw new Error("official_data_schema_failure");
  return createLiveNswPlanningSnapshot(rail, roadworks);
}

async function getRateLimitedLiveSnapshot(apiKey: string) {
  if (liveReadInFlight) return liveReadInFlight;
  if (Date.now() - lastLiveReadStartedAt < minimumLiveReadIntervalMs) return createUnavailableNswPlanningSnapshot();
  lastLiveReadStartedAt = Date.now();
  liveReadInFlight = readLiveSnapshot(apiKey)
    .catch(() => createUnavailableNswPlanningSnapshot())
    .finally(() => {
      liveReadInFlight = null;
    });
  return liveReadInFlight;
}

export interface NswPlanningDataProvider {
  getSnapshot(): Promise<NswPlanningSnapshot>;
}

export function createNswPlanningDataProvider(): NswPlanningDataProvider {
  const mode = process.env.NSW_TRANSPORT_DATA_MODE === "live" ? "live" : "fixture";
  const apiKey = process.env.NSW_TRANSPORT_API_KEY?.trim() ?? "";
  if (mode === "fixture") return { getSnapshot: async () => createDemoNswPlanningSnapshot() };
  if (!apiKey || /[\r\n]/.test(apiKey)) return { getSnapshot: async () => createUnavailableNswPlanningSnapshot() };
  return { getSnapshot: () => getRateLimitedLiveSnapshot(apiKey) };
}
