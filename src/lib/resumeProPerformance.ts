import "server-only";

import Stripe from "stripe";
import { resumeProProduct } from "@/lib/commerce";
import { getLocalOperatorConnectionValue } from "@/lib/localOperatorConnection";
import {
  addResumeProPaymentTotals,
  classifyResumeProPerformancePayment,
  emptyResumeProPaymentTotals,
  type ResumeProPaymentTotals,
} from "@/lib/resumeProPerformancePayment";
import { normalizeResumeProEntry, type ResumeProEntry } from "@/lib/resumeProAttribution";
import { resumeFunnelEvents, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export type ResumeProPerformanceRow = {
  entry: ResumeProEntry;
  label: string;
  visits: number;
  proofStarts: number;
  launchInterests: number;
  checkoutStarts: number;
  paidCheckouts: number;
  fullRefunds: number;
  retainedPayments: number;
  grossRevenueCents: number;
  refundedCents: number;
  netRevenueCents: number;
};

type ConnectionState = {
  connected: boolean;
  message: string;
  mode?: "live" | "test";
  status?: ResumeProCollectionStatus;
};

export type ResumeProCollectionStatus = "collected" | "not_configured" | "error";

export type ResumeProTrafficWindow = {
  since: string;
  until: string;
  siteVisitors: number;
  sitePageviews: number;
  proCatalogVisitors: number;
  resumeProVisitors: number;
};

export type ResumeProTrafficComparison = {
  status: ResumeProCollectionStatus;
  message: string;
  current: ResumeProTrafficWindow;
  previous: ResumeProTrafficWindow;
};

export type ResumeProPerformance = {
  rows: ResumeProPerformanceRow[];
  siteVisitors: number;
  sitePageviews: number;
  proCatalogVisitors: number;
  resumeProVisitors: number;
  builderStarts: number;
  jobAdViews: number;
  jobAdSampleViews: number;
  jobAdChecks: number;
  proCtaClicks: number;
  since: string;
  until: string;
  vercel: ConnectionState;
  stripe: ConnectionState;
  trafficComparison: ResumeProTrafficComparison | null;
};

const entries: Array<{ entry: ResumeProEntry; label: string }> = [
  { entry: "job-ad-checker", label: "이력서·공고 맞춤 점검기" },
  { entry: "article-resume-template", label: "무료 이력서 양식 안내 글" },
  { entry: "article-job-search-plan", label: "구직 관리 안내 글" },
  { entry: "article-achievement-examples", label: "이력서 성과 문장 안내 글" },
  { entry: "article-cover-letter-checklist", label: "커버레터 제출 점검 글" },
  { entry: "resume-builder-complete", label: "무료 이력서 완성 화면" },
  { entry: "home-premium", label: "홈 Premium 도구 영역" },
  { entry: "pro-finder", label: "Pro 상품 선택기" },
  { entry: "pro-catalog-card", label: "Pro 상품 비교 카드" },
  { entry: "direct", label: "직접 방문·기타" },
];

type VercelAggregateResponse = {
  data?: Array<{ eventData?: unknown; count?: unknown }>;
};

type VercelVisitCountResponse = {
  data?: { visitors?: unknown; pageviews?: unknown };
};

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
}

const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function getUtcRolling24HourWindows(now: Date) {
  const currentUntil = now.getTime();
  const currentSince = currentUntil - DAY_IN_MS;
  const previousSince = currentSince - DAY_IN_MS;

  return {
    current: { since: String(currentSince), until: String(currentUntil) },
    previous: { since: String(previousSince), until: String(currentSince) },
  };
}

function safeCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function aggregateMap(payload: VercelAggregateResponse) {
  const totals = new Map<ResumeProEntry, number>();
  for (const row of payload.data ?? []) {
    const entry = normalizeResumeProEntry(row.eventData);
    totals.set(entry, (totals.get(entry) ?? 0) + safeCount(row.count));
  }
  return totals;
}

function aggregateTotal(payload: VercelAggregateResponse) {
  return (payload.data ?? []).reduce((total, row) => total + safeCount(row.count), 0);
}

function visitTotals(payload: VercelVisitCountResponse) {
  return {
    visitors: safeCount(payload.data?.visitors),
    pageviews: safeCount(payload.data?.pageviews),
  };
}

