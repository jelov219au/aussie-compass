import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { RentalApplicationProAccessTools } from "@/components/tools/RentalApplicationProAccessTools";
import { RentalApplicationWorkspace } from "@/components/tools/RentalApplicationWorkspace";
import { Container } from "@/components/ui/Container";
import { getActiveRentalApplicationProEntitlement } from "@/lib/rentalApplicationProAccess";

export const metadata: Metadata = {
  title: "Rental Pack Pro 작업 공간 | Hoju Compass",
  description: "여러 호주 렌트 신청의 서류, 다음 행동, 개인정보와 영문 연락을 기기 안에서 관리하세요.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function RentalApplicationWorkspacePage() {
  const accessProtected = process.env.NODE_ENV === "production";
  if (accessProtected && !await getActiveRentalApplicationProEntitlement()) redirect("/rental-application-pro?access=required");

  return <>
    <BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "Rental Pack Pro", path: "/rental-application-pro" }, { name: "작업 공간", path: "/rental-application-pro/workspace" }]} />
    <Header />
    <main className="py-12 sm:py-16"><Container>
      <Link href="/rental-application-pro" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; Rental Pack Pro 소개로 돌아가기</Link>
      <div className="mt-7 grid gap-7 border-b border-navy/20 pb-9 lg:grid-cols-[1fr_18rem] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">{accessProtected ? "Rental Pack Pro / Purchased workspace" : "Rental Pack Pro / Local preview"}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy [word-break:keep-all] sm:text-5xl">여러 집의 준비, 제출과 후속 연락을 한곳에서.</h1><p className="mt-5 max-w-3xl leading-7 text-muted">공통 신청자 프로필은 재사용하고, 집별 서류·개인정보·다음 행동과 영문 연락 문구를 관리합니다. 원본 서류는 업로드하지 않습니다.</p></div><aside className="border-l-2 border-gold pl-5 text-sm leading-6 text-muted"><strong className="block text-navy">{accessProtected ? "이용권 확인 완료" : "강화 버전 로컬 프리뷰"}</strong>{accessProtected ? "현재 기기의 서명된 접근 세션과 활성 이용권을 확인했습니다." : "기능 검증 단계이며 결제와 계정 생성은 진행되지 않습니다."}</aside></div>
      <div className="mt-9"><RentalApplicationWorkspace /></div>
      {accessProtected && <RentalApplicationProAccessTools />}
      <section className="mt-10 border-l-2 border-gold bg-surface p-5 text-sm leading-7 text-muted"><h2 className="font-semibold text-navy">개인정보와 결과 안내</h2><p className="mt-1">입력 내용은 이 브라우저에만 저장되며 Hoju Compass 서버나 외부 AI로 전송되지 않습니다. 다운로드한 파일에도 TFN, 계좌 로그인, 카드정보 또는 신분증 번호를 적지 마세요. 이 도구는 신청서 제출, 합격 가능성 평가 또는 법률 자문을 제공하지 않습니다.</p></section>
    </Container></main>
    <Footer />
  </>;
}
