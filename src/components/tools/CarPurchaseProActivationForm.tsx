"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { createCarPurchaseActivationClient, type CarPurchaseActivationState } from "@/lib/carPurchaseProActivationClient";

export function CarPurchaseProActivationForm({ initialSessionId, invalidReference, enabled }: {
  initialSessionId?: string;
  invalidReference: boolean;
  enabled: boolean;
}) {
  const [state, setState] = useState<CarPurchaseActivationState>({
    phase: "initializing", message: "이 브라우저의 연결 준비 상태를 확인합니다.", canSubmit: false,
  });
  const client = useRef<ReturnType<typeof createCarPurchaseActivationClient> | null>(null);
  useEffect(() => {
    let inFlight: AbortController | null = null;
    const controller = createCarPurchaseActivationClient({
      storage: {
        getItem: key => window.sessionStorage.getItem(key),
        setItem: (key, value) => window.sessionStorage.setItem(key, value),
        removeItem: key => window.sessionStorage.removeItem(key),
      },
      createNonce: () => Array.from(window.crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, "0")).join(""),
      now: Date.now,
      clearUrlReference: () => {
        if (window.location.search || window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname);
      },
      send: async body => {
        const abort = new AbortController();
        inFlight = abort;
        const timeout = window.setTimeout(() => abort.abort(), 15000);
        try {
          const response = await fetch("/api/car-purchase-pro/access/activate", {
            method: "POST", body, headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
            credentials: "same-origin", mode: "same-origin", redirect: "error", cache: "no-store",
            referrerPolicy: "no-referrer", signal: abort.signal,
          });
          const result: unknown = await response.json();
          return { status: response.status, json: async () => result };
        } finally { window.clearTimeout(timeout); inFlight = null; }
      },
      navigate: destination => window.location.replace(destination),
      onState: setState,
    });
    client.current = controller;
    controller.prepare(initialSessionId, invalidReference, enabled);
    return () => { controller.dispose(); inFlight?.abort(); client.current = null; };
  }, [initialSessionId, invalidReference, enabled]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void client.current?.submit();
  }
  const working = state.phase === "working";
  return <section className="mt-8 rounded-2xl border border-border bg-white p-5 sm:p-6" aria-labelledby="car-activation-heading">
    <h2 id="car-activation-heading" className="text-lg font-semibold text-navy">이 브라우저에서 이용권 확인</h2>
    <p id="car-activation-status" className="mt-3 text-sm leading-7 text-muted" role="status" aria-live="polite">{state.message}</p>
    <form action="/api/car-purchase-pro/access/activate" method="post" onSubmit={submit} className="mt-5">
      <button type="submit" disabled={!state.canSubmit || working} aria-busy={working} aria-describedby="car-activation-status"
        className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        {working ? "이용권 확인 중…" : state.phase === "retry" ? "같은 구매로 다시 확인" : "재결제 없이 이용권 확인"}
      </button>
    </form>
    <p className="mt-4 text-xs leading-6 text-muted">확인 정보는 이 탭에 임시로 보관합니다. 재시도할 때는 같은 탭을 사용해 주세요. 다른 브라우저나 설치형 앱과 자동으로 공유되지 않습니다.</p>
    <noscript><p className="mt-3 text-sm leading-6 text-red-800">안전한 재시도 정보를 유지하려면 JavaScript가 필요합니다. 새로 결제하지 말고 고객지원을 이용해 주세요.</p></noscript>
  </section>;
}
