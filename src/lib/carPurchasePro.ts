export const carPurchaseStorageKey = "hoju-compass-car-purchase-pro-v1";
export const carArchiveMaxBytes = 1024 * 1024;
export const maxCarCandidates = 3;
export const maxCarIssues = 20;
export const maxCarSnapshots = 5;
// A valid candidate can contain 20 issues with six 1,000-character notes each,
// plus candidate notes and export labels. Preserve that whole snapshot; the
// serialized archive still has its independent 1MB UTF-8 limit.
const maxCarSnapshotCharacters = 160_000;
export const inspectionLabels = { uninspected: "검사 전", partial: "일부만 검사", reported: "보고서 받음" } as const;
export const issueLabels = { waiting: "답변 기다림", answered: "답변 받음", promised: "수리 약속", verified: "증빙·재확인 완료" } as const;
export const decisionLabels = { checking: "추가 확인", considering: "구매 검토", excluded: "후보 제외", purchased: "구매·인도 완료 기록" } as const;

export type CarIssue = {
  id: string; title: string; source: string; checkedOn: string;
  reply: string; question: string; followUpOn: string;
  status: keyof typeof issueLabels; promisedOn: string;
  evidence: string; recheckedOn: string; recheckNote: string;
  payer: "unknown" | "buyer" | "seller";
  quote: string; actualCost: string;
};
export type CarCandidate = {
  id: string; alias: string; askingPrice: string; agreedPrice: string;
  inspection: keyof typeof inspectionLabels; inspectionNote: string;
  inspectionBudget: string; transferBudget: string; otherBudget: string;
  issues: CarIssue[]; decision: keyof typeof decisionLabels;
  reason: string; handoverNote: string;
};
export type CarDraft = {
  candidates: CarCandidate[];
  snapshots: { id: string; recordedAt: string; candidateAlias: string; text: string }[];
};
export type CarMoney = { kind: "missing" } | { kind: "invalid" } | { kind: "value"; cents: number };

