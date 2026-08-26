export type NswPlanningDataStatus = "demo" | "live" | "unavailable";
export type NswPlanningNoticeCategory = "rail" | "roadwork";
export type NswPlanningFreshnessStatus =
  | "CURRENT"
  | "FRESHNESS_UNKNOWN"
  | "STALE"
  | "NOT_COLLECTED"
  | "SOURCE_UNAVAILABLE"
  | "ERROR";
export type NswPlanningLicenceReviewStatus = "review_required" | "verified";

export type NswPlanningSourceRecord = {
  sourceName: "Transport for NSW";
  sourceRecordTitle: string;
  sourceUrl: string;
  sourceUpdatedAt: string | null;
  collectedAt: string;
  expectedRefreshInterval: string | null;
  freshnessStatus: NswPlanningFreshnessStatus;
  licenceReviewStatus: NswPlanningLicenceReviewStatus;
  licenceName: string | null;
  licenceUrl: string | null;
  attributionText: string | null;
  transformationSummary: string;
  hojuInterpretation: string;
  limitations: string;
  errorReportPath: "/contact";
};

export type NswPlanningNotice = {
  id: string;
  category: NswPlanningNoticeCategory;
  title: string;
  summary: string;
  startsAt: string | null;
  endsAt: string | null;
  sourceUrl: string;
};

export type NswPlanningSnapshot = {
  schemaVersion: 2;
  status: NswPlanningDataStatus;
  officialRealtime: boolean;
  retrievedAt: string;
  notice: string;
  sources: NswPlanningSourceRecord[];
  notices: NswPlanningNotice[];
};

const railSourceUrl = "https://transportnsw.info/alerts#/train";
const roadworkSourceUrl = "https://www.livetraffic.com/";
const railSourceRecordUrl = "https://opendata.transport.nsw.gov.au/data/dataset/trip-planner-apis";
const roadworkSourceRecordUrl = "https://opendata.transport.nsw.gov.au/data/dataset/live-traffic-hazards";
const maximumNoticesPerSource = 50;

