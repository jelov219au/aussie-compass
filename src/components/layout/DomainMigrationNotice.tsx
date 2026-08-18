"use client";

import { useEffect, useState } from "react";

const legacyHostname = "aussie-compass.vercel.app";
const officialOrigin = "https://hojucompass.com";

export function DomainMigrationNotice() {
  const [destination, setDestination] = useState("");

  useEffect(() => {
    if (window.location.hostname !== legacyHostname) return;
    setDestination(`${officialOrigin}${window.location.pathname}${window.location.search}${window.location.hash}`);
  }, []);

  if (!destination) return null;

  return (
    <aside className="border-b border-gold/30 bg-navy text-white" aria-label="Hoju Compass 공식 주소 이전 안내">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">새 공식 주소를 알려드려요</p>
          <p className="mt-1 text-sm font-semibold leading-6 sm:text-base">공식 주소가 hojucompass.com으로 바뀌었습니다.</p>
          <p className="mt-1 text-xs leading-5 text-white/65 sm:text-sm">이 주소에 저장한 이력서·체크리스트·계산 기록은 자동으로 이동하지 않습니다. 기록이 있다면 먼저 백업한 뒤 새 주소에서 불러오세요.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <a href="/data-transfer#export-heading" className="inline-flex min-h-11 items-center justify-center border border-gold px-4 text-sm font-semibold text-gold transition hover:bg-gold hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">기록 먼저 옮기기</a>
          <a href={destination} className="inline-flex min-h-11 items-center justify-center bg-gold px-4 text-sm font-semibold text-navy transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">새 주소로 이동 →</a>
        </div>
      </div>
    </aside>
  );
}
