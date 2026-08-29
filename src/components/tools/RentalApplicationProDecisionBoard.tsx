"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DECISION_STORAGE_KEY = "hoju-compass-rental-pro-decision-v1";
const FREE_PROJECT_STORAGE_KEY = "house-hunt-project";
const MAX_PROPERTIES = 6;
const FREE_PROJECT_ITEM_IDS = new Set([
  "save-ad",
  "compare-commute",
  "inspect",
  "documents",
  "references",
  "scam-check",
  "written-agreement",
  "bond-process",
  "receipts",
  "condition-report",
  "keys",
  "contacts",
]);

type Decision = {
  version: 1;
  propertyCount: number;
  reuseCommonDetails: boolean;
  privacyReview: boolean;
  englishFollowUp: boolean;
};

type SaveStatus = "loading" | "saving" | "saved" | "unavailable";
type FreeProjectSummary = { completed: number; targetDate: string } | null;

const defaultDecision: Decision = {
  version: 1,
  propertyCount: 1,
  reuseCommonDetails: false,
  privacyReview: false,
  englishFollowUp: false,
};

function normaliseDecision(value: unknown): Decision {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultDecision;
  const candidate = value as Partial<Decision>;
  const propertyCount = Number.isInteger(candidate.propertyCount)
    ? Math.min(MAX_PROPERTIES, Math.max(1, candidate.propertyCount as number))
    : 1;
  return {
    version: 1,
    propertyCount,
    reuseCommonDetails: candidate.reuseCommonDetails === true,
    privacyReview: candidate.privacyReview === true,
    englishFollowUp: candidate.englishFollowUp === true,
  };
}

function readFreeProject(value: string | null): FreeProjectSummary {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as { checked?: unknown; targetDate?: unknown };
    const completed = Array.isArray(parsed.checked)
      ? new Set(parsed.checked.filter((id): id is string => typeof id === "string" && FREE_PROJECT_ITEM_IDS.has(id))).size
      : 0;
    const targetDate = typeof parsed.targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(parsed.targetDate)
      ? parsed.targetDate
      : "";
    return { completed, targetDate };
  } catch {
    return null;
  }
}

