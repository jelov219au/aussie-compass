import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { SiteSearch, type SearchItem } from "@/components/search/SiteSearch";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export const metadata=createPageMetadata({title:"호주 생활 정보 검색 | Hoju Compass",description:"비자, TFN, 급여, 이력서, 집, 교통, 세금, Super와 귀국 준비 도구·가이드를 한 번에 검색하세요.",path:"/search"});

const coreItems:SearchItem[]=[
  {href:"/my-compass",type:"도구",title:"나의 진행 상황",description:"이 기기에 저장된 정착·구직·저축·세금 프로젝트 모아보기",keywords:["대시보드","이어하기","저장","진행률","내 프로젝트","my compass"]},
  {href:"/pro",type:"도구",title:"Hoju Compass Pro 비교",description:"Resume, Rental, 급여 증빙, EOFY와 귀국 준비 개발판 비교",keywords:["유료","프리미엄","pro","가격","결제","상품","패키지"]},
  {href:"/data-transfer",type:"도구",title:"기기 데이터 백업·이전",description:"체크리스트, 이력서와 계산 기록을 파일로 백업하고 새 주소·기기로 옮기기",keywords:["백업","복원","가져오기","내보내기","이전","새 도메인","JSON","기기 변경"]},
  {href:"/life-admin-reminder",type:"도구",title:"만료일·갱신 일정 리마인더",description:"비자, 여권, 렌트, Rego, 보험과 자격증 날짜 관리",keywords:["리마인더","알림","만료일","갱신","캘린더","일정","rego","보험","여권"]},
  {href:"/social-card-maker",type:"도구",title:"SNS 카드뉴스 만들기",description:"호주 생활 정보를 게시물·스토리 PNG와 설명문으로 제작",keywords:["인스타그램","Instagram","릴스","스토리","카드뉴스","콘텐츠","홍보","이미지"]},
  {href:"/install",type:"도구",title:"홈 화면에 앱으로 추가",description:"iPhone·Android에서 Hoju Compass를 앱처럼 사용",keywords:["PWA","설치","홈화면","아이폰","안드로이드","바로가기"]},
  {href:"/glossary",type:"자료",title:"호주 생활 용어집",description:"TFN, ABN, Award, Super, Bond 등 약어 풀이",keywords:["뜻","용어","약어","PAYG","VEVO","Rego","PPSR","HAP ID","OSHC","USI"]},
  {href:"/help-directory",type:"도구",title:"호주 생활 도움 연락처",description:"긴급전화, 의료상담, 통역, 직장 문제와 사기 신고",keywords:["000","응급","lifeline","healthdirect","TIS","한국어","Fair Work","Scamwatch"]},
  {href:"/visa-preparation-guide",type:"도구",title:"비자·신체검사 준비",description:"Visa Finder, ImmiAccount, HAP ID와 지정 병원",keywords:["비자신청","건강검진","Bupa","panel physician","학생비자","워홀비자"]},
  {href:"/arrival-checklist",type:"도구",title:"첫 30일 정착 체크리스트",description:"전화, 교통, 은행, TFN, USI와 의료 준비",keywords:["도착","입국","심카드","계좌","택스파일넘버","학생","정착"]},
  {href:"/salary-calculator",type:"도구",title:"통합 급여 계산기",description:"세전·세후 급여, 세금, Super와 전체 패키지",keywords:["시급","연봉","주급","실수령액","pay","tax","워홀세금","resident"]},
  {href:"/cost-of-living-calculator",type:"도구",title:"생활비 계산기",description:"주거비와 지출을 주·월·연 단위로 비교",keywords:["예산","렌트","주세","식비","공과금","budget"]},
  {href:"/public-transport-guide",type:"도구",title:"대중교통·통학 생활권 비교",description:"주거비, 통학시간, Google Maps와 학생 교통정보",keywords:["기차","버스","트램","통근","대학교","교환학생","교통카드","myki","opal"]},
  {href:"/property-inspection-checklist",type:"도구",title:"쉐어하우스·집 방문 체크리스트",description:"집 상태, 비용, 계약, 안전과 생활환경 점검",keywords:["flatmates","페이스북","렌트","방","보증금","bond","인스펙션"]},
  {href:"/moving-checklist",type:"도구",title:"이사 체크리스트",description:"퇴거 통지, 공과금, 주소 변경과 보증금",keywords:["이삿날","condition report","전기","가스","인터넷","주소"]},
  {href:"/resume-builder",type:"도구",title:"영문 이력서 빌더",description:"영문 예시 문장, 디자인과 PDF 출력",keywords:["resume","CV","레쥬메","번역","자기소개","경력","구직"]},
  {href:"/job-application-tracker",type:"도구",title:"구직 지원 트래커",description:"공고, 지원일, 면접과 다음 행동 관리",keywords:["취업","일자리","인터뷰","application","job"]},
  {href:"/career-pathways",type:"도구",title:"직업·부족 분야 탐색기",description:"직업 정보와 공식 부족·비자 목록 확인",keywords:["영주권","부족직군","skilled","occupation","진로","스폰서"]},
  {href:"/savings-goal-calculator",type:"도구",title:"저축 목표 계산기",description:"목표 기간, 정기 저축액과 비상금 관리",keywords:["적금","비상금","이자","목돈","savings"]},
  {href:"/tax-return-guide",type:"도구",title:"택스 리턴 준비",description:"EOFY 소득자료, 공제 증빙과 신고 일정",keywords:["세금환급","ATO","tax return","deduction","공제"]},
  {href:"/service-quote-comparator",type:"도구",title:"서비스 견적 비교",description:"플러머·전기기사·청소·이사 견적 비교",keywords:["바가지","업체","tradie","plumber","electrician","ABN","면허"]},
  {href:"/service-price-log",type:"도구",title:"서비스 가격 기록",description:"생활 서비스 견적과 실제 결제 금액 기록",keywords:["가격데이터","비용","중앙값","청구서"]},
  {href:"/pay-evidence-pro",type:"도구",title:"Pay Evidence Pack Pro",description:"근무기록과 Payslip 차이, 증빙과 영문 급여 확인 요청문",keywords:["미지급급여","급여차이","underpayment","payslip","근무시간","증빙"]},
  {href:"/used-car-comparison",type:"도구",title:"중고차 구매 비교",description:"첫 1년 비용, PPSR, VIN과 사전검사",keywords:["차","자동차","rego","보험","연료","차량"]},
  {href:"/leaving-australia-guide",type:"도구",title:"귀국 준비·Super DASP",description:"퇴사, 렌트, 계정 정리와 Super 환급",keywords:["출국","한국귀국","슈퍼환급","연금환급","DASP","비자종료"]},
  {href:"/leaving-australia-pro",type:"도구",title:"Leaving Australia Pack Pro",description:"출국 전후 업무와 Bond·마지막 급여·DASP 후속 확인",keywords:["귀국패키지","출국정산","bond","final pay","DASP","한국귀국"]},
  {href:"/minimum-wage-guide",type:"가이드",title:"최저 시급",description:"호주 최저임금과 적용 기준",keywords:["minimum wage","시급","급여"]},
  {href:"/award-guide",type:"가이드",title:"내 Award 찾기",description:"Award와 Classification 확인 순서",keywords:["어워드","직종","등급","pay guide"]},
  {href:"/casual-loading-guide",type:"가이드",title:"Casual Loading",description:"캐주얼 25% 로딩의 의미",keywords:["캐주얼","loading","고용형태"]},
  {href:"/payslip-guide",type:"가이드",title:"Payslip 읽는 법",description:"Gross, Net, PAYG, Super와 YTD",keywords:["급여명세서","페이슬립","세후","원천징수"]},
  {href:"/underpayment-guide",type:"가이드",title:"급여가 적게 들어왔다면",description:"미지급 급여 확인과 대응 순서",keywords:["임금체불","underpayment","신고","차액"]},
  {href:"/super-guide",type:"가이드",title:"Super 이해하기",description:"Super 비율과 급여 패키지 확인",keywords:["슈퍼","연금","고용주납부","fund"]},
  {href:"/leave-guide",type:"가이드",title:"휴가·병가·공휴일",description:"Annual Leave와 Personal Leave 권리",keywords:["연차","sick leave","public holiday","휴일"]},
];

const articleItems: SearchItem[] = articles.map((article) => ({
  href: `/resources/${article.slug}`,
  type: "자료",
  title: article.title,
  description: article.description,
  keywords: [article.category, article.toolLabel, ...article.sections.map((section) => section.heading)],
}));

const items = [...coreItems, ...articleItems];

export default function SearchPage(){return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"통합 검색",path:"/search"}]}/><Header/><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Find your answer</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">필요한 정보를 한 번에 찾으세요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">도구 이름을 몰라도 괜찮습니다. 지금 궁금한 단어나 상황을 입력하면 관련 도구와 가이드를 함께 보여드립니다.</p></div><SiteSearch items={items}/><p className="mt-4 border-l-2 border-gold pl-4 text-xs leading-5 text-muted">검색어는 서버로 전송되거나 저장되지 않으며 현재 페이지 안에서만 처리됩니다.</p></Container></main><Footer/></>}
