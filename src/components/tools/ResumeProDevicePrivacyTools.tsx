"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import {
  beginResumeProDevicePurge,
  cancelResumeProDevicePurge,
  completeResumeProDevicePurge,
} from "@/lib/resumeProDeviceStorage";

export function ResumeProDevicePrivacyTools({
  requireRecoveryAcknowledgement,
}: {
  requireRecoveryAcknowledgement: boolean;
}) {
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [recoveryAcknowledged, setRecoveryAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseUnknown, setReleaseUnknown] = useState(false);
  const recoveryRequired = requireRecoveryAcknowledgement && !recoveryAcknowledged;

  async function requestRelease(devicePurge: boolean) {
    const response = await fetch("/api/resume-pro/access/release", {
      method: "POST",
      body: new URLSearchParams({ intent: devicePurge ? "device-purge" : "access-only" }),
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(devicePurge ? { "X-Hoju-Compass-Mutation": "device-purge" } : {}),
      },
    });
    const result = await response.json().catch(() => null) as { released?: boolean; destination?: string } | null;
    if (!response.ok || result?.released !== true || result.destination !== "/resume-pro?access=released") {
      throw new Error("release outcome unknown");
    }
    return result.destination;
  }

  async function releaseOnly(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (releasing || deleting || recoveryRequired) return;
    setReleasing(true);
    setReleaseUnknown(false);
    try {
      const destination = await requestRelease(false);
      window.location.replace(destination);
    } catch {
      setReleaseUnknown(true);
      setReleasing(false);
    }
  }

  async function releaseAndDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleting || releasing || !deleteConfirmed || recoveryRequired) {
      return;
    }

    setDeleting(true);
    setReleaseUnknown(false);
    try {
      beginResumeProDevicePurge(window.sessionStorage, window);
      await requestRelease(true);
      if (!completeResumeProDevicePurge(window.localStorage, window.sessionStorage)) {
        throw new Error("local purge proof expired");
      }
      window.location.replace("/resume-pro?access=released&deviceData=deleted");
    } catch {
      cancelResumeProDevicePurge(window.sessionStorage);
      setReleaseUnknown(true);
      setDeleting(false);
    }
  }

  return (
    <section className="mt-6 border-t border-border pt-5" aria-labelledby="resume-pro-device-privacy-heading">
      <h3 id="resume-pro-device-privacy-heading" className="text-sm font-semibold text-navy">공용 기기에서 이용 중인가요?</h3>
      <p className="mt-2 text-sm leading-6 text-muted">구매 이용권과 다른 기기의 접근은 그대로 유지하면서, 이 기기의 접근만 해제할 수 있습니다.</p>
      {requireRecoveryAcknowledgement && (
        <>
          <p id="resume-pro-release-recovery-warning" className="mt-3 border-l-2 border-gold bg-gold/10 p-3 text-xs leading-5 text-navy">이 기기의 이용 확인은 30일이며, 복구 코드 없이 접근을 해제하면 자동 복구할 수 없습니다. 다시 열려면 고객지원의 구매 확인이 필요합니다.</p>
          <label className="mt-3 flex min-h-11 cursor-pointer items-start gap-3 text-sm font-medium leading-6 text-navy">
            <input
              type="checkbox"
              checked={recoveryAcknowledged}
              onChange={(event) => setRecoveryAcknowledged(event.target.checked)}
              aria-describedby="resume-pro-release-recovery-warning"
              className="mt-1 h-5 w-5 shrink-0 accent-gold"
            />
            복구 코드를 보관했거나, 코드가 없으면 고객지원 확인 전까지 다시 열 수 없음을 이해했습니다.
          </label>
        </>
      )}

      <form action="/api/resume-pro/access/release" method="post" onSubmit={releaseOnly} className="mt-4 w-full sm:w-auto">
        <button type="submit" disabled={recoveryRequired || releasing || deleting} aria-busy={releasing} aria-describedby={requireRecoveryAcknowledgement ? "resume-pro-release-recovery-warning" : undefined} className="inline-flex min-h-12 w-full items-center justify-center border border-navy px-4 py-2 text-sm font-semibold text-navy disabled:cursor-wait disabled:opacity-50 sm:w-auto">
          {releasing ? "접근 상태 확인 중…" : "접근만 해제 · 데이터 유지"}
        </button>
      </form>

      {releaseUnknown && (
        <div className="mt-4 border-l-2 border-gold bg-gold/10 p-4 text-sm leading-6 text-navy" role="alert" aria-live="assertive">
          <p>요청 결과를 확인하지 못했어요. 다시 결제하지 마세요. 이 기기의 접근 상태를 다시 확인하거나 고객지원에서 구매 내역을 확인해 주세요.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href="/resume-pro/workspace" className="inline-flex min-h-11 w-full items-center justify-center border border-navy px-4 py-2 font-semibold sm:w-auto">접근 상태 다시 확인</Link>
            <Link href="/contact" className="inline-flex min-h-11 w-full items-center justify-center border border-navy px-4 py-2 font-semibold sm:w-auto">고객지원 문의</Link>
          </div>
        </div>
      )}

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
            disabled={recoveryRequired || !deleteConfirmed || deleting || releasing}
            aria-describedby={requireRecoveryAcknowledgement ? "resume-pro-release-recovery-warning" : undefined}
            className="inline-flex min-h-12 w-full items-center justify-center bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
          >
            {deleting ? "접근 해제 및 삭제 중…" : "접근 해제 + 이 기기 데이터 완전 삭제"}
          </button>
        </form>
      </div>
    </section>
  );
}