function displayDate(value: string) {
  if (!value) return "목표일 없음";
  return new Date(`${value}T12:00:00`).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function RentalApplicationProDecisionBoard({ checkoutAvailable }: { checkoutAvailable: boolean }) {
  const [decision, setDecision] = useState<Decision>(defaultDecision);
  const [freeProject, setFreeProject] = useState<FreeProjectSummary>(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");

  useEffect(() => {
    try {
      const savedDecision = window.localStorage.getItem(DECISION_STORAGE_KEY);
      if (savedDecision) setDecision(normaliseDecision(JSON.parse(savedDecision)));
      setFreeProject(readFreeProject(window.localStorage.getItem(FREE_PROJECT_STORAGE_KEY)));
      setSaveStatus("saving");
    } catch {
      setSaveStatus("unavailable");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || saveStatus === "unavailable") return;
    try {
      window.localStorage.setItem(DECISION_STORAGE_KEY, JSON.stringify(decision));
      setSaveStatus("saved");
    } catch {
      setSaveStatus("unavailable");
    }
  }, [decision, loaded, saveStatus]);

  function updateDecision(next: Decision) {
    setSaveStatus((current) => current === "unavailable" ? current : "saving");
    setDecision(next);
  }

  const signals = [
    decision.propertyCount > 1,
    decision.reuseCommonDetails,
    decision.privacyReview,
    decision.englishFollowUp,
  ].filter(Boolean).length;
  const proFit = signals > 0;
  const proReasons = [
    decision.propertyCount > 1 ? `${decision.propertyCount}개 집 후보 비교` : null,
    decision.reuseCommonDetails ? "공통 준비사항 재사용" : null,
    decision.privacyReview ? "개인정보 요청 분리 점검" : null,
    decision.englishFollowUp ? "영문 소개와 후속 연락 관리" : null,
  ].filter((reason): reason is string => Boolean(reason));
  const previewCount = Math.min(decision.propertyCount, 3);

  return (
    <section className="border-y border-navy/20 bg-white py-14 sm:py-20" aria-labelledby="rental-decision-heading">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">내 상황으로 비교</p>
            <h2 id="rental-decision-heading" className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">무료로 이어갈지,<br />Pro로 묶을지 판단하세요.</h2>
            <p className="mt-4 text-sm leading-7 text-muted">정확한 주소나 서류 없이 필요한 관리 방식만 선택합니다. 판단은 이 브라우저에 저장되어 다음 방문에도 이어져요.</p>

            <div className="mt-6 border-l-2 border-gold bg-surface p-4" aria-live="polite">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">무료 집 구하기 프로젝트</p>
              {freeProject ? (
                <p className="mt-2 text-sm font-semibold text-navy">저장된 진행률 {freeProject.completed}/{FREE_PROJECT_ITEM_IDS.size} · {displayDate(freeProject.targetDate)}</p>
              ) : (
                <p className="mt-2 text-sm font-semibold text-navy">저장된 진행률이 아직 없어요.</p>
              )}
              <Link href="/property-inspection-checklist#house-hunt-project" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">무료 프로젝트 열기</Link>
            </div>

            <p className="mt-4 text-xs leading-5 text-muted" role="status">
              {saveStatus === "saved" && "내 판단이 현재 브라우저에 저장됐어요."}
              {saveStatus === "saving" && "내 판단을 저장하는 중이에요."}
              {saveStatus === "loading" && "저장된 판단을 확인하는 중이에요."}
              {saveStatus === "unavailable" && "브라우저 저장소를 사용할 수 없어 이번 판단은 저장되지 않아요."}
            </p>
          </div>

          <div className="border border-navy/20 p-5 sm:p-7">
            <fieldset>
              <legend className="text-lg font-semibold text-navy">이번에 함께 관리할 집은 몇 개인가요?</legend>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {Array.from({ length: MAX_PROPERTIES }, (_, index) => index + 1).map((count) => (
                  <button key={count} type="button" aria-pressed={decision.propertyCount === count} onClick={() => updateDecision({ ...decision, propertyCount: count })} className={`min-h-12 border text-sm font-semibold ${decision.propertyCount === count ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:border-navy/40"}`}>{count}{count === MAX_PROPERTIES ? "개" : ""}</button>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-7 border-t border-border pt-6">
              <legend className="text-lg font-semibold text-navy">집마다 달라지는 준비가 있나요?</legend>
              <div className="mt-3 space-y-2">
                {[
                  ["reuseCommonDetails", "직장·가구 정보와 공통 증빙 상태를 다음 집에 재사용하고 싶어요."],
                  ["privacyReview", "집마다 요구하는 개인정보 범위와 남은 확인을 따로 점검해야 해요."],
                  ["englishFollowUp", "영문 소개문이나 신청 후속 연락을 집별로 관리해야 해요."],
                ].map(([key, label]) => {
                  const field = key as "reuseCommonDetails" | "privacyReview" | "englishFollowUp";
                  return <label key={key} className="flex min-h-12 cursor-pointer items-start gap-3 border border-border p-3 hover:bg-surface"><input type="checkbox" checked={decision[field]} onChange={(event) => updateDecision({ ...decision, [field]: event.target.checked })} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]" /><span className="text-sm leading-6 text-navy">{label}</span></label>;
                })}
              </div>
            </fieldset>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className={`border-l-4 p-5 sm:p-6 ${proFit ? "border-gold bg-gold/10" : "border-emerald-600 bg-emerald-50"}`} aria-live="polite">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">현재 선택 기준</p>
            <h3 className="mt-2 text-xl font-semibold text-navy">{proFit ? "Pro 포트폴리오를 비교할 가치가 높아요." : "무료 프로젝트로 먼저 진행해도 충분해요."}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{proFit ? `${proReasons.join(" · ")}가 필요해요. Pro 보드에서 공통 정보와 집별 후속을 나눠 볼 수 있어요.` : "한 집의 방문 결과와 지원·계약·입주 다음 행동은 무료 프로젝트에 계속 저장할 수 있어요."}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Link href="#rental-free-pro-comparison" className="inline-flex min-h-12 items-center justify-center bg-navy px-5 text-center text-sm font-semibold text-white">전체 기능 비교</Link>
              {checkoutAvailable ? <Link href="#rental-pro-checkout" className="inline-flex min-h-12 items-center justify-center border border-navy px-5 text-center text-sm font-semibold text-navy">구매 단계 확인</Link> : <span className="inline-flex min-h-12 items-center justify-center border border-border px-5 text-center text-sm font-semibold text-muted">판매 준비 중 · 판단은 저장됨</span>}
            </div>
          </div>

          <div className="border border-border bg-surface p-5 sm:p-6" aria-label="Pro 집 후보 비교 미리보기">
            <div className="flex items-center justify-between gap-4"><h3 className="text-lg font-semibold text-navy">Pro에서는 이렇게 나눠 봐요</h3><span className="font-mono text-xs text-muted">{decision.propertyCount}/6 candidates</span></div>
            <ol className="mt-4 grid gap-2 sm:grid-cols-3">
              {Array.from({ length: previewCount }, (_, index) => (
                <li key={index} className="border border-border bg-white p-4"><span className="font-mono text-xs text-gold">0{index + 1}</span><strong className="mt-2 block text-sm text-navy">집 후보 {index + 1}</strong><span className="mt-2 block text-xs leading-5 text-muted">공통 준비 재사용<br />후속 상태는 따로 저장</span></li>
              ))}
            </ol>
            {decision.propertyCount > previewCount && <p className="mt-3 text-xs font-semibold text-muted">+ {decision.propertyCount - previewCount}개 후보도 같은 보드에서 비교</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
