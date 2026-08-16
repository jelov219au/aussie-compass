import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { SocialCardMaker, type SocialCardInitialContent } from "@/components/tools/SocialCardMaker";
import { createPageMetadata, siteUrl } from "@/lib/site";

export const metadata = createPageMetadata({ title: "호주 생활 SNS 카드뉴스 만들기", description: "호주 생활 정보를 Instagram 게시물·스토리 크기의 카드 이미지와 설명문으로 만들어 무료로 저장하세요.", path: "/social-card-maker" });

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined, maxLength: number) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, maxLength);
}

export default async function SocialCardMakerPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const title = readParam(params.title, 58);
  const rawPath = readParam(params.path, 120);
  const initialContent: SocialCardInitialContent | undefined = title ? {
    eyebrow: readParam(params.eyebrow, 45),
    title,
    body: readParam(params.body, 150),
    cta: readParam(params.cta, 42),
    path: rawPath?.startsWith("/") ? rawPath : "/resources",
  } : undefined;

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "무료 도구", path: "/tools" }, { name: "SNS 카드뉴스 만들기", path: "/social-card-maker" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/tools" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 도구 목록으로 돌아가기</Link><div className="mb-10 mt-5 max-w-4xl"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Share useful, not noisy</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">호주 생활 정보를 SNS 카드로 만드세요</h1><p className="mt-4 text-base leading-7 text-muted sm:text-lg">검증한 핵심 내용을 고르고 문장을 다듬으면 게시물·스토리용 PNG와 설명문을 바로 저장할 수 있습니다. 작성 내용과 이미지는 서버로 전송되지 않습니다.</p></div><SocialCardMaker baseUrl={siteUrl} initialContent={initialContent} /><section className="mt-12 grid gap-5 border-t border-navy/20 pt-8 lg:grid-cols-2"><div><h2 className="text-xl font-semibold text-navy">게시하기 전 확인</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-muted"><li>• 숫자, 날짜, 비자·세금·급여 기준은 공식 출처에서 최신 여부 확인</li><li>• 개인 사례를 모든 사람에게 적용되는 사실처럼 표현하지 않기</li><li>• 협찬·광고·제휴 링크가 있다면 눈에 띄게 표시하기</li></ul></div><div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><strong>현재 기능 범위</strong><p className="mt-1">이 도구는 이미지를 만들고 링크 문구를 준비할 뿐 SNS에 자동 게시하지 않습니다. 자동 게시와 성과 분석은 공식 계정 연결, 접근 권한과 개인정보 안내를 준비한 뒤 별도 도입해야 합니다.</p></div></section></Container></main><Footer /></>;
}
