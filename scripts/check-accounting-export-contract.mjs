import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  accountingLedgerHeader,
  accountingRecordKey,
  balanceTransactionHeader,
  normaliseAccountingRows,
} from "./accounting-ledger-schema.mjs";

const source = await readFile(new URL("./export-stripe-accounting.mjs", import.meta.url), "utf8");
const mergeSource = await readFile(new URL("./merge-stripe-accounting.mjs", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("./accounting-ledger-schema.mjs", import.meta.url), "utf8");
const setupSource = await readFile(new URL("./setup-accounting-automation.ps1", import.meta.url), "utf8");
const accountingRunbook = await readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8");
const compactAccountingRunbook = accountingRunbook.replace(/\s+/g, " ");

for (const contract of [
  "STRIPE_ACCOUNTING_KEY",
  "rk_test_",
  "rk_live_",
  "balanceTransactions.list",
  "reporting_category",
  "private\", \"accounting",
  "flag: \"wx\"",
]) {
  assert.ok(source.includes(contract), `Accounting export safety contract is missing: ${contract}`);
}

for (const forbidden of ["customer_email", "billing_details", "receipt_email", "payment_method_details"]) {
  assert.ok(!source.includes(forbidden), `Accounting export must not collect customer data: ${forbidden}`);
  assert.ok(!mergeSource.includes(forbidden), `Accounting ledger must not collect customer data: ${forbidden}`);
}

assert.ok(!source.includes("STRIPE_PERFORMANCE_KEY"), "The Balance Transaction exporter must not accept the performance-report key role.");

for (const unsafeErrorField of ["error.message", "request_log_url", "requestId", "raw.message"]) {
  assert.ok(!source.includes(unsafeErrorField), `Accounting export must not print raw Stripe error data: ${unsafeErrorField}`);
}
assert.ok(source.includes('code === "more_permissions_required"'), "The exporter must recognise a missing Stripe permission without copying the raw error.");
assert.ok(source.includes("Balance Transactions Read permission") && source.includes("No private file was written"), "The exporter must return a safe actionable permission error.");
assert.ok(source.includes("throw safeStripeExportError(error)"), "All Stripe listing failures must pass through the safe error boundary.");

assert.ok(schemaSource.includes("balance_transaction_id"), "The private ledger must retain the Stripe balance transaction ID.");
assert.ok(source.includes("accountingLedgerHeader"), "Every new source export must record whether it came from live or test mode.");
assert.ok(mergeSource.includes("accountingRecordKey"), "The private ledger must deduplicate within a Stripe environment, not across live and test mode.");
assert.ok(setupSource.includes("Export-Clixml"), "The setup must protect the accounting credential with Windows encryption.");
assert.ok(setupSource.includes("rk_(live|test)_"), "The setup must reject full-access Stripe secret keys.");

const sharedTransactionId = "txn_shared_fixture";
const legacyRow = [
  "2026-08-20T00:00:00.000Z",
  "2026-08-22T00:00:00.000Z",
  "AUD",
  "charge",
  "19.90",
  "0.88",
  "19.02",
  "available",
  "ch_fixture",
  sharedTransactionId,
];
const [normalisedLegacyLive] = normaliseAccountingRows(
  "stripe-balance-live-2026-08-01-to-2026-09-01-exclusive.csv",
  [balanceTransactionHeader, legacyRow],
);
const [normalisedCurrentTest] = normaliseAccountingRows(
  "stripe-balance-test-2026-08-01-to-2026-09-01-exclusive.csv",
  [accountingLedgerHeader, ["test", ...legacyRow]],
);

assert.equal(normalisedLegacyLive[0], "live", "Legacy source exports must inherit live/test mode from their immutable filename.");
assert.equal(normalisedCurrentTest[0], "test", "Current source exports must retain their explicit environment.");
assert.notEqual(
  accountingRecordKey(normalisedLegacyLive),
  accountingRecordKey(normalisedCurrentTest),
  "Matching Stripe IDs in live and test mode must remain separate ledger records.",
);
assert.throws(
  () => normaliseAccountingRows(
    "stripe-balance-live-2026-08-01-to-2026-09-01-exclusive.csv",
    [accountingLedgerHeader, ["test", ...legacyRow]],
  ),
  /environment does not match/,
  "A source row must fail closed when its environment contradicts its filename.",
);

for (const boundary of [
  "fee_details.type=tax",
  "does **not**",
  "Never relabel fee tax as `withheld_tax`",
  "never derive",
  "actual payment detail, receipt/invoice or applicable tax report",
  "https://docs.stripe.com/api/balance_transactions/object",
  "https://docs.stripe.com/payments/managed-payments/how-it-works",
]) assert.ok(compactAccountingRunbook.includes(boundary), `Accounting runbook is missing the Managed Payments tax boundary: ${boundary}`);

console.log("Private Stripe accounting-export contract checks passed.");