export function parseCarMoney(raw: string): CarMoney {
  const value = raw.trim();
  if (!value) return { kind: "missing" };
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(value)) return { kind: "invalid" };
  const [whole, fraction = ""] = value.split(".");
  return { kind: "value", cents: Number(whole) * 100 + Number(fraction.padEnd(2, "0")) };
}
export function formatCarCents(cents: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);
}
export function describeCarMoney(raw: string) {
  const amount = parseCarMoney(raw);
  return amount.kind === "value" ? formatCarCents(amount.cents) : amount.kind === "missing" ? "미확정" : `입력 확인 필요 (${raw})`;
}
export function emptyCarCandidate(id: string): CarCandidate {
  return { id, alias: "", askingPrice: "", agreedPrice: "", inspection: "uninspected",
    inspectionNote: "", inspectionBudget: "", transferBudget: "", otherBudget: "",
    issues: [], decision: "checking", reason: "", handoverNote: "" };
}
export function emptyCarIssue(id: string): CarIssue {
  return { id, title: "", source: "", checkedOn: "", reply: "", question: "",
    followUpOn: "", status: "waiting", promisedOn: "", evidence: "", recheckedOn: "",
    recheckNote: "", payer: "unknown", quote: "", actualCost: "" };
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
}
export function isCarIssueResolved(issue: CarIssue) {
  return issue.status === "verified" && !!issue.title.trim() && !!issue.evidence.trim() &&
    validDate(issue.recheckedOn) && !!issue.recheckNote.trim();
}
export function carIssueStatus(issue: CarIssue) {
  return issue.status === "verified" && !isCarIssueResolved(issue) ? "완료 근거 보완 필요" : issueLabels[issue.status];
}
export function summarizeCar(candidate: CarCandidate) {
  let subtotal = 0, missing = 0, invalid = 0, estimatedRepair = 0, actualRepair = 0;
  let payerUnknown = 0, sellerItems = 0;
  const add = (raw: string) => {
    const money = parseCarMoney(raw);
    if (money.kind === "value") subtotal += money.cents;
    else if (money.kind === "missing") missing++;
    else invalid++;
    return money;
  };
  add(candidate.agreedPrice.trim() ? candidate.agreedPrice : candidate.askingPrice);
  [candidate.inspectionBudget, candidate.transferBudget, candidate.otherBudget].forEach(add);
  for (const issue of candidate.issues) {
    if (issue.payer === "unknown") { payerUnknown++; continue; }
    if (issue.payer === "seller") { sellerItems++; continue; }
    const actual = issue.actualCost.trim() !== "";
    const money = add(actual ? issue.actualCost : issue.quote);
    if (money.kind === "value") {
      if (actual) actualRepair += money.cents;
      else estimatedRepair += money.cents;
    }
  }
  return { subtotal, missing, invalid, payerUnknown, sellerItems, estimatedRepair, actualRepair,
    unresolved: candidate.issues.filter(issue => !isCarIssueResolved(issue)).length };
}
export function carQuestions(candidate: CarCandidate) {
  const pending = candidate.issues.filter(issue => !isCarIssueResolved(issue));
  if (!pending.length) return "등록된 미해결 항목이 없습니다. 검사·조회가 모두 끝났다는 뜻은 아닙니다.";
  return [
    "Hi, I would like to clarify the following items before making a decision.",
    ...pending.flatMap((issue, index) => [
      `${index + 1}. Regarding: ${issue.title || "[inspection item]"}`,
      issue.question || "Could you clarify the issue and the proposed next step in writing?",
      ...(issue.status === "promised" || issue.status === "verified"
        ? ["Could you provide the repair evidence and confirm when an independent recheck can be arranged?"] : []),
      ...(issue.payer === "unknown" ? ["Who will cover this cost, and is it included in the agreed vehicle price?"] : []),
    ]),
    "Thank you. This message is a request for information, not acceptance of the purchase.",
  ].join("\n\n");
}
export function carCandidateText(candidate: CarCandidate) {
  const total = summarizeCar(candidate);
  return [
    `후보: ${candidate.alias || "이름 미입력"}`,
    `검사: ${inspectionLabels[candidate.inspection]} / ${candidate.inspectionNote || "메모 없음"}`,
    `요구 가격: ${describeCarMoney(candidate.askingPrice)} / 합의 가격: ${describeCarMoney(candidate.agreedPrice)}`,
    `검사 예산: ${describeCarMoney(candidate.inspectionBudget)} / 이전 예산: ${describeCarMoney(candidate.transferBudget)} / 기타 예산: ${describeCarMoney(candidate.otherBudget)}`,
    `입력 금액 기준 소계: ${formatCarCents(total.subtotal)} (최종 총비용 아님)`,
    `금액 미확정 ${total.missing}, 금액 오류 ${total.invalid}, 부담자 미정 ${total.payerUnknown}, 판매자 부담 표시 ${total.sellerItems}`,
    `구매자 수리비 반영: 실지출 ${formatCarCents(total.actualRepair)} + 아직 실지출 없는 항목의 견적 ${formatCarCents(total.estimatedRepair)}`,
    `등록 항목 중 미해결: ${total.unresolved}개. 0개가 차량 안전·검사 완료를 뜻하지 않습니다.`,
    ...candidate.issues.map((issue, index) => [
      `\n항목 ${index + 1}: ${issue.title || "제목 미입력"} / ${carIssueStatus(issue)}`,
      `출처: ${issue.source || "미입력"} / 확인일: ${issue.checkedOn || "미입력"}`,
      `받은 답변: ${issue.reply || "없음"}`,
      `다음 질문: ${issue.question || "미입력"} / 다음 확인일: ${issue.followUpOn || "미입력"}`,
      `수리 약속일: ${issue.promisedOn || "미입력"} / 증빙 메모: ${issue.evidence || "없음"}`,
      `재확인일: ${issue.recheckedOn || "미입력"} / 재확인 내용: ${issue.recheckNote || "없음"}`,
      `비용 부담: ${{ unknown: "미정", buyer: "구매자", seller: "판매자" }[issue.payer]}`,
      `견적: ${describeCarMoney(issue.quote)} / 실제 추가지출: ${describeCarMoney(issue.actualCost)}`,
    ].join("\n")),
    `\n내 결정: ${decisionLabels[candidate.decision]} / 이유: ${candidate.reason || "미입력"}`,
    `인도·후속 기록: ${candidate.handoverNote || "없음"}`,
  ].join("\n");
}
export function carDraftText(draft: CarDraft) {
  return ["Hoju Compass · 중고차 거래노트",
    "사용자 입력 기록입니다. 차량 상태, 소유권, 법적 효력 또는 구매 적합성을 인증하지 않습니다.",
    ...draft.candidates.map(carCandidateText),
    "=== 날짜별 보관 기록 (당시 입력값) ===",
    ...draft.snapshots.map(snapshot => `${snapshot.recordedAt} · ${snapshot.candidateAlias}\n${snapshot.text}`),
  ].join("\n\n---\n\n");
}
export function addCarSnapshot(draft: CarDraft, candidate: CarCandidate, id: string, now: string): CarDraft {
  if (draft.snapshots.length >= maxCarSnapshots) throw new Error("보관 기록은 최대 5개입니다. 먼저 전체 백업을 내보내세요.");
  if (!candidate.alias.trim() || !candidate.reason.trim()) throw new Error("후보 이름과 결정 이유를 먼저 적어주세요.");
  return { ...draft, snapshots: [...draft.snapshots, { id, recordedAt: now,
    candidateAlias: candidate.alias, text: carCandidateText(candidate) }] };
}

