"use client";
import { useState } from "react";

export function TaxStorageNotice({ storageKey, storage, saveState }: { storageKey: string; storage: "loading" | "ready" | "blocked"; saveState: string }) {
  const [raw, setRaw] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  function showRaw() {
    try { const saved = localStorage.getItem(storageKey); setRaw(saved); setMessage(saved === null ? "현재 읽을 수 있는 저장 원문이 없습니다." : "아래 원문을 선택해 텍스트 파일로 따로 보관하세요. 원문은 수정하지 않았습니다."); }
    catch { setMessage("저장소를 읽지 못했습니다. 브라우저의 저장 권한을 확인하세요. 현재 화면 내용도 따로 보관하세요."); }
  }
  return <div className="mt-4 text-sm leading-6">
    <p role="status" className="font-medium text-navy">{saveState}</p>
    {storage === "blocked" && <div className="mt-2 rounded-lg bg-amber-50 p-4 text-amber-950"><p>기존 저장본을 읽거나 확인하지 못해 자동 저장을 중지했습니다. 기존 원문을 수정하지 않았습니다. 화면에서 추가·삭제한 내용은 저장되지 않으므로 따로 보관하세요. 원문을 백업한 뒤 신뢰할 수 있는 기존 자료와 대조하세요. 이 화면은 손상 자료를 자동 복구하지 않습니다.</p><button type="button" onClick={showRaw} className="mt-2 min-h-11 rounded-lg border border-amber-700 px-3 font-semibold">기존 저장 원문 보기</button></div>}
    {message && <p role="status" className="mt-2 text-muted">{message}</p>}
    {raw !== null && <label className="mt-2 block text-navy">따로 보관할 저장 원문<textarea readOnly value={raw} onFocus={e => e.target.select()} rows={5} className="mt-2 w-full rounded-lg border border-border bg-white p-3 font-mono text-xs" /></label>}
  </div>;
}
