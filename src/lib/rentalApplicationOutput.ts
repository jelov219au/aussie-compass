import { getRentalJurisdiction, type RentalJurisdictionCode } from "@/data/rentalJurisdictions";
import type { RentalReadyNowImportReceipt } from "@/lib/rentalReadyNowHandoff";

export type DocumentStatus = "todo" | "review" | "ready";
export type ApplicationStage = "shortlist" | "inspected" | "preparing" | "submitted" | "follow_up" | "approved" | "declined" | "withdrawn";
export type MessageType = "application" | "inspection" | "followUp";
export type ApplicantProfile = { householdSize: string; employmentSummary: string; rentalSummary: string; petSummary: string; strengths: string };
export type ReusableEvidence = { status: DocumentStatus; checkedOn: string };
export type FollowUpEntry = { id: string; date: string; channel: "email" | "phone" | "portal" | "inspection"; direction: "sent" | "received"; summary: string };
export type RentalApplication = {
  id: string; propertyLabel: string; suburb: string; jurisdiction: RentalJurisdictionCode | ""; weeklyRent: string; agentName: string;
  moveDate: string; leaseTerm: string; stage: ApplicationStage; applicationDate: string;
  nextActionDate: string; notes: string; statuses: Record<string, DocumentStatus>;
  privacyChecks: Record<string, boolean>; messages: Record<MessageType, string>; followUps: FollowUpEntry[];
  inspectionReceipt: RentalReadyNowImportReceipt | null;
};
export type WorkspaceState = { version: 3; profile: ApplicantProfile; evidenceLibrary: Record<string, ReusableEvidence>; activeId: string; applications: RentalApplication[] };
export type DocumentItem = { id: string; group: string; title: string; detail: string; caution?: string };

export const initialProfile: ApplicantProfile = { householdSize: "1", employmentSummary: "", rentalSummary: "", petSummary: "No pets", strengths: "" };

export function createApplication(id: string, propertyLabel = ""): RentalApplication {
  return { id, propertyLabel, suburb: "", jurisdiction: "", weeklyRent: "", agentName: "", moveDate: "", leaseTerm: "12 months", stage: "shortlist", applicationDate: "", nextActionDate: "", notes: "", statuses: {}, privacyChecks: {}, messages: { application: "", inspection: "", followUp: "" }, followUps: [], inspectionReceipt: null };
}

export const documents: DocumentItem[] = [
  { id: "identity", group: "신원 확인", title: "요청 범위에 맞는 신분증", detail: "에이전트가 요구한 종류와 개수를 확인하고 필요한 사본만 준비합니다.", caution: "TFN, 불필요한 면허번호·Medicare 정보는 가릴 수 있는지 먼저 물어보세요." },
  { id: "income", group: "지불 능력", title: "소득 또는 자금 증빙", detail: "Payslip, 거래내역을 가린 은행 잔액 증명 등 허용된 선택지에서 준비합니다.", caution: "인터넷뱅킹 로그인이나 전체 거래내역은 제공하지 마세요." },
  { id: "employment", group: "지불 능력", title: "고용 상태 확인", detail: "직종·고용 형태와 재직 여부를 확인할 수 있는 최소한의 자료를 준비합니다." },
  { id: "rental-history", group: "임대 이력", title: "Rental ledger 또는 이전 임대 이력", detail: "이전 에이전트가 발급한 임대료 납부 기록이 있다면 준비합니다." },
  { id: "references", group: "레퍼런스", title: "레퍼런스 연락 동의", detail: "연락처를 제출하기 전에 상대방에게 어떤 집에 지원하는지 알립니다." },
  { id: "terms", group: "지원 조건", title: "입주일·계약기간·가구 구성", detail: "광고 조건과 맞는지, 모든 성인 신청자가 각자 필요한 절차를 확인합니다." },
  { id: "agent", group: "보안 점검", title: "에이전트와 신청 경로 확인", detail: "광고 도메인, 사무실 전화번호와 신청 링크가 서로 일치하는지 확인합니다." },
  { id: "privacy", group: "보안 점검", title: "개인정보 수집·보관 안내 확인", detail: "수집 목적, 제3자 제공, 보관기간, 삭제·문의 방법을 읽습니다.", caution: "불필요한 선택 항목은 비워도 되는지 확인하세요." },
];
export const reusableDocumentIds = ["identity", "income", "employment", "rental-history", "references"] as const;
export const reusableDocuments = documents.filter((item) => reusableDocumentIds.includes(item.id as (typeof reusableDocumentIds)[number]));
export function createEvidenceLibrary(statuses: Record<string, DocumentStatus> = {}) {
  return Object.fromEntries(reusableDocumentIds.map((id) => [id, { status: statuses[id] ?? "todo", checkedOn: "" }])) as Record<string, ReusableEvidence>;
}
export const initialWorkspace: WorkspaceState = { version: 3, profile: initialProfile, evidenceLibrary: createEvidenceLibrary(), activeId: "starter", applications: [createApplication("starter")] };
export const privacyChecks = [
  ["no-tfn", "TFN·카드·로그인 정보 제외", "세금번호, 카드번호, 인터넷뱅킹 로그인 정보가 포함되지 않았습니다."],
  ["redaction", "불필요한 거래·신분증 정보 가림", "목적과 무관한 거래내역과 식별번호를 가릴 수 있는지 확인했습니다."],
  ["verified-channel", "공식 신청 경로 확인", "링크와 연락처를 공식 웹사이트 또는 사무실 번호로 다시 확인했습니다."],
  ["retention", "보관·삭제 안내 확인", "탈락 후 자료 보관기간과 삭제 문의 방법을 확인했습니다."],
  ["reference-consent", "레퍼런스 사전 동의", "연락처를 제출하기 전 당사자에게 알렸습니다."],
  ["final-review", "최종 제출 범위 검토", "필수와 선택 항목을 구분하고 실제 필요한 자료만 첨부했습니다."],
] as const;
export const stageOptions: Array<{ value: ApplicationStage; label: string }> = [
  { value: "shortlist", label: "관심 목록" }, { value: "inspected", label: "인스펙션 완료" },
  { value: "preparing", label: "신청 준비 중" }, { value: "submitted", label: "신청 제출" },
  { value: "follow_up", label: "후속 연락" }, { value: "approved", label: "승인" },
  { value: "declined", label: "미승인" }, { value: "withdrawn", label: "철회" },
];
export const messageOptions: Array<{ value: MessageType; label: string }> = [
  { value: "application", label: "신청 소개문" }, { value: "inspection", label: "인스펙션 후 문의" }, { value: "followUp", label: "제출 후 확인" },
];
export const statusLabels: Record<DocumentStatus, string> = { todo: "준비 전", review: "확인 필요", ready: "준비 완료" };

