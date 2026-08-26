"use client";

import { useEffect, useMemo, useState } from "react";

import {
  RentalApplicationPortfolio,
  rentalContactStatusLabels,
  type RentalApplicationPackSummary,
  type RentalContactStatus,
} from "@/components/tools/RentalApplicationPortfolio";
import {
  clearRentalReadyNowHandoff,
  createRentalReadyNowImportReceipt,
  readRentalReadyNowHandoff,
  readRentalReadyNowSavedFlag,
  rentalReadyNowReceiptMatches,
  type RentalReadyNowImportReceipt,
} from "@/lib/rentalReadyNowHandoff";

type DocumentStatus = "todo" | "review" | "ready";
type RentalInspectionSummary = RentalReadyNowImportReceipt;
type RentalDraft = {
  propertyLabel: string;
  moveDate: string;
  leaseTerm: string;
  householdSize: string;
  employmentSummary: string;
  rentalSummary: string;
  petSummary: string;
  strengths: string;
  statuses: Record<string, DocumentStatus>;
  coverNote: string;
  inspectionSummary: RentalInspectionSummary | null;
};

type RentalPack = RentalDraft & {
  id: string;
  contactStatus: RentalContactStatus;
  followUpDate: string;
};

type RentalWorkspaceState = {
  version: 2;
  activeId: string;
  packs: RentalPack[];
};

type DocumentItem = {
  id: string;
  group: string;
  title: string;
  detail: string;
  caution?: string;
};

const STORAGE_KEY = "hoju-compass-rental-application-pro-v1";
const FIRST_SUCCESS_KEY = "hoju-compass-rental-application-pro-first-success-v1";
const initialDraft: RentalDraft = {
  propertyLabel: "",
  moveDate: "",
  leaseTerm: "12 months",
  householdSize: "1",
  employmentSummary: "",
  rentalSummary: "",
  petSummary: "No pets",
  strengths: "",
  statuses: {},
  coverNote: "",
  inspectionSummary: null,
};

const MAX_PACKS = 6;
const REUSABLE_DOCUMENT_IDS = new Set(["identity", "income", "employment", "rental-history"]);

function createBlankPack(id = "pack-1", label = "집 후보 1"): RentalPack {
  return {
    ...initialDraft,
    id,
    propertyLabel: label,
    statuses: {},
    contactStatus: "not-contacted",
    followUpDate: "",
  };
}

const initialWorkspace: RentalWorkspaceState = {
  version: 2,
  activeId: "pack-1",
  packs: [createBlankPack()],
};

const documents: DocumentItem[] = [
  { id: "identity", group: "신원 확인", title: "요청 범위에 맞는 신분증", detail: "에이전트가 요구한 종류와 개수를 확인하고 필요한 사본만 준비합니다.", caution: "TFN, 불필요한 면허번호·Medicare 정보는 가릴 수 있는지 먼저 물어보세요." },
  { id: "income", group: "지불 능력", title: "소득 또는 자금 증빙", detail: "Payslip, 거래내역을 가린 은행 잔액 증명, Centrelink 자료 등 허용된 선택지에서 준비합니다.", caution: "인터넷뱅킹 로그인이나 전체 거래내역은 제공하지 마세요." },
  { id: "employment", group: "지불 능력", title: "고용 상태 확인", detail: "직종·고용 형태와 재직 여부를 확인할 수 있는 최소한의 자료를 준비합니다." },
  { id: "rental-history", group: "임대 이력", title: "Rental ledger 또는 이전 임대 이력", detail: "현재 또는 이전 에이전트가 발급한 임대료 납부 기록이 있다면 준비합니다." },
  { id: "references", group: "레퍼런스", title: "레퍼런스 연락 동의", detail: "이름과 연락처를 제출하기 전에 상대방에게 어떤 집에 지원하는지 알립니다." },
  { id: "terms", group: "지원 조건", title: "입주일·계약기간·가구 구성", detail: "광고 조건과 맞는지 확인하고 모든 성인 신청자가 각자 필요한 절차를 확인합니다." },
  { id: "agent", group: "보안 점검", title: "에이전트와 신청 경로 확인", detail: "광고 도메인, 사무실 전화번호와 신청 링크가 서로 일치하는지 확인합니다." },
  { id: "privacy", group: "보안 점검", title: "개인정보 수집·보관 안내 확인", detail: "수집 목적, 제3자 제공, 보관기간, 삭제·문의 방법을 읽습니다.", caution: "제출하지 않으면 불이익이 있다는 표현만으로 불필요한 선택 항목을 채우지 마세요." },
];

