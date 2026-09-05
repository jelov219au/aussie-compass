"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  addCarSnapshot, carArchiveMaxBytes, carDraftText, carIssueStatus, carPurchaseStorageKey,
  carQuestions, decisionLabels, emptyCarCandidate, emptyCarIssue, formatCarCents,
  inspectionLabels, isCarIssueResolved, issueLabels, maxCarCandidates, maxCarIssues,
  maxCarSnapshots, parseCarArchive, parseCarMoney, readCarDraft, sampleCarDraft,
  saveCarDraft, serializeCarDraft, summarizeCar, type CarCandidate, type CarDraft, type CarIssue,
} from "@/lib/carPurchasePro";

const control = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-navy/25 bg-white px-3 py-2 text-base text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const button = "inline-flex min-h-11 items-center justify-center rounded-lg border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-45";
const section = "rounded-2xl border border-border bg-white p-5 sm:p-7";
const initialDraft = (): CarDraft => ({ candidates: [emptyCarCandidate("first-car")], snapshots: [] });
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "작업하지 못했습니다. 현재 기록을 유지합니다.";
type PendingChange = { kind: "sample" } | { kind: "import"; draft: CarDraft } | { kind: "delete"; candidateId: string; issueId: string };

function Field({ label, value, onChange, money = false, multiline = false, date = false, maxLength = 1000, hint }: {
  label: string; value: string; onChange: (value: string) => void;
  money?: boolean; multiline?: boolean; date?: boolean; maxLength?: number; hint?: string;
}) {
  const id = useId();
  const invalid = money && parseCarMoney(value).kind === "invalid";
  const description = invalid ? "쉼표·통화기호 없이 0 이상의 숫자와 소수 둘째 자리까지 입력하세요." : hint;
  return <div className="min-w-0">
    <label htmlFor={id} className="text-sm font-semibold text-navy">{label}</label>
    {multiline ? <textarea id={id} value={value} onInput={event => onChange(event.currentTarget.value)} onChange={event => onChange(event.target.value)} maxLength={maxLength} rows={3} className={control} aria-describedby={description ? `${id}-hint` : undefined} /> :
      <input id={id} type={date ? "date" : "text"} inputMode={money ? "decimal" : undefined} value={value}
        onInput={event => onChange(event.currentTarget.value)}
        onChange={event => onChange(event.target.value)} maxLength={money ? 20 : maxLength} className={control}
        aria-invalid={invalid || undefined} aria-describedby={description ? `${id}-hint` : undefined} />}
    {description && <p id={`${id}-hint`} className={`mt-1 text-xs leading-5 ${invalid ? "text-red-800" : "text-muted"}`}>{description}</p>}
  </div>;
}
function SelectField({ label, value, onChange, children }: {
  label: string; value: string; onChange: (value: string) => void; children: ReactNode;
}) {
  const id = useId();
  return <div className="min-w-0"><label htmlFor={id} className="text-sm font-semibold text-navy">{label}</label>
    <select id={id} value={value} onChange={event => onChange(event.target.value)} className={control}>{children}</select></div>;
}