async function fetchVercelVisits(params: {
  token: string;
  projectId: string;
  teamId?: string;
  since: string;
  until: string;
  requestPath?: "/pro" | "/resume-pro";
}) {
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/count");
  url.searchParams.set("projectId", params.projectId);
  if (params.teamId) url.searchParams.set("teamId", params.teamId);
  url.searchParams.set("since", params.since);
  url.searchParams.set("until", params.until);
  const filters = ["environment eq 'production'"];
  if (params.requestPath) filters.push(`requestPath eq '${params.requestPath}'`);
  url.searchParams.set("filter", filters.join(" and "));

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${params.token}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Vercel Web Analytics visits request failed.");
  return await response.json() as VercelVisitCountResponse;
}

async function fetchVercelEvent(params: {
  token: string;
  projectId: string;
  teamId?: string;
  since: string;
  until: string;
  eventName: string;
  extraFilter?: string;
  groupBy?: "entry" | "context";
}) {
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/events/aggregate");
  url.searchParams.set("projectId", params.projectId);
  if (params.teamId) url.searchParams.set("teamId", params.teamId);
  url.searchParams.set("since", params.since);
  url.searchParams.set("until", params.until);
  url.searchParams.set("by", `eventData/${params.groupBy ?? "entry"}`);
  url.searchParams.set("limit", "20");
  url.searchParams.set("filter", `eventName eq '${params.eventName}' and environment eq 'production'${params.extraFilter ? ` and ${params.extraFilter}` : ""}`);

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${params.token}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("Vercel Web Analytics request failed.");
  return await response.json() as VercelAggregateResponse;
}

async function loadVercelTotals(since: string, until: string) {
  const [token, projectId, teamId] = await Promise.all([
    getLocalOperatorConnectionValue("VERCEL_TOKEN"),
    getLocalOperatorConnectionValue("VERCEL_PROJECT_ID"),
    getLocalOperatorConnectionValue("VERCEL_TEAM_ID"),
  ]);

  if (!token || !projectId) {
    return {
      state: { connected: false, status: "not_configured" as const, message: "VERCEL_TOKEN과 VERCEL_PROJECT_ID를 연결하면 Builder 시작부터 결제 시작까지 익명 합계를 자동으로 불러옵니다." },
      siteVisitors: 0,
      sitePageviews: 0,
      proCatalogVisitors: 0,
      resumeProVisitors: 0,
      visits: new Map<ResumeProEntry, number>(),
      proofStarts: new Map<ResumeProEntry, number>(),
      launchInterests: new Map<ResumeProEntry, number>(),
      checkouts: new Map<ResumeProEntry, number>(),
      builderStarts: 0,
      jobAdViews: 0,
      jobAdSampleViews: 0,
      jobAdChecks: 0,
      proCtaClicks: 0,
    };
  }

  try {
    const [siteTraffic, proCatalogTraffic, resumeProTraffic, visits, proofStarts, launchInterests, checkouts, builderStarts, jobAdViews, jobAdSampleViews, jobAdChecks, proCtaClicks] = await Promise.all([
      fetchVercelVisits({ token, projectId, teamId, since, until }),
      fetchVercelVisits({ token, projectId, teamId, since, until, requestPath: "/pro" }),
      fetchVercelVisits({ token, projectId, teamId, since, until, requestPath: "/resume-pro" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Viewed" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Free Proof Opened" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Launch Interest" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Checkout Started", extraFilter: "eventData/product eq 'resume_pro'" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.builderStarted, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.builderForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.jobAdViewed, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.jobAdCheckerForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.jobAdSampleViewed, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.jobAdCheckerForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.jobAdChecked, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.jobAdCheckerForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.proCtaClicked, groupBy: "context" }),
    ]);
    const site = visitTotals(siteTraffic);
    const proCatalog = visitTotals(proCatalogTraffic);
    const resumePro = visitTotals(resumeProTraffic);
    return {
      state: { connected: true, status: "collected" as const, message: "Vercel의 익명 방문자·페이지뷰와 Resume Pro 퍼널 합계가 연결됐습니다." },
      siteVisitors: site.visitors,
      sitePageviews: site.pageviews,
      proCatalogVisitors: proCatalog.visitors,
      resumeProVisitors: resumePro.visitors,
      visits: aggregateMap(visits),
      proofStarts: aggregateMap(proofStarts),
      launchInterests: aggregateMap(launchInterests),
      checkouts: aggregateMap(checkouts),
      builderStarts: aggregateTotal(builderStarts),
      jobAdViews: aggregateTotal(jobAdViews),
      jobAdSampleViews: aggregateTotal(jobAdSampleViews),
      jobAdChecks: aggregateTotal(jobAdChecks),
      proCtaClicks: aggregateTotal(proCtaClicks),
    };
  } catch {
    return {
      state: { connected: false, status: "error" as const, message: "Vercel 연결 오류입니다. 토큰 권한과 프로젝트·팀 ID를 확인한 뒤 다시 불러오세요." },
      siteVisitors: 0,
      sitePageviews: 0,
      proCatalogVisitors: 0,
      resumeProVisitors: 0,
      visits: new Map<ResumeProEntry, number>(),
      proofStarts: new Map<ResumeProEntry, number>(),
      launchInterests: new Map<ResumeProEntry, number>(),
      checkouts: new Map<ResumeProEntry, number>(),
      builderStarts: 0,
      jobAdViews: 0,
      jobAdSampleViews: 0,
      jobAdChecks: 0,
      proCtaClicks: 0,
    };
  }
}

