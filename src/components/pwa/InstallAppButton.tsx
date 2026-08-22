"use client";

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type DeviceKind = "ios" | "android" | "desktop" | "unknown";

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function detectDevice(): DeviceKind {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIPadDesktopMode = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(userAgent) || isIPadDesktopMode) return "ios";
  if (userAgent.includes("android")) return "android";
  if (/windows|macintosh|linux/.test(userAgent)) return "desktop";
  return "unknown";
}

function isRunningAsApp() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as NavigatorWithStandalone).standalone === true;
}

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [device, setDevice] = useState<DeviceKind>("unknown");
  const [installed, setInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const updateEnvironment = () => {
      setDevice(detectDevice());
      setInstalled(isRunningAsApp());
      setOnline(navigator.onLine);
    };
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const markInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setMessage("설치가 끝났어요. 이제 홈 화면에서 Hoju Compass를 바로 열 수 있어요.");
      track("App Install", { entry: "install_page", outcome: "installed" });
    };

    updateEnvironment();
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", markInstalled);
    window.addEventListener("online", updateEnvironment);
    window.addEventListener("offline", updateEnvironment);
    displayMode.addEventListener("change", updateEnvironment);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", markInstalled);
      window.removeEventListener("online", updateEnvironment);
      window.removeEventListener("offline", updateEnvironment);
      displayMode.removeEventListener("change", updateEnvironment);
    };
  }, []);

  async function install() {
    if (installed) {
      setMessage("지금 앱 화면으로 이용하고 있어요.");
      return;
    }
    if (!promptEvent) {
      const targetId = device === "ios" ? "ios-install" : device === "desktop" ? "desktop-install" : "android-install";
      track("App Install", { entry: "install_page", outcome: `manual_${device}` });
      setMessage(device === "ios"
        ? "iPhone과 iPad에서는 아래 Safari 설치 순서를 따라 주세요."
        : "아래에서 현재 기기에 맞는 설치 순서를 확인해 주세요.");
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    track("App Install", { entry: "install_page", outcome: choice.outcome });
    setMessage(choice.outcome === "accepted"
      ? "설치를 진행하고 있어요. 잠시 후 홈 화면을 확인해 주세요."
      : "괜찮아요. 필요할 때 이 페이지에서 다시 설치할 수 있어요.");
    setPromptEvent(null);
  }

  const buttonLabel = installed
    ? "앱으로 이용 중"
    : promptEvent
      ? "이 기기에 앱 설치"
      : device === "ios"
        ? "iPhone 설치 방법 보기"
        : "홈 화면에 앱으로 추가";

  return (
    <div className="mt-7">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={install}
          disabled={installed}
          className="inline-flex min-h-12 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy shadow-sm transition hover:bg-white disabled:cursor-default disabled:bg-white/15 disabled:text-white/70"
        >
          {buttonLabel}
        </button>
        <span className="inline-flex min-h-9 items-center rounded-full border border-white/20 px-3 text-xs font-medium text-white/70">
          {installed ? "설치 확인됨" : online ? "온라인 · 설치 가능" : "오프라인 상태"}
        </span>
      </div>
      <p className="mt-3 min-h-6 max-w-2xl text-sm leading-6 text-white/70" aria-live="polite">
        {message || (installed
          ? "브라우저 주소창 없이 Hoju Compass를 이용하고 있어요."
          : "설치해도 별도 계정은 생기지 않으며, 작성 기록은 현재 기기에 남아요.")}
      </p>
    </div>
  );
}
