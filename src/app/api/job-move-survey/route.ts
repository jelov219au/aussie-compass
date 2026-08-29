import { NextResponse, type NextRequest } from "next/server";

import { validateJobMoveSurveyAnswers } from "@/lib/jobMoveSurvey";
import { researchSurveyEmailConfigured, sendResearchSurveyResponse } from "@/lib/researchSurveyEmail";
import { validateSameOriginMutation } from "@/lib/requestSecurity";

const minimumCompletionTimeMs = 4_000;
const maximumCompletionTimeMs = 24 * 60 * 60 * 1_000;

export async function POST(request: NextRequest) {
  const security = await validateSameOriginMutation(request, {
    maxBodyBytes: 6_000,
    allowedContentTypes: ["application/json"],
  });
  if (!security.ok) return NextResponse.json({ error: security.error }, { status: security.status });

  if (request.cookies.get("job_move_survey_submitted")?.value === "1") {
    return NextResponse.json({ error: "이 브라우저에서는 이미 설문을 제출했습니다." }, { status: 409 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "설문 응답을 읽을 수 없습니다." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "올바르지 않은 설문 응답입니다." }, { status: 400 });
  }

  const candidate = body as { answers?: unknown; website?: unknown; startedAt?: unknown };
  if (typeof candidate.website === "string" && candidate.website.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const startedAt = typeof candidate.startedAt === "number" ? candidate.startedAt : NaN;
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(elapsed) || elapsed < minimumCompletionTimeMs || elapsed > maximumCompletionTimeMs) {
    return NextResponse.json({ error: "설문 페이지를 새로 열고 다시 제출해 주세요." }, { status: 400 });
  }

  if (!validateJobMoveSurveyAnswers(candidate.answers)) {
    return NextResponse.json({ error: "모든 질문에 하나씩 답해 주세요." }, { status: 400 });
  }

  if (!researchSurveyEmailConfigured()) {
    return NextResponse.json({ error: "설문 접수를 잠시 준비하고 있습니다." }, { status: 503 });
  }

  try {
    const result = await sendResearchSurveyResponse(candidate.answers);
    if (result.outcome !== "sent") {
      return NextResponse.json({ error: "설문 접수를 잠시 준비하고 있습니다." }, { status: 503 });
    }
  } catch {
    return NextResponse.json({ error: "응답 전송에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 502 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("job_move_survey_submitted", "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