function emptyTrafficWindow(since: string, until: string): ResumeProTrafficWindow {
  return {
    since,
    until,
    siteVisitors: 0,
    sitePageviews: 0,
    proCatalogVisitors: 0,
    resumeProVisitors: 0,
  };
}

async function loadVercelTrafficComparison(now: Date): Promise<ResumeProTrafficComparison> {
  const windows = getUtcRolling24HourWindows(now);
  const [token, projectId, teamId] = await Promise.all([
    getLocalOperatorConnectionValue("VERCEL_TOKEN"),
    getLocalOperatorConnectionValue("VERCEL_PROJECT_ID"),
    getLocalOperatorConnectionValue("VERCEL_TEAM_ID"),
  ]);
  const emptyCurrent = emptyTrafficWindow(new Date(Number(windows.current.since)).toISOString(), new Date(Number(windows.current.until)).toISOString());
  const emptyPrevious = emptyTrafficWindow(new Date(Number(windows.previous.since)).toISOString(), new Date(Number(windows.previous.until)).toISOString());

  if (!token || !projectId) {
    return {
      status: "not_configured",
      message: "미수집: 이 컴퓨터에 Vercel 읽기 연결이 없어 24시간 비교를 불러오지 않았습니다.",
      current: emptyCurrent,
      previous: emptyPrevious,
    };
  }

  try {
    const [currentSite, currentPro, currentResumePro, previousSite, previousPro, previousResumePro] = await Promise.all([
      fetchVercelVisits({ token, projectId, teamId, ...windows.current }),
      fetchVercelVisits({ token, projectId, teamId, ...windows.current, requestPath: "/pro" }),
      fetchVercelVisits({ token, projectId, teamId, ...windows.current, requestPath: "/resume-pro" }),
      fetchVercelVisits({ token, projectId, teamId, ...windows.previous }),
      fetchVercelVisits({ token, projectId, teamId, ...windows.previous, requestPath: "/pro" }),
      fetchVercelVisits({ token, projectId, teamId, ...windows.previous, requestPath: "/resume-pro" }),
    ]);
    const currentSiteTotals = visitTotals(currentSite);
    const currentProTotals = visitTotals(currentPro);
    const currentResumeProTotals = visitTotals(currentResumePro);
    const previousSiteTotals = visitTotals(previousSite);
    const previousProTotals = visitTotals(previousPro);
    const previousResumeProTotals = visitTotals(previousResumePro);

    return {
      status: "collected",
      message: "수집됨: Production 익명 합계의 최근 24시간과 그 직전 24시간을 같은 길이로 비교합니다.",
      current: {
        ...emptyCurrent,
        siteVisitors: currentSiteTotals.visitors,
        sitePageviews: currentSiteTotals.pageviews,
        proCatalogVisitors: currentProTotals.visitors,
        resumeProVisitors: currentResumeProTotals.visitors,
      },
      previous: {
        ...emptyPrevious,
        siteVisitors: previousSiteTotals.visitors,
        sitePageviews: previousSiteTotals.pageviews,
        proCatalogVisitors: previousProTotals.visitors,
        resumeProVisitors: previousResumeProTotals.visitors,
      },
    };
  } catch {
    return {
      status: "error",
      message: "오류: Vercel 24시간 합계를 불러오지 못했습니다. 0으로 판단하지 말고 연결을 확인한 뒤 다시 시도하세요.",
      current: emptyCurrent,
      previous: emptyPrevious,
    };
  }
}

