"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { deviceTransferManifest } from "@/data/deviceTransferManifest";
import {
  applyDeviceImport,
  clearDeviceRecord,
  createDeviceBackup,
  deviceBackupMaxBytes,
  prepareDeviceImport,
  validateDeviceBackupText,
  type DeviceBackupIssue,
  type DeviceBackupValidation,
  type DeviceImportMode,
  type DeviceImportPlan,
  type DeviceTransferRecord,
  type ValidatedDeviceBackup,
} from "@/lib/deviceDataTransfer";
import { clearRentalApplicationProDeviceData } from "@/lib/rentalApplicationProDeviceStorage";

const storedRecords = deviceTransferManifest;
const carDeviceRecord = storedRecords.find((record) => record.toolId === "car-purchase-pro")!;
const payEvidenceRecord = storedRecords.find((record) => record.toolId === "pay-evidence-pro")!;
const eofyRecord = storedRecords.find((record) => record.toolId === "eofy-pro")!;
const leavingRecord = storedRecords.find((record) => record.toolId === "leaving-australia-pro")!;

type BackupResult = "not_started" | "ready" | "download_requested_unverified" | "fallback_copy_required" | "blocked_read" | "blocked_oversize" | "failed";
type PreviewResult = "not_started" | "valid_new_only" | "valid_with_conflicts" | "valid_no_operations" | "unsupported_version" | "wrong_product" | "invalid_origin" | "corrupt_or_tampered" | "oversize" | "unreadable";
type TransferOutcome = {
  selected_tool_scope: "none" | "one_tool" | "selected_tools" | "all_available" | "unsupported_scope";
  sensitivity_reviewed: "not_reviewed" | "routine_only" | "personal_or_financial" | "mixed" | "unknown";
  backup_export_result: BackupResult;
  import_preview_result: PreviewResult;
  conflict_decision: "preserve_existing" | "replace_after_current_backup" | "cancel" | "not_applicable";
  recovery_fallback: "keep_source_records" | "export_current_before_replace" | "retry_after_storage_check" | "rollback_verified" | "rollback_unverified_manual_review" | "use_tool_native_archive" | "no_safe_fallback";
  next_action: "select_minimum_tools" | "review_plaintext_risk" | "verify_downloaded_file" | "choose_original_backup" | "inspect_validated_preview" | "export_current_then_replace" | "apply_preserving_existing" | "open_destination_tools_and_verify" | "keep_source_and_retry" | "review_possible_partial_state" | "delete_only_verified_extra_copies";
};

const issueLabels: Record<DeviceBackupIssue["reason"], string> = {
  unknown_tool: "지원 목록에 없는 도구",
  metadata_mismatch: "도구·스키마 정보 불일치",
  checksum_mismatch: "파일 손상 가능성",
  invalid_inner_schema: "도구 기록 형식 오류",
  entry_oversize: "도구 기록 크기 초과",
};

function requestDownload(contents: string) {
  let url = "";
  try {
    const now = new Date();
    const localDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
    const localTime = [now.getHours(), now.getMinutes(), now.getSeconds()].map((part) => String(part).padStart(2, "0")).join("");
    url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hoju-compass-device-backup-v2-${localDate}-${localTime}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => { try { URL.revokeObjectURL(url); } catch {} }, 30_000);
    return true;
  } catch {
    if (url) try { URL.revokeObjectURL(url); } catch {}
    return false;
  }
}

function validationMessage(kind: Exclude<DeviceBackupValidation["kind"], "ready" | "invalid_entries">) {
  return {
    wrong_product: "다른 제품의 파일입니다. Hoju Compass 기기 백업 원본을 선택하세요.",
    unsupported_version: "지원하지 않는 백업 버전입니다. 원본 기기에서 새 백업을 받으세요.",
    invalid_origin: "공식 Hoju Compass 운영 주소에서 만든 백업이 아닙니다. 파일을 적용하지 않았습니다.",
    corrupt_or_tampered: "파일이 손상됐거나 내용이 바뀌었습니다. 원본 백업을 다시 선택하세요.",
    oversize: "백업 파일이 2MB를 넘습니다. 항목을 나눠 다시 백업하세요.",
    unreadable: "파일을 읽을 수 없습니다. 원본 JSON 백업을 다시 선택하세요.",
  }[kind];
}