const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none transition placeholder:text-muted/60 focus:border-navy focus:ring-2 focus:ring-navy/15";
const statusLabels: Record<DocumentStatus, string> = { todo: "준비 전", review: "확인 필요", ready: "준비 완료" };

function safeText(value: unknown, fallback = "", maxLength = 1000) {
  return typeof value === "string" ? value.slice(0, maxLength) : fallback;
}

function safeStatuses(value: unknown): Record<string, DocumentStatus> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const entries: Array<[string, DocumentStatus]> = documents.flatMap((document) => {
    const status = (value as Record<string, unknown>)[document.id];
    return status === "todo" || status === "review" || status === "ready" ? [[document.id, status]] : [];
  });
  return Object.fromEntries(entries);
}

function safeContactStatus(value: unknown): RentalContactStatus {
  return value === "drafting" || value === "sent" || value === "follow-up" || value === "closed" ? value : "not-contacted";
}

function safeInspectionSummary(value: unknown): RentalInspectionSummary | null {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  if ((candidate.mode !== "share" && candidate.mode !== "rent")
    || typeof candidate.reviewedCount !== "number"
    || typeof candidate.concernCount !== "number"
    || !Number.isFinite(candidate.reviewedCount)
    || !Number.isFinite(candidate.concernCount)) return null;
  const reviewedCount = Math.max(0, Math.min(100, Math.trunc(candidate.reviewedCount)));
  const sourceCreatedAt = typeof candidate.sourceCreatedAt === "number" && Number.isFinite(candidate.sourceCreatedAt)
    ? Math.trunc(candidate.sourceCreatedAt)
    : undefined;
  return {
    mode: candidate.mode,
    reviewedCount,
    concernCount: Math.min(reviewedCount, Math.max(0, Math.min(100, Math.trunc(candidate.concernCount)))),
    ...(sourceCreatedAt === undefined ? {} : { sourceCreatedAt }),
  };
}

function normalizePack(value: unknown, index: number): RentalPack {
  const candidate = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    id: safeText(candidate.id, `pack-${index + 1}`, 80).replace(/[^A-Za-z0-9_-]/g, "") || `pack-${index + 1}`,
    propertyLabel: safeText(candidate.propertyLabel, `집 후보 ${index + 1}`, 80),
    moveDate: /^\d{4}-\d{2}-\d{2}$/.test(safeText(candidate.moveDate)) ? safeText(candidate.moveDate) : "",
    leaseTerm: ["6 months", "12 months", "18 months", "24 months", "Flexible"].includes(safeText(candidate.leaseTerm)) ? safeText(candidate.leaseTerm) : "12 months",
    householdSize: safeText(candidate.householdSize, "1", 2),
    employmentSummary: safeText(candidate.employmentSummary, "", 300),
    rentalSummary: safeText(candidate.rentalSummary, "", 300),
    petSummary: safeText(candidate.petSummary, "No pets", 200),
    strengths: safeText(candidate.strengths, "", 600),
    statuses: safeStatuses(candidate.statuses),
    coverNote: safeText(candidate.coverNote, "", 5000),
    inspectionSummary: safeInspectionSummary(candidate.inspectionSummary),
    contactStatus: safeContactStatus(candidate.contactStatus),
    followUpDate: /^\d{4}-\d{2}-\d{2}$/.test(safeText(candidate.followUpDate)) ? safeText(candidate.followUpDate) : "",
  };
}

