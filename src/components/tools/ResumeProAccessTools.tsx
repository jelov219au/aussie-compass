"use client";

import { useState } from "react";

type RestoreCodeResponse = {
  code?: string;
  expiresAt?: string;
  error?: string;
};

export function ResumeProAccessTools() {
  const [restoreCode, setRestoreCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function createCode() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/resume-pro/restore-code", { method: "POST" });
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

  return (
    <section className="mt-10 border border-navy/15 bg-white p-5 sm:p-6" aria-labelledby="resume-pro-access-heading">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Purchase recovery</p>
      <h2 id="resume-pro-access-heading" className="mt-2 text-xl font-semibold text-navy">다른 기기에서 이용권 복구하기</h2>
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
    </section>
  );
}
