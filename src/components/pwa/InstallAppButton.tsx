"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inFlight = useRef(false);
  const manualLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const installed = () => {
      setPromptEvent(null);
      setMessage("홈 화면에 추가되었습니다. 홈 화면의 Hoju Compass 아이콘으로 열어 주세요.");
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!promptEvent || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    // The browser prompt is single-use; keep the manual route available throughout.
    setPromptEvent(null);
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      track("App Install", { entry: "install_page", outcome: choice.outcome });
      setMessage(choice.outcome === "accepted"
        ? "설치 요청을 보냈습니다. 홈 화면에 아이콘이 추가되는지 확인해 주세요."
        : "설치를 취소했습니다. 원할 때 아래 기기별 설치 방법으로 다시 진행할 수 있습니다.");
    } catch {
      setMessage("설치 창을 열지 못했습니다. 아래 기기별 설치 방법을 이용해 주세요.");
    } finally {
      inFlight.current = false;
      setBusy(false);
      manualLinkRef.current?.focus({ preventScroll: true });
    }
  }

  return <div className="mt-7">
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      {promptEvent || busy ? <button type="button" onClick={install} disabled={busy} className="inline-flex min-h-12 items-center justify-center rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-navy shadow-sm disabled:cursor-wait disabled:opacity-70">{busy ? "설치 안내 확인 중…" : "홈 화면에 앱으로 추가"}</button> : null}
      <a ref={manualLinkRef} href="#manual-install" onClick={() => track("App Install", { entry: "install_page", outcome: "manual_instructions" })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">기기별 설치 방법 보기 <span aria-hidden="true">↓</span></a>
    </div>
    <p className="mt-3 text-sm leading-6 text-white/80">설치 버튼이 없거나 이미 설치했다면 기기별 안내를 확인하세요. 설치하지 않고도 같은 도구를 쓸 수 있습니다.</p>
    <p className="mt-3 min-h-5 text-sm leading-6 text-white/80" role="status">{message}</p>
  </div>;
}
