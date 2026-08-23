import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  accountingLedgerHeader,
  accountingRecordKey,
  accountingSourcePattern,
  normaliseAccountingRows,
} from "./accounting-ledger-schema.mjs";

const accountingRoot = path.resolve("private", "accounting");
const masterPath = path.join(accountingRoot, "hoju-compass-stripe-ledger.csv");

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

const files = (await readdir(accountingRoot)).filter((name) => accountingSourcePattern.test(name)).sort();
const records = new Map();

for (const file of files) {
  const rows = parseCsv(await readFile(path.join(accountingRoot, file), "utf8"));
  for (const row of normaliseAccountingRows(file, rows)) {
    const recordKey = accountingRecordKey(row);
    if (!recordKey) continue;
    records.set(recordKey, row);
  }
}

const sortedRows = [...records.values()].sort((left, right) => {
  const createdComparison = left[1].localeCompare(right[1]);
  return createdComparison || accountingRecordKey(left).localeCompare(accountingRecordKey(right));
});
const outputRows = [accountingLedgerHeader, ...sortedRows];

await writeFile(masterPath, `${outputRows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`);

console.log(`Updated the private accounting ledger with ${sortedRows.length} unique Stripe balance records.`);
