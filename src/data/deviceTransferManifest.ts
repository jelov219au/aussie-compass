import { parseArticleHistory, parseWeeklyReadingGoal } from "@/lib/articleProgress";
import { parseBookmarks } from "@/lib/bookmarks";
import { parseCarArchive } from "@/lib/carPurchasePro";
import { departureChecklistCodec } from "@/lib/departureChecklist";
import { readEofyDraft } from "@/lib/eofyProDeviceStorage";
import { parseApplications } from "@/lib/jobApplications";
import { readLeavingDraft } from "@/lib/leavingAustraliaProStorage";
import { parseReminders } from "@/lib/lifeReminders";
import { localProjectMetadata } from "@/lib/localProjectMetadata";
import { projectCodec } from "@/lib/localProjectChecklist";
import { parseBudget, parseSavings } from "@/lib/personalPlans";
import { parsePersonalPlan, parseRoutePreference } from "@/lib/personalRoutePlan";
import { parseInspection } from "@/lib/propertyInspection";
import { parseWatchAreas } from "@/lib/railWorkWatch";
import { parseResumeBuilderDraft } from "@/lib/resumeBuilderData";
import { parseSavedSalary } from "@/lib/salaryCalculationState";
import { parsePrices, parseQuotes } from "@/lib/serviceRecords";
import { parseTaxRecords } from "@/lib/taxPrepStorage";
import { parseTaxChecklist } from "@/lib/taxReturnChecklist";
import { parseVisaCostStorage } from "@/lib/visaCostPlan";
import { parseVehicles } from "@/lib/vehicleComparisonStorage";
import { parseSavedPhrases } from "@/data/englishPhrases";
import type { DeviceTransferRecord } from "@/lib/deviceDataTransfer";

const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function parseJsonString(raw: string) {
  let index = 0;
  const whitespace = () => { while (/\s/.test(raw[index] ?? "")) index += 1; };
  const stringToken = () => {
    const start = index++;
    while (index < raw.length) {
      if (raw[index] === "\\") { index += 2; continue; }
      if (raw[index] === "\"") { index += 1; return JSON.parse(raw.slice(start, index)) as string; }
      index += 1;
    }
    throw new Error("unterminated-string");
  };
  const value = (): unknown => {
    whitespace();
    if (raw[index] === "{") {
      index += 1; whitespace();
      const result: Record<string, unknown> = {};
      const keys = new Set<string>();
      if (raw[index] === "}") { index += 1; return result; }
      while (index < raw.length) {
        if (raw[index] !== "\"") throw new Error("object-key");
        const key = stringToken();
        if (keys.has(key)) throw new Error("duplicate-object-key");
        keys.add(key); whitespace();
        if (raw[index++] !== ":") throw new Error("colon");
        result[key] = value(); whitespace();
        const separator = raw[index++];
        if (separator === "}") return result;
        if (separator !== ",") throw new Error("object-separator");
        whitespace();
      }
      throw new Error("unterminated-object");
    }
    if (raw[index] === "[") {
      index += 1; whitespace();
      const result: unknown[] = [];
      if (raw[index] === "]") { index += 1; return result; }
      while (index < raw.length) {
        result.push(value()); whitespace();
        const separator = raw[index++];
        if (separator === "]") return result;
        if (separator !== ",") throw new Error("array-separator");
        whitespace();
      }
      throw new Error("unterminated-array");
    }
    if (raw[index] === "\"") return stringToken();
    const token = raw.slice(index).match(/^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/)?.[0];
    if (!token) throw new Error("value");
    index += token.length;
    return JSON.parse(token) as unknown;
  };
  const parsed = value();
  whitespace();
  if (index !== raw.length) throw new Error("trailing-data");
  return parsed;
}

function duplicateRecordIds(value: unknown): boolean {
  if (Array.isArray(value)) {
    for (const field of ["id", "href"] as const) {
      const keys = value.map((item) => object(item) && typeof item[field] === "string" ? item[field] : null);
      const present = keys.filter((item): item is string => item !== null);
      if (present.length === value.length && new Set(present).size !== present.length) return true;
    }
    return value.some(duplicateRecordIds);
  }
  return object(value) && Object.values(value).some(duplicateRecordIds);
}

