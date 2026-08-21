"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type StateCode = "NSW" | "VIC" | "QLD" | "WA" | "SA" | "TAS" | "ACT" | "NT";
type SellerType = "private" | "dealer" | "auction";
type Decision = "comparing" | "hold" | "decline" | "ready";
type CheckKey = "vin" | "ppsr" | "rego" | "inspection" | "seller" | "receipt" | "insurance" | "transfer";
type Candidate = {
  id: string;
  label: string;
  sellerType: SellerType;
  askingPrice: string;
  transferCost: string;
  inspectionCost: string;
  immediateRepairs: string;
  insurance: string;
  rego: string;
  servicing: string;
  tyres: string;
  monthlyFuel: string;
  odometer: string;
  decision: Decision;
  notes: string;
  checks: Record<CheckKey, boolean>;
};
type Workspace = { state: StateCode; spendingLimit: string; repairBufferPercent: string; candidates: Candidate[] };
type Backup = { format: "hoju-compass-car-buy-pack"; version: 1; exportedAt: string; workspace: Workspace };

const STORAGE_KEY = "hoju-compass-car-buy-pro-v1";
const MAX_BACKUP_SIZE = 1024 * 1024;
const inputClass = "mt-1.5 min-h-11 w-full border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";
const sellerLabels: Record<SellerType, string> = { private: "개인 판매", dealer: "딜러", auction: "경매" };
const decisionLabels: Record<Decision, string> = { comparing: "비교 중", hold: "추가 확인", decline: "제외", ready: "구매 직전" };
const stateLinks: Record<StateCode, string> = {
  NSW: "https://www.service.nsw.gov.au/transaction/transfer-a-vehicle-registration",
  VIC: "https://www.vicroads.vic.gov.au/registration/buy-sell-or-transfer-a-vehicle",
  QLD: "https://www.qld.gov.au/transport/registration/transfer",
  WA: "https://www.transport.wa.gov.au/licensing/buy-sell-or-transfer-a-vehicle.asp",
  SA: "https://www.sa.gov.au/topics/driving-and-transport/vehicles-and-registration/vehicle-registration/transfers",
  TAS: "https://www.transport.tas.gov.au/registration/buying,-selling-or-transferring",
  ACT: "https://www.accesscanberra.act.gov.au/driving-transport-and-parking/registration/transfer-or-sell-a-vehicle",
  NT: "https://nt.gov.au/driving/rego/vehicle-ownership/transfer-vehicle-ownership",
};

const checks: Array<{ key: CheckKey; label: string; detail: string; critical: boolean }> = [
  { key: "vin", label: "차량·광고·서류의 VIN 일치", detail: "VIN 자체는 이 도구에 입력하지 않고 현장에서 직접 대조해요.", critical: true },
  { key: "ppsr", label: "구매 당일 PPSR 인증서 보관", detail: "번호판이 아닌 VIN으로 공식 검색한 최신 결과를 보관해요.", critical: true },
  { key: "rego", label: "공식 Rego 상태·차량 정보 확인", detail: "등록 만료일과 차량 정보, 이전 절차를 관할 기관에서 확인해요.", critical: true },
  { key: "inspection", label: "독립적인 사전 차량 검사", detail: "판매자와 이해관계가 없는 정비사에게 실제 상태를 확인해요.", critical: true },
  { key: "seller", label: "판매 권한과 판매 형태 확인", detail: "개인·딜러·경매에 따라 적용되는 권리와 절차가 달라요.", critical: true },
  { key: "receipt", label: "가격·날짜·차량이 적힌 영수증", detail: "송금 전에 인수 내용과 거래 기록을 글로 남겨요.", critical: false },
  { key: "insurance", label: "차량 인수 전 보험 시작 확인", detail: "보장 개시 시각과 운전자 조건을 보험사에 직접 확인해요.", critical: false },
  { key: "transfer", label: "명의이전 제출 순서 확인", detail: "구매자·판매자 각각의 제출 항목과 기한을 공식 안내에서 확인해요.", critical: false },
];