function readStoredWorkspace(value: string): RentalWorkspaceState | null {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    if (parsed?.version === 2 && Array.isArray(parsed.packs)) {
      const packs = parsed.packs.slice(0, MAX_PACKS).map(normalizePack);
      if (!packs.length) return initialWorkspace;
      const requestedActiveId = safeText(parsed.activeId, "", 80);
      return { version: 2, activeId: packs.some((pack) => pack.id === requestedActiveId) ? requestedActiveId : packs[0].id, packs };
    }
    const migrated = normalizePack(parsed, 0);
    return { version: 2, activeId: migrated.id, packs: [migrated] };
  } catch {
    return null;
  }
}

function hasMeaningfulPackData(pack: RentalPack, index: number) {
  return pack.propertyLabel.trim() !== `집 후보 ${index + 1}`
    || Boolean(pack.moveDate || pack.employmentSummary || pack.rentalSummary || pack.strengths || pack.coverNote || pack.followUpDate)
    || pack.petSummary !== "No pets"
    || pack.leaseTerm !== "12 months"
    || pack.householdSize !== "1"
    || pack.contactStatus !== "not-contacted"
    || Boolean(pack.inspectionSummary)
    || Object.keys(pack.statuses).length > 0;
}

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 50) || "rental-application";
}

export function RentalApplicationWorkspace() {
  const [workspace, setWorkspace] = useState<RentalWorkspaceState>(initialWorkspace);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [firstCandidateSaved, setFirstCandidateSaved] = useState(false);
  const [firstCandidateMessage, setFirstCandidateMessage] = useState("");

  const draft = workspace.packs.find((pack) => pack.id === workspace.activeId) ?? workspace.packs[0] ?? createBlankPack();

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      let nextWorkspace = saved ? readStoredWorkspace(saved) ?? initialWorkspace : initialWorkspace;
      let importedHandoff = false;
      const handoff = readRentalReadyNowHandoff(window.localStorage);
      if (handoff) {
        const inspectionSummary = createRentalReadyNowImportReceipt(handoff);
        const handoffAlreadyImported = nextWorkspace.packs.some((pack) => rentalReadyNowReceiptMatches(pack.inspectionSummary, handoff));
        const activeIndex = Math.max(0, nextWorkspace.packs.findIndex((pack) => pack.id === nextWorkspace.activeId));
        const activePack = nextWorkspace.packs[activeIndex] ?? nextWorkspace.packs[0];
        const propertyLabel = handoff.propertyLabel || `방문 점검 후보 ${nextWorkspace.packs.length}`;
        if (handoffAlreadyImported) {
          try { clearRentalReadyNowHandoff(window.localStorage); } catch {}
          setMessage("무료 방문 결과는 이미 가져왔습니다. 같은 후보를 다시 만들지 않았습니다.");
        } else if (activePack && !hasMeaningfulPackData(activePack, activeIndex)) {
          nextWorkspace = {
            ...nextWorkspace,
            packs: nextWorkspace.packs.map((pack) => pack.id === activePack.id ? { ...pack, propertyLabel, inspectionSummary } : pack),
          };
          importedHandoff = true;
        } else if (nextWorkspace.packs.length < MAX_PACKS) {
          const importedPack = { ...createBlankPack(window.crypto.randomUUID(), propertyLabel), inspectionSummary };
          nextWorkspace = { ...nextWorkspace, activeId: importedPack.id, packs: [...nextWorkspace.packs, importedPack] };
          importedHandoff = true;
        } else {
          setMessage("집 후보가 6개라 무료 방문 결과를 아직 가져오지 않았습니다. 후보를 하나 정리한 뒤 다시 열어 주세요.");
        }
      }
      if (importedHandoff) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace));
        try { window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved"); } catch {}
        try { clearRentalReadyNowHandoff(window.localStorage); } catch {
          // The persisted import receipt makes a later retry idempotent.
        }
        setMessage("무료 집 방문 결과에서 집 구분명과 점검 집계만 가져왔습니다.");
      }
      setWorkspace(nextWorkspace);
      const completedBefore = nextWorkspace.packs.length > 1 || nextWorkspace.packs.some(hasMeaningfulPackData);
      setFirstCandidateSaved(readRentalReadyNowSavedFlag(window.localStorage, FIRST_SUCCESS_KEY) || completedBefore);
    } catch {
      setMessage("브라우저 저장소를 사용할 수 없어 무료 방문 결과를 가져오지 못했습니다. 무료 방문 결과 원본은 삭제하지 않았습니다.");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch {}
    }, 400);
    return () => window.clearTimeout(timer);
  }, [workspace, loaded]);

  const readyCount = useMemo(() => documents.filter((item) => draft.statuses[item.id] === "ready").length, [draft.statuses]);
  const reviewItems = useMemo(() => documents.filter((item) => draft.statuses[item.id] === "review"), [draft.statuses]);
  const progress = Math.round((readyCount / documents.length) * 100);

  const packSummaries = useMemo<RentalApplicationPackSummary[]>(() => workspace.packs.map((pack, index) => {
    const packReadyCount = documents.filter((item) => pack.statuses[item.id] === "ready").length;
    return {
      id: pack.id,
      label: pack.propertyLabel || `집 후보 ${index + 1}`,
      progress: Math.round((packReadyCount / documents.length) * 100),
      reviewCount: documents.filter((item) => pack.statuses[item.id] === "review").length,
      contactStatus: pack.contactStatus,
      followUpDate: pack.followUpDate,
    };
  }), [workspace.packs]);

  const updateActivePack = (update: (current: RentalPack) => RentalPack) => setWorkspace((current) => ({
    ...current,
    packs: current.packs.map((pack) => pack.id === current.activeId ? update(pack) : pack),
  }));
  const setField = <K extends keyof RentalDraft>(field: K, value: RentalDraft[K]) => updateActivePack((current) => ({ ...current, [field]: value }));
  const setStatus = (id: string, status: DocumentStatus) => updateActivePack((current) => ({ ...current, statuses: { ...current.statuses, [id]: status } }));

  const saveFirstCandidate = () => {
    const label = draft.propertyLabel.trim();
    if (!label) {
      setFirstCandidateMessage("정확한 주소 대신 알아볼 수 있는 별칭을 입력해 주세요.");
      return;
    }
    const nextWorkspace: RentalWorkspaceState = {
      ...workspace,
      packs: workspace.packs.map((pack) => pack.id === workspace.activeId ? { ...pack, propertyLabel: label } : pack),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextWorkspace));
      window.localStorage.setItem(FIRST_SUCCESS_KEY, "saved");
    } catch {
      setFirstCandidateMessage("브라우저 저장소를 사용할 수 없어 첫 후보 저장을 확인하지 못했습니다. 저장 설정을 확인한 뒤 다시 시도해 주세요.");
      return;
    }
    setWorkspace(nextWorkspace);
    setFirstCandidateSaved(true);
    setFirstCandidateMessage(`“${label}”을 첫 집 후보로 저장했습니다.`);
  };

  const addPack = (reuseCurrent: boolean) => {
    if (workspace.packs.length >= MAX_PACKS) {
      setMessage("집 후보는 최대 6개까지 비교할 수 있어요.");
      return;
    }
    const id = window.crypto.randomUUID();
    const label = `집 후보 ${workspace.packs.length + 1}`;
    const nextPack = reuseCurrent
      ? {
          ...createBlankPack(id, label),
          leaseTerm: draft.leaseTerm,
          householdSize: draft.householdSize,
          employmentSummary: draft.employmentSummary,
          rentalSummary: draft.rentalSummary,
          petSummary: draft.petSummary,
          strengths: draft.strengths,
          statuses: Object.fromEntries(Object.entries(draft.statuses).filter(([id]) => REUSABLE_DOCUMENT_IDS.has(id))),
        }
      : createBlankPack(id, label);
    setWorkspace((current) => ({ ...current, activeId: id, packs: [...current.packs, nextPack] }));
    setMessage(reuseCurrent ? "공통 프로필과 재사용 가능한 증빙 상태를 복사했습니다. 집별 조건·레퍼런스 동의·신청 경로·개인정보 안내와 소개문은 새로 확인하세요." : "빈 집 후보를 추가했습니다.");
  };

  const removeActivePack = () => {
    if (workspace.packs.length <= 1) return;
    if (!window.confirm(`“${draft.propertyLabel || "현재 집 후보"}”의 저장 내용을 삭제할까요? 이 브라우저에서는 되돌릴 수 없습니다.`)) return;
    setWorkspace((current) => {
      const packs = current.packs.filter((pack) => pack.id !== current.activeId);
      return { ...current, activeId: packs[0].id, packs };
    });
    setMessage("현재 집 후보를 삭제했습니다.");
  };

  const createCoverNote = () => {
    const property = draft.propertyLabel.trim() || "the advertised property";
    const moveDate = draft.moveDate ? new Date(`${draft.moveDate}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "the advertised availability date";
    const people = Math.max(1, Number(draft.householdSize) || 1);
    const leaseDescription = draft.leaseTerm === "Flexible" ? "flexible-term" : draft.leaseTerm.replace(" months", "-month");
    const household = people === 1 ? "I would be the sole occupant" : `Our household consists of ${people} people`;
    const employment = draft.employmentSummary.trim() ? `My current work situation is: ${draft.employmentSummary.trim()}.` : "I can provide the requested evidence of my ability to meet the rent.";
    const rental = draft.rentalSummary.trim() ? `Rental background: ${draft.rentalSummary.trim()}.` : "I can provide rental history or suitable references on request.";
    const pets = draft.petSummary.trim() ? `${draft.petSummary.trim().replace(/[.!?]+$/, "")}.` : "No pet information has been added.";
    const strengths = draft.strengths.trim() ? `${draft.strengths.trim().replace(/[.!?]+$/, "")}.` : "I would look after the property carefully and communicate promptly about any maintenance issues.";
    const note = [
      "Hello,",
      `I am writing to apply for ${property}. I am looking to move in around ${moveDate} and would prefer a ${leaseDescription || "12-month"} agreement.`,
      `${household}. ${employment} ${rental}`,
      `${pets} ${strengths}`,
      "I am happy to provide the documents reasonably required for the application through the agent's verified application channel.",
      "Thank you for considering my application. I would be pleased to provide any further relevant information.",
      "Kind regards,",
    ].join("\n\n");
    setField("coverNote", note);
    setMessage("영문 소개문 초안을 만들었습니다. 제출 전 사실과 표현을 확인하세요.");
  };

  const copyCoverNote = async () => {
    if (!draft.coverNote) return;
    try { await navigator.clipboard.writeText(draft.coverNote); setMessage("영문 소개문을 복사했습니다."); }
    catch { setMessage("복사하지 못했습니다. 브라우저 권한을 확인해 주세요."); }
  };

  const downloadSummary = () => {
    const lines = [
      "HOJU COMPASS — RENTAL APPLICATION PACK",
      `Property label: ${draft.propertyLabel || "Not set"}`,
      `Preferred move-in: ${draft.moveDate || "Not set"}`,
      `Lease term: ${draft.leaseTerm || "Not set"}`,
      `Household size: ${draft.householdSize || "Not set"}`,
      `Contact status: ${rentalContactStatusLabels[draft.contactStatus]}`,
      `Next follow-up: ${draft.followUpDate || "Not set"}`,
      "",
      "DOCUMENT STATUS",
      ...documents.map((item) => `- [${statusLabels[draft.statuses[item.id] ?? "todo"]}] ${item.title}`),
      "",
      "ITEMS TO REVIEW",
      ...(reviewItems.length ? reviewItems.map((item) => `- ${item.title}: ${item.caution ?? item.detail}`) : ["- None marked"]),
      "",
      "APPLICATION NOTE",
      draft.coverNote || "Not created",
      "",
      "This pack is a preparation summary, not a rental application or legal advice. Do not include TFN, bank login details or identity document numbers in this text file.",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${safeFileName(draft.propertyLabel)}-application-pack.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("준비 현황과 소개문을 텍스트 파일로 저장했습니다.");
  };

  return <div className="space-y-8">
    <RentalApplicationPortfolio
      packs={packSummaries}
      activeId={workspace.activeId}
      onSelect={(id) => setWorkspace((current) => ({ ...current, activeId: id }))}
      onCreate={() => addPack(false)}
      onReuse={() => addPack(true)}
      onRemove={removeActivePack}
      atLimit={workspace.packs.length >= MAX_PACKS}
      canRemove={workspace.packs.length > 1}
      firstCandidateSaved={firstCandidateSaved}
      firstCandidateLabel={draft.propertyLabel}
      firstCandidateMessage={firstCandidateMessage}
      onFirstCandidateLabelChange={(label) => setField("propertyLabel", label)}
      onSaveFirstCandidate={saveFirstCandidate}
    />
    <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
      <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="rental-profile-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application brief</p><h2 id="rental-profile-heading" className="mt-2 text-2xl font-semibold text-navy">집과 신청 조건</h2><p className="mt-3 text-sm leading-6 text-muted">정확한 주소 대신 내가 알아볼 수 있는 별칭만 적어도 됩니다. 이 정보는 현재 브라우저에만 자동 저장됩니다.</p>
        {draft.inspectionSummary && <p className="mt-4 border-l-2 border-gold bg-gold/5 p-3 text-sm leading-6 text-navy"><strong>무료 방문 점검에서 이어짐:</strong> {draft.inspectionSummary.mode === "share" ? "쉐어" : "렌트"} · 확인 {draft.inspectionSummary.reviewedCount}개 · 다시 확인 {draft.inspectionSummary.concernCount}개. 방문 메모와 세부 체크 결과는 가져오지 않았습니다.</p>}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy sm:col-span-2">집 후보 별칭<input maxLength={80} className={inputClass} value={draft.propertyLabel} onChange={(event) => setField("propertyLabel", event.target.value)} placeholder="Carlton 후보 1" /></label>
          <label className="text-sm font-medium text-navy">희망 입주일<input type="date" className={inputClass} value={draft.moveDate} onChange={(event) => setField("moveDate", event.target.value)} /></label>
          <label className="text-sm font-medium text-navy">희망 계약기간<select className={inputClass} value={draft.leaseTerm} onChange={(event) => setField("leaseTerm", event.target.value)}><option>6 months</option><option>12 months</option><option>18 months</option><option>24 months</option><option>Flexible</option></select></label>
          <label className="text-sm font-medium text-navy">입주 인원<input type="number" min="1" max="12" className={inputClass} value={draft.householdSize} onChange={(event) => setField("householdSize", event.target.value)} /></label>
          <label className="text-sm font-medium text-navy">반려동물 요약<input className={inputClass} value={draft.petSummary} onChange={(event) => setField("petSummary", event.target.value)} placeholder="No pets" /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">고용·소득 상황 한 줄 <span className="font-normal text-muted">(금액·회사명 불필요)</span><input className={inputClass} value={draft.employmentSummary} onChange={(event) => setField("employmentSummary", event.target.value)} placeholder="Full-time hospitality employee with regular income" /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">임대 이력 또는 대체 설명<input className={inputClass} value={draft.rentalSummary} onChange={(event) => setField("rentalSummary", event.target.value)} placeholder="Two years of rental history with references available" /></label>
          <label className="text-sm font-medium text-navy sm:col-span-2">집을 잘 관리할 근거 <span className="font-normal text-muted">(선택)</span><textarea className={`${inputClass} min-h-24 resize-y`} value={draft.strengths} onChange={(event) => setField("strengths", event.target.value)} placeholder="Quiet, non-smoking household with a consistent record of on-time rent" /></label>
        </div>
        <button type="button" onClick={createCoverNote} className="mt-6 min-h-12 bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light">영문 소개문 만들기</button>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="rental-follow-up-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Contact and next action</p>
        <h2 id="rental-follow-up-heading" className="mt-2 text-xl font-semibold text-navy">연락 상태와 다음 확인일</h2>
        <p className="mt-3 text-sm leading-6 text-muted">에이전트 이름·이메일·전화번호는 적지 않고, 이 집에 언제 다시 확인할지만 관리합니다.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy">현재 상태<select className={inputClass} value={draft.contactStatus} onChange={(event) => updateActivePack((current) => ({ ...current, contactStatus: event.target.value as RentalContactStatus }))}>{Object.entries(rentalContactStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-navy">다음 확인일 <span className="font-normal text-muted">(선택)</span><input type="date" className={inputClass} value={draft.followUpDate} onChange={(event) => updateActivePack((current) => ({ ...current, followUpDate: event.target.value }))} /></label>
        </div>
      </section>

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="privacy-check-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Before sharing documents</p><h2 id="privacy-check-heading" className="mt-2 text-xl font-semibold text-navy">제출 전에 반드시 멈춰볼 정보</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-muted"><li className="border-l-2 border-gold pl-3"><strong className="text-navy">TFN·은행 로그인·카드정보</strong>는 임대 신청서에 입력하지 않습니다.</li><li className="border-l-2 border-gold pl-3">은행 명세서가 필요하다면 거래내역을 가린 자료가 허용되는지 확인합니다.</li><li className="border-l-2 border-gold pl-3">신분증 사본을 보내기 전 불필요한 번호와 정보를 가릴 수 있는지 묻습니다.</li><li className="border-l-2 border-gold pl-3">신청 링크를 메시지로 받았다면 에이전트 공식 번호로 다시 확인합니다.</li></ul></section>
      </div>

      <div className="space-y-8 xl:sticky xl:top-24">
      <section id="rental-document-readiness" className="scroll-mt-24 border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="document-pack-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Document readiness</p><h2 id="document-pack-heading" className="mt-2 text-xl font-semibold text-navy">서류 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{readyCount} / {documents.length} 준비 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
        <ol className="mt-6 divide-y divide-border border-y border-navy/20">{documents.map((item, index) => { const status = draft.statuses[item.id] ?? "todo"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem] sm:items-start"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.group}</p><h3 className="mt-1 font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>{item.caution && status === "review" ? <p className="mt-2 border-l-2 border-gold pl-3 text-xs leading-5 text-[#755b20]">{item.caution}</p> : null}</div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setStatus(item.id, event.target.value as DocumentStatus)}><option value="todo">준비 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol>
      </section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="rental-note-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application note</p><h2 id="rental-note-heading" className="mt-2 text-xl font-semibold text-navy">영문 소개문 초안</h2></div><button type="button" onClick={copyCoverNote} disabled={!draft.coverNote} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-35">텍스트 복사</button></div><label className="sr-only" htmlFor="rental-cover-note">영문 소개문 초안</label><textarea id="rental-cover-note" className={`${inputClass} mt-5 min-h-80 resize-y font-serif leading-7`} value={draft.coverNote} onChange={(event) => setField("coverNote", event.target.value)} placeholder="왼쪽에서 조건을 입력한 뒤 영문 소개문을 만드세요." /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadSummary} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">준비 패키지 저장</button><span className="self-center text-xs leading-5 text-muted">TXT 파일 · 원본 서류 미포함</span></div><p className="mt-4 min-h-6 text-sm leading-6 text-muted" aria-live="polite">{message}</p></section>
      </div>
    </div>
  </div>;
}
