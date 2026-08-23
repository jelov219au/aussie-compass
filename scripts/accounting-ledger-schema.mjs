export const balanceTransactionHeader = [
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

export const accountingLedgerHeader = ["environment", ...balanceTransactionHeader];

export const accountingSourcePattern = /^stripe-balance-(live|test)-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}-exclusive\.csv$/;

export function accountingEnvironmentFromFilename(filename) {
  const match = filename.match(accountingSourcePattern);
  if (!match) throw new Error(`Unexpected Stripe accounting filename: ${filename}.`);
  return match[1];
}

export function normaliseAccountingRows(filename, rows) {
  const environment = accountingEnvironmentFromFilename(filename);
  const [header, ...dataRows] = rows;

  if (!header) throw new Error(`Missing Stripe accounting columns in ${filename}.`);

  const isCurrent = header.join("|") === accountingLedgerHeader.join("|");
  const isLegacy = header.join("|") === balanceTransactionHeader.join("|");
  if (!isCurrent && !isLegacy) {
    throw new Error(`Unexpected Stripe accounting columns in ${filename}.`);
  }

  return dataRows.map((row) => {
    const normalised = isLegacy ? [environment, ...row] : row;
    if (normalised.length !== accountingLedgerHeader.length) {
      throw new Error(`Unexpected Stripe accounting row width in ${filename}.`);
    }
    if (normalised[0] !== environment) {
      throw new Error(`Stripe accounting environment does not match ${filename}.`);
    }
    return normalised;
  });
}

export function accountingRecordKey(row) {
  const environment = row[0];
  const balanceTransactionId = row[10];
  return environment && balanceTransactionId ? `${environment}:${balanceTransactionId}` : "";
}