function createCandidate(index: number): Candidate {
  return { id: crypto.randomUUID(), label: `후보 ${index + 1}`, sellerType: "private", askingPrice: "", transferCost: "", inspectionCost: "", immediateRepairs: "", insurance: "", rego: "", servicing: "", tyres: "", monthlyFuel: "", odometer: "", decision: "comparing", notes: "", checks: { vin: false, ppsr: false, rego: false, inspection: false, seller: false, receipt: false, insurance: false, transfer: false } };
}

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function totals(candidate: Candidate, bufferPercent: string) {
  const purchase = amount(candidate.askingPrice);
  const upfront = purchase + amount(candidate.transferCost) + amount(candidate.inspectionCost) + amount(candidate.immediateRepairs);
  const running = amount(candidate.insurance) + amount(candidate.rego) + amount(candidate.servicing) + amount(candidate.tyres) + amount(candidate.monthlyFuel) * 12;
  const buffer = purchase * Math.min(50, Math.max(0, amount(bufferPercent))) / 100;
  return { purchase, upfront, running, buffer, firstYear: upfront + running + buffer };
}

function safeName(value: string) {
  return value.trim().replace(/[^a-z0-9가-힣]+/gi, "-").replace(/^-|-$/g, "").slice(0, 42) || "car-buy-pack";
}

