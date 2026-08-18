import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 긴급전화·생활 도움 연락처 | Hoju Compass",
  description: "호주 긴급전화 000, 의료상담, 통역, 위기지원, 직장 문제와 사기 신고 공식 연락처를 상황별로 확인하세요.",
  path: "/help-directory",
});

const urgent = [
  { number: "000", href: "tel:000", title: "생명·안전이 위급한 상황", body: "경찰·소방·구급차가 즉시 필요하거나 범죄가 진행 중인 시간 긴급 상황에 사용합니다.", source: "https://www.triplezero.gov.au/triple-zero/other-emergency-numbers" },
  { number: "13 11 14", href: "tel:131114", title: "Lifeline 위기지원", body: "감당하기 어렵거나 안전을 유지하기 힘들 때 24시간 위기지원 상담을 받을 수 있습니다. 생명이 위험하면 000을 먼저 이용하세요.", source: "https://www.lifeline.org.au/get-help/national-services/lifeline-crisis-support" },
];

const services = [
  { kind: "의료", number: "1800 022 222", call: "tel:1800022222", title: "healthdirect 간호사 상담", body: "건강 문제가 있지만 생명이 위급하지 않을 때 24시간 등록 간호사에게 다음 행동을 문의합니다.", source: "https://about.healthdirect.gov.au/contact-us" },
  { kind: "통역", number: "131 450", call: "tel:131450", title: "TIS National 전화 통역", body: "한국어 통역이 필요하면 언어를 말하고 연결하려는 기관명과 공식 전화번호를 알려주세요.", source: "https://www.tisnational.gov.au/Non-English-speakers/Interpreting-services" },
  { kind: "직장", number: "13 13 94", call: "tel:131394", title: "Fair Work Infoline", body: "임금·Award·해고·근로조건 관련 공식 정보를 확인합니다. 통역은 TIS에 전화해 이 번호 연결을 요청할 수 있습니다.", source: "https://www.fairwork.gov.au/about-us/contact-us/call-us" },
  { kind: "사기", number: "온라인 신고", call: "https://www.scamwatch.gov.au/report-a-scam", title: "Scamwatch", body: "사기 의심 활동을 신고합니다. 돈이나 금융정보를 잃었다면 먼저 은행에 즉시 연락하세요. Scamwatch 신고는 경찰 신고가 아닙니다.", source: "https://www.scamwatch.gov.au/report-a-scam" },
];

const callSteps = [
  ["내 위치", "주소, 도로명, 건물·역 이름 또는 눈에 띄는 지점을 먼저 말할 준비를 합니다."],
  ["무슨 상황인지", "누가 위험한지, 어떤 일이 생겼는지, 지금도 진행 중인지 짧게 설명합니다."],
  ["통역이 필요한지", "가능하면 ‘Korean interpreter, please’라고 말하거나 TIS National을 먼저 이용합니다."],
  ["상담원의 질문", "먼저 끊지 말고 안내를 따릅니다. 안전하지 않다면 통화 가능한 장소로 이동합니다."],
];

export default function HelpDirectoryPage() { return <><BreadcrumbJsonLd items={[{name:"홈",path:"/"},{name:"생활 도움 연락처",path:"/help-directory"}]} /><Header/><main className="py-12 sm:py-16"><Container>
  <Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link>
  <div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_17rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">어디에 연락해야 할지 막막할 때</p><h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-navy sm:text-5xl">문제가 생겼을 때<br/>바로 찾는 공식 연락처</h1><p className="mt-5 max-w-3xl leading-7 text-muted">긴급 상황과 의료 상담, 통역, 직장 문제, 사기 신고를 나눠 정리했어요. 번호를 누르면 바로 전화 앱으로 연결돼요.</p></div><p className="border-l-2 border-gold pl-4 text-sm leading-6 text-muted"><strong className="block text-navy">호주 안에서 이용해 주세요</strong>해외 또는 일부 통신 환경에서는 번호가 연결되지 않을 수 있어요.</p></div>

  <section className="mt-10" aria-labelledby="urgent-heading"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">지금 바로 도움이 필요하다면</p><h2 id="urgent-heading" className="mt-2 text-2xl font-semibold text-navy">긴급한 상황은 먼저 연락하세요</h2><div className="mt-5 grid gap-4 lg:grid-cols-2">{urgent.map((item,index)=><article key={item.number} className={index===0?"bg-red-800 p-6 text-white sm:p-8":"bg-navy p-6 text-white sm:p-8"}><span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/60">{item.title}</span><a href={item.href} className="mt-3 block font-mono text-5xl font-semibold tracking-tight text-white sm:text-6xl">{item.number}</a><p className="mt-4 max-w-xl text-sm leading-6 text-white/75">{item.body}</p><a href={item.source} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-10 items-center border-b border-white/40 text-xs font-semibold">공식 안내 확인 ↗</a></article>)}</div></section>

  <section className="mt-12" aria-labelledby="services-heading"><div className="flex items-end justify-between border-b border-navy/20 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">급하지 않지만 도움이 필요할 때</p><h2 id="services-heading" className="mt-2 text-2xl font-semibold text-navy">생활 중 자주 찾는 도움</h2></div><span className="hidden font-mono text-xs text-muted sm:block">공식 기관 연락처</span></div><ul>{services.map((item,index)=><li key={item.title} className="border-b border-border"><div className="grid gap-5 py-7 sm:grid-cols-[3rem_1fr_1.2fr_auto] sm:items-center sm:px-3"><span className="font-mono text-sm text-gold">0{index+1}</span><div><span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.kind}</span><h3 className="mt-1 text-xl font-semibold text-navy">{item.title}</h3></div><p className="text-sm leading-6 text-muted">{item.body}</p><div className="flex gap-3 sm:flex-col sm:items-end"><a href={item.call} target={item.call.startsWith("http")?"_blank":undefined} rel={item.call.startsWith("http")?"noreferrer":undefined} className="inline-flex min-h-11 items-center border-b-2 border-gold font-mono text-sm font-semibold text-navy">{item.number}</a><a href={item.source} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center text-xs font-semibold text-muted">공식 안내 ↗</a></div></div></li>)}</ul></section>

  <section className="mt-12 bg-surface p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Before you call</p><h2 className="mt-2 text-2xl font-semibold text-navy">전화 전에 준비할 네 가지</h2><ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{callSteps.map(([title,body],index)=><li key={title} className="border-t border-navy/20 pt-4"><span className="font-mono text-sm text-gold">0{index+1}</span><h3 className="mt-2 font-semibold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{body}</p></li>)}</ol></section>

  <section className="mt-8 border-l-2 border-amber-500 bg-amber-50 p-6 text-sm leading-7 text-amber-950"><h2 className="font-semibold">안전 안내</h2><p className="mt-1">이 페이지는 상담·진단·긴급 대응을 제공하지 않습니다. 생명 또는 안전이 위급하거나 범죄가 진행 중이면 페이지를 더 읽지 말고 000에 전화하세요. 전화번호와 운영시간은 바뀔 수 있으므로 비긴급 서비스는 연결된 공식 페이지도 확인하세요.</p></section>
</Container></main><Footer/></>; }
