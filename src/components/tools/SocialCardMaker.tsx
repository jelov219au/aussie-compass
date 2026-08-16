"use client";

import { useMemo, useRef, useState } from "react";

type FormatId = "square" | "portrait" | "story";
type ThemeId = "navy" | "forest" | "plum";

export type SocialCardInitialContent = {
  eyebrow?: string;
  title?: string;
  body?: string;
  cta?: string;
  path?: string;
};

const formats = {
  square: { label: "Instagram 정사각", width: 1080, height: 1080, ratio: "aspect-square" },
  portrait: { label: "Instagram 세로", width: 1080, height: 1350, ratio: "aspect-[4/5]" },
  story: { label: "Story · Shorts", width: 1080, height: 1920, ratio: "aspect-[9/16]" },
} as const;

const themes = {
  navy: { label: "Compass", background: "#1a2744", foreground: "#f8f7f4", accent: "#d0aa43", muted: "#c8cbd4" },
  forest: { label: "Eucalyptus", background: "#173d36", foreground: "#f4efe4", accent: "#d7a84b", muted: "#c2d1cb" },
  plum: { label: "Evening", background: "#40283b", foreground: "#fff7ef", accent: "#e89f85", muted: "#d8c4d1" },
} as const;

const presets = [
  { label: "처음 도착", eyebrow: "호주 도착 후 첫 30일", title: "처음 일주일, 무엇부터 해야 할까?", body: "전화·교통·은행부터 TFN과 첫 Payslip까지. 한꺼번에 말고 순서대로 준비하세요.", cta: "첫 30일 체크리스트 보기", path: "/arrival-checklist" },
  { label: "집 구하기", eyebrow: "쉐어하우스 방문 전 저장", title: "집을 볼 때 월세만 확인하면 안 되는 이유", body: "Bond, 공과금, 계약 상대, 곰팡이와 교통까지 현장에서 놓치기 쉬운 항목을 확인하세요.", cta: "집 방문 체크리스트 열기", path: "/property-inspection-checklist" },
  { label: "급여 확인", eyebrow: "내 시급을 지키는 3단계", title: "시급이 맞아도 급여가 틀릴 수 있어요", body: "Award·Classification·근무시간을 확인하고 Payslip의 loading, penalty와 Super를 비교하세요.", cta: "급여 가이드 확인하기", path: "/payslip-guide" },
  { label: "택스 리턴", eyebrow: "EOFY 준비", title: "택스 리턴 전에 먼저 모아야 할 것", body: "Income statement가 tax ready인지 확인하고 영수증과 공제 근거를 항목별로 정리하세요.", cta: "택스 리턴 준비하기", path: "/tax-return-guide" },
  { label: "귀국 준비", eyebrow: "호주 생활 마무리", title: "출국했다고 Super가 자동 환급되지는 않아요", body: "비자 종료와 출국 여부를 확인하고 DASP, 마지막 Tax return과 계정 접근을 준비하세요.", cta: "귀국 준비 가이드 보기", path: "/leaving-australia-guide" },
];

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
  });
  if (current) lines.push(current);
  return lines;
}

