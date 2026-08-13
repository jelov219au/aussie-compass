"use client";

import { useEffect, useState } from "react";

type Bookmark = { href: string; title: string; savedAt: string };
const bookmarkKey = "aussie-compass-bookmarks-v1";

export function PageShareButton() {
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try { const bookmarks = JSON.parse(localStorage.getItem(bookmarkKey) || "[]") as Bookmark[]; setSaved(bookmarks.some((item) => item.href === window.location.pathname)); }
    catch { setSaved(false); }
  }, []);

  async function sharePage() {
    const shareData = { title: document.title, text: "호주 생활에 필요한 정보와 도구를 확인해 보세요.", url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setStatus("공유 메뉴를 열었습니다.");
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("링크를 복사했습니다.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(window.location.href);
        setStatus("링크를 복사했습니다.");
      } catch {
        setStatus("주소창의 링크를 복사해 공유해 주세요.");
      }
    }
  }

  function toggleBookmark() {
    try {
      const bookmarks = JSON.parse(localStorage.getItem(bookmarkKey) || "[]") as Bookmark[];
      const href = window.location.pathname;
      if (bookmarks.some((item) => item.href === href)) {
        localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks.filter((item) => item.href !== href)));
        setSaved(false); setStatus("저장한 페이지에서 제거했습니다.");
      } else {
        const title = document.title.replace(/\s*\|\s*Aussie Compass.*$/i, "");
        localStorage.setItem(bookmarkKey, JSON.stringify([{ href, title, savedAt: new Date().toISOString() }, ...bookmarks].slice(0, 30)));
        setSaved(true); setStatus("나의 진행 화면에 저장했습니다.");
      }
    } catch { setStatus("이 브라우저에서는 페이지를 저장할 수 없습니다."); }
  }

  return <div><div className="flex flex-wrap gap-x-6 gap-y-2"><button type="button" onClick={sharePage} className="inline-flex min-h-11 items-center gap-2 border-b-2 border-gold text-sm font-semibold text-navy"><span aria-hidden="true">↗</span>이 페이지 공유하기</button><button type="button" onClick={toggleBookmark} aria-pressed={saved} className="inline-flex min-h-11 items-center gap-2 border-b-2 border-border text-sm font-semibold text-navy"><span aria-hidden="true">{saved ? "◆" : "◇"}</span>{saved ? "저장됨" : "나중에 볼 페이지로 저장"}</button></div><p className="mt-2 min-h-5 text-xs text-muted" aria-live="polite">{status}</p></div>;
}
