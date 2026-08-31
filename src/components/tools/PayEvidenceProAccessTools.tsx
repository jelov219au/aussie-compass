"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

type RestoreCodeResponse = {
  code?: string;
  expiresAt?: string;
  error?: string;
};

export function PayEvidenceProAccessTools() {
  const [restoreCode, setRestoreCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseUnknown, setReleaseUnknown] = useState(false);

  async function createCode() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/pay-evidence-pro/restore-code", { method: "POST" });
      const result = await response.json() as RestoreCodeResponse;
      if (!response.ok || !result.code || !result.expiresAt) throw new Error(result.error ?? "복구 코드를 만들 수 없습니다.");
      setRestoreCode(result.code);
      setExpiresAt(result.expiresAt);
      setStatus("이 코드는 다시 표시되지 않습니다. 안전한 비밀번호 관리 앱 등에 보관하세요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "복구 코드를 만들 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyCode() {
    if (!restoreCode) return;
    await navigator.clipboard.writeText(restoreCode);
    setStatus("복구 코드를 클립보드에 복사했습니다.");
  }

  async function releaseAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (releasing) return;
    setReleasing(true);
    setReleaseUnknown(false);
    try {
      const response = await fetch("/api/pay-evidence-pro/access/release", {
        method: "POST",
        body: new URLSearchParams({ intent: "access-only" }),
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => null) as { released?: boolean; destination?: string } | null;
      if (!response.ok || result?.released !== true || result.destination !== "/pay-evidence-pro?access=released") {
        throw new Error("release outcome unknown");
      }
      window.location.replace(result.destination);
    } catch {
      setReleaseUnknown(true);
      setReleasing(false);
    }
  }

  return (
    <section className="mt-10 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="pay-evidence-pro-access-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">구매 내역 다시 찾기</p>
      <h2 id="pay-evidence-pro-access-heading" className="mt-2 text-xl font-semibold text-navy">다른 기기에서 이용권 복구하기</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">현재 기기의 접근 쿠키를 잃기 전에 1회용 복구 코드를 만들어 보관하세요. 코드는 30일 안에 한 번만 사용할 수 있으며 서버에는 원문이 저장되지 않습니다.</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={createCode} disabled={loading} className="inline-flex min-h-11 items-center justify-center bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "생성 중…" : "새 복구 코드 만들기"}
        </button>
        {restoreCode && <button type="button" onClick={copyCode} className="inline-flex min-h-11 items-center justify-center border border-navy px-4 py-2 text-sm font-semibold text-navy">코드 복사</button>}
      </div>
      {restoreCode && (
        <div className="mt-4 border-l-2 border-gold bg-surface p-4">
          <code className="break-all text-sm text-navy">{restoreCode}</code>
          <p className="mt-2 text-xs text-muted">만료: {new Date(expiresAt).toLocaleString("ko-KR")}</p>
        </div>
      )}
      {status && <p className="mt-3 text-sm leading-6 text-muted" role="status">{status}</p>}
      <div className="mt-6 border-t border-border pt-5">
        <h3 className="text-sm font-semibold text-navy">공용 기기에서 이용 중인가요?</h3>
        <p className="mt-2 text-sm leading-6 text-muted">이 기기의 Pay Evidence Pack Pro 접근 쿠키만 제거합니다. 구매 이용권과 다른 기기의 접근은 유지됩니다.</p>
        <form action="/api/pay-evidence-pro/access/release" method="post" onSubmit={releaseAccess} className="mt-3 w-full sm:w-auto">
          <button type="submit" disabled={releasing} aria-busy={releasing} className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:cursor-wait disabled:opacity-50 sm:w-auto">{releasing ? "접근 상태 확인 중…" : "이 기기 접근 해제"}</button>
        </form>
        {releaseUnknown && (
          <div className="mt-4 border-l-2 border-gold bg-gold/10 p-4 text-sm leading-6 text-navy" role="alert" aria-live="assertive">
            <p>요청 결과를 확인하지 못했습니다. 다시 결제하지 말고 이 기기의 Pay Evidence Pack Pro 접근 상태를 다시 확인하거나 고객지원에서 구매 내역을 확인해 주세요.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/pay-evidence-pro/workspace" className="inline-flex min-h-11 w-full items-center justify-center border border-navy px-4 py-2 font-semibold sm:w-auto">접근 상태 다시 확인</Link>
              <Link href="/contact" className="inline-flex min-h-11 w-full items-center justify-center border border-navy px-4 py-2 font-semibold sm:w-auto">고객지원 문의</Link>
            </div>
          </div>
        )}
        <p className="mt-3 text-xs leading-5 text-muted">작성한 급여기간과 증빙 메모도 지우려면 <Link href="/data-transfer#pay-evidence-delete-heading" className="inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Pay Evidence 로컬 기록 삭제</Link>를 사용하세요. 이용권과 결제 증빙은 유지됩니다.</p>
      </div>
    </section>
  );
}
