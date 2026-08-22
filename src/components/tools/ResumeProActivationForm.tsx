"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

const activationStorageKey = "hoju_compass_resume_pro_activation_v1";
const sessionPattern = /^cs_(?:test|live)_[A-Za-z0-9]+$/;
const noncePattern = /^[A-Za-z0-9_-]{40,128}$/;

type ActivationState = { sessionId: string; nonce: string };
type NoticeKind = "ready" | "pending" | "unavailable" | "used" | "released" | "refunded" | "review";

const notices: Record<NoticeKind, string> = {
  ready: "결제가 확인됐습니다. 다시 결제하지 마세요. 아래 버튼으로 이 기기에서 Resume Pro를 열 수 있어요.",
  pending: "결제 처리를 확인하고 있습니다. 다시 결제하지 마세요. 잠시 후 같은 버튼으로 다시 확인하거나 무료 이력서 빌더를 이용해 주세요.",
  unavailable: "이용 준비 상태를 확인할 수 없습니다. 다시 결제하지 마세요. 고객지원에서 결제 내역을 확인하거나 무료 이력서 빌더를 이용해 주세요.",
  used: "이 결제 완료 주소는 이미 다른 브라우저에서 사용됐습니다. 다시 결제하지 마세요. 기존 기기의 1회용 복구 코드로 이용권을 연결해 주세요.",
  released: "이 기기의 이용 연결은 이미 해제됐습니다. 다시 결제하지 마세요. 기존 기기의 1회용 복구 코드로만 다시 연결할 수 있어요.",
  refunded: "환불 완료로 Resume Pro 이용이 종료됐습니다. 다시 결제하지 마세요. 결제 내역이 걱정되면 고객지원에서 확인해 주세요.",
  review: "결제 상태를 확인하고 있습니다. 다시 결제하지 마세요. 확인이 끝날 때까지 무료 이력서 빌더를 이용하거나 고객지원으로 문의해 주세요.",
};

function createActivationNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function readStoredActivation() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(activationStorageKey) ?? "null") as Partial<ActivationState> | null;
    return value && sessionPattern.test(value.sessionId ?? "") && noncePattern.test(value.nonce ?? "")
      ? value as ActivationState
      : null;
  } catch {
    return null;
  }
}

export function ResumeProActivationForm({
  initialSessionId,
  initialNotice,
}: {
  initialSessionId?: string;
  initialNotice: NoticeKind;
}) {
  const [activation, setActivation] = useState<ActivationState | null>(null);
  const [notice, setNotice] = useState<NoticeKind>(initialNotice);
  const [submitting, setSubmitting] = useState(false);
  const canAttemptActivation = Boolean(activation)
    && notice !== "refunded"
    && notice !== "released"
    && notice !== "used"
    && notice !== "review";
  const canUseRestoreCode = notice !== "refunded" && notice !== "review";
  const heading = notice === "refunded"
    ? "환불 내역 확인"
    : notice === "review"
      ? "결제 상태 확인"
      : "구매한 Resume Pro 열기";

  useEffect(() => {
    let next = readStoredActivation();
    if (initialSessionId && sessionPattern.test(initialSessionId)) {
      if (!next || next.sessionId !== initialSessionId) {
        next = { sessionId: initialSessionId, nonce: createActivationNonce() };
      }
      try {
        window.sessionStorage.setItem(activationStorageKey, JSON.stringify(next));
      } catch {
        setNotice("unavailable");
        next = null;
      }
    }
    setActivation(next);

    if (window.location.search) {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
  }, [initialSessionId]);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activation || submitting) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.set("session_id", activation.sessionId);
    formData.set("activation_nonce", activation.nonce);

    try {
      const response = await fetch("/api/resume-pro/access/activate", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null) as { code?: string; destination?: string } | null;

      if (response.ok && body?.code === "activation_ready" && body.destination === "/resume-pro/workspace") {
        window.sessionStorage.removeItem(activationStorageKey);
        window.location.assign(body.destination);
        return;
      }

      const nextNotice: NoticeKind = body?.code === "activation_used" ? "used"
        : body?.code === "activation_released" ? "released"
          : body?.code === "activation_revoked" ? "refunded"
            : body?.code === "activation_review" ? "review"
              : body?.code === "activation_missing" ? "pending"
                : "unavailable";
      setNotice(nextNotice);
      if (nextNotice === "used" || nextNotice === "released" || nextNotice === "refunded") {
        window.sessionStorage.removeItem(activationStorageKey);
        setActivation(null);
      }
    } catch {
      setNotice("unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8 border-l-2 border-gold bg-white p-5 sm:p-6" aria-labelledby="resume-pro-activation-heading">
      <h2 id="resume-pro-activation-heading" className="text-lg font-semibold text-navy">{heading}</h2>
      <p className="mt-3 text-sm leading-7 text-muted" role="status" aria-live="polite" aria-atomic="true">{notices[notice]}</p>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canAttemptActivation && (
          <form action="/api/resume-pro/access/activate" method="post" onSubmit={activate} className="w-full sm:w-auto">
            <button type="submit" disabled={submitting} aria-busy={submitting} className="inline-flex min-h-12 w-full items-center justify-center bg-gold px-5 py-3 text-sm font-semibold text-navy disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              {submitting ? "이용권 확인 중…" : "Resume Pro 열기"}
            </button>
          </form>
        )}
        {notice === "refunded" && (
          <Link href="/contact" className="inline-flex min-h-12 w-full items-center justify-center bg-navy px-5 py-3 text-center text-sm font-semibold text-white sm:w-auto">환불 내역 문의하기</Link>
        )}
        {notice === "review" && (
          <>
            <Link href="/payment-help" className="inline-flex min-h-12 w-full items-center justify-center bg-navy px-5 py-3 text-center text-sm font-semibold text-white sm:w-auto">결제 상태 재확인 순서 보기</Link>
            <Link href="/contact" className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-5 py-3 text-center text-sm font-semibold text-navy sm:w-auto">고객지원 문의하기</Link>
          </>
        )}
        {canUseRestoreCode && (
          <Link href="/resume-pro/restore" className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-5 py-3 text-center text-sm font-semibold text-navy sm:w-auto">1회용 코드로 복구</Link>
        )}
        {notice !== "refunded" && notice !== "review" && (
          <Link href="/payment-help" className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-5 py-3 text-center text-sm font-semibold text-navy sm:w-auto">고객지원 확인 순서</Link>
        )}
        <Link href="/resume-builder" className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-5 py-3 text-center text-sm font-semibold text-navy sm:w-auto">무료 이력서 빌더</Link>
      </div>
    </section>
  );
}
