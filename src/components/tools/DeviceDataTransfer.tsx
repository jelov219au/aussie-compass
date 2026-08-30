"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { RAIL_WORK_ALERT_STORAGE_KEY } from "@/lib/railWorkAlerts";
import {
  clearRentalApplicationProDeviceData,
  propertyInspectionStorageKey,
  rentalApplicationProWorkspaceStorageKey,
} from "@/lib/rentalApplicationProDeviceStorage";
import { resumeProStarStoriesStorageKey } from "@/lib/resumeProDeviceStorage";
import { taxPrepRecordsStorageKey } from "@/lib/taxPrepStorage";

type StoredRecord = {
  key: string;
  label: string;
  group: string;
  sensitive?: boolean;
};

type BackupDocument = {
  format: "hoju-compass-device-backup";
  version: 1;
  exportedAt: string;
  sourceOrigin: string;
  entries: Record<string, string>;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const payEvidenceProStorageKey = "hoju-compass-pay-evidence-pro-v1";
const eofyProStorageKey = "hoju-compass-eofy-pro-v1";

const storedRecords: StoredRecord[] = [
  { key: "visa-preparation-project", label: "비자 신청 준비", group: "체크리스트" },
  { key: "arrival-first-30-days", label: "첫 30일 정착", group: "체크리스트" },
  { key: "house-hunt-project", label: "집 구하기 프로젝트", group: "체크리스트" },
  { key: "moving-project", label: "이사 준비", group: "체크리스트" },
  { key: "leaving-australia-project", label: "귀국 준비", group: "체크리스트" },
  { key: "hoju-compass-leaving-pro-v1", label: "귀국 준비 패키지", group: "체크리스트", sensitive: true },
  { key: "aussie-compass-bookmarks-v1", label: "저장한 페이지", group: "내 Compass" },
  { key: "aussie-compass-read-articles-v1", label: "읽은 실용 자료", group: "내 Compass" },
  { key: "hoju-compass-weekly-reading-goal-v1", label: "주간 읽기 목표", group: "내 Compass" },
  { key: "hoju-compass-route-finder-v1", label: "맞춤 시작 경로", group: "내 Compass" },
  { key: "hoju-compass-personal-plan-v1", label: "나의 3단계 계획", group: "내 Compass" },
  { key: "hoju-compass-english-phrase-cards-v1", label: "저장한 생활 영어 문장", group: "생활 준비" },
  { key: "aussie-compass-life-reminders-v1", label: "만료일·갱신 일정", group: "생활 관리" },
  { key: "aussie-compass-tax-return-checklist-v1", label: "택스 리턴 준비", group: "돈 관리" },
  { key: taxPrepRecordsStorageKey, label: "연중 택스 리턴 준비 장부", group: "돈 관리", sensitive: true },
  { key: eofyProStorageKey, label: "EOFY 준비 패키지", group: "돈 관리", sensitive: true },
  { key: "aussie-compass-salary-calculation", label: "급여 계산", group: "돈 관리", sensitive: true },
  { key: "aussie-compass-living-budget-v1", label: "생활비 예산", group: "돈 관리", sensitive: true },
  { key: "aussie-compass-savings-goal-v1", label: "저축 목표", group: "돈 관리", sensitive: true },
  { key: "aussie-compass-visa-cost-plan-v1", label: "비자 비용 계획", group: "돈 관리", sensitive: true },
  { key: "aussie-compass-resume-v1", label: "영문 이력서", group: "구직", sensitive: true },
  { key: "hoju-compass-resume-pro-preview-v1", label: "Resume Pro 지원서", group: "구직", sensitive: true },
  { key: "hoju-compass-resume-pro-applications-v1", label: "Resume Pro 회사별 지원서 목록", group: "구직", sensitive: true },
  { key: resumeProStarStoriesStorageKey, label: "Resume Pro STAR 경험 보관함", group: "구직", sensitive: true },
  { key: "aussie-compass-job-tracker-v1", label: "구직 지원 현황", group: "구직", sensitive: true },
  { key: payEvidenceProStorageKey, label: "급여 증빙 패키지", group: "구직", sensitive: true },
  { key: "aussie-compass-commute-housing-v1", label: "통학·생활권 비교", group: "주거·이동" },
  { key: RAIL_WORK_ALERT_STORAGE_KEY, label: "철도 작업 확인 지역", group: "주거·이동", sensitive: true },
  { key: propertyInspectionStorageKey, label: "집 방문 점검", group: "주거·이동", sensitive: true },
  { key: rentalApplicationProWorkspaceStorageKey, label: "렌트 신청 패키지", group: "주거·이동", sensitive: true },
  { key: "aussie-compass-service-quotes-v1", label: "서비스 견적 비교", group: "생활 서비스", sensitive: true },
  { key: "aussie-compass-service-price-log-v1", label: "서비스 가격 기록", group: "생활 서비스", sensitive: true },
  { key: "aussie-compass-vehicle-comparison-v1", label: "중고차 비교", group: "주거·이동", sensitive: true },
];

const allowedKeys = new Set(storedRecords.map((record) => record.key));

function isBackupDocument(value: unknown): value is BackupDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BackupDocument>;
  if (candidate.format !== "hoju-compass-device-backup" || candidate.version !== 1) return false;
  if (!candidate.entries || typeof candidate.entries !== "object" || Array.isArray(candidate.entries)) return false;
  return Object.entries(candidate.entries).every(([key, entry]) => allowedKeys.has(key) && typeof entry === "string");
}