export function DeviceDataTransfer() {
  const [available, setAvailable] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [host, setHost] = useState("");
  const [mode, setMode] = useState<DeviceImportMode>("preserve");
  const [plaintextReviewed, setPlaintextReviewed] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [exportFallback, setExportFallback] = useState("");
  const [backupResult, setBackupResult] = useState<BackupResult>("not_started");
  const [previewResult, setPreviewResult] = useState<PreviewResult>("not_started");
  const [blockedValidation, setBlockedValidation] = useState<{ backup: ValidatedDeviceBackup; issues: DeviceBackupIssue[] } | null>(null);
  const [importPreview, setImportPreview] = useState<DeviceImportPlan | null>(null);
  const [importConfirmed, setImportConfirmed] = useState(false);
  const [replacePlaintextReviewed, setReplacePlaintextReviewed] = useState(false);
  const [replaceConfirmed, setReplaceConfirmed] = useState(false);
  const [replaceBackupToken, setReplaceBackupToken] = useState("");
  const [destinationHrefs, setDestinationHrefs] = useState<string[]>([]);
  const [downloadListChecked, setDownloadListChecked] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState<Record<string, boolean>>({});
  const [rollbackState, setRollbackState] = useState<"none" | "verified" | "unverified">("none");
  const importGenerationRef = useRef(0);

  const refresh = () => {
    const saved = storedRecords.filter((record) => {
      try { return localStorage.getItem(record.key) !== null; }
      catch { return false; }
    }).map((record) => record.key);
    setAvailable(saved);
    setSelected((current) => current.filter((key) => saved.includes(key)));
  };

  useEffect(() => { setHost(window.location.hostname); refresh(); }, []);

  const selectedRecords = useMemo(() => storedRecords.filter((record) => selected.includes(record.key)), [selected]);
  const hasSensitiveSelection = selectedRecords.some((record) => record.sensitive);
  const hasRoutineSelection = selectedRecords.some((record) => !record.sensitive);
  const legacyHost = host === "aussie-compass.vercel.app";

  const outcome: TransferOutcome = useMemo(() => {
    const selectedScope = selected.length === 0 ? "none" : selected.length === 1 ? "one_tool" : selected.length === available.length ? "all_available" : "selected_tools";
    const sensitivity = !plaintextReviewed ? "not_reviewed" : hasSensitiveSelection && hasRoutineSelection ? "mixed" : hasSensitiveSelection ? "personal_or_financial" : "routine_only";
    const conflicts = importPreview?.replacedLabels.length ?? 0;
    const conflict = !importPreview ? "not_applicable" : mode === "preserve" ? "preserve_existing" : replaceBackupToken === importPreview.replaceBackupToken && conflicts ? "replace_after_current_backup" : "cancel";
    const recovery = rollbackState === "unverified" ? "rollback_unverified_manual_review" : rollbackState === "verified" ? "rollback_verified" : conflicts && mode === "overwrite" && replaceBackupToken !== importPreview?.replaceBackupToken ? "export_current_before_replace" : error ? "retry_after_storage_check" : "keep_source_records";
    let next: TransferOutcome["next_action"] = "select_minimum_tools";
    if (rollbackState === "unverified") next = "review_possible_partial_state";
    else if (destinationHrefs.length) next = "open_destination_tools_and_verify";
    else if (blockedValidation) next = "inspect_validated_preview";
    else if (importPreview && mode === "overwrite" && conflicts && replaceBackupToken !== importPreview.replaceBackupToken) next = "export_current_then_replace";
    else if (importPreview && mode === "preserve" && importPreview.operations.length) next = "apply_preserving_existing";
    else if (backupResult === "download_requested_unverified" && !downloadListChecked) next = "verify_downloaded_file";
    else if (selected.length && !plaintextReviewed) next = "review_plaintext_risk";
    else if (error) next = "keep_source_and_retry";
    return { selected_tool_scope: selectedScope, sensitivity_reviewed: sensitivity, backup_export_result: backupResult, import_preview_result: previewResult, conflict_decision: conflict, recovery_fallback: recovery, next_action: next };
  }, [available.length, backupResult, blockedValidation, destinationHrefs.length, downloadListChecked, error, hasRoutineSelection, hasSensitiveSelection, importPreview, mode, plaintextReviewed, previewResult, replaceBackupToken, rollbackState, selected.length]);

  const toggle = (key: string) => {
    setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
    setPlaintextReviewed(false); setBackupResult("not_started"); setDownloadListChecked(false);
  };

  const exportRecords = async (records: DeviceTransferRecord[], replacementToken = "") => {
    setError(""); setMessage(""); setExportFallback(""); setBackupResult("ready");
    const result = await createDeviceBackup(window.localStorage, records, window.location.origin);
    if (result.kind === "read_error") { setBackupResult("blocked_read"); setError(`선택한 기록을 읽지 못했습니다: ${result.failedLabels.join(" · ")}. 원본 기록을 유지하고 저장공간을 확인하세요.`); return; }
    if (result.kind === "invalid_record") { setBackupResult("failed"); setError(`현재 기록의 도구별 형식을 확인하지 못했습니다: ${result.invalidLabels.join(" · ")}. 해당 도구에서 기록을 확인하세요.`); return; }
    if (result.kind === "empty") { setBackupResult("failed"); setError("내보낼 기록을 하나 이상 선택하세요."); return; }
    if (result.kind === "invalid_origin") { setBackupResult("failed"); setError("공식 Hoju Compass 운영 주소에서만 백업을 만들 수 있습니다."); return; }
    if (result.kind === "serialise_error") { setBackupResult("failed"); setError("백업 JSON을 만들지 못했습니다. 원본 기록을 유지하고 다시 시도하세요."); return; }
    if (result.kind === "too_large") { setBackupResult("blocked_oversize"); setError(`백업이 ${(result.bytes / 1024 / 1024).toFixed(2)}MB여서 2MB 한도를 넘습니다. 항목을 나눠 선택하세요.`); return; }
    if (!requestDownload(result.json)) { setExportFallback(result.json); setBackupResult("fallback_copy_required"); setError("다운로드 요청을 시작하지 못했습니다. 아래 전체 JSON을 개인 기기의 파일로 직접 저장하세요."); return; }
    setBackupResult("download_requested_unverified"); setDownloadListChecked(false);
    if (replacementToken) setReplaceBackupToken(replacementToken);
    setMessage(`${result.count}개 기록의 다운로드를 요청했습니다. 저장 완료로 단정하지 않으므로 브라우저 다운로드 목록에서 파일 이름과 크기를 직접 확인하세요.`);
  };

  const exportBackup = () => {
    if (!plaintextReviewed) { setError("평문 JSON의 보관 위험을 확인한 뒤 백업을 요청하세요."); return; }
    void exportRecords(selectedRecords);
  };

  const buildPreview = (backup: ValidatedDeviceBackup) => {
    const prepared = prepareDeviceImport(window.localStorage, backup, mode);
    if (prepared.kind !== "ready") { setError(prepared.kind === "read_error" ? `현재 기록을 읽지 못했습니다: ${prepared.failedLabels.join(" · ")}. 어떤 기록도 변경하지 않았습니다.` : "검증된 백업 계획을 만들지 못했습니다."); setPreviewResult("unreadable"); return; }
    setImportPreview(prepared.plan); setBlockedValidation(null); setImportConfirmed(false); setReplacePlaintextReviewed(false); setReplaceConfirmed(false); setReplaceBackupToken("");
    setPreviewResult(prepared.plan.operations.length === 0 ? "valid_no_operations" : prepared.plan.replacedLabels.length ? "valid_with_conflicts" : "valid_new_only");
  };

  const importBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const generation = ++importGenerationRef.current;
    setError(""); setMessage(""); setImportPreview(null); setBlockedValidation(null); setDestinationHrefs([]); setPreviewResult("not_started");
    if (file.size > deviceBackupMaxBytes) { setPreviewResult("oversize"); setError(validationMessage("oversize")); return; }
    let text: string;
    try { text = await file.text(); } catch { setPreviewResult("unreadable"); setError(validationMessage("unreadable")); return; }
    if (generation !== importGenerationRef.current) return;
    const validation = await validateDeviceBackupText(text, storedRecords);
    if (generation !== importGenerationRef.current) return;
    if (validation.kind === "invalid_entries") {
      setBlockedValidation({ backup: validation.backup, issues: validation.issues }); setPreviewResult("corrupt_or_tampered");
      setError("일부 도구 기록이 검증을 통과하지 못했습니다. 기본값은 전체 no-write입니다. 문제 항목을 제외한 뒤 새 미리보기를 만드세요."); return;
    }
    if (validation.kind !== "ready") { setPreviewResult(validation.kind); setError(validationMessage(validation.kind)); return; }
    buildPreview(validation.backup);
  };

  const exportCurrentBeforeReplace = () => {
    if (!importPreview?.replacedLabels.length || !replacePlaintextReviewed) { setError("교체 대상의 평문 백업 위험을 다시 확인하세요."); return; }
    const keys = importPreview.replaceBackupToken.split("|");
    void exportRecords(storedRecords.filter((record) => keys.includes(record.key)), importPreview.replaceBackupToken);
  };

  const applyImport = () => {
    if (!importPreview || !importConfirmed) return;
    setError(""); setMessage(""); setRollbackState("none");
    const result = applyDeviceImport(window.localStorage, importPreview, { currentBackupToken: replaceBackupToken, plaintextReviewed: replacePlaintextReviewed, replaceConfirmed });
    if (result.kind === "blocked_replace_backup") { setError("교체 대상의 현재 백업 다운로드 요청과 평문·전체 교체 확인을 먼저 완료하세요."); return; }
    if (result.kind === "success") {
      refresh(); window.dispatchEvent(new Event("storage")); setDestinationHrefs(result.hrefs);
      setMessage(`${result.imported}개 기록을 이 브라우저 저장소에 기록했습니다.${result.preserved ? ` 기존 도구 ${result.preserved}개는 전체 유지했습니다.` : ""} 각 도구에서 실제 값이 열리는지 확인할 때까지 원본 기기와 백업 파일을 유지하세요.`);
      setImportPreview(null); setImportConfirmed(false); return;
    }
    if (result.kind === "rolled_back") { setRollbackState("verified"); setError("가져오기에 실패해 이번 시도 전 기록으로 되돌렸습니다. 원본을 유지하고 저장공간을 확인한 뒤 다시 시도하세요."); return; }
    setRollbackState("unverified"); setError(`일부 되돌리기를 확인하지 못했습니다: ${result.rollbackLabels.join(" · ")}. 추가 가져오기·삭제를 멈추고 해당 도구만 확인하세요.`);
  };

  const deleteOne = (record: DeviceTransferRecord) => {
    setError(""); setMessage("");
    const result = clearDeviceRecord(window.localStorage, record);
    if (result.kind === "read_error" || result.kind === "delete_failed") { setError(`${record.label} 기록을 삭제하고 확인하지 못했습니다. 저장공간 설정을 확인하세요.`); return; }
    setDeleteConfirmed((current) => ({ ...current, [record.toolId]: false })); refresh();
    if (result.kind === "removed") window.dispatchEvent(new Event("storage"));
    setMessage(result.kind === "removed" ? `이 브라우저의 ${record.label} 기록을 삭제했습니다.` : `이 브라우저에 남은 ${record.label} 기록이 없습니다.`);
  };

  const deleteRental = () => {
    setError(""); setMessage(""); const result = clearRentalApplicationProDeviceData(window.localStorage); refresh();
    if (result.failedKeys.length) { setError("일부 Rental 기록을 삭제하고 확인하지 못했습니다."); return; }
    setDeleteConfirmed((current) => ({ ...current, rental: false })); window.dispatchEvent(new Event("storage"));
    setMessage(result.removedKeys.length ? `이 브라우저의 Rental 로컬 기록 ${result.removedKeys.length}개를 삭제했습니다.` : "이 브라우저에 남은 Rental 로컬 기록이 없습니다.");
  };

  const deletePanels = [
    { id: "car-purchase-pro", title: "중고차 구매 점검 기록", detail: "Car workspace의 재사용 초안", action: () => deleteOne(carDeviceRecord) },
    { id: "rental", title: "Rental 기록", detail: "집 방문 점검과 Rental workspace의 로컬 기록", action: deleteRental },
    { id: "pay-evidence-pro", title: "Pay Evidence 기록", detail: "급여기간·근무시간·증빙 메모", action: () => deleteOne(payEvidenceRecord) },
    { id: "eofy-pro", title: "EOFY 기록", detail: "소득 준비·공제 후보·질문", action: () => deleteOne(eofyRecord) },
    { id: "leaving-australia-pro", title: "출국 준비 기록", detail: "작업·정산·확인 질문", action: () => deleteOne(leavingRecord) },
  ];

  return <div className="mt-8 space-y-8">
    <section className="rounded-2xl border-2 border-navy bg-white p-5 shadow-sm sm:p-7" aria-labelledby="transfer-next-action-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-navy">One backup · one restore</p>
      <h2 id="transfer-next-action-heading" className="mt-2 text-2xl font-semibold text-navy">다음 한 단계 · {outcome.next_action}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">선택 범위를 최소화하고, 평문 파일과 검증 결과를 확인한 뒤 한 단계만 진행하세요. 이 결과는 화면 메모리에만 있고 저장·전송하지 않습니다.</p>
      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">{Object.entries(outcome).map(([key, value]) => <div key={key} className="rounded-lg bg-surface p-3"><dt className="font-mono text-xs text-muted">{key}</dt><dd className="mt-1 font-semibold text-navy">{value}</dd></div>)}</dl>
      <nav className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="백업·복원 빠른 시작"><a href="#export-heading" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">백업 만들기</a><a href="#import-heading" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy px-4 text-sm font-semibold text-navy">백업 불러오기</a><Link href="/payment-help" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-navy">이용권 복구</Link></nav>
    </section>

    <section className="rounded-xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="transfer-order-heading"><h2 id="transfer-order-heading" className="text-xl font-semibold text-navy">기기·브라우저를 바꾸기 전 3단계</h2><ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted"><li>필요한 도구만 선택해 평문 JSON 백업 다운로드를 요청합니다.</li><li>새 환경에서 파일 전체를 도구별로 검증하고, 기본값인 기존 도구 전체 유지를 먼저 사용합니다.</li><li>대상 도구에서 실제 값을 확인할 때까지 원본 브라우저와 백업 파일을 유지합니다.</li></ol><p className="mt-4 text-sm leading-7 text-navy">브라우저·프로필·설치형 앱의 저장소와 JSON 파일은 서로 다른 사본입니다. 구매 이용권과 복구 코드는 백업에 포함되지 않습니다.</p></section>

    <section className="grid gap-6 border-y border-navy/20 py-7 lg:grid-cols-[1fr_18rem] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-navy">Current browser</p><h2 className="mt-2 text-2xl font-semibold text-navy">이 브라우저에서 {available.length}개의 기록을 찾았습니다.</h2><p className="mt-2 text-sm leading-6 text-muted">첫 진입 선택은 0개입니다. 필요한 최소 도구만 직접 선택하세요.</p></div><div className={`border-l-2 px-4 py-2 text-sm leading-6 ${legacyHost ? "border-gold bg-gold/10 text-navy" : "border-navy/25 text-muted"}`}><strong className="block text-navy">{legacyHost ? "기존 공식 주소" : host || "현재 주소 확인 중"}</strong>{legacyHost ? "백업을 받은 뒤 새 공식 주소에서 불러오세요." : "같은 브라우저 프로필의 기록만 표시합니다."}</div></section>

    <section className="grid gap-8 lg:grid-cols-[1fr_20rem]" aria-labelledby="export-heading"><div><div className="flex flex-wrap items-end justify-between gap-4 border-b border-navy/20 pb-4"><div><p className="font-mono text-sm text-navy">01</p><h2 id="export-heading" className="mt-1 text-2xl font-semibold text-navy">기록 백업하기</h2></div>{available.length > 0 && <button type="button" onClick={() => { setSelected(selected.length === available.length ? [] : available); setPlaintextReviewed(false); setBackupResult("not_started"); }} className="min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy">{selected.length === available.length ? "선택 해제" : "모두 선택"}</button>}</div>{available.length ? <ul className="grid gap-x-6 sm:grid-cols-2">{storedRecords.filter((record) => available.includes(record.key)).map((record) => <li key={record.key} className="border-b border-border"><label className="flex min-h-20 cursor-pointer items-center gap-3 py-3"><input type="checkbox" checked={selected.includes(record.key)} onChange={() => toggle(record.key)} className="h-5 w-5 shrink-0 accent-[var(--color-gold)]"/><span><strong className="block text-sm text-navy">{record.label}</strong><span className="mt-1 block text-xs text-muted">{record.group}{record.sensitive ? " · 개인 내용 포함 가능" : " · 일반 진행 기록"} · schema {record.schemaVersion}</span></span></label></li>)}</ul> : <div className="border-b border-border py-10"><p className="font-semibold text-navy">아직 저장된 기록이 없습니다.</p><p className="mt-2 text-sm leading-6 text-muted">아래 불러오기로 이동하거나 도구를 사용한 뒤 다시 확인하세요.</p></div>}</div><aside className="h-fit bg-navy p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Plaintext JSON</p><p className="mt-3 text-lg font-semibold">선택한 {selected.length}개 기록</p><p className="mt-3 text-sm leading-6 text-white/70">이름·연락처·급여·예산·날짜·메모가 평문으로 들어갈 수 있습니다. 공용 기기·메신저·이메일·자동 cloud sync 위치를 피하세요.</p><label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6"><input type="checkbox" checked={plaintextReviewed} onChange={(event) => setPlaintextReviewed(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]"/>개인 기기의 보호된 위치에 보관할 것을 확인했습니다</label><button type="button" disabled={!selected.length || !plaintextReviewed} onClick={exportBackup} className="mt-4 inline-flex min-h-12 w-full items-center justify-center bg-gold px-4 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-40">백업 다운로드 요청</button>{backupResult === "download_requested_unverified" && <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-xs leading-5"><input type="checkbox" checked={downloadListChecked} onChange={(event) => setDownloadListChecked(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-gold)]"/>다운로드 목록에서 파일 이름과 크기를 직접 확인했습니다</label>}</aside></section>
    {exportFallback && <label className="block border border-gold bg-gold/5 p-5"><span className="text-sm font-semibold text-navy">전체 백업 JSON · 직접 저장 필요</span><textarea value={exportFallback} readOnly rows={10} onFocus={(event) => event.currentTarget.select()} className="mt-3 w-full resize-y border border-border bg-white p-3 font-mono text-xs leading-5 text-navy" /></label>}

    <section className="scroll-mt-24 border-t border-navy/20 pt-8" aria-labelledby="import-heading" id="import-heading-section"><div className="grid gap-8 lg:grid-cols-[1fr_20rem]"><div><p className="font-mono text-sm text-navy">02</p><h2 id="import-heading" className="mt-1 text-2xl font-semibold text-navy">백업 불러오기</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-muted">파일을 적용하기 전에 공식 출처, outer version, 도구 ID·label·schema·parser, UTF-8 크기와 SHA-256 손상 검사를 모두 수행합니다.</p><fieldset className="mt-5"><legend className="text-sm font-semibold text-navy">같은 도구 기록이 이미 있을 때</legend><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className={`flex min-h-20 cursor-pointer items-start border p-4 ${mode === "preserve" ? "border-navy bg-surface" : "border-border"}`}><input type="radio" name="import-mode" checked={mode === "preserve"} onChange={() => { setMode("preserve"); setImportPreview(null); }} className="mt-1 mr-3"/><span><strong className="text-sm text-navy">기존 도구 전체 유지</strong><span className="mt-1 block text-xs leading-5 text-muted">storage key가 있으면 그 도구 백업 전체를 건너뜁니다. field merge가 아닙니다.</span></span></label><label className={`flex min-h-20 cursor-pointer items-start border p-4 ${mode === "overwrite" ? "border-red-500 bg-red-50" : "border-border"}`}><input type="radio" name="import-mode" checked={mode === "overwrite"} onChange={() => { setMode("overwrite"); setImportPreview(null); }} className="mt-1 mr-3"/><span><strong className="text-sm text-navy">현재 도구 전체 교체</strong><span className="mt-1 block text-xs leading-5 text-muted">교체 대상 현재 백업 다운로드 요청과 추가 확인이 필요합니다.</span></span></label></div></fieldset></div><div className="h-fit border border-border bg-white p-6"><label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center bg-navy px-4 text-sm font-semibold text-white"><input type="file" accept="application/json,.json" onChange={importBackup} className="sr-only"/>JSON 백업 선택하기</label><p className="mt-3 text-center text-xs leading-5 text-muted">최대 2MB · 검증 전 write 0</p></div></div>
      {blockedValidation && <div className="mt-6 border border-red-300 bg-red-50 p-5"><h3 className="font-semibold text-red-900">검증 실패 · 기본 no-write</h3><ul className="mt-3 space-y-2 text-sm text-red-900">{blockedValidation.issues.map((issue, index) => <li key={`${issue.toolId}-${index}`}>{issue.label}: {issueLabels[issue.reason]}</li>)}</ul><button type="button" disabled={!blockedValidation.backup.entries.length} onClick={() => buildPreview(blockedValidation.backup)} className="mt-4 min-h-12 rounded-lg bg-navy px-5 text-sm font-semibold text-white disabled:opacity-40">문제 항목 제외하고 새 미리보기</button></div>}
      {importPreview && <div className="mt-6 border border-gold bg-gold/5 p-5" aria-labelledby="import-preview-heading"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy">검증된 적용 미리보기</p><h3 id="import-preview-heading" className="mt-2 text-lg font-semibold text-navy">공식 출처 · outer v{importPreview.outerVersion}{importPreview.migration === "legacy_outer_v1" ? " · legacy 검증 후 migration" : " · manifest v1"}</h3><div className="mt-4 grid gap-4 text-sm leading-6 sm:grid-cols-3"><div><strong className="text-navy">새로 기록 {importPreview.importedLabels.length}개</strong><p className="mt-1 text-muted">{importPreview.importedLabels.join(" · ") || "없음"}</p></div><div><strong className="text-navy">전체 교체 {importPreview.replacedLabels.length}개</strong><p className="mt-1 text-muted">{importPreview.replacedLabels.join(" · ") || "없음"}</p></div><div><strong className="text-navy">전체 유지 {importPreview.preservedLabels.length}개</strong><p className="mt-1 text-muted">{importPreview.preservedLabels.join(" · ") || "없음"}</p></div></div>{mode === "overwrite" && importPreview.replacedLabels.length > 0 && <div className="mt-5 border border-red-300 bg-white p-4"><p className="text-sm font-semibold text-red-800">replace 방어: 현재 도구 전체를 먼저 백업하세요.</p><label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-navy"><input type="checkbox" checked={replacePlaintextReviewed} onChange={(event) => setReplacePlaintextReviewed(event.target.checked)} className="mt-1 h-5 w-5"/>현재 기록도 평문 JSON으로 내려받아 별도 보관됨을 확인했습니다</label><button type="button" disabled={!replacePlaintextReviewed || replaceBackupToken === importPreview.replaceBackupToken} onClick={exportCurrentBeforeReplace} className="mt-3 min-h-12 rounded-lg border border-navy px-5 text-sm font-semibold text-navy disabled:opacity-40">교체 대상 현재 백업 다운로드 요청</button><label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-navy"><input type="checkbox" checked={replaceConfirmed} onChange={(event) => setReplaceConfirmed(event.target.checked)} className="mt-1 h-5 w-5"/>merge가 아니라 표시된 도구의 storage key 전체 교체임을 다시 확인했습니다</label></div>}<label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-navy"><input type="checkbox" checked={importConfirmed} onChange={(event) => setImportConfirmed(event.target.checked)} className="mt-1 h-5 w-5"/>새로 기록·전체 유지·전체 교체 목록을 확인했습니다</label><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={!importConfirmed || importPreview.operations.length === 0 || (mode === "overwrite" && importPreview.replacedLabels.length > 0 && (replaceBackupToken !== importPreview.replaceBackupToken || !replacePlaintextReviewed || !replaceConfirmed))} onClick={applyImport} className="min-h-12 rounded-lg bg-navy px-5 text-sm font-semibold text-white disabled:opacity-40">검증된 계획 적용</button><button type="button" onClick={() => { importGenerationRef.current += 1; setImportPreview(null); setImportConfirmed(false); setPreviewResult("not_started"); }} className="min-h-12 rounded-lg border border-border px-5 text-sm font-semibold text-muted">취소 · 현재 기록 유지</button></div></div>}
    </section>

    {(message || error) && <div role="status" aria-live="polite" className={`border-l-4 p-5 text-sm leading-6 ${error ? "border-red-500 bg-red-50 text-red-800" : "border-gold bg-gold/10 text-navy"}`}>{error || message}</div>}
    {destinationHrefs.length > 0 && <section className="border border-navy/20 bg-white p-5"><h2 className="text-lg font-semibold text-navy">대상 도구에서 값 확인</h2><div className="mt-3 flex flex-wrap gap-2">{destinationHrefs.map((href) => <Link key={href} href={href} className="inline-flex min-h-11 items-center rounded-lg border border-navy px-4 text-sm font-semibold text-navy">{href} 열기</Link>)}</div><p className="mt-3 text-sm leading-6 text-muted">모두 확인하기 전에는 원본 브라우저와 백업 파일을 삭제하지 마세요.</p></section>}

    <section className="border-t border-border pt-8" aria-labelledby="device-delete-heading"><h2 id="device-delete-heading" className="text-2xl font-semibold text-navy">공용 기기의 기존 전용 삭제</h2><p className="mt-2 text-sm leading-6 text-muted">34개 전체 reset과 crash recovery journal은 Phase 1 후속입니다. 여기서는 기존 5개 전용 삭제 범위만 유지합니다.</p><div className="mt-5 space-y-5">{deletePanels.map((panel) => <article key={panel.id} className="grid gap-4 border border-border p-5 lg:grid-cols-[1fr_20rem] lg:items-start"><div><h3 className="font-semibold text-navy">{panel.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{panel.detail}만 이 브라우저에서 삭제합니다. 다른 브라우저·PWA·기기·백업 파일·구매 이용권·서버 기록은 바뀌지 않습니다.</p></div><div className="bg-red-50 p-4"><label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6 text-navy"><input type="checkbox" checked={Boolean(deleteConfirmed[panel.id])} onChange={(event) => setDeleteConfirmed((current) => ({ ...current, [panel.id]: event.target.checked }))} className="mt-1 h-5 w-5"/>이 브라우저의 표시된 기록만 삭제함을 확인했습니다</label><button type="button" disabled={!deleteConfirmed[panel.id]} onClick={panel.action} className="mt-3 min-h-12 w-full bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-40">{panel.title} 삭제</button></div></article>)}</div></section>
  </div>;
}
