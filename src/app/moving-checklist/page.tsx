import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LocalProjectChecklist, type ProjectGroup } from "@/components/tools/LocalProjectChecklist";
import { MovingJurisdictionPicker } from "@/components/tools/MovingJurisdictionPicker";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata=createPageMetadata({title:"호주 이사 체크리스트와 리마인더 | Hoju Compass",description:"퇴거 통지부터 전기·인터넷 연결, 주소 변경, Condition report와 보증금까지 호주 이사를 단계별로 관리하세요.",path:"/moving-checklist"});
const movingGroups:ProjectGroup[]=[
 {title:"4주 전",items:[
  {id:"notice",label:"퇴거 통지와 계약 종료일 확인",detail:"계약 형태와 지역 규정에 맞는 서면 통지 방법을 확인하세요."},
  {id:"removal",label:"이사업체·차량 견적 비교",detail:"보험, 포함 작업, 계단·대기·취소 비용을 서면으로 확인하세요."},
  {id:"declutter",label:"기부·판매·폐기 물품 정리",detail:"지역 카운슬의 대형 폐기물 규칙을 확인하세요."},
  {id:"measure",label:"새 집 치수와 반입 경로 확인",detail:"냉장고·침대·소파가 문, 엘리베이터와 계단을 통과하는지 확인하세요."},
 ]},
 {title:"2주 전",items:[
  {id:"electricity",label:"전기·가스 연결 또는 이전",detail:"연결일, 최종 검침, 해지 비용과 새 요금제를 확인하세요."},
  {id:"internet",label:"인터넷 이전 예약",detail:"새 주소 사용 가능 여부와 장비 반납·설치 일정을 확인하세요."},
  {id:"insurance",label:"Contents·차량 보험 주소 변경",detail:"보장 시작일과 보험료 변동을 확인하세요."},
  {id:"mail",label:"우편물 이전 계획",detail:"중요 기관은 직접 변경하고 필요하면 우편 재전송을 고려하세요."},
  {id:"building",label:"건물 이사 예약",detail:"엘리베이터, 적재 구역, 보호 패드와 보증금 요구 여부를 확인하세요."},
 ]},
 {title:"주소 변경",items:[
  {id:"licence",label:"운전면허·차량 등록",detail:"변경 기한은 주·준주 교통기관에서 확인하세요."},
  {id:"mygov",label:"myGov 연결 서비스",detail:"ATO, Medicare, Centrelink 등 본인에게 해당하는 기관을 확인하세요."},
  {id:"bank",label:"은행·카드·Super·고용주",detail:"급여, 명세서와 신원 확인 주소를 업데이트하세요."},
  {id:"health",label:"병원·약국·학교·보험",detail:"정기 연락이나 기록이 필요한 기관의 주소를 바꾸세요."},
  {id:"subscriptions",label:"쇼핑·배달·구독 서비스",detail:"이전 주소로 자동 배송되지 않도록 저장 주소를 점검하세요."},
 ]},
 {title:"이사 당일",items:[
  {id:"meters",label:"최종·입주 계량기 사진",detail:"전기·가스·수도 계량기 수치와 촬영 시간을 기록하세요."},
  {id:"condition-out",label:"퇴거 상태 사진과 Condition report",detail:"모든 방, 가전, 열쇠와 기존 손상 상태를 남기세요."},
  {id:"keys-out",label:"기존 열쇠 반납 증빙",detail:"반납한 열쇠·리모컨 개수와 시간을 기록하세요."},
  {id:"condition-in",label:"새 집 입주 상태 기록",detail:"기존 손상과 청소 상태를 사진과 문서에 상세히 추가하세요."},
  {id:"essentials",label:"첫날 필수품 별도 보관",detail:"약, 충전기, 서류, 세면도구와 기본 침구는 직접 들고 가세요."},
 ]},
 {title:"이사 후",items:[
  {id:"bond",label:"보증금 반환 절차 확인",detail:"관할 지역 공식 채널과 청구 내용을 직접 확인하세요."},
  {id:"smoke",label:"연기 경보기·차단기·대피로 확인",detail:"경보기를 임의로 분리하지 말고 고장은 즉시 알리세요."},
  {id:"locks",label:"열쇠와 잠금장치 확인",detail:"누가 열쇠를 보유하는지, 추가 열쇠 절차를 확인하세요."},
  {id:"receipts",label:"이사 관련 계약·영수증 보관",detail:"분쟁이나 세무 확인이 필요한 경우를 대비해 정리하세요."},
 ]},
];
export default function MovingChecklistPage(){return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"이사 체크리스트",path:"/moving-checklist"}]}/><Header/><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link><div className="mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">이사 프로젝트</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 이사, 주소 변경까지 한 번에 관리하세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">퇴거 통지와 공과금부터 Condition report, 열쇠와 보증금까지 시기별로 점검하세요. 이사일을 정하면 남은 항목이 담긴 캘린더 파일도 받을 수 있습니다.</p></div><div className="mt-8"><LocalProjectChecklist storageKey="moving-project" eyebrow="시기별 23개 준비 항목" title="이사 체크리스트" description="체크 상태와 이사일은 현재 브라우저에만 저장됩니다. 캘린더 파일은 선택한 날짜에 한 번 알림을 추가합니다." groups={movingGroups} dateLabel="이사 예정일" calendarTitle="이사 당일 준비 확인"/></div>
<section className="mt-12 border-t border-navy/20 pt-10" aria-labelledby="moving-order-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">01 · 날짜를 확정하기 전에</p><h2 id="moving-order-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">새 집 시작일과 기존 집 종료일을 따로 계산하세요</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted">열쇠를 받는 날, Rent 책임이 시작되는 날, 기존 집 Rent가 끝나는 날과 실제 이삿짐 이동일은 같지 않을 수 있어요. 계약 두 개의 날짜를 한 줄에 놓고 겹치는 Rent, 공과금과 이동비를 먼저 계산하세요.</p><div className="mt-6 grid gap-3 md:grid-cols-2">{[["기존 계약","Fixed-term·Periodic·Subletting 등 계약 형태와 Notice 방식"],["새 계약","Lease 시작일, 열쇠 수령일과 첫 Condition report 기한"],["겹치는 비용","두 집 Rent·전기·보험·인터넷이 동시에 발생하는 기간"],["작업 일정","청소·Final inspection·열쇠 반납·Removalist 접근 시간"]].map(([title,body])=><article key={title} className="rounded-xl border border-border bg-white p-5"><h3 className="font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></article>)}</div></section>

