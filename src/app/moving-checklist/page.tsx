import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LocalProjectChecklist, type ProjectGroup } from "@/components/tools/LocalProjectChecklist";
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
<section className="mt-10 grid gap-5 lg:grid-cols-2"><a href="https://www.servicesaustralia.gov.au/centrelink-online-account-help-update-address-accommodation-and-contact-details" target="_blank" rel="noreferrer" className="rounded-2xl border border-border bg-white p-6"><strong className="text-lg text-navy">Services Australia 주소 변경 안내 &rarr;</strong><span className="mt-2 block text-sm leading-6 text-muted">Centrelink 이용자는 주소·주거·연락처 변경이 지급액에 영향을 줄 수 있습니다.</span></a><div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">지역 규정 확인</h2><p className="mt-1">퇴거 통지, Condition report, 열쇠 반납과 보증금 절차는 주·준주 및 계약 형태에 따라 다릅니다. 계약서와 관할 기관의 최신 안내를 우선하세요.</p></div></section></Container></main><Footer/></>}
