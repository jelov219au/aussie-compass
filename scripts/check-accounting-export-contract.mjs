import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./export-stripe-accounting.mjs", import.meta.url), "utf8");
const mergeSource = await readFile(new URL("./merge-stripe-accounting.mjs", import.meta.url), "utf8");
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

assert.ok(mergeSource.includes("balance_transaction_id"), "The private ledger must deduplicate by Stripe balance transaction ID.");
assert.ok(setupSource.includes("Export-Clixml"), "The setup must protect the accounting credential with Windows encryption.");
assert.ok(setupSource.includes("rk_(live|test)_"), "The setup must reject full-access Stripe secret keys.");

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