function isBackup(value: unknown): value is Backup {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Backup>;
  return candidate.format === "hoju-compass-car-buy-pack" && candidate.version === 1 && Boolean(candidate.workspace) && Array.isArray(candidate.workspace?.candidates);
}

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function CarBuyProWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>({ state: "NSW", spendingLimit: "", repairBufferPercent: "10", candidates: [] });
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setWorkspace(JSON.parse(saved) as Workspace);
      else setWorkspace((current) => ({ ...current, candidates: [createCandidate(0), createCandidate(1)] }));
    } catch { setWorkspace((current) => ({ ...current, candidates: [createCandidate(0), createCandidate(1)] })); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); } catch {}
    }, 300);
    return () => window.clearTimeout(timer);
  }, [workspace, loaded]);

  const results = useMemo(() => workspace.candidates.map((candidate) => ({ candidate, ...totals(candidate, workspace.repairBufferPercent) })), [workspace]);
  const lowestFirstYear = Math.min(...results.map((item) => item.firstYear).filter((value) => value > 0));

  const update = <K extends keyof Candidate>(id: string, key: K, value: Candidate[K]) => setWorkspace((current) => ({ ...current, candidates: current.candidates.map((candidate) => candidate.id === id ? { ...candidate, [key]: value } : candidate) }));
  const updateCheck = (id: string, key: CheckKey, value: boolean) => setWorkspace((current) => ({ ...current, candidates: current.candidates.map((candidate) => candidate.id === id ? { ...candidate, checks: { ...candidate.checks, [key]: value } } : candidate) }));

  const sellerMessage = (candidate: Candidate) => {
    const missing = checks.filter((check) => !candidate.checks[check.key]).slice(0, 4).map((check) => check.label);
    const intro = candidate.sellerType === "dealer"
      ? `Hi, I am reviewing the ${candidate.label || "vehicle"}. Could you please confirm the full drive-away price and provide the written vehicle details?`
      : `Hi, I am reviewing the ${candidate.label || "vehicle"}. Before arranging payment, could you please confirm that you are authorised to sell it and provide the vehicle details needed for my checks?`;
    return [intro, missing.length ? `I still need to confirm: ${missing.join("; ")}.` : "I have completed my main pre-purchase checks.", "I will arrange my own PPSR and registration checks and, where applicable, an independent inspection before payment.", "Please also confirm what documents and keys will be handed over at collection. Thank you."].join("\n\n");
  };

  const copyMessage = async (candidate: Candidate) => {
    await navigator.clipboard.writeText(sellerMessage(candidate));
    setMessage(`${candidate.label || "차량 후보"} 판매자 확인 문장을 복사했습니다.`);
  };

  const exportSummary = () => {
    const lines = [
      "HOJU COMPASS — CAR BUY DECISION PACK",
      `State or territory: ${workspace.state}`,
      `Spending limit: A$${amount(workspace.spendingLimit).toFixed(2)}`,
      `Repair buffer: ${amount(workspace.repairBufferPercent)}% of purchase price`,
      "",
      ...results.flatMap(({ candidate, upfront, running, buffer, firstYear }) => {
        const completed = checks.filter((check) => candidate.checks[check.key]).length;
        const missingCritical = checks.filter((check) => check.critical && !candidate.checks[check.key]).map((check) => check.label);
        return [
          `${candidate.label || "Untitled vehicle"} — ${sellerLabels[candidate.sellerType]} — ${decisionLabels[candidate.decision]}`,
          `Odometer note: ${candidate.odometer || "not recorded"}`,
          `Upfront estimate: A$${upfront.toFixed(2)}`,
          `First-year running estimate: A$${running.toFixed(2)}`,
          `Repair buffer: A$${buffer.toFixed(2)}`,
          `First-year total estimate: A$${firstYear.toFixed(2)}`,
          `Checks completed: ${completed}/${checks.length}`,
          `Critical checks remaining: ${missingCritical.length ? missingCritical.join("; ") : "none marked"}`,
          `Notes: ${candidate.notes || "none"}`,
          "",
        ];
      }),
      "User-entered estimates only. This summary is not a valuation, mechanical inspection, finance recommendation or legal advice. Verify PPSR, registration, transfer, insurance and consumer rights with official sources before buying.",
    ];
    download(`${safeName(workspace.candidates[0]?.label || "car-buy")}-decision-pack.txt`, lines.join("\r\n"), "text/plain;charset=utf-8");
    setMessage("중고차 구매 결정 요약을 저장했습니다.");
  };

  const exportBackup = () => {
    const backup: Backup = { format: "hoju-compass-car-buy-pack", version: 1, exportedAt: new Date().toISOString(), workspace };
    download("hoju-compass-car-buy-pack.json", JSON.stringify(backup, null, 2), "application/json");
    setMessage("이 기기의 작업 내용을 백업 파일로 저장했습니다.");
  };

  const restoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setError("");
    if (!file) return;
    if (file.size > MAX_BACKUP_SIZE) { setError("백업 파일은 1MB 이하여야 합니다."); return; }
    try {
      const parsed = JSON.parse(await file.text());
      if (!isBackup(parsed)) throw new Error("invalid");
      setWorkspace(parsed.workspace);
      setMessage("백업 내용을 이 기기에 복원했습니다.");
    } catch { setError("Hoju Compass 중고차 구매 패키지 백업 파일인지 확인해 주세요."); }
  };

  return <div className="space-y-8">
    <section className="grid gap-5 border-y border-navy/20 py-6 lg:grid-cols-[1fr_17rem_17rem]" aria-labelledby="car-buy-brief-heading">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Purchase brief</p><h2 id="car-buy-brief-heading" className="mt-2 text-2xl font-semibold text-navy">먼저 구매 기준을 정해요</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">판매자 이름, 연락처, VIN과 번호판은 적지 마세요. 후보 별칭과 예상 비용, 직접 확인한 상태만 이 브라우저에 저장합니다.</p></div>
      <label className="text-sm font-medium text-navy">등록 주·준주<select className={inputClass} value={workspace.state} onChange={(event) => setWorkspace((current) => ({ ...current, state: event.target.value as StateCode }))}>{Object.keys(stateLinks).map((state) => <option key={state}>{state}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-navy">총지출 상한 A$<input type="number" min="0" className={inputClass} value={workspace.spendingLimit} onChange={(event) => setWorkspace((current) => ({ ...current, spendingLimit: event.target.value }))} /></label><label className="text-sm font-medium text-navy">수리 여유 %<input type="number" min="0" max="50" className={inputClass} value={workspace.repairBufferPercent} onChange={(event) => setWorkspace((current) => ({ ...current, repairBufferPercent: event.target.value }))} /></label></div>
    </section>

    <section aria-labelledby="vehicle-candidates-heading"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Vehicle shortlist</p><h2 id="vehicle-candidates-heading" className="mt-2 text-2xl font-semibold text-navy">차량 후보별 비용과 확인 상태</h2></div>{workspace.candidates.length < 3 && <button type="button" onClick={() => setWorkspace((current) => ({ ...current, candidates: [...current.candidates, createCandidate(current.candidates.length)] }))} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">+ 후보 추가</button>}</div>
      <div className="mt-6 grid gap-6 xl:grid-cols-3">{results.map(({ candidate, upfront, running, buffer, firstYear }) => {
        const completed = checks.filter((check) => candidate.checks[check.key]).length;
        const missingCritical = checks.filter((check) => check.critical && !candidate.checks[check.key]);
        const overBudget = amount(workspace.spendingLimit) > 0 && firstYear > amount(workspace.spendingLimit);
        return <article key={candidate.id} className="border border-border bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-gold">CANDIDATE</p><h3 className="mt-1 text-xl font-semibold text-navy">{candidate.label || "이름 없는 후보"}</h3></div>{workspace.candidates.length > 1 && <button type="button" onClick={() => setWorkspace((current) => ({ ...current, candidates: current.candidates.filter((item) => item.id !== candidate.id) }))} className="min-h-9 text-xs font-medium text-muted hover:text-red-700">삭제</button>}</div>
          <div className="mt-4 grid grid-cols-2 gap-3"><label className="col-span-2 text-xs font-medium text-navy">차량 별칭<input className={inputClass} maxLength={60} value={candidate.label} onChange={(event) => update(candidate.id, "label", event.target.value)} placeholder="예: 흰색 Corolla 후보" /></label><label className="text-xs font-medium text-navy">판매 형태<select className={inputClass} value={candidate.sellerType} onChange={(event) => update(candidate.id, "sellerType", event.target.value as SellerType)}>{Object.entries(sellerLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-xs font-medium text-navy">현재 판단<select className={inputClass} value={candidate.decision} onChange={(event) => update(candidate.id, "decision", event.target.value as Decision)}>{Object.entries(decisionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="col-span-2 text-xs font-medium text-navy">주행거리 메모<input className={inputClass} value={candidate.odometer} onChange={(event) => update(candidate.id, "odometer", event.target.value)} placeholder="예: 약 128,000km · 계기판 확인" /></label></div>
          <div className="mt-5 grid grid-cols-2 gap-3">{([['askingPrice','구매가'],['transferCost','이전·인지 비용'],['inspectionCost','사전 검사'],['immediateRepairs','즉시 수리'],['insurance','연 보험'],['rego','연 Rego·CTP'],['servicing','연 정비'],['tyres','타이어 예산'],['monthlyFuel','월 연료']] as const).map(([key, label]) => <label key={key} className="text-xs font-medium text-navy">{label} A$<input type="number" min="0" step="1" className={inputClass} value={candidate[key]} onChange={(event) => update(candidate.id, key, event.target.value)} /></label>)}</div>
          <div className="mt-5 bg-navy p-4 text-white"><div className="flex justify-between text-sm"><span className="text-white/65">초기 지출</span><strong>A${Math.round(upfront).toLocaleString()}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-white/65">첫해 유지비</span><strong>A${Math.round(running).toLocaleString()}</strong></div><div className="mt-2 flex justify-between text-sm"><span className="text-white/65">수리 여유금</span><strong>A${Math.round(buffer).toLocaleString()}</strong></div><div className="mt-4 flex items-end justify-between border-t border-white/15 pt-4"><span className="text-sm text-white/70">첫해 예상 합계</span><strong className="text-2xl text-gold">A${Math.round(firstYear).toLocaleString()}</strong></div>{firstYear > 0 && firstYear === lowestFirstYear && <p className="mt-2 text-xs text-gold">현재 입력한 후보 중 가장 낮은 첫해 합계</p>}{overBudget && <p className="mt-2 text-xs text-rose-200">설정한 총지출 상한을 A${Math.round(firstYear - amount(workspace.spendingLimit)).toLocaleString()} 초과해요.</p>}</div>
          <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold text-navy">구매 직전 확인</p><p className="font-mono text-sm text-gold">{completed}/{checks.length}</p></div><div className="mt-3 space-y-3">{checks.map((check) => <label key={check.key} className="flex cursor-pointer gap-3"><input type="checkbox" checked={Boolean(candidate.checks[check.key])} onChange={(event) => updateCheck(candidate.id, check.key, event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" /><span><span className="block text-sm font-medium text-navy">{check.label}</span><span className="block text-xs leading-5 text-muted">{check.detail}</span></span></label>)}</div>
          <div className={`mt-5 border-l-2 p-3 text-xs leading-5 ${missingCritical.length ? "border-amber-500 bg-amber-50 text-amber-950" : "border-emerald-600 bg-emerald-50 text-emerald-950"}`}>{missingCritical.length ? `핵심 확인 ${missingCritical.length}개가 남아 있어요. 결제·계약 전에 직접 확인하세요.` : "표시한 핵심 확인을 모두 마쳤어요. 실제 결과와 서류를 한 번 더 대조하세요."}</div>
          <label className="mt-5 block text-xs font-medium text-navy">관찰 메모<textarea className={`${inputClass} min-h-24 resize-y`} maxLength={800} value={candidate.notes} onChange={(event) => update(candidate.id, "notes", event.target.value)} placeholder="경고등, 타이어, 냉난방, 누유 의심 등 직접 본 내용만 적으세요." /></label><button type="button" onClick={() => copyMessage(candidate)} className="mt-4 min-h-11 w-full border border-navy px-3 text-sm font-semibold text-navy hover:bg-surface">판매자 확인 영문 복사</button>
        </article>;
      })}</div>
    </section>

    <section className="grid gap-px bg-navy/15 lg:grid-cols-[1fr_1fr]" aria-labelledby="purchase-day-heading"><div className="bg-navy p-6 text-white sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Purchase-day order</p><h2 id="purchase-day-heading" className="mt-2 text-2xl font-semibold">송금보다 먼저 끝낼 순서</h2><ol className="mt-6 space-y-4 text-sm leading-6 text-white/75">{["실물 차량·광고·서류의 VIN 대조", "구매 당일 공식 PPSR 검색과 인증서 저장", `${workspace.state} 공식 Rego 상태·명의이전 절차 확인`, "독립 차량 검사 결과와 수리 예산 반영", "보험 개시 시각 확인", "영수증·열쇠·차량 인수 흐름에 맞춰 결제"].map((item, index) => <li key={item} className="grid grid-cols-[2rem_1fr] gap-2"><span className="font-mono text-gold">{String(index + 1).padStart(2, "0")}</span><span>{item}</span></li>)}</ol></div><div className="bg-surface p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Official checks</p><h2 className="mt-2 text-2xl font-semibold text-navy">도구 밖에서 직접 확인할 것</h2><div className="mt-6 grid gap-3"><a href="https://www.ppsr.gov.au/carcheck" target="_blank" rel="noreferrer" className="border border-border bg-white p-4 text-sm font-semibold text-navy">PPSR 차량 검색 ↗<span className="mt-1 block font-normal leading-5 text-muted">VIN으로 금융 이해관계와 도난·폐차 기록 등을 확인해요.</span></a><a href={stateLinks[workspace.state]} target="_blank" rel="noreferrer" className="border border-border bg-white p-4 text-sm font-semibold text-navy">{workspace.state} 등록·명의이전 안내 ↗<span className="mt-1 block font-normal leading-5 text-muted">등록 상태, 이전 서류와 제출 방법을 관할 기관에서 확인해요.</span></a><a href="https://www.accc.gov.au/consumers/specific-products-and-activities/new-and-second-hand-cars" target="_blank" rel="noreferrer" className="border border-border bg-white p-4 text-sm font-semibold text-navy">ACCC 중고차 소비자 권리 ↗<span className="mt-1 block font-normal leading-5 text-muted">딜러·개인·경매 구매의 차이와 지역별 추가 보호를 확인해요.</span></a></div></div></section>

    <section className="grid gap-6 border-t border-navy/20 pt-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Private handoff</p><h2 className="mt-2 text-2xl font-semibold text-navy">결정 기록을 내 파일로 남겨요</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">텍스트 요약은 정비사나 동행인과 확인할 때 사용하고, JSON 백업은 다른 기기에서 작업을 이어갈 때만 사용하세요. 원본 PPSR 인증서와 차량 검사서는 별도로 안전하게 보관해야 해요.</p><p className="mt-3 min-h-6 text-sm font-medium text-navy" aria-live="polite">{error || message}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={exportSummary} className="min-h-11 bg-navy px-4 text-sm font-semibold text-white">결정 요약 저장</button><button type="button" onClick={exportBackup} className="min-h-11 border border-navy px-4 text-sm font-semibold text-navy">백업 저장</button><label className="inline-flex min-h-11 cursor-pointer items-center border border-border bg-white px-4 text-sm font-semibold text-navy">백업 복원<input type="file" accept="application/json,.json" className="sr-only" onChange={restoreBackup} /></label></div></section>
  </div>;
}
