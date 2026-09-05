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
  return <><BreadcrumbJsonLd items={[{ name: "홈", path: "/" }, { name: "데이터 백업·이전", path: "/data-transfer" }]} /><Header /><main className="py-12 sm:py-16"><Container><Link href="/my-compass" className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-navy">&larr; 나의 진행으로 돌아가기</Link><div className="mt-7 max-w-4xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Private device transfer</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">작성한 기록을<br className="hidden sm:block" /> 안전하게 이어가세요.</h1><p className="mt-5 max-w-3xl text-base leading-7 text-muted sm:text-lg">휴대폰을 바꾸거나 브라우저 데이터를 지우기 전에 기록과 구매 이용권을 따로 챙기세요.</p></div>
    <section className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-7" aria-labelledby="transfer-order-heading">
      <h2 id="transfer-order-heading" className="text-xl font-semibold text-navy">기기·브라우저를 바꾸기 전 3단계</h2>
      <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted"><li>처음 작성한 브라우저에서 아래 목록의 필요한 기록을 선택해 JSON 백업을 받습니다.</li><li>새 기기에서 같은 공식 사이트의 이 화면으로 와 파일을 불러옵니다. 기본값인 기존 기록 유지를 먼저 사용하세요. 덮어쓰기는 같은 항목을 교체하므로 새 기기의 기록도 먼저 백업하세요.</li><li>해당 도구를 열어 중요한 값이 옮겨졌는지 확인한 다음 이전 기기의 데이터를 정리합니다.</li></ol>
      <p className="mt-4 text-sm leading-7 text-navy">이 파일에는 구매 이용권이나 복구 코드가 포함되지 않습니다. 유료 작업 공간 접근은 제품별 이용권 복구에서 따로 연결하세요. <Link href="/payment-help" className="font-semibold underline">제품별 이용권 복구 안내 →</Link></p>
    </section><DeviceDataTransfer /></Container></main><Footer /></>;
}
