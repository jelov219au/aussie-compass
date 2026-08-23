import "server-only";

import Stripe from "stripe";
import { resumeProProduct } from "@/lib/commerce";
import { getLocalOperatorConnectionValue } from "@/lib/localOperatorConnection";
import { normalizeResumeProEntry, type ResumeProEntry } from "@/lib/resumeProAttribution";
import { resumeFunnelEvents, resumeFunnelSurfaces } from "@/lib/resumeFunnelAnalyticsContract";

export type ResumeProPerformanceRow = {
  entry: ResumeProEntry;
  label: string;
  visits: number;
  proofStarts: number;
  launchInterests: number;
  checkoutStarts: number;
  purchases: number;
  revenueCents: number;
};

type ConnectionState = {
  connected: boolean;
  message: string;
  mode?: "live" | "test";
};

export type ResumeProPerformance = {
  rows: ResumeProPerformanceRow[];
  builderStarts: number;
  jobAdChecks: number;
  proCtaClicks: number;
  since: string;
  until: string;
  vercel: ConnectionState;
  stripe: ConnectionState;
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
  { entry: "direct", label: "직접 방문·기타" },
];

type VercelAggregateResponse = {
  data?: Array<{ eventData?: unknown; count?: unknown }>;
};

function dateText(date: Date) {
  return date.toISOString().slice(0, 10);
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
  url.searchParams.set("filter", `eventName eq '${params.eventName}'${params.extraFilter ? ` and ${params.extraFilter}` : ""}`);

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
      state: { connected: false, message: "VERCEL_TOKEN과 VERCEL_PROJECT_ID를 연결하면 Builder 시작부터 결제 시작까지 익명 합계를 자동으로 불러옵니다." },
      visits: new Map<ResumeProEntry, number>(),
      proofStarts: new Map<ResumeProEntry, number>(),
      launchInterests: new Map<ResumeProEntry, number>(),
      checkouts: new Map<ResumeProEntry, number>(),
      builderStarts: 0,
      jobAdChecks: 0,
      proCtaClicks: 0,
    };
  }

  try {
    const [visits, proofStarts, launchInterests, checkouts, builderStarts, jobAdChecks, proCtaClicks] = await Promise.all([
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Viewed" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Free Proof Opened" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Resume Pro Launch Interest" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: "Checkout Started", extraFilter: "eventData/product eq 'resume_pro'" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.builderStarted, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.builderForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.jobAdChecked, extraFilter: `eventData/surface eq '${resumeFunnelSurfaces.jobAdCheckerForm}'`, groupBy: "context" }),
      fetchVercelEvent({ token, projectId, teamId, since, until, eventName: resumeFunnelEvents.proCtaClicked, groupBy: "context" }),
    ]);
    return {
      state: { connected: true, message: "Vercel의 익명 집계 데이터가 연결됐습니다." },
      visits: aggregateMap(visits),
      proofStarts: aggregateMap(proofStarts),
      launchInterests: aggregateMap(launchInterests),
      checkouts: aggregateMap(checkouts),
      builderStarts: aggregateTotal(builderStarts),
      jobAdChecks: aggregateTotal(jobAdChecks),
      proCtaClicks: aggregateTotal(proCtaClicks),
    };
  } catch {
    return {
      state: { connected: false, message: "Vercel 연결을 확인해 주세요. 토큰 권한과 프로젝트·팀 ID가 맞아야 합니다." },
      visits: new Map<ResumeProEntry, number>(),
      proofStarts: new Map<ResumeProEntry, number>(),
      launchInterests: new Map<ResumeProEntry, number>(),
      checkouts: new Map<ResumeProEntry, number>(),
      builderStarts: 0,
      jobAdChecks: 0,
      proCtaClicks: 0,
    };
  }
}

async function loadStripeTotals(sinceDate: Date) {
  const key = await getLocalOperatorConnectionValue("STRIPE_ACCOUNTING_KEY");
  if (!key?.startsWith("rk_test_") && !key?.startsWith("rk_live_")) {
    return {
      state: { connected: false, message: "Checkout Sessions 읽기 권한만 가진 STRIPE_ACCOUNTING_KEY를 연결하면 구매와 매출을 불러옵니다." },
      purchases: new Map<ResumeProEntry, { count: number; revenueCents: number }>(),
    };
  }

  const mode = key.startsWith("rk_live_") ? "live" as const : "test" as const;
  const stripe = new Stripe(key, {
    appInfo: { name: "Hoju Compass performance report", version: "0.1.0" },
    maxNetworkRetries: 2,
    timeout: 15_000,
    telemetry: false,
  });
  const purchases = new Map<ResumeProEntry, { count: number; revenueCents: number }>();

  try {
    for await (const session of stripe.checkout.sessions.list({
      created: { gte: Math.floor(sinceDate.getTime() / 1000) },
      limit: 100,
    })) {
      const isResumeProPurchase = session.status === "complete"
        && session.payment_status === "paid"
        && session.metadata?.product_code === "resume_pro"
        && session.currency === resumeProProduct.currency
        && session.amount_total === resumeProProduct.priceCents;
      if (!isResumeProPurchase) continue;

      const entry = normalizeResumeProEntry(session.metadata?.acquisition_source);
      const current = purchases.get(entry) ?? { count: 0, revenueCents: 0 };
      purchases.set(entry, {
        count: current.count + 1,
        revenueCents: current.revenueCents + (session.amount_total ?? 0),
      });
    }

    return {
      state: { connected: true, mode, message: mode === "live" ? "Stripe 실결제 집계가 연결됐습니다." : "Stripe 테스트 결제 집계가 연결됐습니다." },
      purchases,
    };
  } catch {
    return {
      state: { connected: false, mode, message: "Stripe 연결을 확인해 주세요. 제한 키에 Checkout Sessions 읽기 권한이 필요합니다." },
      purchases: new Map<ResumeProEntry, { count: number; revenueCents: number }>(),
    };
  }
}

export async function getResumeProPerformance(days: 7 | 30 | 90): Promise<ResumeProPerformance> {
  const untilDate = new Date();
  const sinceDate = new Date(untilDate);
  sinceDate.setUTCDate(sinceDate.getUTCDate() - days + 1);
  sinceDate.setUTCHours(0, 0, 0, 0);
  const since = dateText(sinceDate);
  const until = dateText(untilDate);

  const [vercel, stripe] = await Promise.all([
    loadVercelTotals(since, until),
    loadStripeTotals(sinceDate),
  ]);

  return {
    since,
    until,
    vercel: vercel.state,
    stripe: stripe.state,
    builderStarts: vercel.builderStarts,
    jobAdChecks: vercel.jobAdChecks,
    proCtaClicks: vercel.proCtaClicks,
    rows: entries.map(({ entry, label }) => ({
      entry,
      label,
      visits: vercel.visits.get(entry) ?? 0,
      proofStarts: vercel.proofStarts.get(entry) ?? 0,
      launchInterests: vercel.launchInterests.get(entry) ?? 0,
      checkoutStarts: vercel.checkouts.get(entry) ?? 0,
      purchases: stripe.purchases.get(entry)?.count ?? 0,
      revenueCents: stripe.purchases.get(entry)?.revenueCents ?? 0,
    })),
  };
}
