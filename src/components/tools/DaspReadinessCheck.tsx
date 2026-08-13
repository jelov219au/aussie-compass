"use client";

import { useState } from "react";

const conditions=[
 {id:"temporary",label:"임시비자로 일하며 Super가 적립됨",detail:"Subclass 405·410 등 제외가 있으므로 ATO 자격 기준을 확인하세요."},
 {id:"departed",label:"이미 호주를 출국함",detail:"호주 안에서는 신청 내용을 저장할 수 있어도 DASP 제출은 할 수 없습니다."},
 {id:"ceased",label:"해당 임시비자가 더 이상 유효하지 않음",detail:"만료 또는 취소 여부를 공식 기록에서 확인하세요."},
 {id:"status",label:"호주·뉴질랜드 시민 또는 호주 영주권자가 아님",detail:"시민권·영주권 상태에 따라 DASP 대상이 아닐 수 있습니다."},
];

export function DaspReadinessCheck(){
 const [checked,setChecked]=useState<string[]>([]);const complete=conditions.every((condition)=>checked.includes(condition.id));
 return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="dasp-ready-heading"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-gold">신청 가능 시점 확인</p><h2 id="dasp-ready-heading" className="mt-2 text-2xl font-semibold text-navy">DASP 기본 조건 점검</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">자가 점검일 뿐 최종 자격 판정이 아닙니다. 공식 온라인 시스템이 Home Affairs 정보와 대조해 자격을 확인합니다.</p></div><span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${complete?"bg-emerald-100 text-emerald-800":"bg-surface text-muted"}`}>{checked.length}/{conditions.length} 확인</span></div><div className="mt-6 grid gap-3 md:grid-cols-2">{conditions.map((condition)=><label key={condition.id} className="flex cursor-pointer gap-3 rounded-xl border border-border p-4 hover:bg-surface"><input type="checkbox" checked={checked.includes(condition.id)} onChange={()=>setChecked((current)=>current.includes(condition.id)?current.filter((id)=>id!==condition.id):[...current,condition.id])} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-gold)]"/><span><span className="block text-sm font-semibold text-navy">{condition.label}</span><span className="mt-1 block text-xs leading-5 text-muted">{condition.detail}</span></span></label>)}</div><div className={`mt-6 rounded-xl p-4 text-sm leading-6 ${complete?"border border-emerald-300 bg-emerald-50 text-emerald-950":"bg-surface text-muted"}`} aria-live="polite">{complete?"기본 조건은 모두 체크했습니다. 공식 DASP 시스템에서 신원·비자·Super 정보를 입력해 실제 자격을 확인하세요.":"아직 출국 전이거나 비자가 유효하다면, 펀드 정보를 준비하고 출국 후 신청 단계로 돌아오세요."}</div></section>
}