function validator(parser: (raw: string) => unknown, root: "object" | "array" | "either" = "either") {
  return (raw: string) => {
    try {
      const parsed = parseJsonString(raw);
      if ((root === "object" && !object(parsed)) || (root === "array" && !Array.isArray(parsed)) || duplicateRecordIds(parsed)) return false;
      const result = parser(raw);
      return result !== null && result !== undefined && result !== false;
    } catch {
      return false;
    }
  };
}

const genericObject = validator((raw) => JSON.parse(raw), "object");
const genericArray = validator((raw) => JSON.parse(raw), "array");
const exact = (parser: (raw: string) => unknown, root: "object" | "array" | "either" = "either") => validator(parser, root);
const project = (key: string) => {
  const metadata = localProjectMetadata.find((item) => item.key === key)!;
  const items = metadata.ids.map((id) => ({ id, label: "", detail: "" }));
  return key === "leaving-australia-project"
    ? exact(departureChecklistCodec(items).parse, "object")
    : exact(projectCodec(items).parse, "object");
};
const eofy = (raw: string) => readEofyDraft(() => ({ getItem: () => raw, setItem: () => undefined })).kind === "ready";
const leaving = (raw: string) => readLeavingDraft(() => ({ getItem: () => raw, setItem: () => undefined })).kind === "ready";
const car = (raw: string) => { try { parseCarArchive(raw); return true; } catch { return false; } };

const record = (toolId: string, key: string, label: string, group: string, href: string, sensitive: boolean, parserId: string, parse: (raw: string) => boolean, schemaVersion = 1): DeviceTransferRecord => ({
  toolId, key, label, group, href, sensitive, schemaId: `hoju-compass/${toolId}`, schemaVersion, parserId, parse,
});

