"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { derivePwaInstallLifecycle, pwaLifecycleFields, type InstallState, type PwaPlatform } from "@/lib/pwaInstallLifecycle";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

const platformLabels: Record<PwaPlatform, string> = { ios_safari: "iPhone/iPad Safari", android_chrome: "Android Chrome", desktop_chrome: "데스크톱 Chrome", desktop_edge: "데스크톱 Edge", other: "기타·잘 모르겠음" };
const actionCopy = { prompt_install: "설치 요청 열기", open_platform_steps: "선택한 기기 설치 방법 보기", continue_web: "웹으로 계속 사용", verify_original_copy: "원래 브라우저·프로필 확인", backup_before_change: "변경 전 백업 확인", refresh_online: "온라인에서 새로고침", remove_app_only: "앱 제거 방법 확인", delete_site_data_after_backup: "백업 후 데이터 삭제 안내", restore_paid_access: "재결제 전 이용권 복구" } as const;

export function InstallAppButton() {
  const [platform, setPlatform] = useState<PwaPlatform>("other");
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>("prompt_unavailable");
  const [standalone, setStandalone] = useState(false);
  const [online, setOnline] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [message, setMessage] = useState("");
  const [requestAccepted, setRequestAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const manualLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const displayStandalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as NavigatorWithStandalone).standalone);
    setStandalone(displayStandalone);
    setOnline(navigator.onLine);
    if (displayStandalone) setInstallState("installed_or_standalone");
    const capturePrompt = (event: Event) => { event.preventDefault(); setPromptEvent(event as InstallPromptEvent); setRequestAccepted(false); setInstallState("prompt_available"); };
    const installed = () => { setPromptEvent(null); setStandalone(true); setInstallState("installed_or_standalone"); setMessage("설치 완료 신호를 확인했습니다. 원래 기록과 구매 이용권은 별도로 확인하세요."); };
    const onlineNow = () => setOnline(true);
    const offlineNow = () => setOnline(false);
    const updateNow = () => setUpdateAvailable(true);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", onlineNow);
    window.addEventListener("offline", offlineNow);
    window.addEventListener("hoju:pwa-update", updateNow);
    return () => { window.removeEventListener("beforeinstallprompt", capturePrompt); window.removeEventListener("appinstalled", installed); window.removeEventListener("online", onlineNow); window.removeEventListener("offline", offlineNow); window.removeEventListener("hoju:pwa-update", updateNow); };
  }, []);

  const outcome = useMemo(() => derivePwaInstallLifecycle({ platform, launch_context: standalone ? "installed_app" : platform === "other" ? "unknown" : "browser_tab", install_state: standalone ? "installed_or_standalone" : installState, local_copy_state: standalone || platform !== "other" ? "same_profile_unconfirmed" : "separate_or_unknown_copy", offline_scope: platform === "other" ? "online_required" : "offline_fallback_only", update_state: updateAvailable ? "update_available" : "current_unconfirmed", remove_data_choice: "keep_installed", backup_entitlement_boundary: standalone ? "paid_access_separate" : "backup_not_checked", exposePlatformSteps: true, installRequestAccepted: requestAccepted }), [installState, platform, requestAccepted, standalone, updateAvailable]);

  async function requestInstall() {
    if (!promptEvent || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    const currentPrompt = promptEvent;
    setPromptEvent(null);
    setInstallState("prompt_unavailable");
    try {
      await currentPrompt.prompt();
      const choice = await currentPrompt.userChoice;
      if (choice.outcome === "dismissed") { setRequestAccepted(false); setInstallState("dismissed"); setMessage("설치를 취소했습니다. 수동 설치 방법이나 웹 이용을 선택할 수 있습니다."); }
      else { setRequestAccepted(true); setMessage("설치 요청을 보냈습니다. 아이콘이나 독립 창을 확인하기 전에는 설치 완료로 보지 않습니다."); }
    } catch {
      setRequestAccepted(false); setInstallState("failed");
      setMessage("설치 창을 열지 못했습니다. 오류 내용은 저장하거나 전송하지 않았습니다. 수동 방법을 확인하세요.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      manualLinkRef.current?.focus({ preventScroll: true });
    }
  }

  const primary = outcome.next_action === "prompt_install"
    ? <button type="button" onClick={requestInstall} disabled={busy} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{busy ? "설치 안내 확인 중…" : actionCopy.prompt_install}</button>
    : outcome.next_action === "refresh_online"
      ? <button type="button" onClick={() => window.location.reload()} disabled={!online} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">{actionCopy.refresh_online}</button>
      : <Link href={actionHref(outcome.next_action)} className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-navy px-4 py-3 text-center text-sm font-semibold text-white">{actionCopy[outcome.next_action]} →</Link>;

  return <section data-pwa-lifecycle className="mt-6 rounded-2xl border-2 border-navy bg-white p-4 text-navy shadow-sm sm:p-5" aria-labelledby="pwa-next-action-title">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">pwa_install_next_action</p>
    <h2 id="pwa-next-action-title" className="mt-1 text-xl font-semibold">설치 전에 기록과 복구 경계를 확인하세요</h2>
    <p className="mt-2 text-xs leading-5 text-muted">이 PWA는 같은 웹사이트를 아이콘·독립 창으로 여는 방식입니다. 계정·자동 동기화가 생기지 않으며, 오프라인은 안내 한 화면만 보장합니다. 원래 기록 사본을 확인하고 JSON 백업과 구매 이용권 복구를 따로 관리하세요.</p>
    <label className="mt-3 block text-sm font-semibold" htmlFor="pwa-platform">내 기기·브라우저</label>
    <select id="pwa-platform" value={platform} onChange={event => setPlatform(event.target.value as PwaPlatform)} className="mt-1 min-h-11 w-full rounded-lg border border-navy bg-white px-3 text-sm">{Object.entries(platformLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    <p className="mt-2 text-xs leading-5 text-muted" role="status">{message || (!online ? "현재 오프라인입니다. 열린 화면과 도구 동작도 보장되지 않습니다." : updateAvailable ? "새 버전 신호가 있습니다. 저장하지 않은 작업을 먼저 확인한 뒤 온라인에서 새로고침하세요." : "설치 여부·기록 사본·현재 버전은 아직 확정하지 않았습니다.")}</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">{primary}<Link href="/tools" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-navy px-4 py-3 text-sm font-semibold">설치 없이 웹으로 계속</Link></div>
    <a ref={manualLinkRef} href="#manual-install" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline decoration-gold decoration-2 underline-offset-4">수동 설치·제거 안내로 이동 ↓</a>
    <details className="mt-1"><summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">9개 상태 필드 보기</summary><dl className="grid gap-2 sm:grid-cols-3">{pwaLifecycleFields.map(field => <div key={field} className="min-w-0 border border-border bg-surface p-2"><dt className="font-mono text-xs text-muted">{field}</dt><dd className="mt-1 break-words text-xs font-semibold">{outcome[field]}</dd></div>)}</dl></details>
  </section>;
}

function actionHref(action: ReturnType<typeof derivePwaInstallLifecycle>["next_action"]) {
  if (action === "open_platform_steps" || action === "remove_app_only") return "#manual-install";
  if (action === "verify_original_copy") return "#copy-safety";
  if (action === "backup_before_change") return "/data-transfer";
  if (action === "delete_site_data_after_backup") return "/privacy";
  if (action === "restore_paid_access") return "/payment-help";
  return "/tools";
}
