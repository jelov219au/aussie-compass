import { runPaymentAlertTransportCheck } from "../src/lib/paymentAlerts.ts";

const sendTest = process.argv.includes("--send-test");

try {
  const result = await runPaymentAlertTransportCheck({ sendTest });
  console.log("PASS  결제 알림 SMTP 인증 — Production 설정, Checkout OFF");
  if (result.testSent) {
    console.log("PASS  단일 테스트 메일 발송 요청 — 수신함 도착 여부를 별도로 확인하세요");
  } else {
    console.log("INFO  메일 미발송 — --send-test와 명시적 확인 문자열이 필요합니다");
  }
} catch {
  console.error("WAIT  결제 알림 전달 검증 — 설정, 인증 또는 네트워크 확인 필요");
  process.exitCode = 1;
}
