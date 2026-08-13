"use client";

import { useState } from "react";
import Link from "next/link";
import { ToolIcon } from "@/components/icons/Icons";

export type DirectoryTool = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  features: string[];
  cta: string;
  categories: string[];
  featured?: boolean;
};

const filters = [
  { id: "all", label: "전체" },
  { id: "arrival", label: "도착·첫 생활" },
  { id: "work", label: "취업·급여" },
  { id: "money", label: "돈 관리" },
  { id: "home", label: "집·이동·생활" },
  { id: "annual", label: "매년 챙기기" },
];

export function ToolsDirectory({ tools }: { tools: DirectoryTool[] }) {
  const [active, setActive] = useState("all");
  const visible = active === "all" ? tools : tools.filter((tool) => tool.categories.includes(active));
  return <>
    <div className="mt-8 rounded-2xl border border-border bg-white p-4 sm:p-5" aria-labelledby="tool-filter-heading"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="tool-filter-heading" className="font-semibold text-navy">지금 어떤 정보가 필요한가요?</h2><p className="mt-1 text-xs text-muted">상황을 선택하면 관련 도구만 남습니다.</p></div><p className="text-sm font-semibold text-navy" aria-live="polite">{visible.length}개 도구</p></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="상황별 도구 필터">{filters.map((filter)=><button key={filter.id} type="button" aria-pressed={active===filter.id} onClick={()=>setActive(filter.id)} className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${active===filter.id?"border-navy bg-navy text-white":"border-border bg-background text-navy hover:border-gold"}`}>{filter.label}</button>)}</div></div>
    <ul className="mt-8 grid gap-6 lg:grid-cols-2">
      {visible.map((tool) => {
        const featured = tool.featured && active === "all";
        return <li key={tool.href} className={featured ? "lg:col-span-2" : ""}><article className={`h-full overflow-hidden rounded-3xl border shadow-sm ${featured ? "border-gold/40 bg-navy text-white" : "border-border bg-white text-navy"}`}><div className={`grid h-full gap-7 p-7 sm:p-9 ${featured ? "lg:grid-cols-[1fr_auto] lg:items-center" : ""}`}><div><div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${featured ? "bg-white/10 text-gold" : "bg-gold/10 text-navy"}`}><ToolIcon /></div><p className="mt-5 text-sm font-semibold text-gold">{tool.eyebrow}</p><h2 className="mt-2 text-2xl font-semibold">{tool.title}</h2><p className={`mt-3 max-w-2xl leading-7 ${featured ? "text-white/70" : "text-muted"}`}>{tool.description}</p><ul className={`mt-5 flex flex-wrap gap-2 text-xs ${featured ? "text-white/75" : "text-muted"}`} aria-label={`${tool.title} 주요 기능`}>{tool.features.map((feature)=><li key={feature} className={`rounded-full border px-3 py-1.5 ${featured ? "border-white/15 bg-white/5" : "border-border bg-surface"}`}>{feature}</li>)}</ul></div><Link href={tool.href} className={`inline-flex min-h-12 items-center justify-center self-end rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${featured ? "bg-gold text-navy hover:bg-gold/90 focus-visible:ring-white focus-visible:ring-offset-navy lg:min-w-48" : "bg-navy text-white hover:bg-navy-light focus-visible:ring-navy"}`}>{tool.cta}</Link></div></article></li>;
      })}
    </ul>
  </>;
}
