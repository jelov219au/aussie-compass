"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";

const restoreNonceStorageKey = "hoju_compass_resume_pro_restore_nonce_v1";
const noncePattern = /^[A-Za-z0-9_-]{40,128}$/;

type RestoreNotice = "idle" | "invalid" | "used" | "released" | "refunded" | "review" | "unavailable";

const notices: Record<Exclude<RestoreNotice, "idle">, string> = {
  invalid: "코드가 잘못됐거나 만료·사용 처리됐습니다. 다시 결제하지 마세요. 고객지원 확인 순서를 따라 구매 내역을 확인해 주세요.",
  used: "이 복구 코드는 다른 브라우저에서 사용됐습니다. 다시 결제하지 마세요. 기존 기기에서 새 복구 코드를 만들거나 고객지원으로 확인해 주세요.",
  released: "이 기기의 이용 연결은 이미 해제됐습니다. 다시 결제하지 마세요. 기존 기기에서 새 복구 코드를 만들거나 고객지원으로 확인해 주세요.",
  refunded: "환불 완료로 Resume Pro 이용이 종료됐습니다. 다시 결제하지 마세요. 환불 내역은 고객지원에서 확인해 주세요.",
  review: "결제 상태를 확인하고 있습니다. 다시 결제하지 마세요. 결제 상태 재확인 순서나 고객지원을 이용해 주세요.",
  unavailable: "복구 요청 결과를 확인하지 못했습니다. 다시 결제하지 마세요. 같은 코드로 다시 시도하거나 고객지원에서 구매 내역을 확인해 주세요.",
};

function createRestoreNonce() {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function readOrCreateRestoreNonce() {
  const stored = window.sessionStorage.getItem(restoreNonceStorageKey);
  if (stored && noncePattern.test(stored)) return stored;
  const nonce = createRestoreNonce();
  window.sessionStorage.setItem(restoreNonceStorageKey, nonce);
  return nonce;
}

export function ResumeProRestoreForm({ initialStatus }: { initialStatus?: string }) {
  const initialNotice: RestoreNotice = initialStatus === "activation-used" || initialStatus === "used" ? "used"
    : initialStatus === "activation-released" || initialStatus === "released" ? "released"
      : initialStatus === "revoked" ? "refunded"
        : initialStatus === "review" ? "review"
          : initialStatus === "unavailable" ? "unavailable"
            : initialStatus === "invalid" ? "invalid"
              : "idle";
  const [nonce, setNonce] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<RestoreNotice>(initialNotice);
  const [submitting, setSubmitting] = useState(false);
  const codeInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      setNonce(readOrCreateRestoreNonce());
    } catch {
      setNotice("unavailable");
    }
  }, []);

  useEffect(() => {
    if (notice !== "invalid") return;
    codeInputRef.current?.focus();
    codeInputRef.current?.select();
  }, [notice]);

  async function restore(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!nonce || submitting) return;
    setSubmitting(true);

    const formData = new FormData();
    formData.set("restore_code", code);
    formData.set("restore_nonce", nonce);

    try {
      const response = await fetch("/api/resume-pro/restore", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });
      const body = await response.json().catch(() => null) as { code?: string; destination?: string } | null;
      if (response.ok && body?.code === "restore_ready" && body.destination === "/resume-pro/workspace") {
        window.sessionStorage.removeItem(restoreNonceStorageKey);
        window.location.assign(body.destination);
        return;
      }

      const nextNotice: RestoreNotice = body?.code === "restore_used" ? "used"
        : body?.code === "restore_released" ? "released"
          : body?.code === "restore_revoked" ? "refunded"
            : body?.code === "restore_review" ? "review"
              : body?.code === "restore_invalid" || body?.code === "restore_missing" ? "invalid"
                : "unavailable";
      setNotice(nextNotice);
    } catch {
      setNotice("unavailable");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {notice !== "idle" && (
        <p id="resume-pro-restore-notice" className="mt-5 border-l-2 border-gold bg-gold/10 p-4 text-sm leading-6 text-navy" role={notice === "invalid" ? "alert" : "status"} aria-live="polite" aria-atomic="true">
          {notices[notice]}
        </p>
      )}
      <form action="/api/resume-pro/restore" method="post" onSubmit={restore} className="mt-8 border border-navy/15 bg-white p-5 sm:p-6">
        <label htmlFor="restore-code" className="text-sm font-semibold text-navy">복구 코드</label>
        <textarea ref={codeInputRef} id="restore-code" name="restore_code" required minLength={32} maxLength={128} autoComplete="off" spellCheck={false} value={code} onChange={(event) => { setCode(event.target.value); if (notice === "invalid") setNotice("idle"); }} aria-invalid={notice === "invalid"} aria-describedby={notice === "invalid" ? "resume-pro-restore-notice" : undefined} className={`mt-2 min-h-28 w-full border bg-surface p-3 text-sm text-navy outline-none ${notice === "invalid" ? "border-red-600" : "border-border focus:border-gold"}`} />
        <input type="hidden" name="restore_nonce" value={nonce} />
        <button type="submit" disabled={!nonce || submitting} aria-busy={submitting} className="mt-4 inline-flex min-h-12 w-full items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-50 sm:w-auto">
          {submitting ? "이용권 확인 중…" : "이용권 복구"}
        </button>
      </form>
    </>
  );
}
