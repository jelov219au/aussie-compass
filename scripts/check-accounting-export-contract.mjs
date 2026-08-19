import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./export-stripe-accounting.mjs", import.meta.url), "utf8");

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
}

console.log("Private Stripe accounting-export contract checks passed.");
