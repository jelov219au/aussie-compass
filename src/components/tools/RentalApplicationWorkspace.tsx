"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getRentalJurisdiction,
  rentalJurisdictionCodes,
  rentalJurisdictions,
  type RentalJurisdictionCode,
} from "@/data/rentalJurisdictions";
import {
  clearRentalReadyNowHandoff,
  createRentalReadyNowImportReceipt,
  readRentalReadyNowHandoff,
  readRentalReadyNowSavedFlag,
  rentalReadyNowReceiptMatches,
  type RentalReadyNowImportReceipt,
} from "@/lib/rentalReadyNowHandoff";
import {
  rentalApplicationProFirstSuccessStorageKey,
  rentalApplicationProWorkspaceStorageKey,
} from "@/lib/rentalApplicationProDeviceStorage";
import { isRentalWorkspaceBackup } from "@/lib/rentalWorkspaceBackup";

type DocumentStatus = "todo" | "review" | "ready";
type ApplicationStage = "shortlist" | "inspected" | "preparing" | "submitted" | "follow_up" | "approved" | "declined" | "withdrawn";
type MessageType = "application" | "inspection" | "followUp";
type ApplicantProfile = { householdSize: string; employmentSummary: string; rentalSummary: string; petSummary: string; strengths: string };
type ReusableEvidence = { status: DocumentStatus; checkedOn: string };
type FollowUpEntry = { id: string; date: string; channel: "email" | "phone" | "portal" | "inspection"; direction: "sent" | "received"; summary: string };
type RentalApplication = {
  id: string; propertyLabel: string; suburb: string; jurisdiction: RentalJurisdictionCode | ""; weeklyRent: string; agentName: string;
  moveDate: string; leaseTerm: string; stage: ApplicationStage; applicationDate: string;
  nextActionDate: string; notes: string; statuses: Record<string, DocumentStatus>;
  privacyChecks: Record<string, boolean>; messages: Record<MessageType, string>; followUps: FollowUpEntry[];
  inspectionReceipt: RentalReadyNowImportReceipt | null;
};
type WorkspaceState = { version: 3; profile: ApplicantProfile; evidenceLibrary: Record<string, ReusableEvidence>; activeId: string; applications: RentalApplication[] };
type DocumentItem = { id: string; group: string; title: string; detail: string; caution?: string };

const STORAGE_KEY = rentalApplicationProWorkspaceStorageKey;
const FIRST_SUCCESS_KEY = rentalApplicationProFirstSuccessStorageKey;
const MAX_APPLICATIONS = 20;
const initialProfile: ApplicantProfile = { householdSize: "1", employmentSummary: "", rentalSummary: "", petSummary: "No pets", strengths: "" };

function createApplication(id: string, propertyLabel = ""): RentalApplication {
  return { id, propertyLabel, suburb: "", jurisdiction: "", weeklyRent: "", agentName: "", moveDate: "", leaseTerm: "12 months", stage: "shortlist", applicationDate: "", nextActionDate: "", notes: "", statuses: {}, privacyChecks: {}, messages: { application: "", inspection: "", followUp: "" }, followUps: [], inspectionReceipt: null };
}

const documents: DocumentItem[] = [
  { id: "identity", group: "신원 확인", title: "요청 범위에 맞는 신분증", detail: "에이전트가 요구한 종류와 개수를 확인하고 필요한 사본만 준비합니다.", caution: "TFN, 불필요한 면허번호·Medicare 정보는 가릴 수 있는지 먼저 물어보세요." },
  { id: "income", group: "지불 능력", title: "소득 또는 자금 증빙", detail: "Payslip, 거래내역을 가린 은행 잔액 증명 등 허용된 선택지에서 준비합니다.", caution: "인터넷뱅킹 로그인이나 전체 거래내역은 제공하지 마세요." },
  { id: "employment", group: "지불 능력", title: "고용 상태 확인", detail: "직종·고용 형태와 재직 여부를 확인할 수 있는 최소한의 자료를 준비합니다." },
  { id: "rental-history", group: "임대 이력", title: "Rental ledger 또는 이전 임대 이력", detail: "이전 에이전트가 발급한 임대료 납부 기록이 있다면 준비합니다." },
  { id: "references", group: "레퍼런스", title: "레퍼런스 연락 동의", detail: "연락처를 제출하기 전에 상대방에게 어떤 집에 지원하는지 알립니다." },
  { id: "terms", group: "지원 조건", title: "입주일·계약기간·가구 구성", detail: "광고 조건과 맞는지, 모든 성인 신청자가 각자 필요한 절차를 확인합니다." },
  { id: "agent", group: "보안 점검", title: "에이전트와 신청 경로 확인", detail: "광고 도메인, 사무실 전화번호와 신청 링크가 서로 일치하는지 확인합니다." },
  { id: "privacy", group: "보안 점검", title: "개인정보 수집·보관 안내 확인", detail: "수집 목적, 제3자 제공, 보관기간, 삭제·문의 방법을 읽습니다.", caution: "불필요한 선택 항목은 비워도 되는지 확인하세요." },
];
const reusableDocumentIds = ["identity", "income", "employment", "rental-history", "references"] as const;
const reusableDocuments = documents.filter((item) => reusableDocumentIds.includes(item.id as (typeof reusableDocumentIds)[number]));
function createEvidenceLibrary(statuses: Record<string, DocumentStatus> = {}) {
  return Object.fromEntries(reusableDocumentIds.map((id) => [id, { status: statuses[id] ?? "todo", checkedOn: "" }])) as Record<string, ReusableEvidence>;
}
const initialWorkspace: WorkspaceState = { version: 3, profile: initialProfile, evidenceLibrary: createEvidenceLibrary(), activeId: "starter", applications: [createApplication("starter")] };
const privacyChecks = [
  ["no-tfn", "TFN·카드·로그인 정보 제외", "세금번호, 카드번호, 인터넷뱅킹 로그인 정보가 포함되지 않았습니다."],
  ["redaction", "불필요한 거래·신분증 정보 가림", "목적과 무관한 거래내역과 식별번호를 가릴 수 있는지 확인했습니다."],
  ["verified-channel", "공식 신청 경로 확인", "링크와 연락처를 공식 웹사이트 또는 사무실 번호로 다시 확인했습니다."],
  ["retention", "보관·삭제 안내 확인", "탈락 후 자료 보관기간과 삭제 문의 방법을 확인했습니다."],
  ["reference-consent", "레퍼런스 사전 동의", "연락처를 제출하기 전 당사자에게 알렸습니다."],
  ["final-review", "최종 제출 범위 검토", "필수와 선택 항목을 구분하고 실제 필요한 자료만 첨부했습니다."],
] as const;
const stageOptions: Array<{ value: ApplicationStage; label: string }> = [
  { value: "shortlist", label: "관심 목록" }, { value: "inspected", label: "인스펙션 완료" },
  { value: "preparing", label: "신청 준비 중" }, { value: "submitted", label: "신청 제출" },
  { value: "follow_up", label: "후속 연락" }, { value: "approved", label: "승인" },
  { value: "declined", label: "미승인" }, { value: "withdrawn", label: "철회" },
];
const messageOptions: Array<{ value: MessageType; label: string }> = [
  { value: "application", label: "신청 소개문" }, { value: "inspection", label: "인스펙션 후 문의" }, { value: "followUp", label: "제출 후 확인" },
];
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const statusLabels: Record<DocumentStatus, string> = { todo: "준비 전", review: "확인 필요", ready: "준비 완료" };

