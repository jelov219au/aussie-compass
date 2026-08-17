"use client";

import { useEffect, useMemo, useState } from "react";

type DocumentStatus = "todo" | "review" | "ready";
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
};

type DocumentItem = {
  id: string;
  group: string;
  title: string;
  detail: string;
  caution?: string;
};

const STORAGE_KEY = "hoju-compass-rental-application-pro-v1";
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

function safeFileName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 50) || "rental-application";
}

export function RentalApplicationWorkspace() {
  const [draft, setDraft] = useState<RentalDraft>(initialDraft);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setDraft((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch {
      // The workspace remains usable when local storage is unavailable.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draft, loaded]);

  const readyCount = useMemo(() => documents.filter((item) => draft.statuses[item.id] === "ready").length, [draft.statuses]);
  const reviewItems = useMemo(() => documents.filter((item) => draft.statuses[item.id] === "review"), [draft.statuses]);
  const progress = Math.round((readyCount / documents.length) * 100);

  const setField = <K extends keyof RentalDraft>(field: K, value: RentalDraft[K]) => setDraft((current) => ({ ...current, [field]: value }));
  const setStatus = (id: string, status: DocumentStatus) => setDraft((current) => ({ ...current, statuses: { ...current.statuses, [id]: status } }));

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

  return <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(34rem,1.1fr)]">
    <div className="space-y-8">
      <section className="border-t border-navy/20 pt-6" aria-labelledby="rental-profile-heading">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application brief</p><h2 id="rental-profile-heading" className="mt-2 text-2xl font-semibold text-navy">집과 신청 조건</h2><p className="mt-3 text-sm leading-6 text-muted">정확한 주소 대신 내가 알아볼 수 있는 별칭만 적어도 됩니다. 이 정보는 현재 브라우저에만 자동 저장됩니다.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-navy sm:col-span-2">집 후보 별칭<input className={inputClass} value={draft.propertyLabel} onChange={(event) => setField("propertyLabel", event.target.value)} placeholder="Carlton 후보 1" /></label>
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

      <section className="border border-border bg-white p-5 sm:p-7" aria-labelledby="privacy-check-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Before sharing documents</p><h2 id="privacy-check-heading" className="mt-2 text-xl font-semibold text-navy">제출 전에 반드시 멈춰볼 정보</h2><ul className="mt-5 space-y-3 text-sm leading-6 text-muted"><li className="border-l-2 border-gold pl-3"><strong className="text-navy">TFN·은행 로그인·카드정보</strong>는 임대 신청서에 입력하지 않습니다.</li><li className="border-l-2 border-gold pl-3">은행 명세서가 필요하다면 거래내역을 가린 자료가 허용되는지 확인합니다.</li><li className="border-l-2 border-gold pl-3">신분증 사본을 보내기 전 불필요한 번호와 정보를 가릴 수 있는지 묻습니다.</li><li className="border-l-2 border-gold pl-3">신청 링크를 메시지로 받았다면 에이전트 공식 번호로 다시 확인합니다.</li></ul></section>
    </div>

    <div className="space-y-8 xl:sticky xl:top-24">
      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="document-pack-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Document readiness</p><h2 id="document-pack-heading" className="mt-2 text-xl font-semibold text-navy">서류 준비 현황</h2></div><div className="text-right"><p className="font-mono text-3xl text-navy">{progress}%</p><p className="text-xs text-muted">{readyCount} / {documents.length} 준비 완료</p></div></div><div className="mt-5 h-1.5 bg-surface"><div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} /></div>
        <ol className="mt-6 divide-y divide-border border-y border-navy/20">{documents.map((item, index) => { const status = draft.statuses[item.id] ?? "todo"; return <li key={item.id} className="py-5"><div className="grid gap-3 sm:grid-cols-[2rem_1fr_8rem] sm:items-start"><span className="font-mono text-xs text-gold">{String(index + 1).padStart(2, "0")}</span><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.group}</p><h3 className="mt-1 font-semibold text-navy">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.detail}</p>{item.caution && status === "review" ? <p className="mt-2 border-l-2 border-gold pl-3 text-xs leading-5 text-[#755b20]">{item.caution}</p> : null}</div><label className="text-xs font-medium text-muted">상태<select className="mt-1 min-h-10 w-full border border-border bg-white px-2 text-sm text-navy" value={status} onChange={(event) => setStatus(item.id, event.target.value as DocumentStatus)}><option value="todo">준비 전</option><option value="review">확인 필요</option><option value="ready">준비 완료</option></select></label></div></li>; })}</ol>
      </section>

      <section className="border border-border bg-white p-5 shadow-sm sm:p-7" aria-labelledby="rental-note-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Application note</p><h2 id="rental-note-heading" className="mt-2 text-xl font-semibold text-navy">영문 소개문 초안</h2></div><button type="button" onClick={copyCoverNote} disabled={!draft.coverNote} className="min-h-11 border-b-2 border-gold text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-35">텍스트 복사</button></div><label className="sr-only" htmlFor="rental-cover-note">영문 소개문 초안</label><textarea id="rental-cover-note" className={`${inputClass} mt-5 min-h-80 resize-y font-serif leading-7`} value={draft.coverNote} onChange={(event) => setField("coverNote", event.target.value)} placeholder="왼쪽에서 조건을 입력한 뒤 영문 소개문을 만드세요." /><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadSummary} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">준비 패키지 저장</button><span className="self-center text-xs leading-5 text-muted">TXT 파일 · 원본 서류 미포함</span></div><p className="mt-4 min-h-6 text-sm leading-6 text-muted" aria-live="polite">{message}</p></section>
    </div>
  </div>;
}
