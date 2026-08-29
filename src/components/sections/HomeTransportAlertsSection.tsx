import Link from "next/link";
import { Container } from "@/components/ui/Container";
import {
  NATIONAL_ROADWORKS_MAP,
  RAIL_WORK_ALERT_MAX_AREAS,
  RAIL_WORK_ALERT_ROUTE,
  RAIL_WORK_ALERT_SOURCES,
  RAIL_WORK_ALERT_STATE_ORDER,
} from "@/lib/railWorkAlerts";

export function HomeTransportAlertsSection() {
  return (
    <section
      id="transport-alerts"
      className="border-b border-border bg-[#edf3f2] py-12 sm:py-16"
      aria-labelledby="home-transport-alerts-heading"
    >
      <Container>
        <div className="overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-[0_16px_40px_rgba(26,39,68,0.06)]">
          <div className="grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="relative overflow-hidden bg-navy p-6 text-white sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-white/10" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-4 top-8 h-28 w-28 rounded-full border border-gold/30" aria-hidden="true" />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">출발 전 교통 확인</p>
                <h2 id="home-transport-alerts-heading" className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  철도 작업과 도로 공사,<br className="hidden sm:block" /> 집을 나서기 전에 확인하세요.
                </h2>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
                  자주 쓰는 동네·역을 저장해 두고 공식 공지, 작업 날짜, 대체 이동과 접근성 영향을 같은 순서로 점검할 수 있어요.
                </p>
                <ul className="mt-6 flex flex-wrap gap-2 text-xs font-semibold" aria-label="철도 작업 확인 도구의 저장 및 호환 범위">
                  <li className="rounded-full border border-white/20 px-3 py-2">관심 지역 최대 {RAIL_WORK_ALERT_MAX_AREAS}곳</li>
                  <li className="rounded-full border border-white/20 px-3 py-2">웹·홈 화면 앱 공용</li>
                  <li className="rounded-full border border-white/20 px-3 py-2">로그인 불필요</li>
                </ul>
              </div>
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">공식 원문으로 확인</p>
              <h3 className="mt-2 text-xl font-semibold text-navy">NSW·VIC·QLD 교통기관 공지를 바로 열 수 있어요.</h3>
              <ul className="mt-5 grid gap-2 sm:grid-cols-3" aria-label="지원하는 주별 공식 철도 작업 공지">
                {RAIL_WORK_ALERT_STATE_ORDER.map((state) => {
                  const source = RAIL_WORK_ALERT_SOURCES[state];
                  return (
                    <li key={state}>
                      <a
                        href={source.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${state} ${source.label} 새 창에서 열기`}
                        className="flex min-h-20 h-full flex-col justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left transition hover:border-gold"
                      >
                        <span className="font-mono text-xs font-semibold text-gold-ink">{state}</span>
                        <span className="mt-3 text-sm font-semibold leading-5 text-navy">
                          {source.label} <span aria-hidden="true">↗</span>
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href={RAIL_WORK_ALERT_ROUTE}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-navy px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-navy-light"
                >
                  철도 작업 확인 지역 저장 →
                </Link>
                <a
                  href={NATIONAL_ROADWORKS_MAP.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${NATIONAL_ROADWORKS_MAP.label} 새 창에서 열기`}
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-navy px-5 py-3 text-center text-sm font-semibold text-navy transition hover:bg-surface"
                >
                  정부 도로 공사 지도 <span className="ml-1" aria-hidden="true">↗</span>
                </a>
              </div>

              <p className="mt-5 border-l-2 border-gold pl-4 text-xs leading-6 text-muted">
                <strong className="text-navy">실시간 자동 알림이 아닙니다.</strong> 저장과 체크는 현재 브라우저 안에서 처리되며, 최신 공지와 지도는 인터넷에 연결해 공식 원문에서 다시 확인해야 합니다.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
