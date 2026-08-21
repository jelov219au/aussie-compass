import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CarBuyProAccessTools } from "@/components/tools/CarBuyProAccessTools";
import { CarBuyProWorkspace } from "@/components/tools/CarBuyProWorkspace";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/Container";
import { getActiveCarBuyProEntitlement } from "@/lib/carBuyProAccess";

export const metadata: Metadata = {
  title: "Car Buy Pack Pro 개발 프리뷰 | Hoju Compass",
  description: "호주 중고차 후보의 비용과 구매 전 확인, 판매자 질문과 결정 요약을 기기 안에서 정리하세요.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CarBuyProWorkspacePage() {
  const accessProtected = process.env.NODE_ENV === "production";
  if (accessProtected && !await getActiveCarBuyProEntitlement()) redirect("/car-buy-pro?access=required");
  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "중고차 비교", path: "/used-car-comparison" }, { name: "Car Buy Pack Pro", path: "/car-buy-pro" }, { name: "작업 공간", path: "/car-buy-pro/workspace" }]} />
    <Header />
    <main className="py-12 sm:py-16"><Container>
      <Link href="/car-buy-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Car Buy Pack Pro 소개로 돌아가기</Link>
      <div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{accessProtected ? "Car Buy Pack Pro / Purchased workspace" : "Car Buy Pack Pro / Local preview"}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy [word-break:keep-all] sm:text-5xl">송금하기 전에, 비용과 남은 확인을 한 번 더 봐요.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">최대 세 대의 첫해 비용과 구매 직전 확인을 비교하고, 판매자에게 물어볼 내용과 개인 결정 요약을 만들 수 있어요.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">{accessProtected ? "이용권 확인 완료" : "개발 프리뷰 · 현재 무료"}</strong>{accessProtected ? "현재 기기의 서명된 접근 세션과 활성 이용권을 확인했습니다." : "기능 검증 단계이며 결제, 차량 조회와 서류 업로드는 진행되지 않습니다."}</aside></div>
      <div className="mt-9"><CarBuyProWorkspace /></div>
      {accessProtected && <CarBuyProAccessTools />}
      <section className="mt-10 border border-amber-300 bg-amber-50 p-5 text-sm leading-7 text-amber-950"><h2 className="font-semibold">차량·개인정보 안내</h2><p className="mt-1">입력 내용은 이 브라우저에만 저장됩니다. VIN, 번호판, 판매자 이름·연락처, 운전면허와 금융정보는 입력하지 마세요. 계산값은 사용자가 입력한 예상치이며 차량 가치, 상태, 적정 가격 또는 구매 안전성을 판정하지 않습니다.</p></section>
    </Container></main>
    <Footer />
  </>;
}
