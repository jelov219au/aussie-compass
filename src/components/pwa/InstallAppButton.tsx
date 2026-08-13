"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    return () => window.removeEventListener("beforeinstallprompt", capturePrompt);
  }, []);

  async function install() {
    if (!promptEvent) {
      setMessage("아래에서 사용 중인 기기의 설치 방법을 확인해 주세요.");
      document.getElementById("manual-install")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setMessage(choice.outcome === "accepted" ? "홈 화면에 추가하고 있습니다." : "나중에 다시 설치할 수 있습니다.");
    setPromptEvent(null);
  }

  return <div className="mt-7"><button type="button" onClick={install} className="inline-flex min-h-12 items-center rounded-lg bg-gold px-5 text-sm font-semibold text-navy shadow-sm">홈 화면에 앱으로 추가</button><p className="mt-3 min-h-5 text-sm text-white/70" aria-live="polite">{message}</p></div>;
}
