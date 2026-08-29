"use client";

import { useId, useState } from "react";
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
  "지원 마감일(YYYY-MM-DD, 모르면 미정):",
  "",
  "공개 채용 공고 링크(있다면, 개인 초대·추적 링크 제외):",
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
  const manualCopyHeadingId = useId();
  const copyText = launchInterestCopyText(email);

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState("copied");
      trackLaunchInterest(entry, "copy");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={copyRequest}
        aria-live="polite"
      >
        {copyState === "copied"
          ? "요청문과 이메일 주소를 복사했어요"
          : copyState === "failed"
            ? "자동 복사 실패 · 아래 요청문 직접 선택"
            : "메일 앱이 없으면 요청문 복사"}
      </button>
      {copyState === "failed" && (
        <section className="border border-gold/50 bg-gold/8 p-4 sm:col-span-2" aria-labelledby={manualCopyHeadingId}>
          <h3 id={manualCopyHeadingId} className="text-sm font-semibold text-navy">웹메일에 붙여 넣을 고정 요청문</h3>
          <p className="mt-2 text-xs leading-5 text-muted" role="status">자동 복사가 차단됐습니다. 아래 내용을 선택해 직접 복사하세요. 고정 요청문은 Hoju Compass 서버로 전송되지 않습니다.</p>
          <textarea
            value={copyText}
            readOnly
            rows={15}
            onFocus={(event) => event.currentTarget.select()}
            aria-label="Resume Pro 판매 시작 1회 안내 요청문"
            className="mt-3 w-full resize-y border border-navy/20 bg-white p-3 font-mono text-xs leading-5 text-navy outline-none focus:border-gold"
          />
        </section>
      )}
    </>
  );
}