function createSourceRecords(
  collectedAt: string,
  freshnessStatus: NswPlanningFreshnessStatus,
): NswPlanningSourceRecord[] {
  const common = {
    sourceName: "Transport for NSW" as const,
    sourceUpdatedAt: null,
    collectedAt,
    expectedRefreshInterval: null,
    freshnessStatus,
    licenceReviewStatus: "review_required" as const,
    licenceName: null,
    licenceUrl: null,
    attributionText: null,
    errorReportPath: "/contact" as const,
  };

  return [
    {
      ...common,
      sourceRecordTitle: "Trip Planner APIs — Service Alert API",
      sourceUrl: railSourceRecordUrl,
      transformationSummary: "현재 rail 알림을 최대 50건으로 제한하고 HTML을 제거한 뒤 제목·요약·유효기간 필드로 정규화합니다.",
      hojuInterpretation: "Hoju Compass는 rail 카테고리와 확인용 요약을 제공할 뿐, 운행 또는 대체 교통을 보장하지 않습니다.",
      limitations: "원본 갱신 시각과 예상 갱신 주기를 응답에서 확인하지 못하므로 최신 여부를 판정할 수 없습니다.",
    },
    {
      ...common,
      sourceRecordTitle: "Live Traffic Hazards — Roadwork",
      sourceUrl: roadworkSourceRecordUrl,
      transformationSummary: "현재 roadwork 항목을 최대 50건으로 제한하고 HTML을 제거한 뒤 제목·요약·기간 필드로 정규화합니다.",
      hojuInterpretation: "Hoju Compass는 roadwork 카테고리와 확인용 요약을 제공할 뿐, 도로 상태 또는 이동 가능성을 보장하지 않습니다.",
      limitations: "원본 갱신 시각과 예상 갱신 주기를 응답에서 확인하지 못하며, 위치·영향 범위를 재해석하지 않습니다.",
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function plainText(value: unknown, maximumLength = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maximumLength);
}

function isoDateOrNull(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function requiredId(value: unknown, prefix: string, index: number) {
  if (typeof value === "string" || typeof value === "number") {
    const safe = String(value).replace(/[^A-Za-z0-9._:-]/g, "").slice(0, 100);
    if (safe) return `${prefix}:${safe}`;
  }
  return `${prefix}:position-${index}`;
}

export function parseTfnswRailAlerts(payload: unknown): NswPlanningNotice[] | null {
  if (!isRecord(payload) || !isRecord(payload.infos) || !Array.isArray(payload.infos.current)) return null;

  const notices: NswPlanningNotice[] = [];
  for (const [index, candidate] of payload.infos.current.slice(0, maximumNoticesPerSource).entries()) {
    if (!isRecord(candidate)) return null;
    const title = plainText(candidate.subtitle ?? candidate.title, 160);
    if (!title) return null;
    const summary = plainText(candidate.content ?? candidate.description ?? title);
    const timestamps = isRecord(candidate.timestamps) ? candidate.timestamps : {};
    const validity = isRecord(timestamps.validity) ? timestamps.validity : {};
    notices.push({
      id: requiredId(candidate.id, "rail", index),
      category: "rail",
      title,
      summary: summary || title,
      startsAt: isoDateOrNull(validity.from ?? candidate.validFrom),
      endsAt: isoDateOrNull(validity.to ?? candidate.validTo),
      sourceUrl: railSourceUrl,
    });
  }
  return notices;
}

export function parseTfnswRoadworks(payload: unknown): NswPlanningNotice[] | null {
  if (!isRecord(payload) || payload.type !== "FeatureCollection" || !Array.isArray(payload.features)) return null;

  const notices: NswPlanningNotice[] = [];
  for (const [index, feature] of payload.features.slice(0, maximumNoticesPerSource).entries()) {
    if (!isRecord(feature) || feature.type !== "Feature" || !isRecord(feature.properties)) return null;
    const properties = feature.properties;
    const title = plainText(properties.headline ?? properties.displayName ?? properties.title ?? properties.road, 160);
    if (!title) return null;
    const summary = plainText(properties.description ?? properties.adviceA ?? properties.otherAdvice ?? title);
    notices.push({
      id: requiredId(feature.id ?? properties.id, "roadwork", index),
      category: "roadwork",
      title,
      summary: summary || title,
      startsAt: isoDateOrNull(properties.start ?? properties.startDate ?? properties.fromDate),
      endsAt: isoDateOrNull(properties.end ?? properties.endDate ?? properties.toDate),
      sourceUrl: roadworkSourceUrl,
    });
  }
  return notices;
}

export function createDemoNswPlanningSnapshot(retrievedAt = new Date().toISOString()): NswPlanningSnapshot {
  return {
    schemaVersion: 2,
    status: "demo",
    officialRealtime: false,
    retrievedAt,
    notice: "예시 데이터입니다. 실제 NSW 운행 장애·선로 작업·도로 공사 상태가 아니며 이동 판단에 사용하면 안 됩니다.",
    sources: createSourceRecords(retrievedAt, "NOT_COLLECTED"),
    notices: [
      {
        id: "demo:rail-trackwork",
        category: "rail",
        title: "[데모] 주말 선로 작업 예시",
        summary: "실제 알림이 아닌 화면·데이터 계약 확인용 예시입니다.",
        startsAt: null,
        endsAt: null,
        sourceUrl: railSourceUrl,
      },
      {
        id: "demo:roadwork",
        category: "roadwork",
        title: "[데모] 야간 도로 공사 예시",
        summary: "실제 공사 정보가 아닌 화면·데이터 계약 확인용 예시입니다.",
        startsAt: null,
        endsAt: null,
        sourceUrl: roadworkSourceUrl,
      },
    ],
  };
}

export function createUnavailableNswPlanningSnapshot(retrievedAt = new Date().toISOString()): NswPlanningSnapshot {
  return {
    schemaVersion: 2,
    status: "unavailable",
    officialRealtime: false,
    retrievedAt,
    notice: "공식 NSW 데이터를 확인할 수 없습니다. Transport for NSW와 Live Traffic NSW에서 직접 다시 확인해 주세요.",
    sources: createSourceRecords(retrievedAt, "SOURCE_UNAVAILABLE"),
    notices: [],
  };
}

export function createLiveNswPlanningSnapshot(
  rail: NswPlanningNotice[],
  roadworks: NswPlanningNotice[],
  retrievedAt = new Date().toISOString(),
): NswPlanningSnapshot {
  return {
    schemaVersion: 2,
    status: "live",
    officialRealtime: true,
    retrievedAt,
    notice: "Transport for NSW 공식 endpoint에서 조회했지만 원본 갱신 시각은 확인되지 않았습니다. 최신 상태로 단정하지 말고 출발 직전에 공식 링크에서 다시 확인해 주세요.",
    sources: createSourceRecords(retrievedAt, "FRESHNESS_UNKNOWN"),
    notices: [...rail, ...roadworks],
  };
}
