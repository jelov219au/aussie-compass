"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { readBookmarks, toggleSavedPage } from "@/lib/bookmarks";
import { LOCAL_RECORD_UPDATED_EVENT, recordNeedsReview } from "@/lib/localRecordState";
import { canonicalArticleHref } from "@/lib/articleAliases.mjs";

export function PageShareButton() {
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const pathname = usePathname();
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [rawBackup, setRawBackup] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      const result = readBookmarks();
      setSaved(result.status === "valid" && result.value.some(item => item.href === canonicalArticleHref(window.location.pathname)));
      if (recordNeedsReview(result)) { setStatus("북마크를 확인하지 못했습니다. 기존 원문을 변경하지 않습니다."); setRawBackup(result.raw); }
      else setRawBackup(null);
    };
    setStatus(""); setFallbackUrl(""); refresh();
    window.addEventListener("focus", refresh); window.addEventListener("storage", refresh); window.addEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("storage", refresh); window.removeEventListener(LOCAL_RECORD_UPDATED_EVENT, refresh); };
  }, [pathname]);

  const recordShare = (method: string) => { try { track("Page Shared", { content: "resource", method }); } catch { /* Sharing succeeds independently of analytics. */ } };

  async function sharePage() {
    const shareData = { title: document.title, text: "호주 생활에 필요한 정보와 도구를 확인해 보세요.", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        recordShare("native");
        setStatus("공유 메뉴를 열었습니다.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        recordShare("clipboard");
        setStatus("링크를 복사했습니다.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(window.location.href);
        recordShare("clipboard_fallback");
        setStatus("링크를 복사했습니다.");
      } catch {
        setFallbackUrl(shareData.url);
        setStatus("공유와 자동 복사를 실행하지 못했습니다. 아래 정확한 페이지 주소를 선택해 복사하세요.");
      }
    }
  }

  function toggleBookmark() {
    const result = toggleSavedPage(window.location.pathname, document.title.replace(/\s*\|\s*Hoju Compass.*$/i, ""));
    if (result.status === "saved") {
      setSaved(!result.removed); setStatus(result.removed ? "이 페이지만 저장 목록에서 해제했습니다." : "나의 진행 화면에 저장했습니다.");
      try { track("Page Saved", { content: "resource", action: result.removed ? "removed" : "added" }); } catch { /* Optional analytics. */ }
    } else {
      setRawBackup(result.raw);
      setStatus(result.status === "full" ? "저장 목록이 30개 이상입니다. 기존 페이지는 그대로 보존했습니다. 내 Compass에서 페이지를 열어 저장을 해제한 뒤 추가하세요." : "저장하지 못했습니다. 기존 원문은 유지됩니다. 기기 저장소를 복구한 뒤 다시 시도하세요.");
    }
  }

  return <div className="min-w-0"><div className="flex flex-wrap gap-x-6 gap-y-2"><button type="button" onClick={sharePage} className="inline-flex min-h-11 items-center gap-2 border-b-2 border-gold text-sm font-semibold text-navy"><span aria-hidden="true">↗</span>이 페이지 공유하기</button><button type="button" onClick={toggleBookmark} aria-pressed={saved} className="inline-flex min-h-11 items-center gap-2 border-b-2 border-border text-sm font-semibold text-navy"><span aria-hidden="true">{saved ? "◆" : "◇"}</span>{saved ? "저장됨" : "나중에 볼 페이지로 저장"}</button></div><p className="mt-2 min-h-5 text-xs text-muted" aria-live="polite">{status}</p>{status && <Link href="/my-compass#saved-pages" className="inline-flex min-h-11 items-center text-sm underline">저장한 페이지 관리</Link>}{fallbackUrl && <label className="mt-2 block text-sm">직접 복사할 페이지 주소<input readOnly value={fallbackUrl} onFocus={event => event.target.select()} className="mt-1 min-h-11 w-full border p-2" /></label>}{rawBackup !== null && <label className="mt-2 block text-sm">북마크 원문 백업<textarea readOnly value={rawBackup} onFocus={event => event.target.select()} className="mt-1 min-h-24 w-full border p-2" /></label>}</div>;
}
