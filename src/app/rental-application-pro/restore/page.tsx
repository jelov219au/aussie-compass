import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Rental Pack 이용권 복구 | Hoju Compass", description: "1회용 복구 코드로 Rental Application Pack Pro 접근을 복구합니다.", robots: { index: false, follow: false } };
type Props = { searchParams: Promise<{ status?: string }> };

export default async function RentalProRestorePage({ searchParams }: Props) {
  const { status } = await searchParams;
  return <><Header /><main className="py-14 sm:py-20"><Container className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">구매 내역 다시 찾기</p><h1 className="mt-4 text-4xl font-semibold tracking-tight text-navy sm:text-5xl">Rental Pack 이용권 복구</h1><p className="mt-5 text-sm leading-7 text-muted">이전에 유료 작업 공간에서 만든 1회용 이용권 복구 코드를 입력하세요. 집 후보와 신청자 프로필은 작업 공간에서 내려받은 JSON 백업을 별도로 복원해야 합니다.</p>{status === "invalid" && <p className="mt-5 border-l-2 border-red-500 bg-red-50 p-4 text-sm text-red-900" role="alert">코드가 잘못됐거나 만료·사용 처리됐습니다.</p>}<form action="/api/rental-application-pro/restore" method="post" className="mt-8 border border-navy/15 bg-white p-5 sm:p-6"><label htmlFor="rental-restore-code" className="text-sm font-semibold text-navy">복구 코드</label><textarea id="rental-restore-code" name="restore_code" required minLength={32} maxLength={128} autoComplete="off" spellCheck={false} className="mt-2 min-h-28 w-full border border-border bg-surface p-3 text-sm text-navy outline-none focus:border-gold" /><button type="submit" className="mt-4 inline-flex min-h-12 items-center justify-center bg-navy px-5 py-3 text-sm font-semibold text-white">이용권 복구</button></form><p className="mt-5 text-xs leading-5 text-muted">복구 코드를 분실했다면 결제 이메일만으로 자동 복구하지 않습니다. 지원 채널의 구매 확인 절차를 이용해 주세요.</p><Link href="/payment-help" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-navy underline decoration-gold underline-offset-4">복구 코드가 없다면 문제 해결 순서 보기 →</Link><Link href="/rental-application-pro" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-navy">&larr; Rental Pack으로 돌아가기</Link></Container></main><Footer /></>;
}
