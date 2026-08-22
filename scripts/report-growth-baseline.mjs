import Stripe from "stripe";
import { readFile } from "node:fs/promises";

const DAY_MS = 24 * 60 * 60 * 1000;
const WINDOW_DAYS = 28;
const now = new Date();
const sinceDate = new Date(now.getTime() - (WINDOW_DAYS - 1) * DAY_MS);
sinceDate.setUTCHours(0, 0, 0, 0);

const privacyAllowlist = {
  pageviews: ["requestPath"],
  events: {
    "Article Next Step": ["destination"],
    "Resume Builder Completed": ["product", "essentials"],
    "Job Move Survey Completed": ["entry"],
    "Resume Pro Viewed": ["entry", "checkout"],
    "Rental Application Pro Viewed": ["entry", "checkoutAvailable"],
    "Checkout Started": ["product", "entry"],
    "Pro Access Attempted": ["product", "flow"],
    "Pro Access Failed": ["product", "reason"],
  },
  stripe: ["product_code", "acquisition_source", "amount_total", "amount_refunded", "currency", "payment_status", "created"],
  forbidden: ["name", "email", "phone", "address", "ip", "card", "checkout_session_id", "payment_intent_id", "restore_code", "free_text"],
};

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function dateText(date) {
  return date.toISOString().slice(0, 10);
}

function safeCount(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function rate(part, total) {
  return total >= 10 ? Number(((part / total) * 100).toFixed(1)) : null;
}

function vercelUrl(resource, parameters = {}) {
  const url = new URL(`https://api.vercel.com/v1/query/web-analytics/${resource}`);
  url.searchParams.set("projectId", required("VERCEL_PROJECT_ID"));
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (teamId) url.searchParams.set("teamId", teamId);
  url.searchParams.set("since", dateText(sinceDate));
  url.searchParams.set("until", dateText(now));
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
  return url;
}

async function vercelQuery(resource, parameters) {
  const response = await fetch(vercelUrl(resource, parameters), {
    headers: { Authorization: `Bearer ${required("VERCEL_TOKEN")}` },
  });
  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").slice(0, 300);
    throw new Error(`Vercel Web Analytics request failed (${response.status}): ${detail}`);
  }
  return response.json();
}

async function eventRows(eventName, by, extraFilter) {
  const filter = `eventName eq '${eventName}'${extraFilter ? ` and ${extraFilter}` : ""}`;
  const payload = await vercelQuery("events/aggregate", { by, filter, limit: 100 });
  return Array.isArray(payload.data) ? payload.data : [];
}

async function eventCount(eventName, extraFilter, by = "eventData/product") {
  const rows = await eventRows(eventName, by, extraFilter);
  return rows.reduce((sum, row) => sum + safeCount(row.count), 0);
}

async function pageviewCount(path) {
  const escapedPath = path.replaceAll("'", "''");
  const payload = await vercelQuery("visits/count", { filter: `requestPath eq '${escapedPath}'` });
  return safeCount(payload.count ?? payload.data?.count ?? payload.data);
}

async function articlePaths() {
  const source = await readFile(new URL("../src/data/articles.ts", import.meta.url), "utf8");
  return [...source.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)].map((match) => `/resources/${match[1]}`);
}

async function loadVercelBaseline() {
  const measuredToolPaths = ["/resume-builder", "/job-move-survey"];
  const [articleViewCounts, measuredToolViewCounts] = await Promise.all([
    Promise.all((await articlePaths()).map((path) => pageviewCount(path))),
    Promise.all(measuredToolPaths.map((path) => pageviewCount(path))),
  ]);
  const articleViews = articleViewCounts.reduce((sum, count) => sum + count, 0);
  const measuredToolViews = measuredToolViewCounts.reduce((sum, count) => sum + count, 0);

  const [articleToTool, resumeBuilderCompleted, jobMoveCompleted, resumeViews, rentalViews, resumeCheckoutStarts, rentalCheckoutStarts, resumeAccessAttempts, resumeAccessFailures, rentalAccessAttempts, rentalAccessFailures] = await Promise.all([
    eventCount("Article Next Step", "eventData/destination eq 'free_tool'", "eventData/destination"),
    eventCount("Resume Builder Completed", undefined, "eventData/product"),
    eventCount("Job Move Survey Completed", undefined, "eventData/entry"),
    eventCount("Resume Pro Viewed", undefined, "eventData/entry"),
    eventCount("Rental Application Pro Viewed", undefined, "eventData/entry"),
    eventCount("Checkout Started", "eventData/product eq 'resume_pro'"),
    eventCount("Checkout Started", "eventData/product eq 'rental_application_pro'"),
    eventCount("Pro Access Attempted", "eventData/product eq 'resume_pro'"),
    eventCount("Pro Access Failed", "eventData/product eq 'resume_pro'"),
    eventCount("Pro Access Attempted", "eventData/product eq 'rental_application_pro'"),
    eventCount("Pro Access Failed", "eventData/product eq 'rental_application_pro'"),
  ]);

  const toolCompletions = resumeBuilderCompleted + jobMoveCompleted;
  return {
    articleToTool: { articleViews, clicks: articleToTool, ratePct: rate(articleToTool, articleViews) },
    toolCompletion: {
      scope: ["resume-builder", "job-move-survey"],
      toolViews: measuredToolViews,
      completions: toolCompletions,
      ratePct: rate(toolCompletions, measuredToolViews),
    },
    products: {
      resume_pro: { visits: resumeViews, checkoutStarts: resumeCheckoutStarts, visitToCheckoutPct: rate(resumeCheckoutStarts, resumeViews) },
      rental_application_pro: { visits: rentalViews, checkoutStarts: rentalCheckoutStarts, visitToCheckoutPct: rate(rentalCheckoutStarts, rentalViews) },
    },
    accessFailure: {
      resume_pro: { failures: resumeAccessFailures, attempts: resumeAccessAttempts, ratePct: rate(resumeAccessFailures, resumeAccessAttempts) },
      rental_application_pro: { failures: rentalAccessFailures, attempts: rentalAccessAttempts, ratePct: rate(rentalAccessFailures, rentalAccessAttempts) },
    },
  };
}