export function safeFileName(value: string) { return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 50) || "rental-application"; }
export function formatDate(value: string) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "Not set"; }
export function stageLabel(stage: ApplicationStage) { return stageOptions.find((option) => option.value === stage)?.label ?? "관심 목록"; }

export function createRentalMessages(workspace: WorkspaceState, active: RentalApplication): Record<MessageType, string> {
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
  return {
    application: [greeting, `I am writing to apply for ${property}. I am looking to move in around ${moveDate} and would prefer a ${lease || "12-month"} agreement.`, `${household}. ${employment} ${rental}`, `${pets} ${strengths}`, "I am happy to provide the documents reasonably required through the agent's verified application channel.", "Thank you for considering my application. I would be pleased to provide any further relevant information.", "Kind regards,"].join("\n\n"),
    inspection: [greeting, `Thank you for showing me ${property}. I remain interested and am preparing my application.`, "Could you please confirm the preferred application channel, deadline, proposed lease start date, and documents specifically required?", "If there is a privacy notice covering how unsuccessful applications are stored or deleted, I would also appreciate a link.", "Kind regards,"].join("\n\n"),
    followUp: [greeting, `I am following up on my application for ${property}${active.applicationDate ? `, submitted on ${formatDate(active.applicationDate)}` : ""}.`, "Could you please confirm it was received and let me know if any relevant information is missing? I am happy to respond promptly through the verified application channel.", "Thank you for your time.", "Kind regards,"].join("\n\n"),
  };
}


export function createRentalSummary(workspace: WorkspaceState, active: RentalApplication) {
  const activeJurisdiction = getRentalJurisdiction(active.jurisdiction);
  const reviewItems = documents.filter((item) => active.statuses[item.id] === "review");
  const lines = [
    "HOJU COMPASS — RENTAL APPLICATION PACK",
    `Property: ${active.propertyLabel || "Not set"}`,
    `Suburb: ${active.suburb || "Not set"}`,
    `State or territory: ${activeJurisdiction ? `${activeJurisdiction.name} (${activeJurisdiction.code})` : "Not set"}`,
    `Weekly rent: ${active.weeklyRent ? `A$${active.weeklyRent}` : "Not set"}`,
    `Stage: ${stageLabel(active.stage)}`,
    `Move-in: ${active.moveDate || "Not set"}`,
    `Lease term: ${active.leaseTerm || "Not set"}`,
    `Application date: ${active.applicationDate || "Not set"}`,
    `Next action: ${active.nextActionDate || "Not set"}`,
    "", "REUSABLE EVIDENCE LIBRARY", ...reusableDocuments.map((item) => { const evidence = workspace.evidenceLibrary[item.id]; return `- [${statusLabels[evidence?.status ?? "todo"]}] ${item.title} · checked ${evidence?.checkedOn || "not set"}`; }),
    "", "STATE OR TERRITORY CHECK", ...(activeJurisdiction ? [...activeJurisdiction.checkpoints.map((item) => `- ${item}`), `- Official source: ${activeJurisdiction.href}`] : ["- Select a state or territory and check the current official guidance before applying."]),
    "", "PROPERTY DOCUMENT STATUS", ...documents.map((item) => `- [${statusLabels[active.statuses[item.id] ?? "todo"]}] ${item.title}`),
    "", "PRIVACY CHECK", ...privacyChecks.map(([id, title]) => `- [${active.privacyChecks[id] ? "Checked" : "Not checked"}] ${title}`),
    "", "FOLLOW-UP LOG", ...(active.followUps.length ? active.followUps.map((entry) => `- ${entry.date} · ${entry.direction} via ${entry.channel} · ${entry.summary}`) : ["- No contact recorded"]),
    "", "ITEMS TO REVIEW", ...(reviewItems.length ? reviewItems.map((item) => `- ${item.title}: ${item.caution ?? item.detail}`) : ["- None marked"]),
    "", "APPLICATION NOTE", active.messages.application || "Not created",
    "", "INSPECTION MESSAGE", active.messages.inspection || "Not created",
    "", "FOLLOW-UP MESSAGE", active.messages.followUp || "Not created",
    "", "PREPARATION NOTES", active.notes || "Not recorded",
    "", "Preparation summary only; no source document is embedded. Check current official rules. Do not include TFN, bank login details, card details or identity document numbers."];
  return lines.join("\r\n");
}

export function createRentalPropertyPackage(workspace: WorkspaceState, active: RentalApplication, exportedAt: string) {
  return { format: "hoju-compass-rental-property-package", version: 1, exportedAt, warning: "This file contains preparation notes and message drafts, but no source documents. Keep it private and review before sharing.", profile: workspace.profile, reusableEvidence: workspace.evidenceLibrary, application: active };
}
