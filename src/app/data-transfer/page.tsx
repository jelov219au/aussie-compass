import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { DeviceDataTransfer } from "@/components/tools/DeviceDataTransfer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "기기 데이터 백업·이전 | Hoju Compass",
  description: "기기·브라우저를 바꾸기 전에 Hoju Compass 기록을 백업하고 새 기기로 옮기세요. 작성 기록 이전과 구매 이용권 복구를 따로 안내합니다.",
  path: "/data-transfer",
});

export default function DataTransferPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "데이터 백업·이전", path: "/data-transfer" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/my-compass" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 나의 진행으로 돌아가기</Link><div className="mt-7 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-navy">Private device transfer</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">작성한 기록을<br className="hidden sm:block" /> 안전하게 이어가세요.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">휴대폰을 바꾸거나 브라우저 데이터를 지우기 전에 기록과 구매 이용권을 따로 챙기세요.</p></div><DeviceDataTransfer /></Container></main><Footer /></>;
}
