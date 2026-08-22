import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { LifeAdminReminder } from "@/components/tools/LifeAdminReminder";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "호주 생활 만료일·갱신 일정 리마인더 | Hoju Compass",
  description: "비자, 여권, 렌트, Rego, 보험과 자격증 갱신 날짜를 기기에 저장하고 캘린더와 선택형 푸시 알림으로 관리하세요.",
  path: "/life-admin-reminder",
});

export default function LifeAdminReminderPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "전체 도구", path: "/tools" }, { name: "생활 일정 리마인더", path: "/life-admin-reminder" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 전체 도구로 돌아가기</Link><div className="mt-8 grid gap-8 border-b border-navy/20 pb-10 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Life admin / renewal dates</p><h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-navy sm:text-5xl">호주 생활의 만료일을<br /><span className="font-normal text-navy-light">마감 전에 준비하세요.</span></h1><p className="mt-5 max-w-3xl leading-7 text-muted">비자·여권·렌트·Rego·보험·자격증처럼 놓치면 번거로운 날짜를 한곳에 적고 캘린더에 옮길 수 있습니다.</p></div><div className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">기본은 현재 기기 저장</strong>계정 없이 쓸 수 있고, 원할 때만 최소 일정 정보로 푸시 알림을 켤 수 있습니다.</div></div><LifeAdminReminder /><section className="mt-12 grid gap-6 border-t border-navy/20 pt-8 sm:grid-cols-2"><div><h2 className="text-xl font-semibold text-navy">공식 날짜가 우선입니다.</h2><p className="mt-2 text-sm leading-6 text-muted">이 도구는 개인 메모를 정리할 뿐 만료일, 갱신 가능 시점이나 자격 조건을 판정하지 않습니다. 발급기관 계정, 계약서와 최신 공식 안내를 확인하세요.</p></div><div><h2 className="text-xl font-semibold text-navy">기기를 바꾸기 전에는</h2><p className="mt-2 text-sm leading-6 text-muted">전체 캘린더 파일을 저장해 두세요. 브라우저 데이터를 지우면 이 화면의 목록도 삭제되며 다른 기기로 자동 동기화되지 않습니다. 푸시 알림도 새 기기에서 다시 켜야 합니다.</p></div></section></Container></main><Footer /></>;
}
