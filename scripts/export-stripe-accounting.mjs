import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { accountingLedgerHeader } from "./accounting-ledger-schema.mjs";
import {
  createStripeAccountingClient,
  getStripeAccountingConfig,
  safeStripeAccountingError,
} from "./stripe-accounting-access.mjs";

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

const fromText = argumentValue("--from");
const toText = argumentValue("--to");
const from = parseDate(fromText, "--from");
const to = parseDate(toText, "--to");

if (to <= from) throw new Error("--to must be later than --from. The end date is exclusive.");

const { key, mode } = getStripeAccountingConfig();
const outputRoot = path.resolve("private", "accounting");
const outputPath = path.join(outputRoot, `stripe-balance-${mode}-${fromText}-to-${toText}-exclusive.csv`);

const stripe = createStripeAccountingClient(key, "Hoju Compass accounting export");

const rows = [accountingLedgerHeader];

try {
  for await (const transaction of stripe.balanceTransactions.list({
    created: {
      gte: Math.floor(from.getTime() / 1000),
      lt: Math.floor(to.getTime() / 1000),
    },
    limit: 100,
  })) {
    rows.push([
      mode,
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
  throw safeStripeAccountingError(error, "export");
}

await mkdir(outputRoot, { recursive: true });
await writeFile(outputPath, `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`, { flag: "wx" });

console.log(`Saved ${rows.length - 1} Stripe balance records to ${outputPath}`);
