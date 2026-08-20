"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DocumentStatus = "todo" | "review" | "ready";
type ApplicationStage = "shortlist" | "inspected" | "preparing" | "submitted" | "follow_up" | "approved" | "declined" | "withdrawn";
type MessageType = "application" | "inspection" | "followUp";
type ApplicantProfile = { householdSize: string; employmentSummary: string; rentalSummary: string; petSummary: string; strengths: string };
type RentalApplication = {
  id: string; propertyLabel: string; suburb: string; weeklyRent: string; agentName: string;
  moveDate: string; leaseTerm: string; stage: ApplicationStage; applicationDate: string;
  nextActionDate: string; notes: string; statuses: Record<string, DocumentStatus>;
  privacyChecks: Record<string, boolean>; messages: Record<MessageType, string>;
};
type WorkspaceState = { version: 2; profile: ApplicantProfile; activeId: string; applications: RentalApplication[] };
type DocumentItem = { id: string; group: string; title: string; detail: string; caution?: string };

const STORAGE_KEY = "hoju-compass-rental-application-pro-v1";
const MAX_APPLICATIONS = 20;
const initialProfile: ApplicantProfile = { householdSize: "1", employmentSummary: "", rentalSummary: "", petSummary: "No pets", strengths: "" };

function createApplication(id: string, propertyLabel = ""): RentalApplication {
  return { id, propertyLabel, suburb: "", weeklyRent: "", agentName: "", moveDate: "", leaseTerm: "12 months", stage: "shortlist", applicationDate: "", nextActionDate: "", notes: "", statuses: {}, privacyChecks: {}, messages: { application: "", inspection: "", followUp: "" } };
}

const initialWorkspace: WorkspaceState = { version: 2, profile: initialProfile, activeId: "starter", applications: [createApplication("starter")] };
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

function normaliseApplication(candidate: Partial<RentalApplication>, fallbackId: string): RentalApplication {
  const base = createApplication(typeof candidate.id === "string" && candidate.id ? candidate.id : fallbackId);
  return { ...base, ...candidate, id: base.id, stage: stageOptions.some((option) => option.value === candidate.stage) ? candidate.stage as ApplicationStage : base.stage, statuses: candidate.statuses && typeof candidate.statuses === "object" ? candidate.statuses : {}, privacyChecks: candidate.privacyChecks && typeof candidate.privacyChecks === "object" ? candidate.privacyChecks : {}, messages: { ...base.messages, ...(candidate.messages && typeof candidate.messages === "object" ? candidate.messages : {}) } };
}

function parseWorkspace(saved: string): WorkspaceState {
  const parsed = JSON.parse(saved) as Partial<WorkspaceState> & Partial<ApplicantProfile> & { propertyLabel?: string; moveDate?: string; leaseTerm?: string; statuses?: Record<string, DocumentStatus>; coverNote?: string };
  if (parsed.version === 2 && Array.isArray(parsed.applications) && parsed.applications.length) {
    const applications = parsed.applications.slice(0, MAX_APPLICATIONS).map((item, index) => normaliseApplication(item, `restored-${index + 1}`));
    return { version: 2, profile: { ...initialProfile, ...(parsed.profile ?? {}) }, activeId: applications.some((item) => item.id === parsed.activeId) ? parsed.activeId as string : applications[0].id, applications };
  }
  const migrated = createApplication("migrated");
  migrated.propertyLabel = typeof parsed.propertyLabel === "string" ? parsed.propertyLabel : "";
  migrated.moveDate = typeof parsed.moveDate === "string" ? parsed.moveDate : "";
  migrated.leaseTerm = typeof parsed.leaseTerm === "string" ? parsed.leaseTerm : "12 months";
  migrated.statuses = parsed.statuses && typeof parsed.statuses === "object" ? parsed.statuses : {};
  migrated.messages.application = typeof parsed.coverNote === "string" ? parsed.coverNote : "";
  return { version: 2, profile: { householdSize: typeof parsed.householdSize === "string" ? parsed.householdSize : "1", employmentSummary: typeof parsed.employmentSummary === "string" ? parsed.employmentSummary : "", rentalSummary: typeof parsed.rentalSummary === "string" ? parsed.rentalSummary : "", petSummary: typeof parsed.petSummary === "string" ? parsed.petSummary : "No pets", strengths: typeof parsed.strengths === "string" ? parsed.strengths : "" }, activeId: migrated.id, applications: [migrated] };
}