function createId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function safeFileName(value: string) { return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 50) || "rental-application"; }
function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "Not set"; }
function stageLabel(stage: ApplicationStage) { return stageOptions.find((option) => option.value === stage)?.label ?? "관심 목록"; }
function nextActionStatus(value: string, stage: ApplicationStage) {
  if (!value || ["approved", "declined", "withdrawn"].includes(stage)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  const days = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `${Math.abs(days)}일 지남`, tone: "danger" as const };
  if (days === 0) return { label: "오늘", tone: "danger" as const };
  if (days <= 3) return { label: `${days}일 남음`, tone: "warning" as const };
  return { label: formatDate(value), tone: "normal" as const };
}

function normaliseInspectionReceipt(value: unknown): RentalReadyNowImportReceipt | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const receipt = value as Partial<RentalReadyNowImportReceipt>;
  return (receipt.mode === "share" || receipt.mode === "rent")
    && typeof receipt.reviewedCount === "number" && Number.isFinite(receipt.reviewedCount)
    && typeof receipt.concernCount === "number" && Number.isFinite(receipt.concernCount)
    && (receipt.sourceCreatedAt === undefined || typeof receipt.sourceCreatedAt === "number" && Number.isSafeInteger(receipt.sourceCreatedAt))
    ? {
        ...(receipt.sourceCreatedAt === undefined ? {} : { sourceCreatedAt: receipt.sourceCreatedAt }),
        mode: receipt.mode,
        reviewedCount: Math.max(0, Math.min(100, Math.trunc(receipt.reviewedCount))),
        concernCount: Math.max(0, Math.min(100, Math.trunc(receipt.concernCount))),
      }
    : null;
}

function normaliseApplication(candidate: Partial<RentalApplication>, fallbackId: string): RentalApplication {
  const base = createApplication(typeof candidate.id === "string" && candidate.id ? candidate.id : fallbackId);
  const followUps = Array.isArray(candidate.followUps) ? candidate.followUps.filter((entry) => entry && typeof entry.id === "string" && typeof entry.date === "string" && typeof entry.summary === "string" && ["email", "phone", "portal", "inspection"].includes(entry.channel) && ["sent", "received"].includes(entry.direction)).slice(-50) : [];
  return { ...base, ...candidate, id: base.id, jurisdiction: rentalJurisdictionCodes.includes(candidate.jurisdiction as RentalJurisdictionCode) ? candidate.jurisdiction as RentalJurisdictionCode : "", stage: stageOptions.some((option) => option.value === candidate.stage) ? candidate.stage as ApplicationStage : base.stage, statuses: candidate.statuses && typeof candidate.statuses === "object" ? candidate.statuses : {}, privacyChecks: candidate.privacyChecks && typeof candidate.privacyChecks === "object" ? candidate.privacyChecks : {}, messages: { ...base.messages, ...(candidate.messages && typeof candidate.messages === "object" ? candidate.messages : {}) }, followUps, inspectionReceipt: normaliseInspectionReceipt(candidate.inspectionReceipt) };
}

function parseWorkspace(saved: string): WorkspaceState {
  type LegacyPack = { id?: string; propertyLabel?: string; moveDate?: string; leaseTerm?: string; householdSize?: string; employmentSummary?: string; rentalSummary?: string; petSummary?: string; strengths?: string; statuses?: Record<string, DocumentStatus>; coverNote?: string; inspectionSummary?: RentalReadyNowImportReceipt | null; contactStatus?: string; followUpDate?: string };
  const parsed = JSON.parse(saved) as { version?: number; profile?: Partial<ApplicantProfile>; evidenceLibrary?: Record<string, Partial<ReusableEvidence>>; activeId?: string; applications?: Partial<RentalApplication>[]; packs?: LegacyPack[]; propertyLabel?: string; moveDate?: string; leaseTerm?: string; statuses?: Record<string, DocumentStatus>; coverNote?: string; householdSize?: string; employmentSummary?: string; rentalSummary?: string; petSummary?: string; strengths?: string };
  if ((parsed.version === 2 || parsed.version === 3) && Array.isArray(parsed.applications) && parsed.applications.length) {
    const applications = parsed.applications.slice(0, MAX_APPLICATIONS).map((item, index) => normaliseApplication(item, `restored-${index + 1}`));
    const storedEvidence = parsed.evidenceLibrary && typeof parsed.evidenceLibrary === "object" ? parsed.evidenceLibrary : createEvidenceLibrary(applications[0].statuses);
    const evidenceLibrary = Object.fromEntries(reusableDocumentIds.map((id) => { const evidence = storedEvidence[id]; const status = evidence?.status; return [id, { status: status === "review" || status === "ready" ? status : "todo", checkedOn: typeof evidence?.checkedOn === "string" ? evidence.checkedOn : "" }]; })) as Record<string, ReusableEvidence>;
    return { version: 3, profile: { ...initialProfile, ...(parsed.profile ?? {}) }, evidenceLibrary, activeId: applications.some((item) => item.id === parsed.activeId) ? parsed.activeId as string : applications[0].id, applications };
  }
  if (parsed.version === 2 && Array.isArray(parsed.packs) && parsed.packs.length) {
    const legacyPacks = parsed.packs.slice(0, MAX_APPLICATIONS);
    const applications = legacyPacks.map((pack, index) => {
      const application = createApplication(typeof pack.id === "string" && pack.id ? pack.id : `migrated-${index + 1}`);
      application.propertyLabel = typeof pack.propertyLabel === "string" ? pack.propertyLabel : "";
      application.moveDate = typeof pack.moveDate === "string" ? pack.moveDate : "";
      application.leaseTerm = typeof pack.leaseTerm === "string" ? pack.leaseTerm : "12 months";
      application.nextActionDate = typeof pack.followUpDate === "string" ? pack.followUpDate : "";
      application.statuses = pack.statuses && typeof pack.statuses === "object" ? pack.statuses : {};
      application.messages.application = typeof pack.coverNote === "string" ? pack.coverNote : "";
      application.inspectionReceipt = normaliseInspectionReceipt(pack.inspectionSummary);
      application.stage = pack.contactStatus === "drafting" ? "preparing"
        : pack.contactStatus === "sent" ? "submitted"
        : pack.contactStatus === "follow-up" || pack.contactStatus === "closed" ? "follow_up"
        : "shortlist";
      return application;
    });
    const profileSource = legacyPacks.find((pack) => pack.id === parsed.activeId) ?? legacyPacks[0];
    const profile = {
      householdSize: typeof profileSource.householdSize === "string" ? profileSource.householdSize : "1",
      employmentSummary: typeof profileSource.employmentSummary === "string" ? profileSource.employmentSummary : "",
      rentalSummary: typeof profileSource.rentalSummary === "string" ? profileSource.rentalSummary : "",
      petSummary: typeof profileSource.petSummary === "string" ? profileSource.petSummary : "No pets",
      strengths: typeof profileSource.strengths === "string" ? profileSource.strengths : "",
    };
    return { version: 3, profile, evidenceLibrary: createEvidenceLibrary(profileSource.statuses), activeId: applications.some((item) => item.id === parsed.activeId) ? parsed.activeId as string : applications[0].id, applications };
  }
  const migrated = createApplication("migrated");
  migrated.propertyLabel = typeof parsed.propertyLabel === "string" ? parsed.propertyLabel : "";
  migrated.moveDate = typeof parsed.moveDate === "string" ? parsed.moveDate : "";
  migrated.leaseTerm = typeof parsed.leaseTerm === "string" ? parsed.leaseTerm : "12 months";
  migrated.statuses = parsed.statuses && typeof parsed.statuses === "object" ? parsed.statuses : {};
  migrated.messages.application = typeof parsed.coverNote === "string" ? parsed.coverNote : "";
  return { version: 3, profile: { householdSize: typeof parsed.householdSize === "string" ? parsed.householdSize : "1", employmentSummary: typeof parsed.employmentSummary === "string" ? parsed.employmentSummary : "", rentalSummary: typeof parsed.rentalSummary === "string" ? parsed.rentalSummary : "", petSummary: typeof parsed.petSummary === "string" ? parsed.petSummary : "No pets", strengths: typeof parsed.strengths === "string" ? parsed.strengths : "" }, evidenceLibrary: createEvidenceLibrary(migrated.statuses), activeId: migrated.id, applications: [migrated] };
}

