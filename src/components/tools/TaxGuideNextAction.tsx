"use client";
import { useState } from "react";
import { presentTaxGuideNextAction, taxGuideFieldLabels } from "@/lib/taxGuidePresentation";
import { buildTaxGuideNextAction, type LodgingPath, type TaxGuideScenario } from "@/lib/taxGuideNextAction";

const fields = ["income_year", "lodging_path", "due_state", "due_or_recheck", "official_route", "next_action"] as const;
const selfOptions = [["standard", "개인 ATO 기한을 아직 확인하지 않음"], ["individualDate", "ATO에 개인 신고기한이 표시됨"], ["individualUnreadable", "개인 기한을 읽거나 확인할 수 없음"], ["overdue", "일반 기한이 지났고 아직 신고하지 않음"], ["atoNotice", "ATO 통지·prosecution 관련 이력이 있음"], ["atoUnavailable", "ATO 공식 페이지를 확인할 수 없음"]] as const;
const agentOptions = [["agentUnverified", "세무사 TPB 등록을 아직 확인하지 않음"], ["agentAppearsRegistered", "TPB에서 같은 등록 정보를 찾음"], ["agentVerified", "Tax agent 등록·범위를 확인했고 제때 의뢰함"], ["agentLateContact", "처음/변경 세무사에게 10월 31일 이후 연락함"], ["priorOverdue", "이전 연도 신고가 남아 있음"], ["priorFixedPending", "이전 신고를 정리했지만 시스템 반영 대기"], ["agentUnregistered", "관련 유료 Tax agent 등록을 찾지 못함"], ["agentAmbiguous", "이름·법인 결과가 불명확함"], ["basOnly", "BAS agent만 확인됐는데 소득세 신고 서비스임"], ["tpbUnavailable", "TPB Public Register를 확인할 수 없음"]] as const;
const todaySydney = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function TaxGuideNextAction() {
  const [incomeYear, setIncomeYear] = useState<"unknown" | "2025-26">("2025-26");
  const [lodgingPath, setLodgingPath] = useState<LodgingPath>("unknown");
  const [scenario, setScenario] = useState<TaxGuideScenario>("standard");
  const [individualDueDate, setIndividualDueDate] = useState("");
  const result = buildTaxGuideNextAction({ incomeYear, lodgingPath, scenario, today: todaySydney(), individualDueDate });
  const presentation = presentTaxGuideNextAction(result);
  const options = lodgingPath === "registeredAgent" ? agentOptions : selfOptions;
  const changePath = (path: LodgingPath) => { setLodgingPath(path); setScenario(path === "registeredAgent" ? "agentUnverified" : "standard"); setIndividualDueDate(""); };
  return <section className="mt-6 rounded-2xl border-2 border-gold bg-white p-4 shadow-sm sm:p-6" aria-labelledby="tax-next-action-heading" data-tax-guide-next-action>
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">신고기한·세무사 확인</p><h2 id="tax-next-action-heading" className="mt-1 text-xl font-semibold text-navy">내 신고 경로의 다음 확인 한 가지</h2>
    <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-navy">대상 회계연도<select value={incomeYear} onChange={event => setIncomeYear(event.target.value as typeof incomeYear)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"><option value="2025-26">2025–26</option><option value="unknown">확인 필요</option></select></label><label className="text-sm font-semibold text-navy">신고 경로<select value={lodgingPath} onChange={event => changePath(event.target.value as LodgingPath)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"><option value="unknown">아직 결정하지 않음</option><option value="selfLodge">myTax 직접 신고</option><option value="registeredAgent">등록 세무사 이용</option></select></label></div>
    {lodgingPath !== "unknown" ? <label className="mt-3 block text-sm font-semibold text-navy">현재 확인 상태<select value={scenario} onChange={event => setScenario(event.target.value as TaxGuideScenario)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy">{options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}
    {scenario === "individualDate" ? <label className="mt-3 block text-sm font-semibold text-navy">ATO에 표시된 개인 신고기한<input type="date" value={individualDueDate} onChange={event => setIndividualDueDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-slate-400 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy sm:max-w-xs" /></label> : null}
    <div className="mt-4 rounded-xl bg-navy p-4 text-white" role="status" aria-live="polite"><p className="text-xs font-semibold text-gold">{presentation.due_state}</p><p className="mt-1 break-words text-lg font-semibold">{presentation.due_or_recheck}</p>{result.due_state === "general_self_lodge_date" ? <p className="mt-1 text-sm leading-6 text-white/80">2026년 10월 31일이 토요일이어서 다음 영업일을 적용한 일반 직접 신고 날짜입니다. 개인 확정 기한이 아닙니다.</p> : <p className="mt-1 text-sm leading-6 text-white/80">체크리스트 완료나 링크 열기는 신고·등록·기한 확인 완료가 아닙니다.</p>}<a href={result.official_route} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-gold px-4 py-2 text-center text-sm font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:w-auto">{presentation.next_action} ↗</a></div>
    <dl className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="세금 신고 다음 행동 결과">{fields.map(field => <div key={field} className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-3" data-tax-guide-field={field}><dt className="text-xs font-semibold text-slate-600">{taxGuideFieldLabels[field]}</dt><dd className="mt-1 break-words text-sm leading-6 text-navy">{presentation[field]}</dd></div>)}</dl>
    <p className="mt-3 text-xs leading-5 text-slate-600">개인 신고 의무·ATO notice·세무사 client-list·등록 범위는 공식 화면에서 직접 확인하세요. 이 선택과 날짜는 이 화면의 메모리에만 있고 저장·전송되지 않습니다.</p>
  </section>;
}
