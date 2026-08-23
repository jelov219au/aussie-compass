"use client";

import { useState } from "react";
import { track } from "@vercel/analytics";

import type { ResumeProEntry } from "@/lib/resumeProAttribution";

type Props = {
  email: string;
  entry: ResumeProEntry;
  className?: string;
  children: React.ReactNode;
};

const launchInterestSubject = "[Hoju Compass] Resume Pro 판매 시작 1회 안내 요청";
const launchInterestBody = [
  "Resume Pro 판매가 시작되면 이 이메일로 한 번 안내해 주세요.",
  "",
  "지원하려는 직무:",
  "",
  "지원 마감일(알고 있다면):",
  "",
  "무료 이력서 경력 초안: 있음 / 아직 없음",
  "",
  "이 이메일은 자동 마케팅 구독 신청이 아닙니다.",
  "이력서 원문, 회사 내부정보, 여권·비자·TFN·주소·생년월일 또는 결제정보는 보내지 마세요.",
].join("\n");

function launchInterestHref(email: string) {
  return `mailto:${email}?subject=${encodeURIComponent(launchInterestSubject)}&body=${encodeURIComponent(launchInterestBody)}`;
}

function launchInterestCopyText(email: string) {
  return [
    `받는 사람: ${email}`,
    `제목: ${launchInterestSubject}`,
    "",
    launchInterestBody,
  ].join("\n");
}

function trackLaunchInterest(entry: ResumeProEntry, method: "mailto" | "copy") {
  try {
    track("Resume Pro Launch Interest", { entry, method });
  } catch {
    // Analytics must never block the visitor's email action.
  }
}

export function ResumeProLaunchInterestLink({ email, entry, className, children }: Props) {
  return (
    <a
      href={launchInterestHref(email)}
      className={className}
      onClick={() => trackLaunchInterest(entry, "mailto")}
    >
      {children}
    </a>
  );
}

export function ResumeProLaunchInterestCopyButton({ email, entry, className }: Omit<Props, "children">) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(launchInterestCopyText(email));
      setCopyState("copied");
      trackLaunchInterest(entry, "copy");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <button
      type="button"
      className={className}
      onClick={copyRequest}
      aria-live="polite"
    >
      {copyState === "copied"
        ? "요청문과 이메일 주소를 복사했어요"
        : copyState === "failed"
          ? `복사 실패 · ${email}로 직접 보내기`
          : "메일 앱이 없으면 요청문 복사"}
    </button>
  );
}
