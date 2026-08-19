import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const accountingRoot = path.resolve("private", "accounting");
const masterPath = path.join(accountingRoot, "hoju-compass-stripe-ledger.csv");
const sourcePattern = /^stripe-balance-(?:live|test)-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}-exclusive\.csv$/;

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const files = (await readdir(accountingRoot)).filter((name) => sourcePattern.test(name)).sort();
const expectedHeader = [
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
const records = new Map();

for (const file of files) {
  const rows = parseCsv(await readFile(path.join(accountingRoot, file), "utf8"));
  const [header, ...dataRows] = rows;

  if (!header || header.join("|") !== expectedHeader.join("|")) {
    throw new Error(`Unexpected Stripe accounting columns in ${file}.`);
  }

  for (const row of dataRows) {
    const transactionId = row[9];
    if (!transactionId) continue;
    records.set(transactionId, row);
  }
}

const sortedRows = [...records.values()].sort((left, right) => {
  const createdComparison = left[0].localeCompare(right[0]);
  return createdComparison || left[9].localeCompare(right[9]);
});
const outputRows = [expectedHeader, ...sortedRows];

await writeFile(masterPath, `${outputRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);

console.log(`Updated the private accounting ledger with ${sortedRows.length} unique Stripe balance records.`);

