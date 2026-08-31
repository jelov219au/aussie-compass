"use client";

import { type FormEvent, useEffect, useState } from "react";

const activationStorageKey = "hoju_compass_leaving_australia_pro_activation_v1";
const activationLifetimeMs = 24 * 60 * 60 * 1000;
const sessionPattern = /^cs_(?:test|live)_[A-Za-z0-9]+$/;
const noncePattern = /^[A-Za-z0-9_-]{40,128}$/;

type ActivationNotice = "ready" | "pending" | "unavailable" | "used" | "released" | "refunded" | "review";
type ActivationState = { sessionId: string; nonce: string; createdAt: number };

const terminalNotices = new Set<ActivationNotice>(["used", "released", "refunded", "review"]);

function createNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}
function clearStoredActivation() {
  try {
    window.sessionStorage.removeItem(activationStorageKey);
  } catch {
    // Storage can be disabled; a missing in-memory activation remains fail-closed.
  }
}
function readStoredActivation() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(activationStorageKey) ?? "null") as Partial<ActivationState> | null;
    const ageMs = Date.now() - (value?.createdAt ?? Number.NaN);
    if (value
      && sessionPattern.test(value.sessionId ?? "")
      && noncePattern.test(value.nonce ?? "")
      && Number.isFinite(ageMs)
      && ageMs >= 0
      && ageMs <= activationLifetimeMs) {
      return value as ActivationState;
    }
    clearStoredActivation();
    return null;
  } catch {
    clearStoredActivation();
    return null;
  }
}
export function LeavingAustraliaProActivationForm({
  initialSessionId,
  initialNotice,
}: {
  initialSessionId?: string;
  initialNotice: ActivationNotice;
}) {
  const [activation, setActivation] = useState<ActivationState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let next = readStoredActivation();
    try {
      if (terminalNotices.has(initialNotice)) {
        clearStoredActivation();
        next = null;
      } else if (initialSessionId && sessionPattern.test(initialSessionId) && (!next || next.sessionId !== initialSessionId)) {
        next = { sessionId: initialSessionId, nonce: createNonce(), createdAt: Date.now() };
      }
      if (next) window.sessionStorage.setItem(activationStorageKey, JSON.stringify(next));
      setActivation(next);
    } catch {
      setError("이 브라우저에서 안전한 이용권 연결을 준비할 수 없습니다.");
    }
    if (window.location.search) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [initialNotice, initialSessionId]);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activation || submitting) return;
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.set("session_id", activation.sessionId);
    formData.set("activation_nonce", activation.nonce);
    try {
      const response = await fetch("/api/leaving-australia-pro/access/activate", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null) as { code?: string; destination?: string } | null;
      if (response.ok && body?.code === "activation_ready" && body.destination === "/leaving-australia-pro/workspace") {
        clearStoredActivation();
        window.location.assign(body.destination);
        return;
      }
      if (body?.code === "activation_used" || body?.code === "activation_released"
        || body?.code === "activation_revoked" || body?.code === "activation_review") {
        clearStoredActivation();
        setActivation(null);
      }
      if (body?.destination?.startsWith("/leaving-australia-pro/")) {
        window.location.assign(body.destination);
        return;
      }
      setError("이용권 연결 결과를 확인할 수 없습니다. 다시 결제하지 말고 잠시 후 재시도하세요.");
    } catch {
      setError("이용권 연결 결과를 확인할 수 없습니다. 다시 결제하지 말고 잠시 후 재시도하세요.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!activation && !error) return null;

  return (
    <div>
      <form action="/api/leaving-australia-pro/access/activate" method="post" onSubmit={activate}>
        <button type="submit" disabled={!activation || submitting} aria-busy={submitting} className="inline-flex min-h-12 items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy disabled:cursor-wait disabled:opacity-50">
          {submitting ? "이용권 확인 중…" : initialNotice === "ready" ? "Leaving Australia Pack Pro 열기" : "재결제하지 않고 이용권 다시 확인"}
        </button>
      </form>
      {error && <p className="mt-3 max-w-md text-sm leading-6 text-red-800" role="alert">{error}</p>}
    </div>
  );
}