export function RentalApplicationWorkspace() {
  const [workspace, setWorkspace] = useState<WorkspaceState>(initialWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [activeMessageType, setActiveMessageType] = useState<MessageType>("application");
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setWorkspace(parseWorkspace(saved)); } catch {} setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; const timer = window.setTimeout(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch {} }, 400); return () => window.clearTimeout(timer); }, [workspace, loaded]);

  const active = workspace.applications.find((item) => item.id === workspace.activeId) ?? workspace.applications[0];
  const readyCount = useMemo(() => documents.filter((item) => active.statuses[item.id] === "ready").length, [active.statuses]);
  const reviewItems = useMemo(() => documents.filter((item) => active.statuses[item.id] === "review"), [active.statuses]);
  const privacyCount = useMemo(() => privacyChecks.filter(([id]) => active.privacyChecks[id]).length, [active.privacyChecks]);
  const progress = Math.round((readyCount / documents.length) * 100);
  const privacyProgress = Math.round((privacyCount / privacyChecks.length) * 100);
  const submittedCount = workspace.applications.filter((item) => ["submitted", "follow_up", "approved", "declined"].includes(item.stage)).length;
  const approvedCount = workspace.applications.filter((item) => item.stage === "approved").length;
  const activeAction = loaded ? nextActionStatus(active.nextActionDate, active.stage) : null;

  const updateProfile = <K extends keyof ApplicantProfile>(field: K, value: ApplicantProfile[K]) => setWorkspace((current) => ({ ...current, profile: { ...current.profile, [field]: value } }));
  const updateActive = (patch: Partial<RentalApplication>) => setWorkspace((current) => ({ ...current, applications: current.applications.map((item) => item.id === current.activeId ? { ...item, ...patch } : item) }));
  const addApplication = () => {
    if (workspace.applications.length >= MAX_APPLICATIONS) return setMessage(`한 기기에서 최대 ${MAX_APPLICATIONS}개 후보를 관리할 수 있습니다.`);
    const next = createApplication(createId(), `집 후보 ${workspace.applications.length + 1}`);
    setWorkspace((current) => ({ ...current, activeId: next.id, applications: [...current.applications, next] })); setMessage("새 집 후보를 추가했습니다. 재사용 프로필은 그대로 유지됩니다.");
  };
  const duplicateApplication = () => {
    if (workspace.applications.length >= MAX_APPLICATIONS) return setMessage(`최대 ${MAX_APPLICATIONS}개 후보까지 만들 수 있습니다.`);
    const id = createId(); const copy = normaliseApplication({ ...active, id, propertyLabel: `${active.propertyLabel || "집 후보"} 복사본`, stage: "preparing", applicationDate: "", nextActionDate: "" }, id);
    setWorkspace((current) => ({ ...current, activeId: copy.id, applications: [...current.applications, copy] })); setMessage("서류 상태와 문구를 복사했습니다. 새 집 조건에 맞게 수정하세요.");
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

  const copyMessage = async () => { const text = active.messages[activeMessageType]; if (!text) return; try { await navigator.clipboard.writeText(text); setMessage("선택한 문구를 복사했습니다."); } catch { setMessage("브라우저 복사 권한을 확인해 주세요."); } };
  const saveBlob = (content: string, type: string, name: string) => { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = name; anchor.click(); URL.revokeObjectURL(url); };
  const downloadBackup = () => { saveBlob(JSON.stringify(workspace, null, 2), "application/json;charset=utf-8", `hoju-compass-rental-workspace-${new Date().toISOString().slice(0, 10)}.json`); setMessage("전체 작업 공간을 JSON으로 백업했습니다."); };
  const restoreBackup = async (file: File | undefined) => {
    if (!file) return;
    try {
      const content = await file.text();
      const candidate = JSON.parse(content) as Partial<WorkspaceState>;
      if (candidate.version !== 2 || !Array.isArray(candidate.applications) || candidate.applications.length === 0) throw new Error("Invalid rental workspace backup");
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
    const lines = ["HOJU COMPASS — RENTAL APPLICATION PACK", `Property: ${active.propertyLabel || "Not set"}`, `Suburb: ${active.suburb || "Not set"}`, `Weekly rent: ${active.weeklyRent ? `A$${active.weeklyRent}` : "Not set"}`, `Stage: ${stageLabel(active.stage)}`, `Move-in: ${active.moveDate || "Not set"}`, `Next action: ${active.nextActionDate || "Not set"}`, "", "DOCUMENT STATUS", ...documents.map((item) => `- [${statusLabels[active.statuses[item.id] ?? "todo"]}] ${item.title}`), "", "PRIVACY CHECK", ...privacyChecks.map(([id, title]) => `- [${active.privacyChecks[id] ? "Checked" : "Not checked"}] ${title}`), "", "ITEMS TO REVIEW", ...(reviewItems.length ? reviewItems.map((item) => `- ${item.title}: ${item.caution ?? item.detail}`) : ["- None marked"]), "", "APPLICATION NOTE", active.messages.application || "Not created", "", "Preparation summary only. Do not include TFN, bank login details or identity document numbers."];
    saveBlob(lines.join("\r\n"), "text/plain;charset=utf-8", `${safeFileName(active.propertyLabel)}-application-pack.txt`); setMessage("현재 집 후보의 TXT 패키지를 저장했습니다.");
  };

  return <div className="space-y-8">
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

      <section className="border border-border bg-white p-5 sm:p-7"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Property brief</p><h2 className="mt-2 text-xl font-semibold text-navy">현재 집 후보 정보</h2></div><div className="flex gap-3"><button type="button" onClick={duplicateApplication} className="border-b-2 border-gold text-xs font-semibold text-navy">복제</button><button type="button" onClick={deleteApplication} className="text-xs font-semibold text-[#8c3434]">삭제</button></div></div><p className="mt-3 text-sm text-muted">정확한 주소 대신 별칭과 suburb만 적어도 됩니다.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-navy sm:col-span-2">집 후보 별칭<input className={inputClass} value={active.propertyLabel} onChange={(e) => updateActive({ propertyLabel: e.target.value })} placeholder="Carlton 후보 1" /></label><label className="text-sm font-medium text-navy">Suburb<input className={inputClass} value={active.suburb} onChange={(e) => updateActive({ suburb: e.target.value })} /></label><label className="text-sm font-medium text-navy">주당 렌트 (AUD)<input type="number" min="0" className={inputClass} value={active.weeklyRent} onChange={(e) => updateActive({ weeklyRent: e.target.value })} /></label>
        <label className="text-sm font-medium text-navy">진행 상태<select className={inputClass} value={active.stage} onChange={(e) => updateActive({ stage: e.target.value as ApplicationStage })}>{stageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label><label className="text-sm font-medium text-navy">담당자 이름<input className={inputClass} value={active.agentName} onChange={(e) => updateActive({ agentName: e.target.value })} /></label>
        <label className="text-sm font-medium text-navy">희망 입주일<input type="date" className={inputClass} value={active.moveDate} onChange={(e) => updateActive({ moveDate: e.target.value })} /></label><label className="text-sm font-medium text-navy">계약기간<select className={inputClass} value={active.leaseTerm} onChange={(e) => updateActive({ leaseTerm: e.target.value })}><option>6 months</option><option>12 months</option><option>18 months</option><option>24 months</option><option>Flexible</option></select></label>
        <label className="text-sm font-medium text-navy">신청 제출일<input type="date" className={inputClass} value={active.applicationDate} onChange={(e) => updateActive({ applicationDate: e.target.value })} /></label><label className="text-sm font-medium text-navy">다음 행동 날짜<input type="date" className={inputClass} value={active.nextActionDate} onChange={(e) => updateActive({ nextActionDate: e.target.value })} />{activeAction ? <span className={`mt-2 block text-xs font-semibold ${activeAction.tone === "danger" ? "text-[#8c3434]" : activeAction.tone === "warning" ? "text-[#755b20]" : "text-muted"}`}>다음 행동: {activeAction.label}</span> : null}</label><label className="text-sm font-medium text-navy sm:col-span-2">메모 (민감정보 제외)<textarea className={`${inputClass} min-h-24 resize-y`} value={active.notes} onChange={(e) => updateActive({ notes: e.target.value })} /></label>
      </div></section>

      <section className="border border-border bg-white p-5 sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Privacy guard</p><h2 className="mt-2 text-xl font-semibold text-navy">제출 전 개인정보 점검</h2></div><p className="font-mono text-2xl text-navy">{privacyProgress}%</p></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold" style={{ width: `${privacyProgress}%` }} /></div><ul className="mt-5 divide-y divide-border">{privacyChecks.map(([id, title, detail]) => <li key={id} className="py-4"><label className="flex cursor-pointer gap-3"><input type="checkbox" className="mt-1 size-4 accent-[#1a2744]" checked={Boolean(active.privacyChecks[id])} onChange={(e) => updateActive({ privacyChecks: { ...active.privacyChecks, [id]: e.target.checked } })} /><span><strong className="block text-sm text-navy">{title}</strong><span className="mt-1 block text-xs leading-5 text-muted">{detail}</span></span></label></li>)}</ul></section>
    </div>

    <div className="space-y-8"><section className="border border-border bg-white p-5 shadow-sm sm:p-7"><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Document readiness</p><h2 className="mt-2 text-xl font-semibold text-navy">서류 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{readyCount} / {documents.length}</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold" style={{ width: `${progress}%` }} /></div><ol className="mt-6 divide-y divide-border border-y border-navy/20">{documents.map((item, index) => { const status = active.statuses[item.id] ?? "todo"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem]"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.group}</p><h3 className="mt-1 font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>{item.caution && status === "review" ? <p className="mt-2 border-l-2 border-gold pl-3 text-xs text-[#755b20]">{item.caution}</p> : null}</div><label className="text-xs text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(e) => updateActive({ statuses: { ...active.statuses, [item.id]: e.target.value as DocumentStatus } })}><option value="todo">준비 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol></section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7"><div className="flex flex-wrap justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Message studio</p><h2 className="mt-2 text-xl font-semibold text-navy">상황별 영문 문구 3종</h2></div><button type="button" onClick={createMessages} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">문구 새로 만들기</button></div><div className="mt-5 flex flex-wrap gap-2" role="tablist">{messageOptions.map((option) => <button key={option.value} type="button" role="tab" aria-selected={activeMessageType === option.value} onClick={() => setActiveMessageType(option.value)} className={`min-h-10 px-3 text-sm font-semibold ${activeMessageType === option.value ? "bg-gold text-navy" : "border border-border text-muted"}`}>{option.label}</button>)}</div><textarea aria-label="선택한 영문 문구" className={`${inputClass} mt-5 min-h-80 resize-y font-serif leading-7`} value={active.messages[activeMessageType]} onChange={(e) => updateActive({ messages: { ...active.messages, [activeMessageType]: e.target.value } })} placeholder="프로필과 집 조건을 입력한 뒤 문구를 만드세요." /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={copyMessage} disabled={!active.messages[activeMessageType]} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:opacity-35">선택 문구 복사</button><button type="button" onClick={downloadSummary} className="min-h-11 border border-border px-4 text-sm font-semibold text-navy">현재 패키지 TXT</button><button type="button" onClick={() => window.print()} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">PDF로 저장 / 인쇄</button></div><p className="mt-4 min-h-6 text-sm text-muted" aria-live="polite">{message}</p></section>
    </div></div>

    <section id="rental-application-print" className="hidden" aria-label="렌트 신청 준비 패키지 인쇄본"><header><p>HOJU COMPASS / RENTAL APPLICATION PACK</p><h1>{active.propertyLabel || "Rental application"}</h1><p>{active.suburb || "Suburb not set"} · {stageLabel(active.stage)} · {progress}% documents ready</p></header><section><h2>Application brief</h2><dl><div><dt>Weekly rent</dt><dd>{active.weeklyRent ? `A$${active.weeklyRent}` : "Not set"}</dd></div><div><dt>Preferred move-in</dt><dd>{formatDate(active.moveDate)}</dd></div><div><dt>Lease term</dt><dd>{active.leaseTerm}</dd></div><div><dt>Application date</dt><dd>{formatDate(active.applicationDate)}</dd></div><div><dt>Next action</dt><dd>{formatDate(active.nextActionDate)}</dd></div></dl></section><section><h2>Document readiness</h2><ul>{documents.map((item) => <li key={item.id}><span>{item.title}</span><strong>{statusLabels[active.statuses[item.id] ?? "todo"]}</strong></li>)}</ul></section><section><h2>Privacy check</h2><ul>{privacyChecks.map(([id, title]) => <li key={id}><span>{title}</span><strong>{active.privacyChecks[id] ? "Checked" : "Not checked"}</strong></li>)}</ul></section><section><h2>Application note</h2><p className="whitespace-pre-wrap">{active.messages.application || "Not created"}</p></section>{active.notes ? <section><h2>Preparation notes</h2><p className="whitespace-pre-wrap">{active.notes}</p></section> : null}<footer>Preparation summary only, not a rental application or legal advice. Keep identity documents and sensitive financial information outside this file.</footer></section>
  </div>;
}