export function RentalApplicationWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [firstCandidateSaved, setFirstCandidateSaved] = useState(false);
  const [firstCandidateMessage, setFirstCandidateMessage] = useState("");
  const [activeMessageType, setActiveMessageType] = useState<MessageType>("application");
  const [followUpDraft, setFollowUpDraft] = useState({ date: "", channel: "email" as FollowUpEntry["channel"], direction: "sent" as FollowUpEntry["direction"], summary: "" });
  const backupInputRef = useRef<HTMLInputElement>(null);
  const didInitialiseRef = useRef(false);

  useEffect(() => {
    if (didInitialiseRef.current) return;
    didInitialiseRef.current = true;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      let nextWorkspace = saved ? parseWorkspace(saved) : initialWorkspace;
      const handoff = readRentalReadyNowHandoff(window.localStorage);
      if (handoff) {
        const contextNote = `무료 집 방문 체크에서 ${handoff.reviewedCount}개 항목 확인 · 다시 확인 ${handoff.concernCount}개. 방문 메모와 세부 체크 결과는 개인정보 보호를 위해 가져오지 않았습니다.`;
        const receipt = createRentalReadyNowImportReceipt(handoff);
        const handoffAlreadyImported = nextWorkspace.applications.some((item) => rentalReadyNowReceiptMatches(item.inspectionReceipt, handoff));
        const activeApplication = nextWorkspace.applications.find((item) => item.id === nextWorkspace.activeId) ?? nextWorkspace.applications[0];
        const activeIsBlank = !activeApplication.propertyLabel && !activeApplication.notes && Object.keys(activeApplication.statuses).length === 0 && activeApplication.followUps.length === 0;
        let importedHandoff = false;
        if (handoffAlreadyImported) {
          try { clearRentalReadyNowHandoff(window.localStorage); } catch {}
          setMessage("무료 집 방문 결과는 이미 가져왔습니다. 같은 후보를 다시 만들지 않았습니다.");
        } else if (activeIsBlank) {
          nextWorkspace = { ...nextWorkspace, applications: nextWorkspace.applications.map((item) => item.id === activeApplication.id ? { ...item, propertyLabel: handoff.propertyLabel, stage: "inspected", notes: contextNote, inspectionReceipt: receipt } : item) };
          importedHandoff = true;
          setMessage("무료 집 방문 결과의 최소 정보만 현재 집 후보로 가져왔습니다.");
        } else if (nextWorkspace.applications.length < MAX_APPLICATIONS) {
          const imported = createApplication(createId(), handoff.propertyLabel || `집 후보 ${nextWorkspace.applications.length + 1}`);
          imported.stage = "inspected"; imported.notes = contextNote; imported.inspectionReceipt = receipt;
          nextWorkspace = { ...nextWorkspace, activeId: imported.id, applications: [...nextWorkspace.applications, imported] };
          importedHandoff = true;
          setMessage("무료 집 방문 결과의 최소 정보만 새 집 후보로 가져왔습니다.");
        }
        if (importedHandoff) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace));
          try { window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved"); } catch {}
          try { clearRentalReadyNowHandoff(window.localStorage); } catch {
            // The persisted import receipt makes a later retry idempotent.
          }
        }
      }
      setWorkspace(nextWorkspace);
      setFirstCandidateSaved(readRentalReadyNowSavedFlag(window.localStorage, FIRST_SUCCESS_KEY) || nextWorkspace.applications.some((item) => Boolean(item.propertyLabel.trim())));
    } catch {
      setMessage("브라우저 저장소를 사용할 수 없어 무료 방문 결과를 가져오지 못했습니다. 무료 방문 결과 원본은 삭제하지 않았습니다.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => { if (!loaded) return; const timer = window.setTimeout(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch {} }, 400); return () => window.clearTimeout(timer); }, [workspace, loaded]);

  const active = workspace.applications.find((item) => item.id === workspace.activeId) ?? workspace.applications[0];
  useEffect(() => { setFollowUpDraft({ date: "", channel: "email", direction: "sent", summary: "" }); }, [active.id]);
  const readyCount = useMemo(() => documents.filter((item) => active.statuses[item.id] === "ready").length, [active.statuses]);
  const reviewItems = useMemo(() => documents.filter((item) => active.statuses[item.id] === "review"), [active.statuses]);
  const privacyCount = useMemo(() => privacyChecks.filter(([id]) => active.privacyChecks[id]).length, [active.privacyChecks]);
  const progress = Math.round((readyCount / documents.length) * 100);
  const privacyProgress = Math.round((privacyCount / privacyChecks.length) * 100);
  const submittedCount = workspace.applications.filter((item) => ["submitted", "follow_up", "approved", "declined"].includes(item.stage)).length;
  const approvedCount = workspace.applications.filter((item) => item.stage === "approved").length;
  const activeAction = loaded ? nextActionStatus(active.nextActionDate, active.stage) : null;
  const activeJurisdiction = getRentalJurisdiction(active.jurisdiction);

  const updateProfile = <K extends keyof ApplicantProfile>(field: K, value: ApplicantProfile[K]) => setWorkspace((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  const updateEvidence = (id: string, patch: Partial<ReusableEvidence>) => setWorkspace((current) => ({ ...current, evidenceLibrary: { ...current.evidenceLibrary, [id]: { ...current.evidenceLibrary[id], ...patch } } }));
  const updateActive = (patch: Partial<RentalApplication>) => setWorkspace((current) => ({ ...current, applications: current.applications.map((item) => item.id === current.activeId ? { ...item, ...patch } : item) }));
  const saveFirstCandidate = () => {
    const label = active.propertyLabel.trim();
    if (!label) return setFirstCandidateMessage("정확한 주소 대신 알아볼 수 있는 별칭을 입력해 주세요.");
    const nextWorkspace = { ...workspace, applications: workspace.applications.map((item) => item.id === workspace.activeId ? { ...item, propertyLabel: label } : item) };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace));
      window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved");
    } catch {
      setFirstCandidateMessage("브라우저 저장소를 사용할 수 없어 첫 후보 저장을 확인하지 못했습니다.");
      return;
    }
    setWorkspace(nextWorkspace);
    setFirstCandidateSaved(true);
    setFirstCandidateMessage(`“${label}”을 첫 집 후보로 저장했습니다.`);
  };
  const addApplication = () => {
    if (workspace.applications.length >= MAX_APPLICATIONS) return setMessage(`한 기기에서 최대 ${MAX_APPLICATIONS}개 후보를 관리할 수 있습니다.`);
    const next = createApplication(createId(), `집 후보 ${workspace.applications.length + 1}`);
    setWorkspace((current) => ({ ...current, activeId: next.id, applications: [...current.applications, next] })); setMessage("새 집 후보를 추가했습니다. 재사용 프로필은 그대로 유지됩니다.");
  };
  const duplicateApplication = () => {
    if (workspace.applications.length >= MAX_APPLICATIONS) return setMessage(`최대 ${MAX_APPLICATIONS}개 후보까지 만들 수 있습니다.`);
    const id = createId();
    const copy = createApplication(id, `집 후보 ${workspace.applications.length + 1}`);
    copy.jurisdiction = active.jurisdiction; copy.weeklyRent = active.weeklyRent; copy.moveDate = active.moveDate; copy.leaseTerm = active.leaseTerm; copy.stage = "preparing";
    setWorkspace((current) => ({ ...current, activeId: copy.id, applications: [...current.applications, copy] })); setMessage("계약 조건만 복제했습니다. 이전 집의 주소·문구·제출 상태·연락 기록은 안전을 위해 복사하지 않았습니다.");
  };
  const deleteApplication = () => {
    if (workspace.applications.length === 1) return setMessage("마지막 후보는 삭제할 수 없습니다.");
    if (!window.confirm(`‘${active.propertyLabel || "이 집 후보"}’ 기록을 삭제할까요? 먼저 백업을 권장합니다.`)) return;
    setWorkspace((current) => { const applications = current.applications.filter((item) => item.id !== current.activeId); return { ...current, applications, activeId: applications[0].id }; }); setMessage("집 후보 기록을 삭제했습니다.");
  };

  const createMessages = () => {
    const property = active.propertyLabel.trim() || "the advertised property";
    const greeting = active.agentName.trim() ? `Hello ${active.agentName.trim()},` : "Hello,";
    const people = Math.max(1, Number(workspace.profile.householdSize) || 1);
    const household = people === 1 ? "I would be the sole occupant" : `Our household consists of ${people} people`;
    const employment = workspace.profile.employmentSummary.trim() ? `My current work situation is: ${workspace.profile.employmentSummary.trim()}.` : "I can provide the requested evidence of my ability to meet the rent.";
    const rental = workspace.profile.rentalSummary.trim() ? `Rental background: ${workspace.profile.rentalSummary.trim()}.` : "I can provide rental history or suitable references on request.";
    const pets = `${(workspace.profile.petSummary.trim() || "No pet information has been added").replace(/[.!?]+$/, "")}.`;
    const strengths = `${(workspace.profile.strengths.trim() || "I would look after the property carefully and communicate promptly about maintenance issues").replace(/[.!?]+$/, "")}.`;
    const moveDate = active.moveDate ? formatDate(active.moveDate) : "the advertised availability date";
    const lease = active.leaseTerm === "Flexible" ? "flexible-term" : active.leaseTerm.replace(" months", "-month");
    updateActive({ messages: {
      application: [greeting, `I am writing to apply for ${property}. I am looking to move in around ${moveDate} and would prefer a ${lease || "12-month"} agreement.`, `${household}. ${employment} ${rental}`, `${pets} ${strengths}`, "I am happy to provide the documents reasonably required through the agent's verified application channel.", "Thank you for considering my application. I would be pleased to provide any further relevant information.", "Kind regards,"].join("\n\n"),
      inspection: [greeting, `Thank you for showing me ${property}. I remain interested and am preparing my application.`, "Could you please confirm the preferred application channel, deadline, proposed lease start date, and documents specifically required?", "If there is a privacy notice covering how unsuccessful applications are stored or deleted, I would also appreciate a link.", "Kind regards,"].join("\n\n"),
      followUp: [greeting, `I am following up on my application for ${property}${active.applicationDate ? `, submitted on ${formatDate(active.applicationDate)}` : ""}.`, "Could you please confirm it was received and let me know if any relevant information is missing? I am happy to respond promptly through the verified application channel.", "Thank you for your time.", "Kind regards,"].join("\n\n"),
    } }); setMessage("영문 문구 3종을 만들었습니다. 제출 전 사실과 표현을 확인하세요.");
  };

  const applyReusableEvidence = () => {
    const statuses = { ...active.statuses };
    for (const document of reusableDocuments) statuses[document.id] = workspace.evidenceLibrary[document.id]?.status ?? "todo";
    updateActive({ statuses });
    setMessage("공용 증빙 준비 상태를 현재 집 체크리스트에 반영했습니다. 제출 전에 날짜와 에이전트 요구사항을 다시 확인하세요.");
  };
  const addFollowUp = () => {
    const summary = followUpDraft.summary.trim();
    if (!followUpDraft.date || !summary) return setMessage("연락 날짜와 민감정보를 제외한 요약을 입력해 주세요.");
    const entry: FollowUpEntry = { id: createId(), ...followUpDraft, summary };
    updateActive({ followUps: [...active.followUps, entry].slice(-50), stage: ["submitted", "follow_up"].includes(active.stage) ? "follow_up" : active.stage });
    setFollowUpDraft({ date: "", channel: "email", direction: "sent", summary: "" });
    setMessage("후속 연락을 현재 집 기록에 추가했습니다.");
  };
  const removeFollowUp = (id: string) => { updateActive({ followUps: active.followUps.filter((entry) => entry.id !== id) }); setMessage("후속 연락 기록을 삭제했습니다."); };

  const copyMessage = async () => { const text = active.messages[activeMessageType]; if (!text) return; try { await navigator.clipboard.writeText(text); setMessage("선택한 문구를 복사했습니다."); } catch { setMessage("브라우저 복사 권한을 확인해 주세요."); } };
  const saveBlob = (content: string, type: string, name: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); };
  const downloadBackup = () => { saveBlob(JSON.stringify(workspace, null, 2), "application/json;charset=utf-8", `hoju-compass-rental-workspace-${new Date().toISOString().slice(0, 10)}.json`); setMessage("전체 작업 공간을 JSON으로 백업했습니다."); };
  const restoreBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      if (file.size > 1_000_000) throw new Error("Rental workspace backup is too large");
      const content = await file.text();
      const candidate: unknown = JSON.parse(content);
      if (!isRentalWorkspaceBackup(candidate, MAX_APPLICATIONS)) throw new Error("Invalid rental workspace backup");
      const restored = parseWorkspace(content);
      if (!window.confirm(`백업에 있는 집 후보 ${restored.applications.length}개로 현재 작업 공간을 바꿀까요? 현재 내용은 먼저 전체 백업을 권장합니다.`)) return;
      setWorkspace(restored); setMessage(`백업에서 집 후보 ${restored.applications.length}개를 복원했습니다.`);
    } catch {
      setMessage("이 파일은 Rental Pack 전체 백업으로 확인되지 않습니다. 원본 JSON 파일을 선택해 주세요.");
    } finally {
      if (backupInputRef.current) backupInputRef.current.value = "";
    }
  };
  const downloadSummary = () => {
    const lines = ["HOJU COMPASS — RENTAL APPLICATION PACK", `Property: ${active.propertyLabel || "Not set"}`, `Suburb: ${active.suburb || "Not set"}`, `State or territory: ${activeJurisdiction ? `${activeJurisdiction.name} (${activeJurisdiction.code})` : "Not set"}`, `Weekly rent: ${active.weeklyRent ? `A$${active.weeklyRent}` : "Not set"}`, `Stage: ${stageLabel(active.stage)}`, `Move-in: ${active.moveDate || "Not set"}`, `Next action: ${active.nextActionDate || "Not set"}`, "", "REUSABLE EVIDENCE LIBRARY", ...reusableDocuments.map((item) => { const evidence = workspace.evidenceLibrary[item.id]; return `- [${statusLabels[evidence?.status ?? "todo"]}] ${item.title} · checked ${evidence?.checkedOn || "not set"}`; }), "", "STATE OR TERRITORY CHECK", ...(activeJurisdiction ? [...activeJurisdiction.checkpoints.map((item) => `- ${item}`), `- Official source: ${activeJurisdiction.href}`] : ["- Select a state or territory and check the current official guidance before applying."]), "", "PROPERTY DOCUMENT STATUS", ...documents.map((item) => `- [${statusLabels[active.statuses[item.id] ?? "todo"]}] ${item.title}`), "", "PRIVACY CHECK", ...privacyChecks.map(([id, title]) => `- [${active.privacyChecks[id] ? "Checked" : "Not checked"}] ${title}`), "", "FOLLOW-UP LOG", ...(active.followUps.length ? active.followUps.map((entry) => `- ${entry.date} · ${entry.direction} via ${entry.channel} · ${entry.summary}`) : ["- No contact recorded"]), "", "ITEMS TO REVIEW", ...(reviewItems.length ? reviewItems.map((item) => `- ${item.title}: ${item.caution ?? item.detail}`) : ["- None marked"]), "", "APPLICATION NOTE", active.messages.application || "Not created", "", "INSPECTION MESSAGE", active.messages.inspection || "Not created", "", "FOLLOW-UP MESSAGE", active.messages.followUp || "Not created", "", "Preparation summary only; no source document is embedded. Check current official rules. Do not include TFN, bank login details, card details or identity document numbers."];
    saveBlob(lines.join("\r\n"), "text/plain;charset=utf-8", `${safeFileName(active.propertyLabel)}-application-pack.txt`); setMessage("현재 집 후보의 TXT 패키지를 저장했습니다.");
  };
  const downloadPropertyPackage = () => {
    const bundle = { format: "hoju-compass-rental-property-package", version: 1, exportedAt: new Date().toISOString(), warning: "This file contains preparation notes and message drafts, but no source documents. Keep it private and review before sharing.", profile: workspace.profile, reusableEvidence: workspace.evidenceLibrary, application: active };
    saveBlob(JSON.stringify(bundle, null, 2), "application/json;charset=utf-8", `${safeFileName(active.propertyLabel)}-private-package.json`);
    setMessage("현재 집의 비공개 패키지를 저장했습니다. 제출용 원본 서류는 포함되지 않습니다.");
  };

  return <div className="space-y-8">
    {!firstCandidateSaved ? <form className="border-l-4 border-gold bg-gold/10 p-5 sm:p-6" onSubmit={(event) => { event.preventDefault(); saveFirstCandidate(); }} aria-labelledby="rental-first-candidate-heading"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">구매 후 첫 1분</p><h2 id="rental-first-candidate-heading" className="mt-2 text-xl font-semibold text-navy">첫 집 후보 하나를 먼저 저장하세요.</h2><p className="mt-2 text-sm leading-6 text-muted">정확한 주소는 적지 말고 “Carlton 후보 1”처럼 나만 알아볼 별칭을 사용하세요.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1 text-sm font-semibold text-navy">첫 집 후보 별칭<input id="rental-first-candidate-label" autoComplete="off" maxLength={80} value={active.propertyLabel} onChange={(event) => updateActive({ propertyLabel: event.target.value })} className="mt-2 min-h-12 w-full border border-border bg-white px-3 text-sm font-normal text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15" /></label><button type="submit" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-sm font-semibold text-white">첫 후보 저장</button></div><p className="mt-3 min-h-5 text-sm leading-5 text-red-800" role="status" aria-live="polite">{firstCandidateMessage}</p></form> : <div className="border-l-4 border-emerald-600 bg-emerald-50 p-5 sm:flex sm:items-center sm:justify-between sm:gap-5 sm:p-6" role="status"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800">첫 후보 저장 완료</p><h2 className="mt-2 text-xl font-semibold text-navy">{firstCandidateMessage || "첫 집 후보가 이 브라우저에 저장되어 있어요."}</h2><p className="mt-2 text-sm leading-6 text-muted">이 후보의 증빙 상태, 개인정보 확인과 다음 행동을 집별로 이어서 관리할 수 있어요.</p></div><a href="#rental-document-readiness" className="mt-4 inline-flex min-h-12 shrink-0 items-center justify-center bg-navy px-5 text-sm font-semibold text-white sm:mt-0">8개 증빙 상태 시작</a></div>}
    <section className="border-y border-navy/20 bg-white py-6" aria-labelledby="rental-dashboard-heading">
      <div className="flex flex-wrap items-end justify-between gap-4 px-5 sm:px-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application dashboard</p><h2 id="rental-dashboard-heading" className="mt-2 text-2xl font-semibold text-navy">집 후보와 신청 진행 상황</h2></div><div className="flex flex-wrap gap-2"><input ref={backupInputRef} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void restoreBackup(event.target.files?.[0])} /><button type="button" onClick={() => backupInputRef.current?.click()} className="min-h-11 border border-border px-4 text-sm font-semibold text-navy">백업 복원</button><button type="button" onClick={downloadBackup} className="min-h-11 border border-border px-4 text-sm font-semibold text-navy">전체 백업</button><button type="button" onClick={addApplication} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">+ 새 집 후보</button></div></div>
      <div className="mt-6 grid gap-px bg-border sm:grid-cols-3"><div className="bg-surface px-6 py-4"><p className="text-xs text-muted">관리 중</p><p className="font-mono text-2xl text-navy">{workspace.applications.length}</p></div><div className="bg-surface px-6 py-4"><p className="text-xs text-muted">제출</p><p className="font-mono text-2xl text-navy">{submittedCount}</p></div><div className="bg-surface px-6 py-4"><p className="text-xs text-muted">승인</p><p className="font-mono text-2xl text-navy">{approvedCount}</p></div></div>
      <div className="mt-5 flex gap-3 overflow-x-auto px-5 pb-2 sm:px-7">{workspace.applications.map((item) => { const count = documents.filter((doc) => item.statuses[doc.id] === "ready").length; const selected = item.id === active.id; const action = loaded ? nextActionStatus(item.nextActionDate, item.stage) : null; return <button key={item.id} type="button" onClick={() => setWorkspace((current) => ({ ...current, activeId: item.id }))} className={`min-w-56 border p-4 text-left ${selected ? "border-navy bg-navy text-white" : "border-border bg-white text-navy"}`} aria-pressed={selected}><span className={`text-xs font-semibold ${selected ? "text-gold" : "text-muted"}`}>{stageLabel(item.stage)}</span><strong className="mt-2 block truncate">{item.propertyLabel || "이름 없는 집 후보"}</strong><span className={`mt-2 block text-xs ${selected ? "text-white/65" : "text-muted"}`}>서류 {count}/{documents.length}</span>{action ? <span className={`mt-3 inline-flex px-2 py-1 text-xs font-semibold ${action.tone === "danger" ? "bg-[#f6dddd] text-[#8c3434]" : action.tone === "warning" ? "bg-gold/20 text-[#755b20]" : selected ? "bg-white/10 text-white" : "bg-surface text-muted"}`}>다음 행동 · {action.label}</span> : null}</button>; })}</div>
    </section>

    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(34rem,1.08fr)]"><div className="space-y-8">
      <section className="border-t border-navy/20 pt-6"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Reusable profile</p><h2 className="mt-2 text-2xl font-semibold text-navy">모든 집에 재사용할 신청자 프로필</h2><p className="mt-3 text-sm leading-6 text-muted">금액, 회사명, 신분증 번호처럼 민감한 정보는 적지 마세요.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy">입주 인원<input type="number" min="1" max="12" className={inputClass} value={workspace.profile.householdSize} onChange={(e) => updateProfile("householdSize", e.target.value)} /></label><label className="text-sm font-medium text-navy">반려동물 요약<input className={inputClass} value={workspace.profile.petSummary} onChange={(e) => updateProfile("petSummary", e.target.value)} /></label>
        <label className="text-sm font-medium text-navy sm:col-span-2">고용·소득 상황 한 줄<input className={inputClass} value={workspace.profile.employmentSummary} onChange={(e) => updateProfile("employmentSummary", e.target.value)} placeholder="Full-time employee with regular income" /></label><label className="text-sm font-medium text-navy sm:col-span-2">임대 이력 또는 대체 설명<input className={inputClass} value={workspace.profile.rentalSummary} onChange={(e) => updateProfile("rentalSummary", e.target.value)} /></label><label className="text-sm font-medium text-navy sm:col-span-2">집을 잘 관리할 근거<textarea className={`${inputClass} min-h-24 resize-y`} value={workspace.profile.strengths} onChange={(e) => updateProfile("strengths", e.target.value)} /></label>
      </div></section>

      <section className="border border-border bg-white p-5 sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Reusable evidence</p><h2 className="mt-2 text-xl font-semibold text-navy">공용 증빙 라이브러리</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">파일을 올리지 않고 준비 상태와 마지막 확인일만 기록합니다. 집마다 요구 범위가 다르므로 적용 후 다시 확인하세요.</p></div><button type="button" onClick={applyReusableEvidence} className="min-h-11 border-b-2 border-gold px-2 text-sm font-semibold text-navy">현재 집에 상태 적용</button></div><ul className="mt-5 divide-y divide-border">{reusableDocuments.map((item) => { const evidence = workspace.evidenceLibrary[item.id] ?? { status: "todo" as DocumentStatus, checkedOn: "" }; return <li key={item.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_8rem_10rem] sm:items-end"><div><strong className="block text-sm text-navy">{item.title}</strong><span className="mt-1 block text-xs leading-5 text-muted">원본 파일명·번호·금액은 저장하지 마세요.</span></div><label className="text-xs text-muted">공용 상태<select className="mt-1 min-h-11 w-full border border-border bg-white px-2 text-sm text-navy" value={evidence.status} onChange={(event) => updateEvidence(item.id, { status: event.target.value as DocumentStatus })}><option value="todo">준비 전</option><option value="review">확인 필요</option><option value="ready">재사용 가능</option></select></label><label className="text-xs text-muted">마지막 확인일<input type="date" className="mt-1 min-h-11 w-full border border-border bg-white px-2 text-sm text-navy" value={evidence.checkedOn} onChange={(event) => updateEvidence(item.id, { checkedOn: event.target.value })} /></label></li>; })}</ul></section>

      <section className="border border-border bg-white p-5 sm:p-7"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Property brief</p><h2 className="mt-2 text-xl font-semibold text-navy">현재 집 후보 정보</h2></div><div className="flex gap-2"><button type="button" onClick={duplicateApplication} className="min-h-11 min-w-11 border-b-2 border-gold px-3 text-xs font-semibold text-navy">조건 복제</button><button type="button" onClick={deleteApplication} className="min-h-11 min-w-11 px-3 text-xs font-semibold text-[#8c3434]">삭제</button></div></div><p className="mt-3 text-sm text-muted">정확한 주소 대신 별칭과 suburb만 적어도 됩니다. 조건 복제는 이전 집의 문구·제출 상태·연락 기록을 넘기지 않습니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy sm:col-span-2">집 후보 별칭<input className={inputClass} value={active.propertyLabel} onChange={(e) => updateActive({ propertyLabel: e.target.value })} placeholder="Carlton 후보 1" /></label><label className="text-sm font-medium text-navy">Suburb<input className={inputClass} value={active.suburb} onChange={(e) => updateActive({ suburb: e.target.value })} /></label><label className="text-sm font-medium text-navy">주·준주<select className={inputClass} value={active.jurisdiction} onChange={(e) => updateActive({ jurisdiction: e.target.value as RentalJurisdictionCode | "" })}><option value="">선택하세요</option>{rentalJurisdictions.map((jurisdiction) => <option key={jurisdiction.code} value={jurisdiction.code}>{jurisdiction.code} · {jurisdiction.name}</option>)}</select></label><label className="text-sm font-medium text-navy">주당 렌트 (AUD)<input type="number" min="0" className={inputClass} value={active.weeklyRent} onChange={(e) => updateActive({ weeklyRent: e.target.value })} /></label>
        <label className="text-sm font-medium text-navy">진행 상태<select className={inputClass} value={active.stage} onChange={(e) => updateActive({ stage: e.target.value as ApplicationStage })}>{stageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="text-sm font-medium text-navy">담당자 이름<input className={inputClass} value={active.agentName} onChange={(e) => updateActive({ agentName: e.target.value })} /></label>
        <label className="text-sm font-medium text-navy">희망 입주일<input type="date" className={inputClass} value={active.moveDate} onChange={(e) => updateActive({ moveDate: e.target.value })} /></label><label className="text-sm font-medium text-navy">계약기간<select className={inputClass} value={active.leaseTerm} onChange={(e) => updateActive({ leaseTerm: e.target.value })}><option>6 months</option><option>12 months</option><option>18 months</option><option>24 months</option><option>Flexible</option></select></label>
        <label className="text-sm font-medium text-navy">신청 제출일<input type="date" className={inputClass} value={active.applicationDate} onChange={(e) => updateActive({ applicationDate: e.target.value })} /></label><label className="text-sm font-medium text-navy">다음 행동 날짜<input type="date" className={inputClass} value={active.nextActionDate} onChange={(e) => updateActive({ nextActionDate: e.target.value })} />{activeAction ? <span className={`mt-2 block text-xs font-semibold ${activeAction.tone === "danger" ? "text-[#8c3434]" : activeAction.tone === "warning" ? "text-[#755b20]" : "text-muted"}`}>다음 행동: {activeAction.label}</span> : null}</label><label className="text-sm font-medium text-navy sm:col-span-2">메모 (민감정보 제외)<textarea className={`${inputClass} min-h-24 resize-y`} value={active.notes} onChange={(e) => updateActive({ notes: e.target.value })} /></label>
      </div>{activeJurisdiction ? <aside className="mt-6 border-l-2 border-gold bg-surface p-5" aria-label={`${activeJurisdiction.name} 신청 전 공식 확인`}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold">{activeJurisdiction.code} official checkpoint</p><h3 className="mt-2 font-semibold text-navy">{activeJurisdiction.name} 신청 전 공식 확인</h3><p className="mt-2 text-sm leading-6 text-muted">{activeJurisdiction.summary}</p><ul className="mt-3 space-y-2 text-sm leading-6 text-navy">{activeJurisdiction.checkpoints.map((item) => <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-gold">✓</span><span>{item}</span></li>)}</ul><a href={activeJurisdiction.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-navy">{activeJurisdiction.authority} 최신 안내 열기 ↗</a><p className="mt-3 text-xs leading-5 text-muted">2026년 8월 21일 확인 · 법률 자문이 아니며 제출 직전에 공식 원문을 다시 확인하세요.</p></aside> : <p className="mt-5 border-l-2 border-border pl-4 text-sm leading-6 text-muted">주·준주를 선택하면 이 집에 맞는 공식 신청 안내와 확인 항목을 표시합니다.</p>}</section>

      <section className="border border-border bg-white p-5 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Follow-up tracker</p><h2 className="mt-2 text-xl font-semibold text-navy">집별 후속 연락 기록</h2><p className="mt-3 text-sm leading-6 text-muted">연락처·신분번호·신청 링크 대신 날짜, 채널과 결과만 짧게 남기세요.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-muted">연락 날짜<input type="date" className={inputClass} value={followUpDraft.date} onChange={(event) => setFollowUpDraft((current) => ({ ...current, date: event.target.value }))} /></label><label className="text-xs text-muted">방향<select className={inputClass} value={followUpDraft.direction} onChange={(event) => setFollowUpDraft((current) => ({ ...current, direction: event.target.value as FollowUpEntry["direction"] }))}><option value="sent">보냄</option><option value="received">받음</option></select></label><label className="text-xs text-muted">채널<select className={inputClass} value={followUpDraft.channel} onChange={(event) => setFollowUpDraft((current) => ({ ...current, channel: event.target.value as FollowUpEntry["channel"] }))}><option value="email">Email</option><option value="phone">Phone</option><option value="portal">Portal</option><option value="inspection">Inspection</option></select></label><label className="text-xs text-muted">결과 요약<input className={inputClass} maxLength={160} value={followUpDraft.summary} onChange={(event) => setFollowUpDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="Received; decision expected Friday" /></label></div><button type="button" onClick={addFollowUp} className="mt-4 min-h-11 bg-navy px-4 text-sm font-semibold text-white">연락 기록 추가</button><ol className="mt-5 divide-y divide-border border-y border-border">{active.followUps.length ? [...active.followUps].reverse().map((entry) => <li key={entry.id} className="flex gap-3 py-4"><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-gold">{entry.date} · {entry.direction === "sent" ? "보냄" : "받음"} · {entry.channel}</p><p className="mt-2 break-words text-sm text-navy">{entry.summary}</p></div><button type="button" onClick={() => removeFollowUp(entry.id)} className="min-h-11 min-w-11 self-center text-xs font-semibold text-[#8c3434]" aria-label={`${entry.date} 연락 기록 삭제`}>삭제</button></li>) : <li className="py-5 text-sm text-muted">아직 기록한 연락이 없습니다.</li>}</ol></section>

      <section className="border border-border bg-white p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Privacy guard</p><h2 className="mt-2 text-xl font-semibold text-navy">제출 전 개인정보 점검</h2></div><p className="font-mono text-2xl text-navy">{privacyProgress}%</p></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold" style={{ width: `${privacyProgress}%` }} /></div><ul className="mt-5 divide-y divide-border">{privacyChecks.map(([id, title, detail]) => <li key={id} className="py-4"><label className="flex cursor-pointer gap-3"><input type="checkbox" className="mt-1 size-4 accent-[#1a2744]" checked={Boolean(active.privacyChecks[id])} onChange={(e) => updateActive({ privacyChecks: { ...active.privacyChecks, [id]: e.target.checked } })} /><span><strong className="block text-sm text-navy">{title}</strong><span className="mt-1 block text-xs leading-5 text-muted">{detail}</span></span></label></li>)}</ul></section>
    </div>

    <div className="space-y-8"><section id="rental-document-readiness" className="scroll-mt-24 border border-border bg-white p-5 shadow-sm sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Document readiness</p><h2 className="mt-2 text-xl font-semibold text-navy">서류 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{readyCount} / {documents.length}</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{documents.map((item, index) => { const status = active.statuses[item.id] ?? "todo"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.group}</p><h3 className="mt-1 font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>{item.caution && status === "review" ? <p className="mt-2 border-l-2 border-gold pl-3 text-xs text-[#755b20]">{item.caution}</p> : null}</div><label className="text-xs text-muted">상태<select className="mt-1 min-h-11 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(e) => updateActive({ statuses: { ...active.statuses, [item.id]: e.target.value as DocumentStatus } })}><option value="todo">준비 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol></section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Message studio</p><h2 className="mt-2 text-xl font-semibold text-navy">상황별 영문 문구 3종</h2></div><button type="button" onClick={createMessages} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">문구 새로 만들기</button></div><div className="mt-5 flex flex-wrap gap-2" role="tablist">{messageOptions.map((option) => <button key={option.value} type="button" role="tab" aria-selected={activeMessageType === option.value} onClick={() => setActiveMessageType(option.value)} className={`min-h-11 px-3 text-sm font-semibold ${activeMessageType === option.value ? "bg-gold text-navy" : "border border-border text-muted"}`}>{option.label}</button>)}</div><textarea aria-label="선택한 영문 문구" className={`${inputClass} mt-5 min-h-80 resize-y font-serif leading-7`} value={active.messages[activeMessageType]} onChange={(e) => updateActive({ messages: { ...active.messages, [activeMessageType]: e.target.value } })} placeholder="프로필과 집 조건을 입력한 뒤 문구를 만드세요." /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={copyMessage} disabled={!active.messages[activeMessageType]} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:opacity-35">선택 문구 복사</button><button type="button" onClick={downloadSummary} className="min-h-11 border border-border px-4 text-sm font-semibold text-navy">현재 패키지 TXT</button><button type="button" onClick={downloadPropertyPackage} className="min-h-11 border border-border px-4 text-sm font-semibold text-navy">집별 비공개 JSON</button><button type="button" onClick={() => window.print()} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">PDF로 저장 / 인쇄</button></div><p className="mt-3 text-xs leading-5 text-muted">TXT와 PDF는 검토·제출 준비용이며, JSON은 집별 기록을 구조화해 보관하는 비공개 묶음입니다. 세 파일 모두 원본 증빙을 포함하지 않습니다.</p><p className="mt-4 min-h-6 text-sm text-muted" aria-live="polite">{message}</p></section>
    </div></div>

    <section id="rental-application-print" className="hidden" aria-label="렌트 신청 준비 패키지 인쇄본"><header><p>HOJU COMPASS / RENTAL APPLICATION PACK</p><h1>{active.propertyLabel || "Rental application"}</h1><p>{active.suburb || "Suburb not set"}{activeJurisdiction ? `, ${activeJurisdiction.code}` : ""} · {stageLabel(active.stage)} · {progress}% documents ready</p></header><section><h2>Application brief</h2><dl><div><dt>State or territory</dt><dd>{activeJurisdiction ? `${activeJurisdiction.name} (${activeJurisdiction.code})` : "Not set"}</dd></div><div><dt>Weekly rent</dt><dd>{active.weeklyRent ? `A$${active.weeklyRent}` : "Not set"}</dd></div><div><dt>Preferred move-in</dt><dd>{formatDate(active.moveDate)}</dd></div><div><dt>Lease term</dt><dd>{active.leaseTerm}</dd></div><div><dt>Application date</dt><dd>{formatDate(active.applicationDate)}</dd></div><div><dt>Next action</dt><dd>{formatDate(active.nextActionDate)}</dd></div></dl></section>{activeJurisdiction ? <section><h2>{activeJurisdiction.code} official checkpoints</h2><ul>{activeJurisdiction.checkpoints.map((item) => <li key={item}><span>{item}</span><strong>Check</strong></li>)}</ul><p>{activeJurisdiction.authority}: {activeJurisdiction.href}</p></section> : null}<section><h2>Reusable evidence</h2><ul>{reusableDocuments.map((item) => { const evidence = workspace.evidenceLibrary[item.id]; return <li key={item.id}><span>{item.title} · checked {evidence?.checkedOn || "not set"}</span><strong>{statusLabels[evidence?.status ?? "todo"]}</strong></li>; })}</ul></section><section><h2>Property document readiness</h2><ul>{documents.map((item) => <li key={item.id}><span>{item.title}</span><strong>{statusLabels[active.statuses[item.id] ?? "todo"]}</strong></li>)}</ul></section><section><h2>Privacy check</h2><ul>{privacyChecks.map(([id, title]) => <li key={id}><span>{title}</span><strong>{active.privacyChecks[id] ? "Checked" : "Not checked"}</strong></li>)}</ul></section><section><h2>Follow-up log</h2><ul>{active.followUps.length ? active.followUps.map((entry) => <li key={entry.id}><span>{entry.date} · {entry.direction} via {entry.channel}</span><strong>{entry.summary}</strong></li>) : <li><span>No contact recorded</span><strong>—</strong></li>}</ul></section><section><h2>Application note</h2><p className="whitespace-pre-wrap">{active.messages.application || "Not created"}</p></section>{active.notes ? <section><h2>Preparation notes</h2><p className="whitespace-pre-wrap">{active.notes}</p></section> : null}<footer>Preparation summary only; no source document is embedded. Check current official rules and keep sensitive information outside this file.</footer></section>
  </div>;
}
