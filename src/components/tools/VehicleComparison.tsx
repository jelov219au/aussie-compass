"use client";

import { useState } from "react";
import { useToolStarted } from "@/components/analytics/useToolStarted";
import { useLocalPlan } from "@/lib/useLocalPlan";
import { makeVehicle, parseVehicles, serializeVehicles, validVehicleCost, vehicleComparisonKey, type Vehicle } from "@/lib/vehicleComparisonStorage";
import { vehicleCostSummary, formatVehicleCost } from "@/lib/vehicleComparisonCosts";
import { TaxStorageNotice } from "./TaxStorageNotice";

const checks: Array<[keyof Vehicle,string,string]> = [
  ["vin","VIN 일치 확인","차량·등록 서류·광고의 VIN 비교"], ["ppsr","PPSR 검색 증명서 보관","구매 당일 또는 전날 공식 검색"], ["regoCheck","주·준주 Rego 상태 확인","등록 만료와 차량 세부정보 비교"], ["mechanic","독립 정비사 또는 차량을 잘 아는 동행인과 사전 점검","동행인의 1차 확인과 판매자에게서 독립된 전문 검사의 차이를 구분"], ["history","정비·사고 이력 확인","기록의 날짜·주행거리 흐름 확인"], ["testDrive","시승과 기능 확인","브레이크·조향·경고등·냉난방 확인"],
];

export function VehicleComparison() {
  const recordStarted = useToolStarted("used_car_comparison");
  const [initial] = useState(() => [makeVehicle(0), makeVehicle(1)]);
  const { data: vehicles, update: setVehicles, reset, storage, saveState } = useLocalPlan(vehicleComparisonKey, initial, parseVehicles, serializeVehicles, { initial: "빈 비교표 · 아직 저장하지 않음", reset: "비교표 초기화 · 아직 저장하지 않음" });
  const loaded = storage !== "loading";
  const resetVehicles = () => {
    if (!loaded || !window.confirm("이 브라우저의 중고차 비교표 저장본과 현재 입력을 모두 지울까요? 필요한 내용과 저장 원문을 먼저 따로 보관하세요.")) return;
    reset();
  };
  const update = (id: string, field: keyof Vehicle, value: string | boolean) => {
    const vehicle = vehicles.find(candidate => candidate.id === id);
    if (!loaded || !vehicle || vehicle[field] === value) return;
    const meaningful = typeof value === "boolean" || (field === "name" ? value.trim().length > 0 : value !== "" && validVehicleCost(value));
    if (meaningful) recordStarted();
    setVehicles(current => current.map(candidate => candidate.id === id ? { ...candidate, [field]: value } : candidate));
  };
  const addVehicle = () => {
    if (!loaded || vehicles.length >= 3) return;
    recordStarted();
    setVehicles(current => [...current, makeVehicle(current.length)]);
  };
  return <section className="rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8" aria-labelledby="vehicle-compare-heading"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-gold-ink">구매가보다 실제 1년 비용</p><h2 id="vehicle-compare-heading" className="mt-2 text-2xl font-semibold text-navy">중고차 후보 비교표</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">VIN이나 판매자 개인정보는 저장하지 마세요. 비교명과 예상 비용, 확인 완료 여부를 이 브라우저에 저장합니다. 다른 브라우저·설치형 앱과 자동으로 동기화되지 않습니다.</p></div>{vehicles.length<3&&<button type="button" disabled={!loaded} onClick={addVehicle} className="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white">차량 추가</button>}</div>
  <TaxStorageNotice storageKey={vehicleComparisonKey} storage={storage} saveState={saveState} />
  <div className="mt-8 grid gap-5 xl:grid-cols-3">{vehicles.map((vehicle,index)=>{const costs=vehicleCostSummary(vehicle);const complete=checks.filter(([field])=>Boolean(vehicle[field])).length;return <article key={vehicle.id} className="rounded-2xl border border-border p-5"><div className="flex justify-between"><span className="text-xs font-semibold text-gold-ink">후보 {index+1}</span>{vehicles.length>2&&<button type="button" disabled={!loaded} onClick={()=>{ if (loaded && window.confirm("이 차량 후보를 삭제할까요? 필요한 내용은 먼저 따로 보관하세요.")) setVehicles((current)=>current.filter((item)=>item.id!==vehicle.id)); }} className="min-h-11 px-3 text-xs font-semibold text-muted">삭제</button>}</div><label className="mt-3 block text-sm font-medium text-navy">차량 구분명<input disabled={!loaded} value={vehicle.name} maxLength={60} onChange={(e)=>update(vehicle.id,"name",e.target.value)} placeholder="예: 흰색 Corolla" className="mt-2 min-h-11 w-full rounded-lg border border-border px-3" /></label>
  <div className="mt-4 grid grid-cols-2 gap-3">{([['price','구매가'],['transfer','이전·인지 비용'],['inspection','사전 검사비'],['insurance','연 보험료'],['rego','연 Rego·CTP'],['servicing','연 정비 예산'],['fuel','월 연료비']] as const).map(([field,label])=><label key={field} className="text-xs font-medium text-navy">{label} ($)<input disabled={!loaded} type="number" min="0" max="1000000000000" step="any" inputMode="decimal" aria-invalid={costs.invalid.includes(field)} aria-describedby={costs.invalid.includes(field) ? `vehicle-cost-error-${index}` : undefined} value={vehicle[field]} onChange={(e)=>update(vehicle.id,field,e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border px-3 text-sm" /></label>)}</div>
  {costs.invalid.length>0&&<p id={`vehicle-cost-error-${index}`} role="status" className="mt-3 text-sm text-red-700">비용은 0 이상 1조 달러 이하의 숫자로 입력하세요. 잘못된 금액이 있으면 계산을 보류합니다.</p>}
  <div className="mt-5 rounded-xl bg-navy p-4 text-white"><div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-white/70">{costs.upfrontComplete ? "초기 지출 합계" : "입력한 초기 비용 소계"}</span><strong className="break-all">{formatVehicleCost(costs.upfront)}</strong></div><div className="mt-2 flex flex-wrap justify-between gap-2"><span className="text-sm text-white/70">{costs.complete ? "첫 1년 예상 합계" : "입력한 1년 비용 소계"}</span><strong className="break-all text-xl">{formatVehicleCost(costs.firstYear)}</strong></div><p className="mt-3 text-xs leading-5 text-white/80">비용 {costs.provided}/{costs.total} 입력 · {costs.invalid.length ? "잘못된 금액을 확인하세요." : costs.complete ? "월 연료비는 12개월로 계산했습니다." : "빈칸은 합계에서 제외됩니다. 비용이 없으면 0을 입력하세요."}</p><p className="mt-2 text-xs leading-5 text-white/80">확인 {complete}/{checks.length} · 감가상각·금융비용·예상 밖 수리 제외</p></div>
  <div className="mt-5 space-y-3">{checks.map(([field,label,detail])=><label key={field} className="flex cursor-pointer gap-3"><input disabled={!loaded} type="checkbox" checked={Boolean(vehicle[field])} onChange={(e)=>update(vehicle.id,field,e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--color-gold)]" /><span><span className="block text-sm font-medium text-navy">{label}</span><span className="block text-xs leading-5 text-muted">{detail}</span></span></label>)}</div></article>})}</div>
  <button type="button" disabled={!loaded} onClick={resetVehicles} className="mt-6 min-h-11 rounded-lg border border-border px-4 text-sm font-semibold text-navy">비교표 초기화</button></section>;
}
