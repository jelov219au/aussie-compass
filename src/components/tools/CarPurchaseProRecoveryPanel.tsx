"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { createCarPurchaseRecoveryClient, type CarPurchaseRecoveryState } from "@/lib/carPurchaseProRecoveryClient";

export function CarPurchaseProRecoveryPanel({ enabled }: { enabled: boolean }) {
  const [code, setCode] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [state, setState] = useState<CarPurchaseRecoveryState>({ phase: "closed", operation: null,
    message: "복구·연결 관리 준비 상태를 확인합니다.", issuedCode: null, expiresAt: null, canRestore: false, canManage: false });
  const client = useRef<ReturnType<typeof createCarPurchaseRecoveryClient> | null>(null);
  useEffect(() => {
    let inFlight: AbortController | null = null;
    let canEnable = enabled;
    try {
      if (window.location.search || window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);
    } catch { canEnable = false; }
    const controller = createCarPurchaseRecoveryClient({
      enabled: canEnable,
      storage: { getItem: key => window.sessionStorage.getItem(key), setItem: (key, value) => window.sessionStorage.setItem(key, value), removeItem: key => window.sessionStorage.removeItem(key) },
      fingerprint: async value => {
        const bytes = new TextEncoder().encode("car-purchase-pro-restore-client-v1:" + value);
        const hash = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
      },
      createNonce: () => Array.from(window.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join(""),
      now: Date.now,
      send: async (operation, body) => {
        const endpoint = operation === "release" ? "/api/car-purchase-pro/access/release" : `/api/car-purchase-pro/${operation}`;
        const abort = new AbortController(); inFlight = abort;
        const timeout = window.setTimeout(() => abort.abort(), 15000);
        try {
          const response = await fetch(endpoint, { method: "POST", body,
            headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
            credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store", referrerPolicy: "no-referrer", signal: abort.signal });
          const value: unknown = await response.json();
          return { status: response.status, json: async () => value };
        } finally { window.clearTimeout(timeout); inFlight = null; }
      },
      navigate: path => window.location.replace(path),
      onState: next => { setState(next); if (next.phase === "restored" || next.phase === "released") setCode(""); },
    });
    client.current = controller;
    return () => { controller.dispose(); inFlight?.abort(); client.current = null; };
  }, [enabled]);
  function restore(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void client.current?.restore(code); }
  return <div className="mt-8 space-y-6">
    <p id="car-recovery-status" className="rounded-xl bg-surface p-4 text-sm leading-7 text-navy" role="status" aria-live="polite">{state.message}</p>
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6" aria-labelledby="car-restore-heading">
      <h2 id="car-restore-heading" className="text-lg font-semibold text-navy">보관한 코드로 복구</h2>
      <form action="/api/car-purchase-pro/restore" method="post" onSubmit={restore} className="mt-4">
        <label htmlFor="car-restore-code" className="text-sm font-semibold text-navy">복구 코드</label>
        <input id="car-restore-code" type="password" required maxLength={128} autoComplete="off" autoCapitalize="none" spellCheck={false}
          value={code} onChange={event => setCode(event.target.value)} disabled={!state.canRestore}
          aria-describedby="car-recovery-status car-restore-storage" className="mt-2 min-h-12 w-full rounded-lg border border-border bg-surface px-3 text-base text-navy" />
        <button type="submit" disabled={!state.canRestore || !code.trim()} aria-busy={state.operation === "restore"}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto">{state.operation === "restore" ? "복구 확인 중…" : "재결제 없이 복구 확인"}</button>
      </form>
      <p id="car-restore-storage" className="mt-3 text-xs leading-6 text-muted">원문 코드는 자동 저장하지 않습니다. 재시도할 때는 같은 코드와 같은 탭을 사용해 주세요. 다른 브라우저·설치형 앱과 자동 동기화되지 않습니다.</p>
    </section>
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6" aria-labelledby="car-code-heading">
      <h2 id="car-code-heading" className="text-lg font-semibold text-navy">현재 연결의 복구 코드 받기</h2>
      <p className="mt-3 text-sm leading-7 text-muted">이미 이용권이 연결된 브라우저에서 요청할 수 있습니다. 발급된 코드는 직접 안전하게 보관해 주세요.</p>
      <button type="button" onClick={() => void client.current?.issueCode()} disabled={!state.canManage || !!state.issuedCode} aria-busy={state.operation === "restore-code"}
        className="mt-4 inline-flex min-h-12 items-center rounded-lg border border-navy px-5 py-3 text-sm font-semibold text-navy disabled:opacity-50">복구 코드 발급 요청</button>
      {state.issuedCode && <div className="mt-4 rounded-xl bg-surface p-4">
        <p className="text-sm font-semibold text-navy">발급된 복구 코드</p>
        <code className="mt-2 block select-all break-all text-base text-navy">{state.issuedCode}</code>
        <p className="mt-2 text-xs leading-6 text-muted">만료: {state.expiresAt ? new Date(state.expiresAt).toLocaleString("ko-KR") : ""}. 화면을 닫기 전에 보관해 주세요.</p>
        <button type="button" onClick={() => client.current?.hideCode()} disabled={state.phase === "working"} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline">보관 후 화면에서 숨기기</button>
      </div>}
    </section>
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6" aria-labelledby="car-release-heading">
      <h2 id="car-release-heading" className="text-lg font-semibold text-navy">이 브라우저 연결 해제</h2>
      <p className="mt-3 text-sm leading-7 text-muted">구매 취소나 환불 요청이 아닙니다. 서버가 해제를 확인하기 전에는 완료로 표시하지 않습니다.</p>
      <label className="mt-4 flex min-h-12 items-start gap-3 py-3 text-sm leading-6 text-navy">
        <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} disabled={!state.canManage} className="mt-1 h-5 w-5 shrink-0" />
        복구 코드가 필요하면 먼저 보관했으며, 이 브라우저의 연결을 해제한다는 것을 확인했습니다.
      </label>
      <button type="button" onClick={() => void client.current?.release(confirmed)} disabled={!state.canManage || !confirmed} aria-busy={state.operation === "release"}
        className="mt-3 inline-flex min-h-12 items-center rounded-lg border border-red-800 px-5 py-3 text-sm font-semibold text-red-800 disabled:opacity-50">{state.operation === "release" ? "해제 확인 중…" : "이 브라우저 연결 해제"}</button>
    </section>
    <noscript><p className="text-sm leading-7 text-red-800">연결 요청에는 JavaScript가 필요합니다. 새로 결제하지 말고 고객지원을 이용해 주세요.</p></noscript>
  </div>;
}
