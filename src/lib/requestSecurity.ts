import "server-only";

import type { NextRequest } from "next/server";

type MutationRequestOptions = {
  maxBodyBytes?: number;
  allowedContentTypes?: string[];
};

export type MutationRequestCheck =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 413; error: string };

function normalizedContentType(value: string | null) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
}

export function validateSameOriginMutation(
  request: NextRequest,
  options: MutationRequestOptions = {},
): MutationRequestCheck {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  const requiresOrigin = process.env.VERCEL_ENV === "production";

  if (!origin && requiresOrigin) {
    return { ok: false, status: 403, error: "Request origin is required." };
  }

  if (origin) {
    try {
      if (new URL(origin).origin !== request.nextUrl.origin) {
        return { ok: false, status: 403, error: "Invalid request origin." };
      }
    } catch {
      return { ok: false, status: 403, error: "Invalid request origin." };
    }
  }

  if (fetchSite === "cross-site") {
    return { ok: false, status: 403, error: "Cross-site request rejected." };
  }

  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader && options.maxBodyBytes) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength < 0) {
      return { ok: false, status: 400, error: "Invalid request length." };
    }
    if (contentLength > options.maxBodyBytes) {
      return { ok: false, status: 413, error: "Request body is too large." };
    }
  }

  if (options.allowedContentTypes?.length) {
    const contentType = normalizedContentType(request.headers.get("content-type"));
    if (!options.allowedContentTypes.includes(contentType)) {
      return { ok: false, status: 400, error: "Unsupported request content type." };
    }
  }

  return { ok: true };
}