<section className="mt-12" aria-labelledby="moving-evidence-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">02 · 집을 비우는 날</p><h2 id="moving-evidence-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">청소보다 먼저 입주 당시 기록과 비교하세요</h2><div className="mt-6 grid gap-5 lg:grid-cols-3"><article className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold text-navy">Condition report 비교</h3><p className="mt-3 text-sm leading-6 text-muted">입주 당시 손상·얼룩·작동상태와 현재 상태를 방별로 대조하고, Normal wear and tear와 새 손상을 임의로 단정하지 말고 관할 규칙을 확인하세요.</p></article><article className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold text-navy">사진·계량기·열쇠</h3><p className="mt-3 text-sm leading-6 text-muted">빈 방 전체와 세부 손상, 청소 상태, 계량기 수치, 열쇠·리모컨 개수를 날짜가 남는 원본으로 기록하고 반납 영수증을 받으세요.</p></article><article className="rounded-2xl border border-border bg-white p-6"><h3 className="font-semibold text-navy">Bond 청구</h3><p className="mt-3 text-sm leading-6 text-muted">공식 Bond 시스템에서 청구 내용을 직접 확인하고, 공제에 동의하기 전에 사진·Invoice·수리 근거와 분쟁 기한을 관할 기관에서 확인하세요.</p></article></div></section>

<section className="mt-12 rounded-2xl bg-navy p-6 text-white sm:p-8" aria-labelledby="moving-utility-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">03 · 서비스 이전</p><h2 id="moving-utility-heading" className="mt-2 text-2xl font-semibold">‘주소 변경’과 ‘서비스 이전’은 다릅니다</h2><div className="mt-6 grid gap-6 text-sm leading-7 text-white/75 md:grid-cols-2"><div><h3 className="font-semibold text-white">기존 주소 종료</h3><ul className="mt-3 space-y-2"><li>최종 사용일·계량기 수치·마지막 Bill 주소</li><li>모뎀·라우터·열쇠 등 대여장비 반납</li><li>Direct debit 종료와 Credit 환급 계좌</li><li>보험 보장 종료시간과 이삿짐 운송 중 보장</li></ul></div><div><h3 className="font-semibold text-white">새 주소 시작</h3><ul className="mt-3 space-y-2"><li>전기·가스 연결일과 Connection fee</li><li>인터넷 기술·설치 일정과 임시 데이터</li><li>Contents·차량보험 주소와 주차 조건 변경</li><li>건물 엘리베이터·Loading zone 예약 승인</li></ul></div></div></section>

<section className="mt-12" aria-labelledby="moving-state-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">04 · 지역 규정</p><h2 id="moving-state-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">퇴거 통지와 Bond는 주·준주에서 확인하세요</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted">아래는 2026년 8월 30일 다시 확인한 정부·공식 임대기관 출발점입니다. 현재 집이 있는 지역을 고르고 계약 형태, 종료 사유, Notice 기한과 공식 양식을 직접 확인하세요.</p><MovingJurisdictionPicker/></section>

<section className="mt-12" aria-labelledby="moving-address-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">05 · 주소 변경</p><h2 id="moving-address-heading" className="mt-2 text-2xl font-semibold text-navy sm:text-3xl">기관마다 바뀌는 정보와 시점이 달라요</h2><div className="mt-6 grid gap-3 md:grid-cols-2">{["운전면허·차량 Rego: 주 교통기관의 변경 기한과 차량 보관주소", "ATO·Medicare·Centrelink: myGov 연결 서비스별 주소·연락처와 주거정보", "은행·카드·Super·보험: Statement·신원확인·위험주소와 우편 수신", "고용주·Payroll: Payslip·PAYG·비상연락 기록", "학교·의료·전문자격: 학생 주소 의무와 예약·기록 전달", "Australia Post 재전송: 보조수단일 뿐 기관 직접 변경을 대신하지 않음"].map((item)=><p key={item} className="flex gap-3 rounded-xl border border-border bg-white p-4 text-sm leading-6 text-muted"><span aria-hidden="true" className="text-gold-ink">□</span><span>{item}</span></p>)}</div><div className="mt-5 flex flex-wrap gap-3"><a href="https://www.servicesaustralia.gov.au/centrelink-online-account-help-update-address-accommodation-and-contact-details" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">Services Australia 주소 변경 ↗</a><a href="https://www.accc.gov.au/consumers/problem-with-a-product-or-service-you-bought/where-to-go-for-consumer-help" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold decoration-2 underline-offset-4">주·준주 Consumer help ↗</a></div></section>

<section className="mt-10 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">중요 안내</h2><p className="mt-1">퇴거 통지, Condition report, 열쇠 반납과 Bond 절차는 주·준주, 계약 형태와 종료 사유에 따라 다릅니다. 캘린더 날짜와 체크 상태는 현재 브라우저에만 저장되며 공식 통지나 Bond 청구를 대신하지 않습니다.</p></section></Container></main><Footer/></>}
