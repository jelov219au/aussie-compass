"use client";

import { track } from "@vercel/analytics";

import type { ResumeProEntry } from "@/lib/resumeProAttribution";

type Props = {
  email: string;
  entry: ResumeProEntry;
  className?: string;
  children: React.ReactNode;
};

function launchInterestHref(email: string) {
  const subject = "[Hoju Compass] Resume Pro 판매 시작 1회 안내 요청";
  const body = [
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

  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ResumeProLaunchInterestLink({ email, entry, className, children }: Props) {
  return (
    <a
      href={launchInterestHref(email)}
      className={className}
      onClick={() => {
        try {
          track("Resume Pro Launch Interest", { entry });
        } catch {
          // Analytics must never block the visitor's email app.
        }
      }}
    >
      {children}
    </a>
  );
}
