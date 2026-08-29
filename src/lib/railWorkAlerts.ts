export const RAIL_WORK_ALERT_ROUTE = "/rail-work-alerts" as const;
export const RAIL_WORK_ALERT_STORAGE_KEY = "aussie-compass-rail-work-watch-areas-v1";
export const RAIL_WORK_ALERT_MAX_AREAS = 5;

export const RAIL_WORK_ALERT_STATE_ORDER = ["NSW", "VIC", "QLD"] as const;

export type RailWorkAlertSupportedState = (typeof RAIL_WORK_ALERT_STATE_ORDER)[number];

export const RAIL_WORK_ALERT_SOURCES = {
  NSW: {
    label: "Transport for NSW Travel alerts",
    href: "https://transportnsw.info/alerts",
  },
  VIC: {
    label: "Victoria's Big Build disruptions map",
    href: "https://bigbuild.vic.gov.au/disruptions/disruptions-map",
  },
  QLD: {
    label: "Translink service updates",
    href: "https://translink.com.au/service-updates",
  },
} as const satisfies Record<RailWorkAlertSupportedState, { label: string; href: string }>;

export const NATIONAL_ROADWORKS_MAP = {
  label: "National Road Safety Data Hub 도로 공사 지도",
  href: "https://datahub.roadsafety.gov.au/infrastructure/roadworks-and-road-closures",
} as const;
