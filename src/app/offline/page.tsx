import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function OfflinePage() {
  return <main className="flex min-h-screen items-center py-16"><Container><p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Offline</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-navy">인터넷 연결을 확인해 주세요.</h1><p className="mt-4 max-w-xl leading-7 text-muted">현재 페이지를 불러올 수 없습니다. 연결이 돌아오면 다시 시도하거나 이미 열어둔 화면으로 돌아가세요.</p><Link href="/" className="mt-7 inline-flex min-h-12 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white">홈 다시 열기</Link></Container></main>;
}
