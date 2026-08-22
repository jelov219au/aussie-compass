"use client";

import { type FormEvent, useState } from "react";

import {
  beginResumeProDevicePurge,
  cancelResumeProDevicePurge,
  completeResumeProDevicePurge,
} from "@/lib/resumeProDeviceStorage";

export function ResumeProDevicePrivacyTools() {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function releaseAndDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteConfirmed) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      beginResumeProDevicePurge(window.sessionStorage, window);
      const response = await fetch("/api/resume-pro/access/release", {
        method: "POST",
        body: new URLSearchParams({ intent: "device-purge" }),
        credentials: "same-origin",
        headers: { "X-Hoju-Compass-Mutation": "device-purge" },
        redirect: "follow",
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? "접근 해제 요청을 완료하지 못했습니다.");
      }
      if (!completeResumeProDevicePurge(window.localStorage, window.sessionStorage)) {
        throw new Error("데이터 삭제 요청이 만료됐습니다.");
      }
      window.location.replace("/resume-pro?access=released&deviceData=deleted");
    } catch (caught) {
      cancelResumeProDevicePurge(window.sessionStorage);
      setError(caught instanceof Error ? caught.message : "접근 해제 요청을 완료하지 못했습니다.");
      setDeleting(false);
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-5" aria-labelledby="resume-pro-device-privacy-heading">
      <h3 id="resume-pro-device-privacy-heading" className="text-sm font-semibold text-navy">공용 기기에서 이용 중인가요?</h3>
      <p className="mt-2 text-sm leading-6 text-muted">구매 이용권과 다른 기기의 접근은 그대로 유지하면서, 이 기기의 접근만 해제할 수 있습니다.</p>

      <form action="/api/resume-pro/access/release" method="post" className="mt-4">
        <button type="submit" className="inline-flex min-h-11 items-center justify-center border border-navy px-4 py-2 text-sm font-semibold text-navy">접근만 해제 · 데이터 유지</button>
      </form>

      <div className="mt-5 border border-red-200 bg-red-50/60 p-4 sm:p-5">
        <h4 className="text-sm font-semibold text-navy">공용 기기라면 데이터도 함께 삭제하세요</h4>
        <p className="mt-2 text-xs leading-5 text-muted">무료 이력서, 회사별 지원서, 공고·커버레터 초안, 면접·STAR 메모를 이 브라우저에서 영구 삭제합니다. 삭제한 내용은 복구할 수 없습니다.</p>
        <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-navy">
          <input
            type="checkbox"
            checked={deleteConfirmed}
            onChange={(event) => setDeleteConfirmed(event.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-red-700"
          />
          이 기기의 Resume Pro 데이터까지 삭제
        </label>
        <form onSubmit={releaseAndDelete} className="mt-3">
          <button
            type="submit"
            disabled={!deleteConfirmed || deleting}
            className="inline-flex min-h-12 items-center justify-center bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? "접근 해제 및 삭제 중…" : "접근 해제 + 이 기기 데이터 완전 삭제"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm leading-6 text-red-800" role="alert">{error} 다시 시도해 주세요.</p>}
      </div>
    </section>
  );
}
