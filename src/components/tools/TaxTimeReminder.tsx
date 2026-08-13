"use client";

import { useMemo, useState } from "react";

function event(uid:string,date:string,summary:string,description:string){return ["BEGIN:VEVENT",`UID:${uid}@aussiecompass`,`DTSTART;VALUE=DATE:${date}`,`SUMMARY:${summary}`,`DESCRIPTION:${description}`,"END:VEVENT"].join("\r\n")}

export function TaxTimeReminder(){
 const defaultYear=useMemo(()=>{const now=new Date();return now.getMonth()>=6?now.getFullYear():now.getFullYear()-1},[]);
 const [year,setYear]=useState(defaultYear);
 function download(){const next=String(year+1);const body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Aussie Compass//Tax Time//KO","CALSCALE:GREGORIAN",event(`tax-ready-${year}`,`${next}0725`,"택스 리턴 자료 준비 확인","Income statement의 Tax ready 상태와 ATO pre-fill 자료를 확인하세요."),event(`tax-agent-${year}`,`${next}1015`,"택스 리턴 마감 전 최종 확인","직접 신고 또는 등록 세무사 의뢰 상태를 확인하세요. 일반적인 직접 신고 기한은 10월 31일이지만 개인 상황과 최신 ATO 안내를 확인하세요."),"END:VCALENDAR"].join("\r\n");const url=URL.createObjectURL(new Blob([body],{type:"text/calendar;charset=utf-8"}));const link=document.createElement("a");link.href=url;link.download=`tax-time-${year}-${year+1}.ics`;link.click();URL.revokeObjectURL(url)}
 return <section className="rounded-2xl border border-gold/40 bg-gold/5 p-6 sm:p-8" aria-labelledby="tax-reminder-heading"><p className="text-sm font-semibold text-gold">매년 다시 방문할 이유</p><h2 id="tax-reminder-heading" className="mt-2 text-2xl font-semibold text-navy">EOFY 캘린더 리마인더</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">7월 25일 자료 준비 확인과 10월 15일 마감 전 점검 일정을 캘린더에 추가합니다. 실제 신고 기한은 개인 상황과 ATO 최신 안내를 확인하세요.</p><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="text-sm font-medium text-navy">시작 회계연도<div className="mt-2 flex items-center gap-2"><input type="number" min="2020" max="2100" value={year} onChange={(e)=>setYear(Number(e.target.value))} className="min-h-11 w-28 rounded-lg border border-border bg-white px-3"/><span className="text-sm text-muted">– {year+1}</span></div></label><button type="button" onClick={download} className="min-h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white">캘린더 파일 받기</button></div></section>
}
