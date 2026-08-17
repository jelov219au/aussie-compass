import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "데이터와 개인정보 안내 | Hoju Compass", description: "Hoju Compass 도구의 브라우저 저장, 외부 링크와 현재 개인정보 수집 여부를 확인하세요.", path: "/privacy" });

const sections = [
  ["현재 수집하는 개인정보", "Hoju Compass는 현재 회원 계정, 이메일 구독, 문의 양식 또는 광고 프로필을 운영하지 않습니다. 도구에 입력한 이력서·구직·예산·체크리스트 내용은 별도 안내가 없는 한 서버로 제출되지 않습니다. Resume Pro 테스트 결제를 직접 선택한 경우에만 아래 결제 처리 내용이 적용됩니다."],
  ["Stripe 테스트 결제와 이용권", "Resume Pro 테스트 결제를 시작하면 Stripe 결제 화면으로 이동하며 Stripe가 사용자가 입력한 연락처와 테스트 결제 정보를 처리합니다. Hoju Compass는 전체 카드번호나 카드 보안번호를 직접 받지 않습니다. 서버에는 Stripe 이벤트·결제 세션·결제수단 관련 식별자, 제품 코드, 이용권 상태와 처리 시각을 저장할 수 있습니다. 작업 공간의 이력서·커버레터 내용은 이 이용권 데이터베이스에 저장하지 않습니다."],
  ["접근 쿠키와 복구 코드", "결제와 활성 이용권이 확인되면 Resume Pro 접근을 위해 30일짜리 서명된 HttpOnly 쿠키를 현재 기기에 저장합니다. 다른 기기용 1회성 복구 코드를 만들면 서버에는 코드 원문 대신 해시와 만료·사용 상태만 저장되며, 새 코드를 만들면 이전 미사용 코드는 무효화됩니다."],
  ["브라우저에 저장되는 내용", "일부 도구는 진행 상태, 입력값과 사용자가 저장한 페이지 목록을 브라우저의 localStorage에 저장합니다. 나의 진행 화면은 이 기기의 저장 내용을 요약할 뿐 서버로 전송하거나 다른 기기와 동기화하지 않습니다. 브라우저 사이트 데이터 삭제 또는 각 도구의 초기화 기능으로 지울 수 있으며 공용 기기에서는 사용 후 삭제하세요."],
  ["백업과 기기 이전", "데이터 백업·이전 도구는 Hoju Compass가 사용하는 저장 항목만 사용자의 선택에 따라 JSON 파일로 만듭니다. 파일 생성과 불러오기는 브라우저 안에서 처리되며 서버에 업로드되지 않습니다. 백업에는 이력서의 이름·연락처, 급여·예산 같은 개인 내용이 포함될 수 있으므로 개인 기기에 보관하고 이전이 끝나면 안전하게 삭제하세요."],
  ["웹앱과 오프라인 안내", "홈 화면 설치를 지원하기 위해 앱 이름·색상·아이콘이 담긴 manifest와 service worker를 사용합니다. service worker는 온라인 페이지를 오래 보관하지 않고 네트워크 연결에 실패했을 때 보여줄 오프라인 안내만 캐시에 저장합니다."],
  ["공유·캘린더와 이미지 저장", "페이지 공유 버튼은 기기의 기본 공유 메뉴를 열거나 사용자가 선택하면 현재 주소를 클립보드에 복사합니다. 맞춤 경로를 공유하면 선택한 생활 단계와 고민 분류만 링크에 포함되며 이름, 완료 기록과 작성 내용은 포함되지 않습니다. 7일 점검 알림은 선택한 경로와 남은 단계가 담긴 캘린더 파일을 기기에 저장합니다. SNS 카드 제작과 PNG 저장도 브라우저에서 처리되며 자동으로 외부 서비스에 게시되지 않습니다."],
  ["호스팅 기술 정보", "사이트 제공과 보안을 위해 호스팅·네트워크 제공자가 접속 IP, 브라우저·기기 정보, 요청 시간과 오류 같은 기술 로그를 처리할 수 있습니다. Hoju Compass는 현재 별도의 사용자 행동 분석, 광고 추적 픽셀 또는 맞춤 광고 쿠키를 설치하지 않습니다."],
  ["외부 사이트와 Google Maps", "정부기관, Google Maps와 기타 외부 링크를 누르면 해당 서비스로 이동하며 검색어·출발지·목적지처럼 URL에 포함된 정보가 외부 서비스에 전달될 수 있습니다. 정확한 집 주소나 민감정보 대신 동네·역 이름을 사용하고 각 서비스의 개인정보 안내를 확인하세요."],
  ["민감정보 입력 금지", "여권번호, TFN, 비자 grant number, HAP ID, 은행·카드 정보, 건강정보, 비밀번호 또는 신분증 사본을 이 사이트에 입력하지 마세요. 계산기와 체크리스트는 그러한 정보 없이 사용할 수 있도록 설계했습니다."],
  ["향후 이메일·광고 기능", "이메일 구독이나 광고를 도입한다면 시작 전에 수집 목적, 이용 주체, 보관·삭제, 제3자 제공, 동의 철회와 수신 거부 방법을 입력 지점에서 명확히 알리고 이 안내를 갱신합니다. 현재 마케팅 이메일 주소를 수집하거나 마케팅 메시지를 보내지 않습니다."],
];

export default function PrivacyPage() { return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"데이터와 개인정보",path:"/privacy"}]} /><Header/><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_16rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Privacy / Data</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">데이터와 개인정보 안내</h1><p className="mt-5 max-w-3xl leading-7 text-muted">현재 사이트가 어떤 정보를 저장하고, 무엇을 수집하지 않는지 쉽게 설명합니다.</p></div><p className="border-l-2 border-gold pl-4 text-sm leading-6 text-muted"><strong className="block text-navy">최종 업데이트</strong>2026년 8월 18일</p></div><div className="divide-y divide-border">{sections.map(([title,body],index)=><section key={title} className="grid gap-4 py-7 sm:grid-cols-[5rem_1fr]"><span className="font-mono text-sm text-gold">{String(index+1).padStart(2,"0")}</span><div><h2 className="text-xl font-semibold text-navy">{title}</h2><p className="mt-3 max-w-4xl text-sm leading-7 text-muted sm:text-base">{body}</p></div></section>)}</div><section className="mt-8 border-l-2 border-gold bg-surface p-6 text-sm leading-7 text-muted"><h2 className="font-semibold text-navy">법적 적용 범위</h2><p className="mt-1">호주의 Privacy Act 적용 여부는 사업 규모와 활동에 따라 달라질 수 있습니다. 이 페이지는 현재 실제 데이터 처리 방식을 투명하게 설명하기 위한 것이며 법률 자문이 아닙니다. 서비스와 법적 지위가 변경되면 전문 검토를 거쳐 갱신해야 합니다.</p><Link href="/purchase-information" className="mt-3 inline-flex min-h-11 items-center font-semibold text-navy underline decoration-gold underline-offset-4">구매·환불 안내 보기 →</Link></section></Container></main><Footer/></>; }
