import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/ui/Container";
import { DeviceDataTransfer } from "@/components/tools/DeviceDataTransfer";
import { BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/site";

export const metadata = createPageMetadata({
  title: "기기 데이터 백업·이전 | Hoju Compass",
  description: "Hoju Compass 체크리스트, 이력서, 계산기와 저장 기록을 파일로 백업하고 새 주소나 다른 기기로 옮기세요.",
  path: "/data-transfer",
});

export default function DataTransferPage() {
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "데이터 백업·이전", path: "/data-transfer" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/my-compass" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 나의 진행으로 돌아가기</Link><div className="mt-7 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Private device transfer</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">작성한 기록을<br className="hidden sm:block" /> 안전하게 이어가세요.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">Hoju Compass는 계정 없이 브라우저에 기록을 저장합니다. 백업 파일을 직접 내려받아 새 공식 주소나 다른 기기에서 불러올 수 있습니다.</p></div><DeviceDataTransfer /></Container></main><Footer /></>;
}
