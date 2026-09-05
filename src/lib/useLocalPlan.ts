"use client";
import { useEffect, useState, type SetStateAction } from "react";
const blockedMessage = "저장본 확인 실패 · 자동 저장 중지";

// Only complete, valid numeric plans replace the existing v1 record. Invalid
// drafts remain on screen; unreadable records never get overwritten implicitly.
export function useLocalPlan<T>(key: string, initial: T, parse: (raw: string) => T | null, serialize: (data: T) => string | null, labels?: { initial: string; reset: string }) {
  const [data, setData] = useState<T>(initial);
  const [storage, setStorage] = useState<"loading" | "ready" | "blocked">("loading");
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState(labels?.initial ?? "예시 · 아직 저장하지 않음");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const restored = parse(raw);
        if (restored === null) { setStorage("blocked"); setSaveState(blockedMessage); return; }
        setData(restored); setSaveState("저장본 불러옴");
      }
      setStorage("ready");
    } catch { setStorage("blocked"); setSaveState(blockedMessage); }
  }, [key, parse]);
  useEffect(() => {
    if (storage !== "ready" || !dirty) return;
    const raw = serialize(data);
    if (raw === null) { setSaveState("입력 미완료 · 저장 보류"); return; }
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(key, raw); setSaveState("저장됨"); }
      catch { setSaveState("저장 실패 · 화면 내용을 따로 보관하세요"); }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [data, dirty, key, serialize, storage]);
  const update = (next: SetStateAction<T>) => { setData(next); setDirty(true); setSaveState(storage === "blocked" ? blockedMessage : "변경 내용 저장 대기"); };
  const reset = () => {
    try { localStorage.removeItem(key); setData(initial); setDirty(false); setStorage("ready"); setSaveState(labels?.reset ?? "예시로 초기화 · 아직 저장하지 않음"); return true; }
    catch { setSaveState("초기화 실패 · 기존 저장본을 유지합니다"); return false; }
  };
  return { data, update, reset, storage, saveState };
}