export const deviceTransferManifest: DeviceTransferRecord[] = [
  record("visa-preparation-project", "visa-preparation-project", "비자 신청 준비", "체크리스트", "/visa-preparation-guide", true, "project-checklist-v1", project("visa-preparation-project")),
  record("arrival-first-30-days", "arrival-first-30-days", "첫 30일 정착", "체크리스트", "/arrival-checklist", true, "project-checklist-v1", project("arrival-first-30-days")),
  record("house-hunt-project", "house-hunt-project", "집 구하기 프로젝트", "체크리스트", "/property-inspection-checklist", true, "project-checklist-v1", project("house-hunt-project")),
  record("moving-project", "moving-project", "이사 준비", "체크리스트", "/moving-checklist", true, "project-checklist-v1", project("moving-project")),
  record("leaving-australia-project", "leaving-australia-project", "귀국 준비", "체크리스트", "/leaving-australia-guide", true, "departure-checklist-v2", project("leaving-australia-project"), 2),
  record("leaving-australia-pro", "hoju-compass-leaving-pro-v1", "귀국 준비 패키지", "체크리스트", "/leaving-australia-pro/workspace", true, "leaving-workspace-v3", exact(leaving, "object"), 3),
  record("bookmarks", "aussie-compass-bookmarks-v1", "저장한 페이지", "내 Compass", "/my-compass", false, "bookmarks-v1", exact(parseBookmarks, "array")),
  record("read-articles", "aussie-compass-read-articles-v1", "읽은 실용 자료", "내 Compass", "/my-compass", false, "article-history-v1", exact(parseArticleHistory, "array")),
  record("weekly-reading-goal", "hoju-compass-weekly-reading-goal-v1", "주간 읽기 목표", "내 Compass", "/my-compass", false, "weekly-goal-v1", exact(parseWeeklyReadingGoal, "object")),
  record("route-finder", "hoju-compass-route-finder-v1", "맞춤 시작 경로", "내 Compass", "/#route-finder", false, "route-preference-v1", exact(parseRoutePreference, "object")),
  record("personal-plan", "hoju-compass-personal-plan-v1", "나의 3단계 계획", "내 Compass", "/?plan=saved#route-finder", false, "personal-plan-v1", exact(parsePersonalPlan, "object")),
  record("english-phrase-cards", "hoju-compass-english-phrase-cards-v1", "저장한 생활 영어 문장", "생활 준비", "/english-phrase-cards", false, "phrase-ids-v1", exact(parseSavedPhrases, "array")),
  record("life-reminders", "aussie-compass-life-reminders-v1", "만료일·갱신 일정", "생활 관리", "/life-admin-reminder", true, "reminders-v1", exact(parseReminders, "array")),
  record("tax-return-checklist", "aussie-compass-tax-return-checklist-v1", "택스 리턴 준비", "돈 관리", "/tax-return-guide", false, "tax-checklist-v1", exact(parseTaxChecklist, "array")),
  record("tax-prep-records", "hoju-compass-tax-prep-records-v1", "연중 택스 리턴 준비 장부", "돈 관리", "/tax-prep-tracker", true, "tax-records-v1", exact(parseTaxRecords, "array")),
  record("eofy-pro", "hoju-compass-eofy-pro-v1", "EOFY 준비 패키지", "돈 관리", "/eofy-pro/workspace", true, "eofy-workspace-v3", exact(eofy, "object"), 3),
  record("salary-calculation", "aussie-compass-salary-calculation", "급여 계산", "돈 관리", "/salary-calculator", true, "salary-calculation-v1", exact(parseSavedSalary, "object")),
  record("living-budget", "aussie-compass-living-budget-v1", "생활비 예산", "돈 관리", "/cost-of-living-calculator", true, "living-budget-v1", exact(parseBudget, "object")),
  record("savings-goal", "aussie-compass-savings-goal-v1", "저축 목표", "돈 관리", "/savings-goal-calculator", true, "savings-goal-v1", exact(parseSavings, "object")),
  record("visa-cost-plan", "aussie-compass-visa-cost-plan-v1", "비자 비용 계획", "돈 관리", "/visa-preparation-guide", true, "visa-costs-v1", exact(parseVisaCostStorage, "object")),
  record("resume-builder", "aussie-compass-resume-v1", "영문 이력서", "구직", "/resume-builder", true, "resume-draft-v1", exact(parseResumeBuilderDraft, "object")),
  record("resume-pro-preview", "hoju-compass-resume-pro-preview-v1", "Resume Pro 지원서", "구직", "/resume-pro/workspace", true, "resume-pro-draft-v1", genericObject),
  record("resume-pro-applications", "hoju-compass-resume-pro-applications-v1", "Resume Pro 회사별 지원서 목록", "구직", "/resume-pro/workspace", true, "resume-pro-applications-v1", genericObject),
  record("resume-pro-star-stories", "hoju-compass-resume-pro-star-stories-v1", "Resume Pro STAR 경험 보관함", "구직", "/resume-pro/workspace", true, "resume-pro-star-v1", genericArray),
  record("job-tracker", "aussie-compass-job-tracker-v1", "구직 지원 현황", "구직", "/job-application-tracker", true, "job-applications-v1", exact(parseApplications, "array")),
  record("pay-evidence-pro", "hoju-compass-pay-evidence-pro-v1", "급여 증빙 패키지", "구직", "/pay-evidence-pro/workspace", true, "pay-evidence-workspace-v1", genericObject),
  record("commute-housing", "aussie-compass-commute-housing-v1", "통학·생활권 비교", "주거·이동", "/public-transport-guide", true, "commute-plan-v1", genericObject),
  record("rail-work-areas", "aussie-compass-rail-work-watch-areas-v1", "철도 작업 확인 지역", "주거·이동", "/rail-work-alerts", true, "rail-watch-v1", exact(parseWatchAreas, "array")),
  record("property-inspection", "aussie-compass-property-inspection-v1", "집 방문 점검", "주거·이동", "/property-inspection-checklist", true, "property-inspection-v2", exact(parseInspection, "object"), 2),
  record("rental-application-pro", "hoju-compass-rental-application-pro-v1", "렌트 신청 패키지", "주거·이동", "/rental-application-pro/workspace", true, "rental-workspace-v1", genericObject),
  record("service-quotes", "aussie-compass-service-quotes-v1", "서비스 견적 비교", "생활 서비스", "/service-quote-comparator", true, "service-quotes-v1", exact(parseQuotes, "array")),
  record("service-price-log", "aussie-compass-service-price-log-v1", "서비스 가격 기록", "생활 서비스", "/service-price-log", true, "service-prices-v1", exact(parsePrices, "array")),
  record("vehicle-comparison", "aussie-compass-vehicle-comparison-v1", "중고차 비교", "주거·이동", "/used-car-comparison", true, "vehicle-comparison-v1", exact(parseVehicles, "array")),
  record("car-purchase-pro", "hoju-compass-car-purchase-pro-v1", "중고차 구매 점검 패키지", "주거·이동", "/car-purchase-pro/workspace", true, "car-purchase-archive-v1", exact(car, "object")),
];
