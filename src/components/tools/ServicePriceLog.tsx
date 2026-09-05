"use client";
import { useState, type FormEvent } from "react";
import { amount, money } from "@/lib/personalPlans";
import { costFields, parsePrices, priceGroups, priceTotal, serializePrices, serviceCategories, serviceStates, validMonth, type CostKey, type PriceRecord } from "@/lib/serviceRecords";
import { useLocalPlan } from "@/lib/useLocalPlan";
const initial: PriceRecord[] = [];
const emptyCosts = { callout: "", labour: "", materials: "", other: "" };
const inputClass = "mt-2 min-h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy";
const condition = (item: PriceRecord) => `${item.state} · ${item.period || "월 미입력"} · ${item.timing === "afterhours" ? "야간·주말·긴급" : "일반 시간"} · ${item.status === "completed" ? "결제 완료" : "견적만 받음"}`;
export function ServicePriceLog() {
  const { data: records, update: setRecords, storage, saveState, reset } = useLocalPlan("aussie-compass-service-price-log-v1", initial, parsePrices, serializePrices, { initial: "아직 저장한 가격 기록 없음", reset: "가격 기록과 저장본을 초기화했습니다" });
  const [category, setCategory] = useState(serviceCategories[0]), [state, setState] = useState(serviceStates[0]), [period, setPeriod] = useState("");
  const [timing, setTiming] = useState("standard"), [status, setStatus] = useState("completed"), [costs, setCosts] = useState(emptyCosts);
  const [itemised, setItemised] = useState(false), [confirmedTotal, setConfirmedTotal] = useState(false), [message, setMessage] = useState("");
  const groups = priceGroups(records), values = costFields.map(([key]) => amount(costs[key])), complete = values.every(v => v !== null), known = values.filter((v): v is number => v !== null);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!validMonth(period)) { setMessage("기록한 월을 입력하세요."); return; }
    if (!complete) { setMessage("비용 네 항목을 확인하세요. 빈칸은 미확인이며, 실제 0원인 항목만 0을 입력하세요. 미완성 소계는 기록 요약에 넣지 않습니다."); return; }
    if (records.length >= 500) { setMessage("최대 500건입니다. 필요한 기록을 따로 보관하고 정리하세요."); return; }
    const item: PriceRecord = { id: crypto.randomUUID(), category, state, period, timing, status, itemised, confirmedTotal, ...Object.fromEntries(costFields.map(([key]) => [key, amount(costs[key])!])) as Record<CostKey, number> };
    setRecords(current => [item, ...current]); setCosts(emptyCosts); setItemised(false); setConfirmedTotal(false); setMessage("기록을 화면에 추가했습니다. 저장 상태를 확인하세요.");
  }
  return <section className="min-w-0 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="price-log-heading">
    <p className="text-sm font-semibold text-gold">내가 받은 견적과 실제 지출</p><h2 id="price-log-heading" className="mt-2 text-2xl font-semibold text-navy">내 서비스 가격 기록</h2><p className="mt-2 text-sm leading-6 text-muted">업체명·작업자 이름·전화번호·주소·리뷰를 받지 않습니다. 현재 브라우저에만 저장하며 서버로 공유하지 않습니다.</p>
    <p role="status" className="mt-3 text-sm text-navy">{saveState}</p>{storage === "blocked" && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm leading-6 text-amber-900">기존 저장본을 읽거나 확인하지 못해 원문을 보존하고 자동 저장을 중지했습니다. 화면의 새 기록은 저장되지 않습니다. 필요한 내용은 따로 보관하세요.</p>}
    <form onSubmit={submit} className="mt-7 rounded-2xl bg-surface p-4 sm:p-6"><fieldset disabled={storage === "loading"}><legend className="sr-only">가격 기록 입력</legend><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="min-w-0 text-sm font-medium text-navy">서비스<select value={category} onChange={event => setCategory(event.target.value)} className={inputClass}>{serviceCategories.map(v => <option key={v}>{v}</option>)}</select></label>
      <label className="min-w-0 text-sm font-medium text-navy">주·준주<select value={state} onChange={event => setState(event.target.value)} className={inputClass}>{serviceStates.map(v => <option key={v}>{v}</option>)}</select></label>
      <label className="min-w-0 text-sm font-medium text-navy">기록한 월<input type="month" value={period} onChange={event => setPeriod(event.target.value)} className={inputClass} /></label>
      <label className="min-w-0 text-sm font-medium text-navy">시간대<select value={timing} onChange={event => setTiming(event.target.value)} className={inputClass}><option value="standard">일반 시간</option><option value="afterhours">야간·주말·긴급</option></select></label>
      <label className="min-w-0 text-sm font-medium text-navy">기록 유형<select value={status} onChange={event => setStatus(event.target.value)} className={inputClass}><option value="completed">결제 완료</option><option value="quote">견적만 받음</option></select></label>
      {costFields.map(([key, label]) => <label key={key} className="min-w-0 text-sm font-medium text-navy">{label} (AUD)<input inputMode="decimal" maxLength={32} value={costs[key]} onChange={event => setCosts(current => ({ ...current, [key]: event.target.value }))} className={inputClass} aria-invalid={costs[key].trim() !== "" && amount(costs[key]) === null} />{amount(costs[key]) === null && <span className={`mt-1 block text-xs ${costs[key].trim() ? "text-red-700" : "text-muted"}`}>{costs[key].trim() ? "0~1조의 유효한 금액 필요" : "금액 미확인"}</span>}</label>)}
    </div><p className="mt-4 text-sm text-navy">{complete ? "입력 금액 합계" : "확인된 항목 소계"}: {known.length ? money(known.reduce((a, b) => a + b, 0)) : "금액 미입력"}{!complete && " · 남은 비용 미확인"}</p>
    <label className="mt-4 flex gap-3 text-sm text-navy"><input type="checkbox" checked={itemised} onChange={event => setItemised(event.target.checked)} className="h-5 w-5 shrink-0" />항목별 견적·청구서 확인</label><label className="mt-3 flex gap-3 text-sm text-navy"><input type="checkbox" checked={confirmedTotal} onChange={event => setConfirmedTotal(event.target.checked)} className="h-5 w-5 shrink-0" />입력한 금액이 이 기록의 전체 금액임을 확인</label>
    <p className="mt-2 text-xs leading-6 text-muted">전체 금액 확인을 하지 않은 기록은 보관하되 금액 분포에서 제외합니다. 빈 입력 내용은 추가 버튼을 누르기 전까지 저장되지 않습니다.</p><button type="submit" className="mt-4 min-h-11 rounded-lg bg-navy px-5 text-sm font-semibold text-white">가격 기록 추가</button></fieldset></form>
    <p className="mt-3 text-sm text-muted" aria-live="polite">{message}</p>
    <div className="mt-8"><h3 className="text-lg font-semibold text-navy">같은 조건의 개인 기록 요약</h3><p className="mt-2 text-sm leading-6 text-muted">서비스·주·준주·월·시간대·견적/결제를 나누어 집계합니다. 적은 수의 개인 기록이며 호주 시세나 업체 추천이 아닙니다. 같은 그룹에서도 실제 작업 범위는 다를 수 있습니다.</p><p className="mt-2 text-xs leading-6 text-muted">이전 기록의 0원이 명시된 0인지 빈칸이었는지는 알 수 없습니다. 기존 값은 그대로 보관하며 전체 금액을 다시 확인하고 월이 있는 기록만 요약에 포함합니다.</p>
      {groups.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{groups.map(g => <div key={g.key} className="min-w-0 rounded-xl border border-border p-4"><h4 className="font-semibold text-navy">{g.sample.category} · {g.count}건</h4><p className="mt-2 text-xs leading-6 text-muted">{condition(g.sample)}</p><p className="mt-3 break-all text-sm text-muted">중앙값 <strong className="text-lg text-navy">{money(g.median)}</strong></p><p className="mt-2 break-all text-xs text-muted">내 범위 {money(g.min)}–{money(g.max)}</p></div>)}</div> : <p className="mt-4 text-sm text-muted">월과 전체 금액을 확인한 기록이 아직 없습니다.</p>}
    </div>
    <div className="mt-8 overflow-x-auto" role="region" aria-label="개인 가격 기록 표" tabIndex={0}><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted"><th className="p-3">서비스</th><th className="p-3">지역·월·조건</th><th className="p-3">기록 금액</th><th className="p-3">확인 상태</th><th className="p-3">작업</th></tr></thead><tbody>{records.map(item => <tr key={item.id} className="border-b border-border"><td className="p-3 font-medium text-navy">{item.category}</td><td className="p-3 text-muted">{condition(item)}</td><td className="p-3 font-semibold text-navy">{money(priceTotal(item))}</td><td className="p-3 text-muted">항목별 {item.itemised ? "확인" : "미확인"}<br />전체 금액 {item.confirmedTotal === true ? "확인" : "미확인 · 요약 제외"}{!item.period && <><br />월 미입력 · 요약 제외</>}</td><td className="p-3">{item.confirmedTotal !== true && <button type="button" onClick={() => { if (window.confirm(`이 기록의 ${money(priceTotal(item))}가 전체 금액이며, 0원 항목도 실제로 확인했나요?`)) setRecords(current => current.map(r => r.id === item.id ? { ...r, confirmedTotal: true } : r)); }} className="min-h-11 px-2 text-xs font-semibold text-navy">전체 금액 확인</button>}<button type="button" onClick={() => { if (window.confirm("이 가격 기록을 지울까요?")) setRecords(current => current.filter(r => r.id !== item.id)); }} className="min-h-11 px-2 text-xs text-muted">삭제</button></td></tr>)}</tbody></table>{!records.length && <p className="py-8 text-center text-sm text-muted">아직 화면에 추가한 가격 기록이 없습니다.</p>}</div>
    <button type="button" disabled={storage === "loading"} onClick={() => { if (window.confirm("이 브라우저의 모든 가격 기록과 저장본을 지울까요?")) reset(); }} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm text-navy">모든 가격 기록 초기화</button>
  </section>;
}
