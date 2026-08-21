import "server-only";

import { randomUUID } from "node:crypto";
import nodemailer from "nodemailer";

import { jobMoveSurveyQuestions, type JobMoveSurveyAnswers } from "@/lib/jobMoveSurvey";

const defaultEmail = "support@hojucompass.com";

function mailConfig() {
  const password = process.env.ZOHO_SMTP_APP_PASSWORD?.trim();
  const user = process.env.ZOHO_SMTP_USER?.trim() || defaultEmail;
  const host = process.env.ZOHO_SMTP_HOST?.trim() || "smtppro.zoho.com";
  const port = Number(process.env.ZOHO_SMTP_PORT?.trim() || 465);

  if (!password || !Number.isInteger(port) || port < 1 || port > 65535) return null;

  return {
    host,
    port,
    secure: port === 465,
    user,
    password,
    from: process.env.PAYMENT_ALERT_FROM_EMAIL?.trim() || user,
    to: process.env.PAYMENT_ALERT_TO_EMAIL?.trim() || defaultEmail,
  };
}

export function researchSurveyEmailConfigured() {
  return mailConfig() !== null;
}

export async function sendResearchSurveyResponse(answers: JobMoveSurveyAnswers) {
  const config = mailConfig();
  if (!config) return { outcome: "unavailable" as const };

  const responseId = randomUUID();
  const text = [
    "Job Move Pro 공개 설문 응답이 도착했습니다.",
    "",
    ...jobMoveSurveyQuestions.flatMap((question, index) => [
      `${index + 1}. ${question.prompt}`,
      `답변: ${answers[question.id]}`,
      "",
    ]),
    `응답 ID: ${responseId}`,
    `수신 시각: ${new Date().toISOString()}`,
    "",
    "이 설문은 이름, 이메일, 전화번호와 자유 입력을 받지 않습니다.",
  ].join("\n");

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  await transporter.sendMail({
    from: `Hoju Compass 리서치 <${config.from}>`,
    to: config.to,
    subject: "[Hoju Compass] Job Move Pro 설문 응답",
    text,
    messageId: `<research-${responseId}@hojucompass.com>`,
    headers: { "X-Hoju-Compass-Research-Response": responseId },
  });

  return { outcome: "sent" as const };
}
