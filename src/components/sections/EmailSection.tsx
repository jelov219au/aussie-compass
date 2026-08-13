import Link from "next/link";
import { Container } from "@/components/ui/Container";

export function EmailSection() {
  return <section className="border-t border-border bg-navy py-14 text-white sm:py-16" aria-labelledby="email-heading"><Container><div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Updates / 준비 중</p><h2 id="email-heading" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">이메일 업데이트는 아직 받지 않습니다.</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">구독 동의, 개인정보 처리와 수신 거부 절차를 먼저 갖춘 뒤 시작하겠습니다. 현재 사이트에 이메일을 입력하거나 제출할 필요가 없습니다.</p></div><Link href="/privacy" className="inline-flex min-h-11 items-center border-b-2 border-gold text-sm font-semibold text-white">데이터 처리 방식 보기 <span className="ml-3" aria-hidden="true">→</span></Link></div></Container></section>;
}
