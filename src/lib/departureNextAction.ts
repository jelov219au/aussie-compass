import { validDate } from "@/lib/lifeReminders";

export const departureStages = [
  { value: "before_8_plus_weeks", label: "8주 이상 남음", band: "계약별 통지일을 먼저 비교" },
  { value: "before_4_to_8_weeks", label: "4–8주 남음", band: "퇴사·퇴거·항공 조건 확인" },
  { value: "before_1_to_4_weeks", label: "1–4주 남음", band: "최종 지급·계정 접근·해지일 확정" },
  { value: "before_7_days", label: "7일 이내", band: "해외 접근과 미수령 지급 경로 우선" },
  { value: "already_departed", label: "이미 출국", band: "미수령 결과와 해외 계정 접근 추적" },
] as const;
export type DepartureStage = typeof departureStages[number]["value"];

export const departureTaskIds = ["final_pay", "bond", "utility", "telco_access", "bank_payment_route", "insurance_vehicle_mail", "tax", "super_dasp"] as const;
export type DepartureTaskId = typeof departureTaskIds[number];
export type Applicability = "pending" | "applicable" | "not_applicable";
export type ActionStatus = "prepare" | "requested_or_submitted" | "awaiting_confirmation" | "received_or_final_bill_reconciled" | "blocked_or_disputed" | "not_applicable";
export type EvidenceStatus = "not_needed" | "location_chosen" | "copy_saved" | "receipt_saved";

export type DepartureNextActionState = {
  version: 1;
  stage: "" | DepartureStage;
  applicability: Record<DepartureTaskId, Applicability>;
  task: "" | DepartureTaskId;
  jurisdiction: "" | "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
  status: ActionStatus;
  recheckDate: string;
  evidence: EvidenceStatus;
};

export const emptyDepartureNextAction: DepartureNextActionState = {
  version: 1,
  stage: "",
  applicability: Object.fromEntries(departureTaskIds.map((id) => [id, "pending"])) as Record<DepartureTaskId, Applicability>,
  task: "",
  jurisdiction: "",
  status: "prepare",
  recheckDate: "",
  evidence: "not_needed",
};

const applicabilityValues = new Set<Applicability>(["pending", "applicable", "not_applicable"]);
const statusValues = new Set<ActionStatus>(["prepare", "requested_or_submitted", "awaiting_confirmation", "received_or_final_bill_reconciled", "blocked_or_disputed", "not_applicable"]);
const evidenceValues = new Set<EvidenceStatus>(["not_needed", "location_chosen", "copy_saved", "receipt_saved"]);
const stageValues = new Set<string>(departureStages.map((item) => item.value));
const jurisdictions = new Set(["", "ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"]);

export function parseDepartureNextAction(raw: string): DepartureNextActionState | null {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)
      || Object.keys(value).some((key) => !["version", "stage", "applicability", "task", "jurisdiction", "status", "recheckDate", "evidence"].includes(key))
      || value.version !== 1 || !(value.stage === "" || stageValues.has(value.stage))
      || !(value.task === "" || departureTaskIds.includes(value.task))
      || !jurisdictions.has(value.jurisdiction)
      || !statusValues.has(value.status) || !(value.recheckDate === "" || validDate(value.recheckDate))
      || !evidenceValues.has(value.evidence) || !value.applicability || typeof value.applicability !== "object" || Array.isArray(value.applicability)
      || Object.keys(value.applicability).some((id) => !departureTaskIds.includes(id as DepartureTaskId))
      || Object.values(value.applicability).some((entry) => !applicabilityValues.has(entry as Applicability))) return null;
    return {
      ...value,
      applicability: Object.fromEntries(departureTaskIds.map((id) => [id, value.applicability[id] ?? "pending"])),
    } as DepartureNextActionState;
  } catch {
    return null;
  }
}

export const serializeDepartureNextAction = (value: DepartureNextActionState) => {
  const raw = JSON.stringify(value);
  return parseDepartureNextAction(raw) ? raw : null;
};

export function departureActionValid(value: DepartureNextActionState) {
  if (!value.stage || !value.task || value.applicability[value.task] !== "applicable"
    || value.status === "not_applicable" || !validDate(value.recheckDate)) return false;
  return !["bond", "insurance_vehicle_mail"].includes(value.task) || Boolean(value.jurisdiction);
}
