const vercelSsoOrigin = "https://vercel.com";
const vercelSsoPath = "/sso-api";

export const previewProtectionPaths = Object.freeze([
  "/",
  "/resume-builder",
  "/resume-pro",
  "/resources/english-resume-achievement-examples",
  "/terms",
  "/purchase-information",
  "/privacy",
  "/contact",
  "/payment-help",
  "/robots.txt",
  "/sitemap.xml",
]);

const canonicalPass = `PREVIEW_PROTECTION_EVIDENCE=PASS routes=${previewProtectionPaths.length} method=get redirects=blocked sso=vercel noindex=verified credentials=none cookies=none secrets_printed=no`;
const canonicalFail = `PREVIEW_PROTECTION_EVIDENCE=FAIL routes=${previewProtectionPaths.length} method=get redirects=blocked sso=unverified noindex=unverified credentials=none cookies=none secrets_printed=no launch=NO-GO`;

export class PreviewProtectionEvidenceError extends Error {
  constructor(reason) {
    super(reason);
    this.name = "PreviewProtectionEvidenceError";
    this.reason = reason;
  }
}

function fail(reason) {
  throw new PreviewProtectionEvidenceError(reason);
}

export function validatePreviewOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    fail("invalid_origin");
  }

  if (
    url.protocol !== "https:"
    || !url.hostname.endsWith(".vercel.app")
    || url.hostname === ".vercel.app"
    || url.pathname !== "/"
    || url.search
    || url.hash
    || url.username
    || url.password
    || url.port
  ) fail("invalid_origin");

  return url.origin;
}

function containsNoindex(value) {
  return typeof value === "string"
    && value.split(/[,\s]+/).some((directive) => directive.toLowerCase() === "noindex");
}

function assertVercelSsoRedirect(response, requestedUrl) {
  if (response?.status !== 302) fail("deployment_protection_missing");

  let responseUrl;
  let location;
  try {
    responseUrl = new URL(response.url);
    location = new URL(response.headers.get("location"));
  } catch {
    fail("invalid_sso_redirect");
  }

  if (responseUrl.toString() !== requestedUrl.toString()) fail("unexpected_response_url");
  if (
    location.origin !== vercelSsoOrigin
    || location.pathname !== vercelSsoPath
    || location.username
    || location.password
    || location.port
    || location.hash
    || location.searchParams.get("url") !== requestedUrl.toString()
  ) fail("invalid_sso_redirect");

  if (!containsNoindex(response.headers.get("x-robots-tag"))) fail("edge_noindex_missing");
}

async function inspectPath(fetchImpl, origin, path) {
  const requestedUrl = new URL(path, origin);
  let response;
  try {
    response = await fetchImpl(requestedUrl, {
      method: "GET",
      headers: {
        Accept: "text/html,application/xml;q=0.9,text/plain;q=0.8",
        "Cache-Control": "no-cache",
        "User-Agent": "hoju-compass-preview-protection-evidence/1.0",
      },
      redirect: "manual",
      credentials: "omit",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    fail("preview_unavailable");
  }

  assertVercelSsoRedirect(response, requestedUrl);
}

export async function auditPreviewProtectionEvidence({ origin, fetchImpl = fetch }) {
  const validatedOrigin = validatePreviewOrigin(origin);
  await Promise.all(
    previewProtectionPaths.map((path) => inspectPath(fetchImpl, validatedOrigin, path)),
  );

  return { routesChecked: previewProtectionPaths.length };
}

export function formatPreviewProtectionPass() {
  return canonicalPass;
}

export function formatPreviewProtectionFail(reason) {
  const safeReason = /^[a-z0-9_]+$/.test(reason ?? "") ? reason : "unexpected_error";
  return `${canonicalFail} reason=${safeReason}`;
}
