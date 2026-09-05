"use client";

import { useEffect, useState } from "react";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { Container } from "@/components/ui/Container";
import { ARTICLE_READING_UPDATED_EVENT } from "@/lib/articleProgress";
import { LOCAL_RECORD_UPDATED_EVENT, recordNeedsReview } from "@/lib/localRecordState";
import { readCompassRecords } from "@/lib/compassRecords";
import installStyles from "./HomeInstallBanner.module.css";

export function ReturnVisitSection() {
  const [summary, setSummary] = useState("");
  const [needsReview, setNeedsReview] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const records = readCompassRecords();
      const work = records.items.filter(item => item.active).length;
      const pages = records.bookmarks.status === "valid" ? records.bookmarks.value.length : 0;
      const reading = records.reading.status === "valid" ? records.reading.value.filter(item => Date.parse(item.completedAt) <= Date.now()).length : 0;
      setSummary(work || pages || reading ? `이어갈 작업 ${work}개 · 저장 페이지 ${pages}개 · 본 자료 ${reading}개` : "시작한 일을 다시 이어보세요.");
      setNeedsReview(records.items.some(recordNeedsReview) || recordNeedsReview(records.bookmarks) || recordNeedsReview(records.reading));
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    window.addEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
    window.addEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ARTICLE_READING_UPDATED_EVENT, refresh);
      window.removeEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh);
    };
  }, []);

  return (
    <section className="border-b border-border bg-surface py-6" aria-label="저장한 작업 이어가기">
      <Container>
        <div className="grid gap-5 rounded-2xl border border-border bg-white px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
          <div className="flex gap-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-sm text-gold-ink" aria-hidden="true">↗</span>
            <div>
              <p className="font-semibold text-navy">
                {summary || "시작한 일을 다시 이어보세요."}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                {needsReview ? "읽거나 확인하지 못한 기록이 있습니다. 내 Compass에서 다른 정상 작업과 확인할 항목을 나눠 볼 수 있어요." : "기기 저장에 성공한 기록을 다시 열 수 있어요. 기기 간 자동 동기화는 아니에요."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <TrackedLink href="/my-compass" eventName="Home Navigation" properties={{ section: "return_visit", destination: "my_compass" }} className="inline-flex min-h-11 items-center text-navy">이어서 보기 →</TrackedLink>
            <TrackedLink href="/install" eventName="Home Navigation" properties={{ section: "return_visit", destination: "install" }} className={`${installStyles.prompt} inline-flex min-h-11 items-center text-muted hover:text-navy`}>홈 화면에 추가</TrackedLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
