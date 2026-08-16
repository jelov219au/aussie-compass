import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { MyCompassDashboard } from "@/components/dashboard/MyCompassDashboard";
import { articles } from "@/data/articles";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({ title: "나의 호주 생활 진행 상황", description: "이 기기에 저장된 비자, 정착, 구직, 집, 저축, 세금과 귀국 준비 프로젝트를 한곳에서 이어가세요.", path: "/my-compass" });

export default function MyCompassPage() {
  const resourceArticles = articles.map((article) => ({
    href: `/resources/${article.slug}`,
    title: article.title,
    description: article.description,
    category: article.category,
    readingTime: article.readingTime,
  }));

  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "나의 진행 상황", path: "/my-compass" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 홈으로 돌아가기</Link><div className="mt-7 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">My Compass</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">하던 일을 찾지 말고,<br className="hidden sm:block" /> 여기서 바로 이어가세요.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">여러 도구에 흩어진 진행 상태를 현재 기기에서 모아 보여드립니다. 데이터는 서버로 전송되지 않으며 다른 기기와 자동 동기화되지 않습니다.</p></div><MyCompassDashboard resourceArticles={resourceArticles} /><section className="mt-12 grid gap-5 border-t border-border pt-7 md:grid-cols-2"><div><h2 className="text-lg font-semibold text-navy">기기를 바꾸면 보이지 않아요</h2><p className="mt-2 text-sm leading-7 text-muted">로그인과 클라우드 저장을 사용하지 않기 때문에 다른 브라우저나 기기에서는 기록이 나타나지 않습니다. 브라우저 데이터를 지우면 저장 내용도 삭제될 수 있습니다.</p></div><div><h2 className="text-lg font-semibold text-navy">공용 기기라면</h2><p className="mt-2 text-sm leading-7 text-muted">사용을 마친 뒤 각 도구에서 기록을 초기화하거나 브라우저의 사이트 데이터를 삭제하세요. 여권번호, TFN, 은행정보 같은 민감정보는 어느 도구에도 입력하지 마세요.</p></div></section></Container></main><Footer /></>;
}
