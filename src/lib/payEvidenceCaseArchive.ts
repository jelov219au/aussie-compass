export const PAY_EVIDENCE_ARCHIVE_FORMAT = "hoju-compass-pay-evidence-case";
export const PAY_EVIDENCE_ARCHIVE_VERSION = 1;
export const MAX_PAY_EVIDENCE_ARCHIVE_BYTES = 512 * 1024;

export type PayEvidenceStatus = "missing" | "review" | "ready";
export type PayEvidenceRequestType = "first" | "followup";
export type PayEvidenceRateBasisType = "unsure" | "award" | "agreement" | "contract" | "other";
export type PayEvidenceEmploymentType = "Unsure" | "Casual" | "Part-time" | "Full-time" | "Contractor — status needs checking";
export type PayEvidenceKey = "hours" | "roster" | "payslip" | "bank" | "basis" | "messages";

export type PayEvidenceShift = {
  id: string;
  date: string;
  start: string;
  end: string;
  breakMinutes: string;
  rateLabel: string;
  hourlyRate: string;
  allowance: string;
  note: string;
};

export type PayEvidencePeriod = {
  id: string;
  label: string;
  hours: string;
  expectedGross: string;
  payslipGross: string;
  payslipNet: string;
  bankNet: string;
  note: string;
  shifts: PayEvidenceShift[];
};

export type PayEvidenceDraft = {
  employerLabel: string;
  employmentType: PayEvidenceEmploymentType;
  rateBasisType: PayEvidenceRateBasisType;
  rateBasisCheckedOn: string;
  sourceNote: string;
  periods: PayEvidencePeriod[];
  evidence: Partial<Record<PayEvidenceKey, PayEvidenceStatus>>;
  requestType: PayEvidenceRequestType;
  requestDraft: string;
};

export type PayEvidenceCaseArchive = {
  format: typeof PAY_EVIDENCE_ARCHIVE_FORMAT;
  version: typeof PAY_EVIDENCE_ARCHIVE_VERSION;
  exportedAt: string;
  case: PayEvidenceDraft;
};

export type PayEvidenceArchiveParseResult =
  | { ok: true; archive: PayEvidenceCaseArchive }
  | { ok: false; error: string };

const evidenceKeys: PayEvidenceKey[] = ["hours", "roster", "payslip", "bank", "basis", "messages"];
const evidenceStatuses: PayEvidenceStatus[] = ["missing", "review", "ready"];
const requestTypes: PayEvidenceRequestType[] = ["first", "followup"];
const rateBasisTypes: PayEvidenceRateBasisType[] = ["unsure", "award", "agreement", "contract", "other"];
const employmentTypes: PayEvidenceEmploymentType[] = ["Unsure", "Casual", "Part-time", "Full-time", "Contractor — status needs checking"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]) {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isIdentifier(value: unknown): value is string {
  return isBoundedString(value, 128) && value.length > 0;
}

function isNumericInput(value: unknown): value is string {
  if (!isBoundedString(value, 32)) return false;
  if (value === "") return true;
  if (value.trim() !== value) return false;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function isDateInput(value: unknown): value is string {
  if (value === "") return true;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function isTimeInput(value: unknown): value is string {
  return value === "" || (typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));
}

function validateShift(value: unknown): value is PayEvidenceShift {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "date", "start", "end", "breakMinutes", "rateLabel", "hourlyRate", "allowance", "note"])) return false;
  return isIdentifier(value.id)
    && isDateInput(value.date)
    && isTimeInput(value.start)
    && isTimeInput(value.end)
    && isNumericInput(value.breakMinutes)
    && isBoundedString(value.rateLabel, 160)
    && isNumericInput(value.hourlyRate)
    && isNumericInput(value.allowance)
    && isBoundedString(value.note, 2_000);
}

function validatePeriod(value: unknown): value is PayEvidencePeriod {
  if (!isRecord(value) || !hasOnlyKeys(value, ["id", "label", "hours", "expectedGross", "payslipGross", "payslipNet", "bankNet", "note", "shifts"])) return false;
  return isIdentifier(value.id)
    && isBoundedString(value.label, 240)
    && isNumericInput(value.hours)
    && isNumericInput(value.expectedGross)
    && isNumericInput(value.payslipGross)
    && isNumericInput(value.payslipNet)
    && isNumericInput(value.bankNet)
    && isBoundedString(value.note, 4_000)
    && Array.isArray(value.shifts)
    && value.shifts.length <= 80
    && value.shifts.every(validateShift);
}

function validateEvidence(value: unknown): value is PayEvidenceDraft["evidence"] {
  if (!isRecord(value) || !hasOnlyKeys(value, evidenceKeys)) return false;
  return Object.values(value).every((status) => typeof status === "string" && evidenceStatuses.includes(status as PayEvidenceStatus));
}