async function loadStripeTotals(sinceDate: Date) {
  const key = await getLocalOperatorConnectionValue("STRIPE_PERFORMANCE_KEY");
  if (!key?.startsWith("rk_test_") && !key?.startsWith("rk_live_")) {
    return {
      state: { connected: false, message: "Checkout Sessions와 PaymentIntents 읽기 권한을 가진 전용 STRIPE_PERFORMANCE_KEY를 연결하면 live 결제·환불·순액을 불러옵니다." },
      payments: new Map<ResumeProEntry, ResumeProPaymentTotals>(),
    };
  }

  const mode = key.startsWith("rk_live_") ? "live" as const : "test" as const;
  const stripe = new Stripe(key, {
    appInfo: { name: "Hoju Compass performance report", version: "0.1.0" },
    maxNetworkRetries: 2,
    timeout: 15_000,
    telemetry: false,
  });
  const payments = new Map<ResumeProEntry, ResumeProPaymentTotals>();

  try {
    for await (const session of stripe.checkout.sessions.list({
      created: { gte: Math.floor(sinceDate.getTime() / 1000) },
      limit: 100,
      expand: ["data.payment_intent.latest_charge"],
    })) {
      const paymentIntent = typeof session.payment_intent === "object" ? session.payment_intent : null;
      const charge = paymentIntent && typeof paymentIntent.latest_charge === "object"
        ? paymentIntent.latest_charge
        : null;
      const classified = classifyResumeProPerformancePayment({
        status: session.status,
        paymentStatus: session.payment_status,
        productCode: session.metadata?.product_code ?? null,
        currency: session.currency,
        amountTotal: session.amount_total,
        expectedCurrency: resumeProProduct.currency,
        expectedAmountTotal: resumeProProduct.priceCents,
        paymentIntentStatus: paymentIntent?.status ?? null,
        chargePaid: charge?.paid ?? null,
        amountRefunded: charge?.amount_refunded ?? null,
      });
      if (!classified) continue;

      const entry = normalizeResumeProEntry(session.metadata?.acquisition_source);
      payments.set(entry, addResumeProPaymentTotals(
        payments.get(entry) ?? emptyResumeProPaymentTotals(),
        classified,
      ));
    }

    return {
      state: { connected: true, mode, message: mode === "live" ? "Stripe live 결제·전액 환불·환불 반영 순액이 연결됐습니다." : "Stripe 테스트 결제·전액 환불·환불 반영 순액이 연결됐습니다." },
      payments,
    };
  } catch {
    return {
      state: { connected: false, mode, message: "Stripe 연결을 확인해 주세요. 제한 키에 Checkout Sessions와 PaymentIntents 읽기 권한이 필요합니다." },
      payments: new Map<ResumeProEntry, ResumeProPaymentTotals>(),
    };
  }
}

export async function getResumeProPerformance(days: 1 | 7 | 30 | 90): Promise<ResumeProPerformance> {
  const untilDate = new Date();
  const sinceDate = new Date(untilDate);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - days + 1);
  sinceDate.setUTCHours(0, 0, 0, 0);
  const since = dateText(sinceDate);
  const until = dateText(untilDate);

  const [vercel, stripe, trafficComparison] = await Promise.all([
    loadVercelTotals(since, until),
    loadStripeTotals(sinceDate),
    days === 1 ? loadVercelTrafficComparison(untilDate) : Promise.resolve(null),
  ]);

  return {
    since,
    until,
    vercel: vercel.state,
    stripe: stripe.state,
    trafficComparison,
    siteVisitors: vercel.siteVisitors,
    sitePageviews: vercel.sitePageviews,
    proCatalogVisitors: vercel.proCatalogVisitors,
    resumeProVisitors: vercel.resumeProVisitors,
    builderStarts: vercel.builderStarts,
    jobAdViews: vercel.jobAdViews,
    jobAdSampleViews: vercel.jobAdSampleViews,
    jobAdChecks: vercel.jobAdChecks,
    proCtaClicks: vercel.proCtaClicks,
    rows: entries.map(({ entry, label }) => {
      const payment = stripe.payments.get(entry) ?? emptyResumeProPaymentTotals();
      return {
        entry,
        label,
        visits: vercel.visits.get(entry) ?? 0,
        proofStarts: vercel.proofStarts.get(entry) ?? 0,
        launchInterests: vercel.launchInterests.get(entry) ?? 0,
        checkoutStarts: vercel.checkouts.get(entry) ?? 0,
        ...payment,
      };
    }),
  };
}