export function DeviceDataTransfer() {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [host, setHost] = useState("");
  const [mode, setMode] = useState<"preserve" | "overwrite">("preserve");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [rentalDeleteConfirmed, setRentalDeleteConfirmed] = useState(false);
  const [payEvidenceDeleteConfirmed, setPayEvidenceDeleteConfirmed] = useState(false);
  const [eofyDeleteConfirmed, setEofyDeleteConfirmed] = useState(false);

  const refresh = (selectAll = false) => {
    const saved = storedRecords.filter((record) => {
      try { return localStorage.getItem(record.key) !== null; }
      catch { return false; }
    }).map((record) => record.key);
    setAvailable(saved);
    setSelected((current) => selectAll || !current.length ? saved : current.filter((key) => saved.includes(key)));
  };

  useEffect(() => {
    setHost(window.location.hostname);
    refresh();
  }, []);

  const selectedRecords = useMemo(() => storedRecords.filter((record) => selected.includes(record.key)), [selected]);
  const hasSensitiveSelection = selectedRecords.some((record) => record.sensitive);
  const legacyHost = host === "aussie-compass.vercel.app";

  const toggle = (key: string) => {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  };

  const exportBackup = () => {
    setError("");
    setMessage("");
    const entries: Record<string, string> = {};
    selected.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) entries[key] = value;
    });
    if (!Object.keys(entries).length) {
      setError("내보낼 기록을 하나 이상 선택해 주세요.");
      return;
    }
    const backup: BackupDocument = {
      format: "hoju-compass-device-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      sourceOrigin: window.location.origin,
      entries,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hoju-compass-device-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`${Object.keys(entries).length}개 기록을 백업 파일로 저장했습니다.`);
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setMessage("");
    if (file.size > MAX_FILE_SIZE) {
      setError("백업 파일이 너무 큽니다. 2MB 이하의 Hoju Compass JSON 파일을 선택해 주세요.");
      return;
    }
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isBackupDocument(parsed)) throw new Error("invalid");
      let imported = 0;
      let skipped = 0;
      for (const [key, value] of Object.entries(parsed.entries)) {
        if (mode === "preserve" && localStorage.getItem(key) !== null) {
          skipped += 1;
          continue;
        }
        localStorage.setItem(key, value);
        imported += 1;
      }
      refresh(true);
      window.dispatchEvent(new Event("storage"));
      setMessage(`${imported}개 기록을 불러왔습니다.${skipped ? ` 기존 기록 ${skipped}개는 유지했습니다.` : ""}`);
    } catch {
      setError("파일을 읽을 수 없습니다. Hoju Compass에서 내려받은 원본 JSON 백업인지 확인해 주세요.");
    }
  };

  const deleteRentalDeviceData = () => {
    setError("");
    setMessage("");
    const result = clearRentalApplicationProDeviceData(window.localStorage);
    refresh();
    window.dispatchEvent(new Event("storage"));
    if (result.failedKeys.length) {
      setError("일부 Rental 기록을 삭제하지 못했습니다. 브라우저 저장공간 설정을 확인한 뒤 이 기기에서 다시 시도해 주세요.");
      return;
    }
    setRentalDeleteConfirmed(false);
    setMessage(result.removedKeys.length
      ? `이 브라우저의 Rental 로컬 기록 ${result.removedKeys.length}개를 삭제했습니다.`
      : "이 브라우저에 남은 Rental 로컬 기록이 없습니다.");
  };

  const deletePayEvidenceDeviceData = () => {
    setError("");
    setMessage("");
    try {
      const existed = window.localStorage.getItem(payEvidenceProStorageKey) !== null;
      window.localStorage.removeItem(payEvidenceProStorageKey);
      refresh();
      window.dispatchEvent(new Event("storage"));
      setPayEvidenceDeleteConfirmed(false);
      setMessage(existed
        ? "이 브라우저의 Pay Evidence 로컬 기록을 삭제했습니다."
        : "이 브라우저에 남은 Pay Evidence 로컬 기록이 없습니다.");
    } catch {
      setError("Pay Evidence 기록을 삭제하지 못했습니다. 브라우저 저장공간 설정을 확인한 뒤 이 기기에서 다시 시도해 주세요.");
    }
  };

  const deleteEofyDeviceData = () => {
    setError("");
    setMessage("");
    try {
      const existed = window.localStorage.getItem(eofyProStorageKey) !== null;
      window.localStorage.removeItem(eofyProStorageKey);
      refresh();
      window.dispatchEvent(new Event("storage"));
      setEofyDeleteConfirmed(false);
      setMessage(existed
        ? "이 브라우저의 EOFY 로컬 기록을 삭제했습니다."
        : "이 브라우저에 남은 EOFY 로컬 기록이 없습니다.");
    } catch {
      setError("EOFY 기록을 삭제하지 못했습니다. 브라우저 저장공간 설정을 확인한 뒤 이 기기에서 다시 시도해 주세요.");
    }
  };

  return (
    <div className="mt-10 space-y-8">
      <section className="grid gap-6 border-y border-navy/20 py-7 lg:grid-cols-[1fr_18rem] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Current browser</p>
          <h2 className="mt-2 text-2xl font-semibold text-navy">이 브라우저에서 {available.length}개의 기록을 찾았습니다.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">{host || "현재 주소 확인 중"}에 저장된 Hoju Compass 기록만 표시합니다. 다른 웹사이트의 데이터에는 접근하지 않습니다.</p>
        </div>
        <div className={`border-l-2 px-4 py-2 text-sm leading-6 ${legacyHost ? "border-gold bg-gold/10 text-navy" : "border-navy/25 text-muted"}`}>
          <strong className="block text-navy">{legacyHost ? "기존 주소에서 접속 중" : "새 공식 주소에서 접속 중"}</strong>
          {legacyHost ? "먼저 백업 파일을 받은 뒤 새 주소에서 불러오세요." : "기존 주소에서 받은 백업 파일을 여기서 불러올 수 있습니다."}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_20rem]" aria-labelledby="export-heading">
        <div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-4">
            <div><p className="font-mono text-sm text-gold">01</p><h2 id="export-heading" className="mt-1 text-2xl font-semibold text-navy">기록 백업하기</h2></div>
            {available.length > 0 && <button type="button" onClick={() => setSelected(selected.length === available.length ? [] : available)} className="min-h-10 border-b border-border text-sm font-semibold text-navy hover:border-gold">{selected.length === available.length ? "선택 해제" : "모두 선택"}</button>}
          </div>
          {available.length ? <ul className="grid gap-x-6 sm:grid-cols-2">{storedRecords.filter((record) => available.includes(record.key)).map((record) => <li key={record.key} className="border-b border-border"><label className="flex min-h-20 cursor-pointer items-center gap-3 py-3"><input type="checkbox" checked={selected.includes(record.key)} onChange={() => toggle(record.key)} className="h-5 w-5 shrink-0 accent-[var(--color-gold)]"/><span><strong className="block text-sm text-navy">{record.label}</strong><span className="mt-1 block text-xs text-muted">{record.group}{record.sensitive ? " · 개인 내용 포함 가능" : ""}</span></span></label></li>)}</ul> : <div className="border-b border-border py-10"><p className="font-semibold text-navy">아직 저장된 기록이 없습니다.</p><p className="mt-2 text-sm leading-6 text-muted">체크리스트나 계산기를 사용한 뒤 다시 확인하거나, 아래에서 기존 백업을 불러오세요.</p></div>}
        </div>
        <aside className="h-fit bg-navy p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Download</p>
          <p className="mt-3 text-lg font-semibold">선택한 {selected.length}개 기록</p>
          <p className="mt-3 text-sm leading-6 text-white/65">JSON 파일 한 개로 기기에 저장합니다. 파일은 Hoju Compass 서버로 전송되지 않습니다.</p>
          {hasSensitiveSelection && <p className="mt-4 border-l-2 border-gold pl-3 text-xs leading-5 text-white/75">이력서의 이름·연락처나 급여·예산 금액이 포함될 수 있습니다. 개인 기기에 보관하고 이전을 마치면 안전하게 삭제하세요.</p>}
          <button type="button" disabled={!selected.length} onClick={exportBackup} className="mt-6 inline-flex min-h-12 w-full items-center justify-center bg-gold px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">백업 파일 받기</button>
          {legacyHost && <a href="https://hojucompass.com/data-transfer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center border border-white/25 px-4 text-center text-sm font-semibold text-white hover:border-gold">새 주소에서 불러오기 →</a>}
        </aside>
      </section>

      <section className="border-t border-navy/20 pt-8" aria-labelledby="import-heading">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
          <div>
            <p className="font-mono text-sm text-gold">02</p><h2 id="import-heading" className="mt-1 text-2xl font-semibold text-navy">백업 불러오기</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">기존 주소나 다른 기기에서 내려받은 Hoju Compass 백업 파일을 선택하세요. 백업에 없는 현재 기록은 삭제하지 않습니다.</p>
            <fieldset className="mt-6"><legend className="text-sm font-semibold text-navy">같은 항목이 이미 있을 때</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer border p-4 ${mode === "preserve" ? "border-gold bg-gold/10" : "border-border"}`}><input type="radio" name="import-mode" value="preserve" checked={mode === "preserve"} onChange={() => setMode("preserve")} className="mr-2 accent-[var(--color-gold)]"/><strong className="text-sm text-navy">기존 기록 유지</strong><span className="mt-1 block pl-6 text-xs leading-5 text-muted">비어 있는 항목만 가져옵니다. 권장 설정입니다.</span></label><label className={`cursor-pointer border p-4 ${mode === "overwrite" ? "border-gold bg-gold/10" : "border-border"}`}><input type="radio" name="import-mode" value="overwrite" checked={mode === "overwrite"} onChange={() => setMode("overwrite")} className="mr-2 accent-[var(--color-gold)]"/><strong className="text-sm text-navy">백업으로 덮어쓰기</strong><span className="mt-1 block pl-6 text-xs leading-5 text-muted">같은 항목의 현재 기록을 백업 내용으로 교체합니다.</span></label></div></fieldset>
          </div>
          <div className="h-fit border border-border bg-white p-6">
            <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-light"><input type="file" accept="application/json,.json" onChange={importBackup} className="sr-only"/>JSON 백업 선택하기</label>
            <p className="mt-3 text-center text-xs leading-5 text-muted">최대 2MB · 파일은 브라우저 안에서만 처리</p>
          </div>
        </div>
      </section>

      <section className="border-t border-navy/20 pt-8" aria-labelledby="rental-delete-heading">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <p className="font-mono text-sm text-gold">03</p>
            <h2 id="rental-delete-heading" className="mt-1 text-2xl font-semibold text-navy">공용 기기의 Rental 기록 삭제</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">집 방문 점검, Rental workspace의 모든 집 후보와 내부 가져오기 표식, 남은 이어보기 정보와 로컬 완료 표식을 이 브라우저에서 한 번에 삭제합니다. 구매 이용권·결제 증빙·서버 기록과 다른 기기의 데이터는 변경하지 않습니다.</p>
            <p className="mt-3 max-w-3xl text-xs leading-5 text-muted">일반 백업에는 다시 사용할 집 방문 점검과 Rental workspace가 포함되며, workspace 안의 집 후보와 내부 가져오기 표식도 함께 옮겨집니다. 일시적인 이어보기 정보와 로컬 완료 표식은 이전 대상이 아닙니다. 설치형 앱과 일반 브라우저에서 기록이 따로 보이면 각 환경에서 각각 백업하거나 삭제하세요.</p>
          </div>
          <div className="border border-red-200 bg-red-50/60 p-5">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-navy">
              <input type="checkbox" checked={rentalDeleteConfirmed} onChange={(event) => setRentalDeleteConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-red-700" />
              삭제 후 이 브라우저에서는 복구할 수 없음을 확인했습니다
            </label>
            <button type="button" disabled={!rentalDeleteConfirmed} onClick={deleteRentalDeviceData} className="mt-3 inline-flex min-h-12 w-full items-center justify-center bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Rental 로컬 기록 완전 삭제</button>
          </div>
        </div>
      </section>

      <section className="border-t border-navy/20 pt-8" aria-labelledby="pay-evidence-delete-heading">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <p className="font-mono text-sm text-gold">04</p>
            <h2 id="pay-evidence-delete-heading" className="mt-1 text-2xl font-semibold text-navy">공용 기기의 Pay Evidence 기록 삭제</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">급여기간, 근무시간, 확인한 시급, Payslip·입금 대조와 증빙 메모를 이 브라우저에서 삭제합니다. 구매 이용권·결제 증빙·서버 기록과 다른 기기의 데이터는 변경하지 않습니다.</p>
          </div>
          <div className="border border-red-200 bg-red-50/60 p-5">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-navy">
              <input type="checkbox" checked={payEvidenceDeleteConfirmed} onChange={(event) => setPayEvidenceDeleteConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-red-700" />
              삭제 후 이 브라우저에서는 복구할 수 없음을 확인했습니다
            </label>
            <button type="button" disabled={!payEvidenceDeleteConfirmed} onClick={deletePayEvidenceDeviceData} className="mt-3 inline-flex min-h-12 w-full items-center justify-center bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Pay Evidence 로컬 기록 완전 삭제</button>
          </div>
        </div>
      </section>

      <section className="border-t border-navy/20 pt-8" aria-labelledby="eofy-delete-heading">
        <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
          <div>
            <p className="font-mono text-sm text-gold">05</p>
            <h2 id="eofy-delete-heading" className="mt-1 text-2xl font-semibold text-navy">공용 기기의 EOFY 기록 삭제</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">소득 준비 상태, 공제 후보, 회계사 질문과 검토 확인을 이 브라우저에서 삭제합니다. 구매 이용권·결제 증빙·서버 기록과 다른 기기의 데이터는 변경하지 않습니다.</p>
          </div>
          <div className="border border-red-200 bg-red-50/60 p-5">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-navy">
              <input type="checkbox" checked={eofyDeleteConfirmed} onChange={(event) => setEofyDeleteConfirmed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-red-700" />
              삭제 후 이 브라우저에서는 복구할 수 없음을 확인했습니다
            </label>
            <button type="button" disabled={!eofyDeleteConfirmed} onClick={deleteEofyDeviceData} className="mt-3 inline-flex min-h-12 w-full items-center justify-center bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">EOFY 로컬 기록 완전 삭제</button>
          </div>
        </div>
      </section>

      {(message || error) && <div role="status" aria-live="polite" className={`border-l-4 p-5 text-sm leading-6 ${error ? "border-red-500 bg-red-50 text-red-800" : "border-gold bg-gold/10 text-navy"}`}>{error || message}{message && <Link href="/my-compass" className="ml-2 font-semibold underline underline-offset-4">나의 진행에서 확인 →</Link>}</div>}

      <section className="grid gap-5 border-t border-border pt-7 sm:grid-cols-3">
        {["기존 주소에서 백업 파일 받기", "새 주소 또는 새 기기에서 파일 선택", "나의 진행에서 기록 확인"].map((step, index) => <div key={step}><span className="font-mono text-xs text-gold">0{index + 1}</span><p className="mt-2 text-sm font-semibold leading-6 text-navy">{step}</p></div>)}
      </section>
    </div>
  );
}
