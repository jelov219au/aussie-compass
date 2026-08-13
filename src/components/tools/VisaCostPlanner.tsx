"use client";

import { useEffect, useMemo, useState } from "react";

const fields=[
 {id:"application",label:"비자 신청비",hint:"Home Affairs Pricing Estimator에서 확인"},
 {id:"medical",label:"신체검사",hint:"Referral letter의 검사 코드로 예약 시 확인"},
 {id:"police",label:"경찰증명서",hint:"요청 국가와 발급·배송 비용"},
 {id:"translation",label:"번역·인증",hint:"비영문 문서와 요구 형식 확인"},
 {id:"biometrics",label:"생체정보",hint:"요청받은 경우 센터·이동 비용 포함"},
 {id:"insurance",label:"건강보험",hint:"해당 비자의 보험 조건 별도 확인"},
 {id:"advice",label:"전문가 도움",hint:"이용하는 경우 등록 여부와 서비스 범위 확인"},
 {id:"travel",label:"이동·기타",hint:"검사 장소 교통, 사진, 우편 등"},
];
const storageKey="aussie-compass-visa-cost-plan-v1";

export function VisaCostPlanner(){
 const [values,setValues]=useState<Record<string,string>>({});const [loaded,setLoaded]=useState(false);
 useEffect(()=>{try{const saved=localStorage.getItem(storageKey);if(saved)setValues(JSON.parse(saved))}catch{}setLoaded(true)},[]);useEffect(()=>{if(!loaded)return;try{localStorage.setItem(storageKey,JSON.stringify(values))}catch{}},[values,loaded]);
 const total=useMemo(()=>fields.reduce((sum,field)=>sum+(Number(values[field.id])||0),0),[values]);
 return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="visa-cost-heading"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold">고정 금액 대신 내 견적 입력</p><h2 id="visa-cost-heading" className="mt-2 text-2xl font-semibold text-navy">비자 준비 총비용 계산</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">비자와 신체검사 비용은 신청 시점, 검사 코드, 국가와 개인 상황에 따라 달라집니다. 공식 화면에서 확인한 금액만 입력하세요.</p></div><div className="rounded-xl bg-navy px-5 py-4 text-white"><span className="text-xs text-white/65">현재 예상 합계</span><strong className="mt-1 block text-2xl">${total.toLocaleString(undefined,{maximumFractionDigits:2})}</strong></div></div><div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{fields.map((field)=><label key={field.id} className="text-sm font-medium text-navy">{field.label} ($)<input type="number" min="0" step="0.01" inputMode="decimal" value={values[field.id]||""} onChange={(event)=>setValues((current)=>({...current,[field.id]:event.target.value}))} className="mt-2 min-h-11 w-full rounded-lg border border-border px-3"/><span className="mt-1 block text-xs leading-5 text-muted">{field.hint}</span></label>)}</div>{total>0&&<button type="button" onClick={()=>setValues({})} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy">비용 초기화</button>}</section>
}