export function SocialCardMaker({ baseUrl, initialContent }: { baseUrl: string; initialContent?: SocialCardInitialContent }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<FormatId>("portrait");
  const [theme, setTheme] = useState<ThemeId>("navy");
  const [brand, setBrand] = useState("HOJU COMPASS");
  const [eyebrow, setEyebrow] = useState(initialContent?.eyebrow ?? presets[0].eyebrow);
  const [title, setTitle] = useState(initialContent?.title ?? presets[0].title);
  const [body, setBody] = useState(initialContent?.body ?? presets[0].body);
  const [cta, setCta] = useState(initialContent?.cta ?? presets[0].cta);
  const [path, setPath] = useState(initialContent?.path ?? presets[0].path);
  const [status, setStatus] = useState("");
  const activeFormat = formats[format];
  const activeTheme = themes[theme];
  const displayUrl = `${baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const caption = useMemo(() => `${title}\n\n${body}\n\n${cta}\n${displayUrl}\n\n#호주생활 #호주워홀 #호주유학`, [body, cta, displayUrl, title]);

  function applyPreset(index: number) {
    const preset = presets[index];
    setEyebrow(preset.eyebrow); setTitle(preset.title); setBody(preset.body); setCta(preset.cta); setPath(preset.path);
  }

  async function downloadCard() {
    await document.fonts.ready;
    const { width, height } = activeFormat;
    const canvas = document.createElement("canvas");
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const scale = width / 1080;
    const pad = 86 * scale;
    ctx.fillStyle = activeTheme.background; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = activeTheme.accent; ctx.lineWidth = 3 * scale;
    ctx.beginPath(); ctx.arc(width - 150 * scale, 150 * scale, 72 * scale, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(width - 150 * scale, 100 * scale); ctx.lineTo(width - 123 * scale, 173 * scale); ctx.lineTo(width - 150 * scale, 156 * scale); ctx.lineTo(width - 177 * scale, 173 * scale); ctx.closePath(); ctx.fillStyle = activeTheme.foreground; ctx.fill();
    ctx.fillStyle = activeTheme.accent; ctx.font = `700 ${26 * scale}px Arial, sans-serif`; ctx.letterSpacing = `${3 * scale}px`; ctx.fillText(brand.toUpperCase().slice(0, 28), pad, pad + 8 * scale);
    ctx.fillStyle = activeTheme.muted; ctx.font = `600 ${25 * scale}px Arial, sans-serif`; ctx.letterSpacing = "0px"; ctx.fillText(eyebrow.slice(0, 45), pad, height * 0.27);
    ctx.fillStyle = activeTheme.foreground; ctx.font = `700 ${format === "story" ? 76 : 70}px system-ui, sans-serif`;
    const titleLines = wrapCanvasText(ctx, title.slice(0, 58), width - pad * 2);
    const titleY = height * 0.34;
    const titleLineHeight = (format === "story" ? 98 : 90) * scale;
    titleLines.slice(0, format === "story" ? 4 : 3).forEach((line, index) => ctx.fillText(line, pad, titleY + index * titleLineHeight));
    const bodyY = titleY + Math.min(titleLines.length, format === "story" ? 4 : 3) * titleLineHeight + 48 * scale;
    ctx.fillStyle = activeTheme.muted; ctx.font = `400 ${32 * scale}px system-ui, sans-serif`;
    const bodyLines = wrapCanvasText(ctx, body.slice(0, 150), width - pad * 2);
    bodyLines.slice(0, format === "story" ? 5 : 4).forEach((line, index) => ctx.fillText(line, pad, bodyY + index * 48 * scale));
    const footerY = height - 155 * scale;
    ctx.strokeStyle = activeTheme.accent; ctx.lineWidth = 2 * scale; ctx.beginPath(); ctx.moveTo(pad, footerY - 52 * scale); ctx.lineTo(width - pad, footerY - 52 * scale); ctx.stroke();
    ctx.fillStyle = activeTheme.foreground; ctx.font = `700 ${27 * scale}px system-ui, sans-serif`; ctx.fillText(`${cta.slice(0, 42)}  →`, pad, footerY);
    ctx.fillStyle = activeTheme.muted; ctx.font = `400 ${20 * scale}px Arial, sans-serif`; ctx.fillText(displayUrl.slice(0, 76), pad, footerY + 44 * scale);
    canvas.toBlob((blob) => { if (!blob) return; const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `hoju-compass-${format}.png`; anchor.click(); URL.revokeObjectURL(url); setStatus("PNG 이미지를 저장했습니다."); }, "image/png");
  }

  async function copyCaption() {
    try { await navigator.clipboard.writeText(caption); setStatus("게시물 설명을 복사했습니다."); }
    catch { setStatus("아래 설명문을 직접 선택해 복사해 주세요."); }
  }

  const inputClass = "mt-1.5 min-h-11 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy outline-none focus:border-navy focus:ring-2 focus:ring-navy/15";

  return <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]"><section className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-semibold text-navy">카드 내용 편집</h2>{initialContent && <p className="mt-3 border-l-2 border-gold pl-3 text-sm leading-6 text-muted">선택한 실용 자료의 제목과 요약을 불러왔습니다. 게시하기 전에 문장을 원하는 톤으로 다듬어 보세요.</p>}<div className="mt-5"><p className="text-sm font-medium text-navy">주제 예시</p><div className="mt-2 flex flex-wrap gap-2">{presets.map((preset,index)=><button key={preset.label} type="button" onClick={()=>applyPreset(index)} className="min-h-10 rounded-full border border-border px-3 text-sm text-muted hover:border-gold hover:text-navy">{preset.label}</button>)}</div></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-navy">이미지 크기<select className={inputClass} value={format} onChange={(e)=>setFormat(e.target.value as FormatId)}>{Object.entries(formats).map(([id,item])=><option key={id} value={id}>{item.label} · {item.width}×{item.height}</option>)}</select></label><label className="text-sm font-medium text-navy">색상<select className={inputClass} value={theme} onChange={(e)=>setTheme(e.target.value as ThemeId)}>{Object.entries(themes).map(([id,item])=><option key={id} value={id}>{item.label}</option>)}</select></label></div><div className="mt-4 space-y-4"><label className="block text-sm font-medium text-navy">브랜드 표기<input className={inputClass} value={brand} maxLength={28} onChange={(e)=>setBrand(e.target.value)} /></label><label className="block text-sm font-medium text-navy">작은 제목<input className={inputClass} value={eyebrow} maxLength={45} onChange={(e)=>setEyebrow(e.target.value)} /></label><label className="block text-sm font-medium text-navy">핵심 문장<textarea className={`${inputClass} min-h-24 resize-y`} value={title} maxLength={58} onChange={(e)=>setTitle(e.target.value)} /><span className="mt-1 block text-right text-xs text-muted">{title.length}/58</span></label><label className="block text-sm font-medium text-navy">설명<textarea className={`${inputClass} min-h-28 resize-y`} value={body} maxLength={150} onChange={(e)=>setBody(e.target.value)} /><span className="mt-1 block text-right text-xs text-muted">{body.length}/150</span></label><label className="block text-sm font-medium text-navy">버튼 문구<input className={inputClass} value={cta} maxLength={42} onChange={(e)=>setCta(e.target.value)} /></label><label className="block text-sm font-medium text-navy">연결할 페이지<input className={inputClass} value={path} onChange={(e)=>setPath(e.target.value)} placeholder="/arrival-checklist" /></label></div></section><section><div className="mx-auto max-w-[560px]"><p className="mb-3 flex items-center justify-between text-sm font-medium text-navy"><span>미리보기</span><span className="font-mono text-xs text-muted">{activeFormat.width} × {activeFormat.height}</span></p><div ref={previewRef} className={`${activeFormat.ratio} relative overflow-hidden shadow-xl`} style={{background:activeTheme.background,color:activeTheme.foreground}}><div className="absolute right-[8%] top-[6%] flex h-[14%] aspect-square items-center justify-center rounded-full border-2" style={{borderColor:activeTheme.accent}}><span className="inline-block h-[44%] w-[20%] rotate-[38deg]" style={{background:activeTheme.foreground,clipPath:"polygon(50% 0, 100% 100%, 50% 78%, 0 100%)"}} /></div><div className="flex h-full flex-col p-[8%]"><p className="text-[clamp(10px,2.3vw,18px)] font-bold tracking-[0.18em]" style={{color:activeTheme.accent}}>{brand.toUpperCase()}</p><div className="mt-auto mb-auto pt-[20%]"><p className="text-[clamp(10px,2.2vw,17px)] font-semibold" style={{color:activeTheme.muted}}>{eyebrow}</p><h3 className="mt-[4%] max-w-[92%] text-[clamp(25px,6.5vw,50px)] font-bold leading-[1.17] tracking-tight">{title}</h3><p className="mt-[6%] max-w-[94%] text-[clamp(11px,2.7vw,21px)] leading-[1.55]" style={{color:activeTheme.muted}}>{body}</p></div><div className="border-t pt-[5%]" style={{borderColor:activeTheme.accent}}><p className="text-[clamp(11px,2.5vw,19px)] font-bold">{cta} →</p><p className="mt-[2%] truncate text-[clamp(8px,1.7vw,13px)]" style={{color:activeTheme.muted}}>{displayUrl}</p></div></div></div><div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={downloadCard} className="inline-flex min-h-12 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">PNG 저장</button><button type="button" onClick={copyCaption} className="inline-flex min-h-12 items-center rounded-lg border border-navy px-5 text-sm font-semibold text-navy">설명문 복사</button></div><p className="mt-3 min-h-5 text-sm text-muted" aria-live="polite">{status}</p><details className="mt-5 border-t border-border pt-4"><summary className="cursor-pointer text-sm font-semibold text-navy">복사될 게시물 설명 미리보기</summary><pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface p-4 font-sans text-sm leading-6 text-muted">{caption}</pre></details></div></section></div>;
}
