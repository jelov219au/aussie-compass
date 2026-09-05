"use client";

import { useEffect, useId, useRef, useState } from "react";

export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [requested, setRequested] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const noticeId = useId();

  useEffect(() => {
    if (requested) frameRef.current?.focus({ preventScroll: true });
  }, [requested]);

  return (
    <>
      <p id={noticeId} className="mb-3 text-sm leading-6 text-muted">
        영상을 불러오면 YouTube에 연결됩니다. 인터넷 연결이 필요해요.
      </p>
      <div className="relative w-full overflow-hidden rounded-xl bg-surface" style={{ aspectRatio: "16 / 9", minHeight: 200 }}>
        {requested ? (
          <iframe
            ref={frameRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&playsinline=1&controls=1&hl=ko&cc_lang_pref=ko`}
            title={`YouTube 동영상: ${title}`}
            aria-describedby={noticeId}
            tabIndex={0}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-navy"
          />
        ) : (
          <button
            type="button"
            onClick={() => setRequested(true)}
            aria-label={`${title} 영상 불러오기`}
            aria-describedby={noticeId}
            className="absolute inset-0 flex min-h-11 w-full flex-col items-center justify-center gap-3 p-4 text-navy hover:bg-border/50 focus-visible:outline-offset-[-6px]"
          >
            <span className="text-sm font-semibold text-gold-ink">Hoju Compass · YouTube</span>
            <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-xl text-white">▶</span>
            <span className="text-base font-semibold">영상 불러오기</span>
          </button>
        )}
      </div>
      <p role="status" className="sr-only">{requested ? "YouTube 플레이어에서 재생 버튼을 눌러주세요. 재생되지 않으면 아래 YouTube에서 보기 링크를 이용하세요." : ""}</p>
      <noscript><p className="mt-3 text-sm leading-6 text-muted">사이트 안에서 영상을 보려면 JavaScript가 필요해요. 아래 YouTube에서 보기 링크로도 볼 수 있습니다.</p></noscript>
    </>
  );
}
