import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const env = { PAYMENT_ALERTS_ENABLED: "true", PAYMENT_ALERT_TO_EMAIL: "support@hojucompass.com",
  PAYMENT_ALERT_FROM_EMAIL: "support@hojucompass.com", NEXT_PUBLIC_SUPPORT_EMAIL: "support@hojucompass.com",
  ZOHO_SMTP_HOST: "smtppro.zoho.com.au", ZOHO_SMTP_PORT: "465", ZOHO_SMTP_USER: "owner@hojucompass.com",
  ZOHO_SMTP_APP_PASSWORD: "synthetic-only" };
let sends = 0, closes = 0, transports = 0, fail = false;
const record = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync("src/lib/paymentAlerts.ts", "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, { module: record, exports: record.exports, Buffer, process: { env }, require(name) {
  assert.equal(name, "nodemailer");
  return { createTransport(config) { transports++; assert.equal(config.host, "smtppro.zoho.com.au"); return {
    async sendMail(message) { sends++; assert.equal(message.to, "support@hojucompass.com");
      assert.equal(message.replyTo, "support@hojucompass.com"); if (fail) throw Error("synthetic mail failure"); },
    close() { closes++; },
  }; } };
} });
const send = record.exports.sendPaymentOperatorMessage;
const valid = { subject: "Car payment", text: "Synthetic receipt", messageId: "<car-alert-paid-ABC123@hojucompass.com>" };
for (const invalid of [null, {}, { ...valid, subject: "bad\r\nBcc: bad@example.com" },
  { ...valid, subject: "a".repeat(201) }, { ...valid, text: "" }, { ...valid, text: "한".repeat(5500) },
  { ...valid, messageId: "<car-alert-paid-full_payment_identifier@hojucompass.com>" },
  { ...valid, messageId: "<car-alert-paid-ABC123@foreign.example>" }]) {
  await assert.rejects(send(invalid), /Invalid payment operator message/);
}
assert.equal(transports, 0);
env.PAYMENT_ALERTS_ENABLED = "false";
await assert.rejects(send(valid), /not configured/); assert.equal(transports, 0);
env.PAYMENT_ALERTS_ENABLED = "true";
assert.equal((await send(valid)).outcome, "sent");
assert.equal(closes, 1);
fail = true; await assert.rejects(send(valid), /synthetic mail failure/);
assert.equal(sends, 2); assert.equal(closes, 2);
console.log("PASS Car operator transport: invalid headers/oversized body/full identifiers rejected before SMTP; fixed recipient; transport closed on success and failure. 11 cases, mock SMTP only.");