function validateDraft(value: unknown): value is PayEvidenceDraft {
  if (!isRecord(value) || !hasOnlyKeys(value, ["employerLabel", "employmentType", "rateBasisType", "rateBasisCheckedOn", "sourceNote", "periods", "evidence", "requestType", "requestDraft"])) return false;
  if (!isBoundedString(value.employerLabel, 160)
    || typeof value.employmentType !== "string"
    || !employmentTypes.includes(value.employmentType as PayEvidenceEmploymentType)
    || typeof value.rateBasisType !== "string"
    || !rateBasisTypes.includes(value.rateBasisType as PayEvidenceRateBasisType)
    || !isDateInput(value.rateBasisCheckedOn)
    || !isBoundedString(value.sourceNote, 4_000)
    || !Array.isArray(value.periods)
    || value.periods.length > 40
    || !value.periods.every(validatePeriod)
    || !validateEvidence(value.evidence)
    || typeof value.requestType !== "string"
    || !requestTypes.includes(value.requestType as PayEvidenceRequestType)
    || !isBoundedString(value.requestDraft, 20_000)) return false;

  const periodIds = new Set<string>();
  const shiftIds = new Set<string>();
  let shiftCount = 0;
  for (const period of value.periods) {
    if (periodIds.has(period.id)) return false;
    periodIds.add(period.id);
    shiftCount += period.shifts.length;
    if (shiftCount > 500) return false;
    for (const shift of period.shifts) {
      if (shiftIds.has(shift.id)) return false;
      shiftIds.add(shift.id);
    }
  }
  return true;
}

function validateArchive(value: unknown): value is PayEvidenceCaseArchive {
  if (!isRecord(value) || !hasOnlyKeys(value, ["format", "version", "exportedAt", "case"])) return false;
  if (value.format !== PAY_EVIDENCE_ARCHIVE_FORMAT || value.version !== PAY_EVIDENCE_ARCHIVE_VERSION || typeof value.exportedAt !== "string") return false;
  try {
    if (new Date(value.exportedAt).toISOString() !== value.exportedAt) return false;
  } catch {
    return false;
  }
  return validateDraft(value.case);
}

function cloneDraft(draft: PayEvidenceDraft): PayEvidenceDraft {
  return {
    employerLabel: draft.employerLabel,
    employmentType: draft.employmentType,
    rateBasisType: draft.rateBasisType,
    rateBasisCheckedOn: draft.rateBasisCheckedOn,
    sourceNote: draft.sourceNote,
    periods: draft.periods.map((period) => ({
      id: period.id,
      label: period.label,
      hours: period.hours,
      expectedGross: period.expectedGross,
      payslipGross: period.payslipGross,
      payslipNet: period.payslipNet,
      bankNet: period.bankNet,
      note: period.note,
      shifts: period.shifts.map((shift) => ({
        id: shift.id,
        date: shift.date,
        start: shift.start,
        end: shift.end,
        breakMinutes: shift.breakMinutes,
        rateLabel: shift.rateLabel,
        hourlyRate: shift.hourlyRate,
        allowance: shift.allowance,
        note: shift.note,
      })),
    })),
    evidence: Object.fromEntries(evidenceKeys.flatMap((key) => draft.evidence[key] ? [[key, draft.evidence[key]]] : [])),
    requestType: draft.requestType,
    requestDraft: draft.requestDraft,
  };
}

export function createPayEvidenceCaseArchive(draft: PayEvidenceDraft, now = new Date()): PayEvidenceCaseArchive {
  const archive: PayEvidenceCaseArchive = {
    format: PAY_EVIDENCE_ARCHIVE_FORMAT,
    version: PAY_EVIDENCE_ARCHIVE_VERSION,
    exportedAt: now.toISOString(),
    case: cloneDraft(draft),
  };
  const serialised = JSON.stringify(archive);
  if (new TextEncoder().encode(serialised).byteLength > MAX_PAY_EVIDENCE_ARCHIVE_BYTES || !validateArchive(archive)) {
    throw new Error("The current case cannot be archived safely.");
  }
  return archive;
}

export function parsePayEvidenceCaseArchive(text: string): PayEvidenceArchiveParseResult {
  if (new TextEncoder().encode(text).byteLength > MAX_PAY_EVIDENCE_ARCHIVE_BYTES) {
    return { ok: false, error: "백업 파일이 허용 크기인 512KB를 초과합니다." };
  }
  try {
    const value: unknown = JSON.parse(text);
    if (!validateArchive(value)) return { ok: false, error: "지원되는 Pay Evidence 사건 백업 형식이 아닙니다." };
    return { ok: true, archive: value };
  } catch {
    return { ok: false, error: "JSON 백업 파일을 읽을 수 없습니다." };
  }
}