const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const text = (value: unknown, max = 1000): value is string => typeof value === "string" && value.length <= max;
const id = (value: unknown): value is string => text(value, 80) && /^[A-Za-z0-9_-]+$/.test(value);
const date = (value: unknown) => text(value, 10) && (value === "" || validDate(value));
const oneOf = (value: unknown, values: readonly string[]) => typeof value === "string" && values.includes(value);
function keysMatch(value: Record<string, unknown>, allowed: string[]) {
  return Object.keys(value).length === allowed.length && Object.keys(value).every(key => allowed.includes(key));
}
function validIssue(value: unknown): value is CarIssue {
  if (!object(value) || !keysMatch(value, Object.keys(emptyCarIssue("schema")))) return false;
  return id(value.id) && ["title", "source", "reply", "question", "evidence", "recheckNote"].every(key => text(value[key])) &&
    ["checkedOn", "followUpOn", "promisedOn", "recheckedOn"].every(key => date(value[key])) &&
    ["quote", "actualCost"].every(key => text(value[key], 20)) &&
    oneOf(value.status, Object.keys(issueLabels)) && oneOf(value.payer, ["unknown", "buyer", "seller"]);
}
function validCandidate(value: unknown): value is CarCandidate {
  if (!object(value) || !keysMatch(value, Object.keys(emptyCarCandidate("schema")))) return false;
  return id(value.id) && text(value.alias, 80) &&
    ["inspectionNote", "reason", "handoverNote"].every(key => text(value[key])) &&
    ["askingPrice", "agreedPrice", "inspectionBudget", "transferBudget", "otherBudget"].every(key => text(value[key], 20)) &&
    oneOf(value.inspection, Object.keys(inspectionLabels)) && oneOf(value.decision, Object.keys(decisionLabels)) &&
    Array.isArray(value.issues) && value.issues.length <= maxCarIssues && value.issues.every(validIssue) &&
    new Set(value.issues.map(issue => issue.id)).size === value.issues.length;
}
export function validCarDraft(value: unknown): value is CarDraft {
  if (!object(value) || !keysMatch(value, ["candidates", "snapshots"])) return false;
  return Array.isArray(value.candidates) && value.candidates.length >= 1 && value.candidates.length <= maxCarCandidates &&
    value.candidates.every(validCandidate) && new Set(value.candidates.map(candidate => candidate.id)).size === value.candidates.length &&
    Array.isArray(value.snapshots) && value.snapshots.length <= maxCarSnapshots && value.snapshots.every(snapshot =>
      object(snapshot) && keysMatch(snapshot, ["id", "recordedAt", "candidateAlias", "text"]) &&
      id(snapshot.id) && text(snapshot.recordedAt, 30) && /^\d{4}-\d{2}-\d{2}T/.test(snapshot.recordedAt) &&
      Number.isFinite(Date.parse(snapshot.recordedAt)) && text(snapshot.candidateAlias, 80) && text(snapshot.text, maxCarSnapshotCharacters)) &&
    new Set(value.snapshots.map(snapshot => snapshot.id)).size === value.snapshots.length;
}
export function serializeCarDraft(draft: CarDraft) {
  if (!validCarDraft(draft)) throw new Error("기록 형식을 확인해주세요.");
  const raw = JSON.stringify({ format: "hoju-compass-car-purchase-pro", version: 1, draft });
  if (new TextEncoder().encode(raw).byteLength > carArchiveMaxBytes) throw new Error("백업 용량은 1MB 이하여야 합니다.");
  return raw;
}
export function parseCarArchive(raw: string): CarDraft {
  if (new TextEncoder().encode(raw).byteLength > carArchiveMaxBytes) throw new Error("백업 용량은 1MB 이하여야 합니다.");
  let archive: unknown;
  try { archive = JSON.parse(raw); }
  catch { throw new Error("백업 파일의 형식이 손상되었습니다. 기존 기록은 바꾸지 않았습니다. 내보낸 원본을 다시 선택해주세요."); }
  if (!object(archive) || !keysMatch(archive, ["format", "version", "draft"]) ||
    archive.format !== "hoju-compass-car-purchase-pro" || archive.version !== 1 || !validCarDraft(archive.draft)) {
    throw new Error("지원하는 중고차 거래노트 백업이 아닙니다. 기존 기록을 유지합니다.");
  }
  return archive.draft;
}
type CarStorage = Pick<Storage, "getItem" | "setItem">;
export function readCarDraft(getStorage: () => CarStorage):
  { kind: "empty"; raw: null } | { kind: "loaded"; raw: string; draft: CarDraft } | { kind: "blocked"; raw: string | null } {
  let raw: string | null = null;
  try {
    raw = getStorage().getItem(carPurchaseStorageKey);
    return raw === null ? { kind: "empty", raw } : { kind: "loaded", raw, draft: parseCarArchive(raw) };
  } catch { return { kind: "blocked", raw }; }
}
export function saveCarDraft(getStorage: () => CarStorage, draft: CarDraft, expected: string | null):
  { kind: "saved"; raw: string } | { kind: "conflict" | "failed" } {
  try {
    const raw = serializeCarDraft(draft);
    const storage = getStorage();
    if (storage.getItem(carPurchaseStorageKey) !== expected) return { kind: "conflict" };
    storage.setItem(carPurchaseStorageKey, raw);
    return { kind: "saved", raw };
  } catch { return { kind: "failed" }; }
}
export function sampleCarDraft(): CarDraft {
  const a = emptyCarCandidate("sample-a");
  Object.assign(a, { alias: "가상 A · 타이어 수리 약속", askingPrice: "8500", agreedPrice: "8200",
    inspection: "reported", inspectionNote: "가상 검사 보고서: 타이어 마모 확인", inspectionBudget: "250",
    transferBudget: "350", otherBudget: "0", reason: "판매자 수리 증빙과 독립 재확인을 기다립니다." });
  a.issues = [{ ...emptyCarIssue("sample-tyres"), title: "앞 타이어 교체", source: "가상 보고서 p.2",
    checkedOn: "2026-09-03", status: "promised", reply: "인도 전에 교체하겠다는 답변",
    question: "Could you send the tyre replacement invoice and arrange an independent recheck?",
    payer: "seller", promisedOn: "2026-09-05" }];
  const b = emptyCarCandidate("sample-b");
  Object.assign(b, { alias: "가상 B · 수리 견적 미확정", askingPrice: "7900", inspection: "partial",
    inspectionNote: "누유 원인을 추가 확인해야 함", inspectionBudget: "250", transferBudget: "350",
    otherBudget: "0", reason: "수리 견적이 없어 총예산 비교를 보류합니다." });
  b.issues = [{ ...emptyCarIssue("sample-leak"), title: "누유 원인 추가 확인", source: "가상 검사 메모",
    payer: "buyer", question: "Could you provide an itemised diagnosis and repair quote?" }];
  return { candidates: [a, b], snapshots: [] };
}