async function loadStripeBaseline() {
  const key = required("STRIPE_ACCOUNTING_KEY");
  if (!key.startsWith("rk_live_") && !key.startsWith("rk_test_")) throw new Error("STRIPE_ACCOUNTING_KEY must be a restricted key.");
  const stripe = new Stripe(key, {
    appInfo: { name: "Hoju Compass growth baseline", version: "0.1.0" },
    maxNetworkRetries: 2,
    timeout: 15_000,
    telemetry: false,
  });
  const mode = key.startsWith("rk_live_") ? "live" : "test";
  const products = {
    resume_pro: { purchases: 0, grossCents: 0, refundedCents: 0, netRevenueCents: 0, refundedPurchases: 0 },
    rental_application_pro: { purchases: 0, grossCents: 0, refundedCents: 0, netRevenueCents: 0, refundedPurchases: 0 },
  };
  const eligibleSessions = [];

  for await (const session of stripe.checkout.sessions.list({
    created: { gte: Math.floor(sinceDate.getTime() / 1000) },
    limit: 100,
  })) {
    const productCode = session.metadata?.product_code;
    if (!(productCode in products) || session.status !== "complete" || session.payment_status !== "paid" || session.currency !== "aud") continue;
    const amount = safeCount(session.amount_total);
    products[productCode].purchases += 1;
    products[productCode].grossCents += amount;
    eligibleSessions.push({ productCode, paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id, amount });
  }

  let refundsAvailable = true;
  const paymentIntentMap = new Map(eligibleSessions.filter((item) => item.paymentIntentId).map((item) => [item.paymentIntentId, item]));
  try {
    for await (const charge of stripe.charges.list({ created: { gte: Math.floor(sinceDate.getTime() / 1000) }, limit: 100 })) {
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      const purchase = paymentIntentId ? paymentIntentMap.get(paymentIntentId) : undefined;
      if (!purchase) continue;
      const refunded = Math.min(purchase.amount, safeCount(charge.amount_refunded));
      products[purchase.productCode].refundedCents += refunded;
      if (refunded > 0) products[purchase.productCode].refundedPurchases += 1;
    }
  } catch {
    try {
      const refundedPurchases = new Set();
      for await (const refund of stripe.refunds.list({ created: { gte: Math.floor(sinceDate.getTime() / 1000) }, limit: 100 })) {
        const paymentIntentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
        const purchase = paymentIntentId ? paymentIntentMap.get(paymentIntentId) : undefined;
        if (!purchase || refund.status !== "succeeded") continue;
        products[purchase.productCode].refundedCents += Math.min(purchase.amount, safeCount(refund.amount));
        refundedPurchases.add(`${purchase.productCode}:${paymentIntentId}`);
      }
      for (const key of refundedPurchases) products[key.split(":", 1)[0]].refundedPurchases += 1;
    } catch {
      refundsAvailable = false;
    }
  }

  for (const product of Object.values(products)) {
    product.netRevenueCents = refundsAvailable ? product.grossCents - product.refundedCents : null;
    product.refundRatePct = refundsAvailable && product.purchases >= 10
      ? Number(((product.refundedPurchases / product.purchases) * 100).toFixed(1))
      : null;
  }

  return { mode, refundsAvailable, products };
}

async function main() {
  const output = {
    generatedAt: now.toISOString(),
    window: { days: WINDOW_DAYS, since: dateText(sinceDate), until: dateText(now) },
    decisionRule: "Do not draw a conclusion for any path whose denominator is below 10.",
    search: { status: "google_search_console_not_connected", impressions: null, clicks: null, ctrPct: null },
    privacyAllowlist,
  };

  try {
    output.vercel = await loadVercelBaseline();
  } catch (error) {
    output.vercel = { status: "unavailable", message: error instanceof Error ? error.message : "Unknown Vercel error." };
  }
  try {
    output.stripe = await loadStripeBaseline();
  } catch (error) {
    output.stripe = { status: "unavailable", message: error instanceof Error ? error.message : "Unknown Stripe error." };
  }

  console.log(JSON.stringify(output, null, 2));
}

await main();
