import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import Stripe from "stripe";

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function parseDate(value, label) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label} is not a valid date.`);
  }
  return date;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function objectId(value) {
  if (!value) return "";
  return typeof value === "string" ? value : value.id;
}

function safeStripeExportError(error) {
  const statusCode = typeof error === "object" && error !== null ? error.statusCode : undefined;
  const code = typeof error === "object" && error !== null ? error.code : undefined;
  if (statusCode === 403 || code === "more_permissions_required") {
    return new Error("Stripe accounting export needs Balance Transactions Read permission on the dedicated restricted key. No private file was written.");
  }
  return new Error("Stripe accounting export failed before a private file was written. Review the restricted key and Stripe availability without copying the raw SDK error.");
}

const fromText = argumentValue("--from");
const toText = argumentValue("--to");
const from = parseDate(fromText, "--from");
const to = parseDate(toText, "--to");

if (to <= from) throw new Error("--to must be later than --from. The end date is exclusive.");

const accountingKey = process.env.STRIPE_ACCOUNTING_KEY?.trim();
if (!accountingKey?.startsWith("rk_test_") && !accountingKey?.startsWith("rk_live_")) {
  throw new Error("STRIPE_ACCOUNTING_KEY must be a dedicated restricted Stripe key (rk_). Do not use the checkout key.");
}

const mode = accountingKey.startsWith("rk_live_") ? "live" : "test";
const outputRoot = path.resolve("private", "accounting");
const outputPath = path.join(outputRoot, `stripe-balance-${mode}-${fromText}-to-${toText}-exclusive.csv`);

const stripe = new Stripe(accountingKey, {
  appInfo: { name: "Hoju Compass accounting export", version: "0.1.0" },
  maxNetworkRetries: 2,
  timeout: 20_000,
  telemetry: false,
});

const header = [
  "created_utc",
  "available_on_utc",
  "currency",
  "reporting_category",
  "gross_amount",
  "fee_amount",
  "net_amount",
  "status",
  "source_id",
  "balance_transaction_id",
];
const rows = [header];

try {
  for await (const transaction of stripe.balanceTransactions.list({
    created: {
      gte: Math.floor(from.getTime() / 1000),
      lt: Math.floor(to.getTime() / 1000),
    },
    limit: 100,
  })) {
    rows.push([
      new Date(transaction.created * 1000).toISOString(),
      new Date(transaction.available_on * 1000).toISOString(),
      transaction.currency.toUpperCase(),
      transaction.reporting_category,
      (transaction.amount / 100).toFixed(2),
      (transaction.fee / 100).toFixed(2),
      (transaction.net / 100).toFixed(2),
      transaction.status,
      objectId(transaction.source),
      transaction.id,
    ]);
  }
} catch (error) {
  throw safeStripeExportError(error);
}

await mkdir(outputRoot, { recursive: true });
await writeFile(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, { flag: "wx" });

console.log(`Saved ${rows.length - 1} Stripe balance records to ${outputPath}`);