export function CarPurchaseProWorkspace() {
  const [draft, setDraft] = useState<CarDraft>(initialDraft);
  const [selected, setSelected] = useState("first-car");
  const [ready, setReady] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [notice, setNotice] = useState("저장 기록을 확인하고 있습니다.");
  const [pendingImport, setPendingImport] = useState<CarDraft | null>(null);
  const [readingImport, setReadingImport] = useState(false);
  const [showBackupText, setShowBackupText] = useState(false);
  const [backupInput, setBackupInput] = useState("");
  const [showText, setShowText] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
  const confirmation = useRef<HTMLElement | null>(null);
  const baseline = useRef<string | null>(null);
  const initialized = useRef(false);
  const importSequence = useRef(0);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const loaded = readCarDraft(() => window.localStorage);
    baseline.current = loaded.raw;
    setOriginal(loaded.raw);
    if (loaded.kind === "loaded") {
      setDraft(loaded.draft);
      setSelected(loaded.draft.candidates[0].id);
      setNotice("이 기기의 저장 기록을 불러왔습니다.");
    } else if (loaded.kind === "blocked") {
      setBlocked(true);
      setNotice("저장 기록을 읽을 수 없어 덮어쓰기를 막았습니다. 현재 입력은 백업으로 보관할 수 있습니다.");
    } else setNotice("새 기록입니다. 입력 후 ‘이 기기에 저장’을 누르세요.");
    setReady(true);
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === carPurchaseStorageKey || event.key === null) {
        setBlocked(true);
        setNotice("다른 탭에서 저장 기록이 바뀌었습니다. 현재 화면을 백업한 뒤 다시 열어주세요. 덮어쓰지 않았습니다.");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const onExit = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", onExit);
    return () => window.removeEventListener("beforeunload", onExit);
  }, [dirty]);
  useEffect(() => {
    if (!pendingChange) return;
    confirmation.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    confirmation.current?.focus({ preventScroll: true });
  }, [pendingChange]);

  const candidate = draft.candidates.find(car => car.id === selected) ?? draft.candidates[0];
  const summary = summarizeCar(candidate);
  const changeDraft = (next: CarDraft) => { setDraft(next); setDirty(true); };
  const changeCar = (patch: Partial<CarCandidate>) => {
    setDraft(previous => ({ ...previous, candidates: previous.candidates.map(car => car.id === candidate.id ? { ...car, ...patch } : car) }));
    setDirty(true);
  };
  const changeIssue = (id: string, patch: Partial<CarIssue>) => {
    setDraft(previous => ({ ...previous, candidates: previous.candidates.map(car => car.id === candidate.id ?
      { ...car, issues: car.issues.map(issue => issue.id === id ? { ...issue, ...patch } : issue) } : car) }));
    setDirty(true);
  };
  const save = () => {
    if (blocked) return;
    const result = saveCarDraft(() => window.localStorage, draft, baseline.current);
    if (result.kind === "saved") {
      baseline.current = result.raw; setOriginal(result.raw);
      setDirty(false); setNotice("이 기기에 저장했습니다. 다른 기기로 옮길 때는 백업을 내보내세요.");
    } else {
      if (result.kind === "conflict") setBlocked(true);
      setNotice(result.kind === "conflict" ? "저장 기록이 바뀌어 덮어쓰기를 중단했습니다. 현재 입력을 백업하고 다시 열어주세요." :
        "기기에 저장하지 못했습니다. 입력값은 화면에 남아 있습니다. 백업 파일 또는 백업 텍스트로 보관하세요.");
    }
  };
  const download = (content: string, name: string, type: string) => {
    try {
      const url = URL.createObjectURL(new Blob([content], { type }));
      const link = document.createElement("a");
      link.href = url; link.download = name;
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30000);
      setNotice("파일 다운로드를 요청했습니다. 다운로드 목록을 확인하세요. 저장이 안 되면 아래 텍스트를 복사하세요.");
    } catch { setNotice("파일 다운로드를 시작하지 못했습니다. 아래 텍스트를 복사해 보관하세요."); }
  };
  const exportBackup = () => {
    try { setShowBackupText(true); download(serializeCarDraft(draft), "hoju-car-purchase-backup.json", "application/json;charset=utf-8"); }
    catch (error) { setNotice(errorMessage(error)); }
  };
  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setNotice("복사했습니다. 공유 전에 내용을 확인하세요."); }
    catch { setNotice("자동 복사가 지원되지 않습니다. 텍스트 상자에서 직접 선택·복사하세요."); }
  };
  const loadSample = () => {
    setPendingChange({ kind: "sample" });
  };
  const clearImportReview = () => {
    setPendingImport(null);
    // A replacement or cancelled preview also invalidates its final confirmation.
    setPendingChange(previous => previous?.kind === "import" ? null : previous);
  };
  const reviewImport = (raw: string) => {
    clearImportReview();
    try { const next = parseCarArchive(raw); setPendingImport(next); setNotice("복원 미리보기를 확인한 뒤 적용하세요. 아직 현재 기록을 바꾸지 않았습니다."); }
    catch (error) { setPendingImport(null); setNotice(errorMessage(error)); }
  };
  const readFile = async (file: File | undefined) => {
    const sequence = ++importSequence.current;
    clearImportReview();
    if (!file) return;
    if (file.size > carArchiveMaxBytes) { setNotice("1MB 이하의 백업을 선택하세요."); return; }
    setReadingImport(true);
    try {
      const raw = await file.text();
      if (sequence === importSequence.current) reviewImport(raw);
    } catch { if (sequence === importSequence.current) setNotice("파일을 읽지 못했습니다. 기존 기록을 유지합니다."); }
    finally { if (sequence === importSequence.current) setReadingImport(false); }
  };
  const applyImport = () => {
    if (!pendingImport) return;
    setPendingChange({ kind: "import", draft: pendingImport });
  };
  const confirmChange = () => {
    if (!pendingChange) return;
    if (pendingChange.kind === "delete") {
      changeDraft({ ...draft, candidates: draft.candidates.map(car => car.id === pendingChange.candidateId ?
        { ...car, issues: car.issues.filter(issue => issue.id !== pendingChange.issueId) } : car) });
      setNotice("현재 화면에서 항목을 삭제했습니다. 기기에 저장하기 전까지 저장본은 유지됩니다.");
    } else {
      const next = pendingChange.kind === "sample" ? sampleCarDraft() : pendingChange.draft;
      changeDraft(next); setSelected(next.candidates[0].id); setPendingImport(null);
      setNotice(pendingChange.kind === "sample" ? "가상 예시입니다. 금액은 시장 견적이 아닙니다." : "화면에 복원했습니다. 확인 후 ‘이 기기에 저장’을 누르세요.");
    }
    setPendingChange(null);
  };
  const snapshot = () => {
    try {
      const next = addCarSnapshot(draft, candidate, crypto.randomUUID(), new Date().toISOString());
      serializeCarDraft(next);
      changeDraft(next); setNotice("현재 결정과 입력값을 보관 기록에 추가했습니다. ‘이 기기에 저장’을 눌러 보관하세요.");
    } catch (error) { setNotice(errorMessage(error)); }
  };
  const draftText = showText ? carDraftText(draft) : "";
  let backupText = "";
  if (showBackupText) { try { backupText = serializeCarDraft(draft); } catch { backupText = "기록 형식을 확인한 뒤 백업을 다시 시도하세요."; } }

  return <div className="space-y-6">
    <section className={section} aria-labelledby="car-start">
      <h2 id="car-start" className="text-xl font-semibold text-navy">검사 후 남은 질문을 한곳에</h2>
      <p className="mt-3 text-sm leading-7 text-muted">1. 후보와 검사 내용을 적고 → 2. 답변·수리 증빙을 이어서 기록하고 → 3. 결정 당시 기록을 보관하세요. 후보 최대 3대, 후보당 항목 20개, 보관 기록 5개입니다.</p>
      <p className="mt-2 text-sm leading-7 text-muted">기기·브라우저마다 따로 저장됩니다. 자동 동기화와 오프라인 재실행은 지원하지 않습니다. 후보 별칭을 쓰고 VIN·신분증·연락처·계좌번호는 적지 마세요.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={!ready || blocked} onClick={save}>이 기기에 저장</button>
        <button type="button" className={button} disabled={!ready} onClick={exportBackup}>백업 JSON 내보내기</button>
        <button type="button" className={button} disabled={!ready} onClick={loadSample}>가상 사례 2개 보기</button>
      </div>
      <p role="status" aria-live="polite" className="mt-4 break-words text-sm leading-6 text-navy">{notice}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{dirty ? "아직 기기에 저장하지 않은 변경이 있습니다." : ready ? "저장 후 변경 없음 · 새 기록은 먼저 입력하세요." : "불러오는 중…"}</p>
      {blocked && original !== null && <button type="button" className={`${button} mt-3`} onClick={() => download(original, "hoju-car-original.txt", "text/plain;charset=utf-8")}>불러왔던 원본 기록 보관</button>}
    </section>

    {pendingChange && <section ref={confirmation} tabIndex={-1} className="rounded-2xl border-2 border-gold bg-[#fff9e7] p-5" aria-labelledby="car-confirm-heading">
      <h2 id="car-confirm-heading" className="text-xl font-semibold text-navy">{pendingChange.kind === "sample" ? "가상 사례로 바꾸기" : pendingChange.kind === "import" ? "백업으로 현재 화면 바꾸기" : "현재 항목 삭제 확인"}</h2>
      <p className="mt-3 text-sm leading-7 text-navy">{pendingChange.kind === "delete" ? "선택한 검사 항목을 현재 화면에서 삭제합니다. 날짜별 보관 기록은 유지합니다." : "현재 입력을 바꿉니다. 보관할 내용이 있다면 먼저 백업을 내보내세요."} 기기 저장은 별도로 눌러야 합니다.</p>
      <div className="mt-4 flex flex-wrap gap-3"><button type="button" className={button} onClick={exportBackup}>현재 입력 먼저 백업</button><button type="button" className={button} onClick={confirmChange}>변경 적용</button><button type="button" className={button} onClick={() => setPendingChange(null)}>변경 취소</button></div>
    </section>}

    <fieldset disabled={!ready} className="min-w-0 space-y-6">
      <legend className="sr-only">거래 기록 입력</legend>
      <section className={section} aria-labelledby="car-candidates">
        <h2 id="car-candidates" className="text-xl font-semibold text-navy">1. 후보와 검사 범위</h2>
        <div className="mt-4 flex flex-wrap gap-2" aria-label="후보 선택">
          {draft.candidates.map((car, index) => <button type="button" key={car.id} aria-pressed={car.id === candidate.id} className={`${button} max-w-full break-words aria-pressed:bg-navy aria-pressed:text-white`} onClick={() => setSelected(car.id)}>{car.alias || `후보 ${index + 1}`}</button>)}
          <button type="button" className={button} disabled={draft.candidates.length >= maxCarCandidates} onClick={() => {
            const next = emptyCarCandidate(crypto.randomUUID()); changeDraft({ ...draft, candidates: [...draft.candidates, next] }); setSelected(next.id);
          }}>후보 추가</button>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="후보 별칭" value={candidate.alias} onChange={alias => changeCar({ alias })} maxLength={80} />
          <SelectField label="검사 진행 상태" value={candidate.inspection} onChange={inspection => changeCar({ inspection: inspection as CarCandidate["inspection"] })}>
            {Object.entries(inspectionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <Field label="검사 범위·빠진 항목 메모" value={candidate.inspectionNote} onChange={inspectionNote => changeCar({ inspectionNote })} multiline hint="보고서를 받았어도 미검사 항목은 따로 남기세요." />
          <div className="grid gap-4">
            <Field label="판매자 요구 가격 (AUD)" value={candidate.askingPrice} onChange={askingPrice => changeCar({ askingPrice })} money />
            <Field label="합의 가격 (AUD · 아직 없으면 빈칸)" value={candidate.agreedPrice} onChange={agreedPrice => changeCar({ agreedPrice })} money hint="입력하면 요구 가격 대신 소계에 반영합니다." />
          </div>
          <Field label="검사·재검 예산 (AUD)" value={candidate.inspectionBudget} onChange={inspectionBudget => changeCar({ inspectionBudget })} money />
          <Field label="명의 이전·세금 예산 (AUD)" value={candidate.transferBudget} onChange={transferBudget => changeCar({ transferBudget })} money />
          <Field label="기타 구매 시점 예산 (AUD)" value={candidate.otherBudget} onChange={otherBudget => changeCar({ otherBudget })} money hint="아래 결함별 수리비와 같은 지출을 중복 입력하지 마세요. 비용이 없다고 확인한 경우에만 0." />
        </div>
      </section>

      <section className={section} aria-labelledby="car-issues">
        <h2 id="car-issues" className="text-xl font-semibold text-navy">2. 검사 항목 → 답변 → 수리·재확인</h2>
        <p className="mt-3 text-sm leading-7 text-muted">완료는 본인이 증빙 메모·재확인 날짜·내용을 남겼을 때만 표시됩니다. 도구가 수리나 안전성을 검증하는 것은 아닙니다.</p>
        <div className="mt-5 space-y-4">
          {candidate.issues.map((issue, index) => <details key={issue.id} open className="rounded-xl border border-border p-4">
            <summary className="min-h-11 cursor-pointer break-words font-semibold text-navy">{index + 1}. {issue.title || "새 항목"} · {carIssueStatus(issue)}</summary>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field label="검사 항목" value={issue.title} onChange={title => changeIssue(issue.id, { title })} />
              <Field label="출처 메모 (보고서 쪽수 등)" value={issue.source} onChange={source => changeIssue(issue.id, { source })} />
              <Field label="확인한 날짜" value={issue.checkedOn} onChange={checkedOn => changeIssue(issue.id, { checkedOn })} date />
              <SelectField label="진행 상태" value={issue.status} onChange={status => {
                if (status === "verified" && !isCarIssueResolved({ ...issue, status: "verified" })) {
                  setNotice("항목 제목, 증빙 메모, 재확인 날짜와 내용을 먼저 적어야 완료로 바꿀 수 있습니다."); return;
                }
                changeIssue(issue.id, { status: status as CarIssue["status"] });
              }}>{Object.entries(issueLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
              <Field label="받은 답변" value={issue.reply} onChange={reply => changeIssue(issue.id, { reply })} multiline />
              <Field label="다음에 물을 질문" value={issue.question} onChange={question => changeIssue(issue.id, { question })} multiline hint="영문 초안에 넣을 문장은 직접 영문으로 적으세요. 자동 번역하지 않습니다." />
              <Field label="다음 확인 날짜" value={issue.followUpOn} onChange={followUpOn => changeIssue(issue.id, { followUpOn })} date />
              <Field label="수리 약속 날짜" value={issue.promisedOn} onChange={promisedOn => changeIssue(issue.id, { promisedOn })} date />
              <Field label="받은 증빙 메모" value={issue.evidence} onChange={evidence => changeIssue(issue.id, { evidence })} multiline />
              <Field label="재확인 내용" value={issue.recheckNote} onChange={recheckNote => changeIssue(issue.id, { recheckNote })} multiline />
              <Field label="재확인 날짜" value={issue.recheckedOn} onChange={recheckedOn => changeIssue(issue.id, { recheckedOn })} date />
              <SelectField label="추가 수리비 부담자" value={issue.payer} onChange={payer => changeIssue(issue.id, { payer: payer as CarIssue["payer"] })}>
                <option value="unknown">미정</option><option value="buyer">구매자</option><option value="seller">판매자</option>
              </SelectField>
              <Field label="수리 견적 (AUD)" value={issue.quote} onChange={quote => changeIssue(issue.id, { quote })} money hint="금액을 모르면 빈칸을 유지하세요." />
              <Field label="실제 추가지출 (AUD)" value={issue.actualCost} onChange={actualCost => changeIssue(issue.id, { actualCost })} money hint="확정된 실지출을 입력하면 이 항목의 견적 대신 반영합니다." />
            </div>
            <button type="button" className={`${button} mt-5`} onClick={() => {
              setPendingChange({ kind: "delete", candidateId: candidate.id, issueId: issue.id });
            }}>이 항목 삭제</button>
          </details>)}
          {candidate.issues.length === 0 && <p className="text-sm leading-7 text-muted">아직 항목이 없습니다. ‘문제 없음’으로 판단된 상태가 아닙니다.</p>}
        </div>
        <button type="button" className={`${button} mt-5`} disabled={candidate.issues.length >= maxCarIssues} onClick={() => changeCar({ issues: [...candidate.issues, emptyCarIssue(crypto.randomUUID())] })}>검사 항목 추가</button>
      </section>

      <section className={section} aria-labelledby="car-decision">
        <h2 id="car-decision" className="text-xl font-semibold text-navy">3. 남은 일과 내 결정</h2>
        <div className="mt-5 rounded-xl bg-[#f6f3e9] p-5 text-sm leading-7 text-navy">
          <p>등록 항목 중 미해결 <strong>{summary.unresolved}개</strong> · 검사 상태: {inspectionLabels[candidate.inspection]}</p>
          <p>입력 금액 기준 소계 <strong>{formatCarCents(summary.subtotal)}</strong> · 최종 총비용이 아닙니다.</p>
          <p>금액 미확정 {summary.missing}개 · 금액 오류 {summary.invalid}개 · 부담자 미정 {summary.payerUnknown}개</p>
          <p>판매자 부담 표시 {summary.sellerItems}개는 소계에서 제외했습니다. 실제 부담 합의와 수리 이행을 따로 확인하세요.</p>
          <p>구매자 수리비: 실지출 {formatCarCents(summary.actualRepair)} + 실지출 미입력 항목의 견적 {formatCarCents(summary.estimatedRepair)}</p>
          <p className="mt-2">위 소계는 차값 + 검사·이전·기타 예산 + 구매자 수리비입니다. 무료 비교표의 연간 비용은 가져오지 않습니다.</p>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <SelectField label="현재 내 결정" value={candidate.decision} onChange={decision => changeCar({ decision: decision as CarCandidate["decision"] })}>
            {Object.entries(decisionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectField>
          <Field label="결정 이유·아직 남은 조건" value={candidate.reason} onChange={reason => changeCar({ reason })} multiline />
          <Field label="인도·후속 확인 메모" value={candidate.handoverNote} onChange={handoverNote => changeCar({ handoverNote })} multiline hint="인도 날짜, 받은 서류 종류, 남은 확인을 적으세요. 법적 명의 이전 완료를 자동 확인하지 않습니다." />
        </div>
        <button type="button" className={`${button} mt-5`} disabled={draft.snapshots.length >= maxCarSnapshots} onClick={snapshot}>현재 결정과 입력값 보관 ({draft.snapshots.length}/5)</button>
        <div className="mt-4 space-y-3">{draft.snapshots.map(saved => <details key={saved.id} className="rounded-lg border border-border p-3"><summary className="min-h-11 cursor-pointer break-words text-sm font-semibold">{saved.recordedAt.replace("T", " ").replace("Z", " UTC")} · {saved.candidateAlias}</summary><pre className="whitespace-pre-wrap break-words text-sm leading-7">{saved.text}</pre></details>)}</div>
      </section>
    </fieldset>

    <section className={section} aria-labelledby="car-export">
      <h2 id="car-export" className="text-xl font-semibold text-navy">질문 초안과 거래노트 가져가기</h2>
      <p className="mt-3 text-sm leading-7 text-muted">현재 후보의 미해결 항목을 영문 질문 틀에 넣습니다. 직접 적은 내용은 그대로 들어가므로 언어와 사실을 확인한 뒤 사용하세요.</p>
      <label className="mt-4 block text-sm font-semibold" htmlFor="car-question-preview">문의문 미리보기</label>
      <textarea id="car-question-preview" readOnly value={carQuestions(candidate)} rows={8} className={control} />
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={!ready} onClick={() => void copy(carQuestions(candidate))}>질문 초안 복사</button>
        <button type="button" className={button} disabled={!ready} onClick={() => { setShowText(true); download(carDraftText(draft), "hoju-car-purchase-note.txt", "text/plain;charset=utf-8"); }}>전체 거래노트 TXT 내보내기</button>
        <button type="button" className={button} disabled={!ready} onClick={() => setShowText(!showText)}>전체 거래노트 미리보기</button>
      </div>
      {showText && <><label className="mt-4 block text-sm font-semibold" htmlFor="car-note-preview">직접 선택·복사할 거래노트</label><textarea id="car-note-preview" readOnly value={draftText} rows={12} className={control} /></>}
    </section>

    <section className={section} aria-labelledby="car-backup">
      <h2 id="car-backup" className="text-xl font-semibold text-navy">백업 복원 · 다른 기기로 옮기기</h2>
      <p className="mt-3 text-sm leading-7 text-muted">이 도구에서 내보낸 1MB 이하 JSON만 읽습니다. 미리보기 후 화면에 적용하며, 기기 저장은 별도입니다. 한 번에 한 탭에서 편집하세요.</p>
      <label className="mt-4 block text-sm font-semibold" htmlFor="car-backup-file">백업 파일 선택</label>
      <input id="car-backup-file" type="file" accept=".json,application/json" className={control} disabled={!ready || readingImport} onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ""; }} />
      <details className="mt-5"><summary className="min-h-11 cursor-pointer text-sm font-semibold">파일 사용이 어려우면 백업 텍스트 붙여넣기</summary>
        <label className="block text-sm" htmlFor="car-backup-paste">백업 JSON 원문</label>
        <textarea id="car-backup-paste" value={backupInput} maxLength={carArchiveMaxBytes} onInput={event => setBackupInput(event.currentTarget.value)} onChange={event => setBackupInput(event.target.value)} rows={5} className={control} />
        <button type="button" className={`${button} mt-3`} disabled={!ready || readingImport} onClick={() => reviewImport(backupInput)}>복원 미리보기 확인</button>
      </details>
      {pendingImport && <div className="mt-5 rounded-xl border border-gold p-4">
        <p className="font-semibold">복원할 후보 {pendingImport.candidates.length}대 · 보관 기록 {pendingImport.snapshots.length}개</p>
        <ul className="mt-2 list-inside list-disc text-sm">{pendingImport.candidates.map(car => <li key={car.id} className="break-words">{car.alias || "이름 미입력"} · 검사 항목 {car.issues.length}개 · {decisionLabels[car.decision]}</li>)}</ul>
        <div className="mt-3 flex flex-wrap gap-3"><button type="button" className={button} onClick={applyImport}>이 백업을 화면에 적용</button><button type="button" className={button} onClick={clearImportReview}>취소</button></div>
      </div>}
      <button type="button" className={`${button} mt-5`} disabled={!ready} onClick={() => setShowBackupText(!showBackupText)}>현재 백업 텍스트 보기</button>
      {showBackupText && <><label htmlFor="car-backup-output" className="mt-4 block text-sm font-semibold">현재 기록의 백업 JSON · 직접 선택해 복사</label><textarea id="car-backup-output" readOnly value={backupText} rows={6} className={control} /></>}
    </section>
  </div>;
}
