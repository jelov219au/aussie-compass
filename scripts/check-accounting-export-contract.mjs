import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  accountingLedgerHeader,
  accountingRecordKey,
  accountingSourcePrecedence,
  balanceTransactionHeader,
  compareAccountingSourcePrecedence,
  normaliseAccountingRows,
} from "./accounting-ledger-schema.mjs";
import { safeStripeAccountingError } from "./stripe-accounting-access.mjs";

const source = await readFile(new URL("./export-stripe-accounting.mjs", import.meta.url), "utf8");
const accessSource = await readFile(new URL("./stripe-accounting-access.mjs", import.meta.url), "utf8");
const preflightSource = await readFile(new URL("./preflight-stripe-accounting.mjs", import.meta.url), "utf8");
const mergeSource = await readFile(new URL("./merge-stripe-accounting.mjs", import.meta.url), "utf8");
const schemaSource = await readFile(new URL("./accounting-ledger-schema.mjs", import.meta.url), "utf8");
const setupSource = await readFile(new URL("./setup-accounting-automation.ps1", import.meta.url), "utf8");
const refreshSource = await readFile(new URL("./run-accounting-refresh.ps1", import.meta.url), "utf8");
const securePreflightSource = await readFile(new URL("./run-accounting-preflight.ps1", import.meta.url), "utf8");
const accountingRunbook = await readFile(new URL("../docs/accounting-reconciliation.md", import.meta.url), "utf8");
const taxAgentHandoff = await readFile(new URL("../docs/registered-tax-agent-first-sale-handoff.md", import.meta.url), "utf8");
const firstPaymentOperationsPacket = await readFile(new URL("../docs/first-payment-24-hour-operations-packet.md", import.meta.url), "utf8");
const productRollout = await readFile(new URL("../docs/pro-product-rollout.md", import.meta.url), "utf8");
const paymentAlertsRunbook = await readFile(new URL("../docs/payment-alerts.md", import.meta.url), "utf8");
const packageSource = await readFile(new URL("../package.json", import.meta.url), "utf8");
const compactAccountingRunbook = accountingRunbook.replace(/\s+/g, " ");
const compactProductRollout = productRollout.replace(/\s+/g, " ");
const compactPaymentAlertsRunbook = paymentAlertsRunbook.replace(/\s+/g, " ");
const accessContract = `${source}\n${accessSource}`;

for (const contract of [
  "STRIPE_ACCOUNTING_KEY",
  "rk_test_",
  "rk_live_",
  "balanceTransactions.list",
  "reporting_category",
  "private\", \"accounting",
  "flag: \"wx\"",
]) {
  assert.ok(accessContract.includes(contract), `Accounting export safety contract is missing: ${contract}`);
}

for (const forbidden of ["customer_email", "billing_details", "receipt_email", "payment_method_details"]) {
  assert.ok(!source.includes(forbidden), `Accounting export must not collect customer data: ${forbidden}`);
  assert.ok(!accessSource.includes(forbidden), `Accounting access boundary must not collect customer data: ${forbidden}`);
  assert.ok(!preflightSource.includes(forbidden), `Accounting preflight must not collect customer data: ${forbidden}`);
  assert.ok(!mergeSource.includes(forbidden), `Accounting ledger must not collect customer data: ${forbidden}`);
}

assert.ok(!accessContract.includes("STRIPE_PERFORMANCE_KEY"), "The Balance Transaction exporter must not accept the performance-report key role.");

for (const unsafeErrorField of ["error.message", "request_log_url", "requestId", "raw.message"]) {
  assert.ok(!accessContract.includes(unsafeErrorField), `Accounting export must not print raw Stripe error data: ${unsafeErrorField}`);
  assert.ok(!preflightSource.includes(unsafeErrorField), `Accounting preflight must not print raw Stripe error data: ${unsafeErrorField}`);
}
assert.ok(accessSource.includes('code === "more_permissions_required"'), "Accounting access must recognise a missing Stripe permission without copying the raw error.");
assert.ok(accessSource.includes("Balance Transactions Read permission") && accessSource.includes("No private file was written"), "Accounting access must return a safe actionable permission error.");
assert.ok(source.includes('throw safeStripeAccountingError(error, "export")'), "All export listing failures must pass through the safe error boundary.");
assert.ok(preflightSource.includes('throw safeStripeAccountingError(error, "preflight")'), "All preflight listing failures must pass through the safe error boundary.");
assert.ok(preflightSource.includes("balanceTransactions.list({ limit: 1 })"), "The preflight must make only the minimum Balance Transactions read probe.");
for (const writeBoundary of ["node:fs", "writeFile", "mkdir", '"private"', "Export-Clixml"]) {
  assert.ok(!preflightSource.includes(writeBoundary), `Accounting preflight must not contain a file-write boundary: ${writeBoundary}`);
}
assert.ok(packageSource.includes('"accounting:preflight": "node scripts/preflight-stripe-accounting.mjs"'), "The no-write accounting preflight must be exposed as a package command.");
for (const secureBoundary of [
  'Read-Host "Stripe accounting live restricted key" -AsSecureString',
  "SecureStringToBSTR",
  "PtrToStringBSTR",
  'SetEnvironmentVariable("STRIPE_ACCOUNTING_KEY", $plainKey, "Process")',
  'Remove-Item -LiteralPath "Env:STRIPE_ACCOUNTING_KEY"',
  "ZeroFreeBSTR",
  "'^rk_live_[A-Za-z0-9]+$'",
  "npm.cmd run accounting:preflight",
  'ACCOUNTING_PREFLIGHT=PASS mode=live permission=balance_transactions.read private_file_written=no',
  'ACCOUNTING_PREFLIGHT=FAIL mode=unverified permission=unverified private_file_written=no launch=NO-GO',
  "exit $exitCode",
]) assert.ok(securePreflightSource.includes(secureBoundary), `Secure accounting preflight is missing: ${secureBoundary}`);
assert.ok(securePreflightSource.indexOf("SetEnvironmentVariable") < securePreflightSource.indexOf("npm.cmd run accounting:preflight"), "The masked key must be process-scoped before the preflight starts.");
assert.ok(securePreflightSource.indexOf("npm.cmd run accounting:preflight") < securePreflightSource.indexOf("Remove-Item -LiteralPath"), "The process key must be cleared after the preflight attempt.");
assert.ok(!securePreflightSource.includes("AllowTest"), "The first-customer wrapper must never turn a test-mode verification into a launch PASS.");
assert.ok(!securePreflightSource.includes("rk_test_"), "The first-customer wrapper must reject test-mode key input before calling Stripe.");
assert.ok(securePreflightSource.indexOf("$exitCode = 0") < securePreflightSource.indexOf("ACCOUNTING_PREFLIGHT=PASS"), "PASS must be emitted only after the Stripe verification succeeds.");
assert.ok(accountingRunbook.includes(".\\scripts\\run-accounting-preflight.ps1"), "The accounting runbook must use the masked live preflight wrapper.");
assert.ok(accountingRunbook.includes("It is not first-customer launch") && accountingRunbook.includes("must not become a second launch prerequisite"), "The accounting runbook must not turn the standalone permission probe into a duplicate first-sale gate.");
assert.ok(accountingRunbook.includes("FIRST_SALE_PREFLIGHT=PASS") && accountingRunbook.includes("later independent revalidation"), "The accounting runbook must defer first-customer launch evidence to the integrated preflight.");
assert.ok(!accountingRunbook.includes('$env:STRIPE_ACCOUNTING_KEY = "rk_live_..."'), "The accounting runbook must not place a live restricted key placeholder in shell history.");

const sensitiveStripeMarker = "acct_sensitive_request_fixture";
const permissionFailure = safeStripeAccountingError({
  code: "more_permissions_required",
  message: sensitiveStripeMarker,
  requestId: sensitiveStripeMarker,
}, "preflight");
const unknownFailure = safeStripeAccountingError({
  code: "api_connection_error",
  message: sensitiveStripeMarker,
  request_log_url: sensitiveStripeMarker,
}, "preflight");
assert.match(permissionFailure.message, /Balance Transactions Read permission/, "A missing permission must return the actionable role only.");
assert.match(unknownFailure.message, /Review the restricted key and Stripe availability/, "An unknown failure must return a safe operator action.");
assert.ok(!permissionFailure.message.includes(sensitiveStripeMarker) && !unknownFailure.message.includes(sensitiveStripeMarker), "Accounting preflight failures must redact raw Stripe error fields.");

assert.ok(schemaSource.includes("balance_transaction_id"), "The private ledger must retain the Stripe balance transaction ID.");
assert.ok(source.includes("accountingLedgerHeader"), "Every new source export must record whether it came from live or test mode.");
assert.ok(mergeSource.includes("accountingRecordKey"), "The private ledger must deduplicate within a Stripe environment, not across live and test mode.");
assert.ok(mergeSource.includes("compareAccountingSourcePrecedence"), "Overlapping daily and monthly sources must use deterministic close-period precedence.");
assert.ok(setupSource.includes("Export-Clixml"), "The setup must protect the accounting credential with Windows encryption.");
assert.ok(setupSource.includes("rk_(live|test)_"), "The setup must reject full-access Stripe secret keys.");
assert.ok(setupSource.includes("npm.cmd run accounting:preflight"), "The setup must verify Balance Transactions Read before saving the credential.");
assert.ok(setupSource.indexOf("npm.cmd run accounting:preflight") < setupSource.indexOf("Export-Clixml"), "The setup must run the permission preflight before saving the credential.");
for (const dailyBoundary of [
  "[DateTime]::UtcNow.Date",
  "$utcToday -gt $utcMonthStart",
  "From = $utcMonthStart.ToString",
  "To = $utcToday.ToString",
  "$utcMonthStart.AddMonths(-1)",
  "foreach ($window in $windows)",
  "npm.cmd run accounting:export -- --from $window.From --to $window.To",
]) assert.ok(refreshSource.includes(dailyBoundary), `The scheduled first-sale accounting refresh is missing: ${dailyBoundary}`);
assert.ok(setupSource.includes("completed UTC month-to-date and previous completed month"), "The scheduled task description must disclose rolling first-sale capture and monthly close capture.");

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
const dailyPrecedence = accountingSourcePrecedence("stripe-balance-live-2026-08-20-to-2026-08-21-exclusive.csv");
const monthlyPrecedence = accountingSourcePrecedence("stripe-balance-live-2026-08-01-to-2026-09-01-exclusive.csv");
const sameEndDailyPrecedence = accountingSourcePrecedence("stripe-balance-live-2026-08-31-to-2026-09-01-exclusive.csv");
assert.ok(compareAccountingSourcePrecedence(monthlyPrecedence, dailyPrecedence) > 0, "A later completed month must supersede an earlier daily snapshot of the same transaction.");
assert.ok(compareAccountingSourcePrecedence(monthlyPrecedence, sameEndDailyPrecedence) > 0, "A wider completed-month source must supersede a daily snapshot with the same end date.");
assert.throws(
  () => accountingSourcePrecedence("stripe-balance-live-2026-02-30-to-2026-03-02-exclusive.csv"),
  /Invalid Stripe accounting date window/,
  "A calendar-invalid source window must fail closed instead of being normalised by Date.",
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
for (const boundary of [
  "completed UTC month-to-date window",
  "first payment into the private source ledger on the next available run after its UTC day closes",
  "catches days missed while the laptop was off",
  "pending to available",
  "completed-month export remains the close-period source",
  "newer month-to-date snapshot or month-close record supersedes an earlier snapshot",
]) assert.ok(compactAccountingRunbook.includes(boundary), `Accounting runbook is missing the first-sale capture boundary: ${boundary}`);

for (const boundary of [
  "The repository copy must remain blank",
  "registered tax agent",
  "F1",
  "F6",
  "Q1",
  "Q9",
  "Required bookkeeping mapping",
  "Gross customer consideration",
  "Customer-facing tax shown",
  "Managed Payments calculated/withheld amount",
  "Stripe fee",
  "Tax on Stripe fee",
  "Refund or credit adjustment",
  "Dispute/chargeback",
  "Stripe clearing balance",
  "Bank payout",
  "overall_tax_handoff",
  "PASS",
  "UNRESOLVED",
  "second sale at `HOLD`",
]) assert.ok(taxAgentHandoff.includes(boundary), `Registered tax-agent handoff is missing: ${boundary}`);
for (const forbidden of [
  /\b\d{11}\b/,
  /\b(?:acct|ch|pi|cs|txn|re)_[A-Za-z0-9]{8,}\b/,
  /\b(?:rk|sk)_(?:live|test)_[A-Za-z0-9]+\b/,
]) assert.doesNotMatch(taxAgentHandoff, forbidden, `Blank tax-agent handoff contains forbidden live evidence: ${forbidden}`);
assert.ok(accountingRunbook.includes("docs/registered-tax-agent-first-sale-handoff.md"), "The accounting runbook must route post-first-sale professional advice through the handoff.");
assert.ok(firstPaymentOperationsPacket.includes("docs/registered-tax-agent-first-sale-handoff.md"), "The 24-hour packet must preserve the post-first-sale tax-agent gate.");
assert.ok(accountingRunbook.includes("overall_tax_handoff=PASS") && accountingRunbook.includes("UNRESOLVED"), "The accounting runbook must fail closed until tax-agent advice is complete.");
assert.ok(firstPaymentOperationsPacket.includes("overall_tax_handoff=PASS") && firstPaymentOperationsPacket.includes("UNRESOLVED"), "The first-payment packet must fail closed when later evidence contradicts tax advice.");
assert.ok(accountingRunbook.includes("not a Stripe setup prerequisite") && accountingRunbook.includes("second sale at `HOLD`"), "The accounting runbook must not over-block the single first sale on optional professional advice.");

assert.ok(!accountingLedgerHeader.includes("product_code"), "The immutable Balance Transaction ledger must not pretend to contain Stripe product attribution.");
for (const boundary of [
  "Rental accounting isolation gate",
  "account-level source ledger",
  "Never infer a product",
  "rental_application_pro",
  "signed `metadata.product_code`",
  "PaymentIntent",
  "Charge",
  "Balance Transaction",
  "UNALLOCATED",
  "Resume subledger totals",
  "ACCOUNTING_PRODUCT_ISOLATION=PASS mode=live products=resume_pro+rental_application_pro price_identity=PASS source_chain=PASS adjustment_support_chain=PASS non_app_unallocated=PASS shared_reconciliation=PASS unresolved=0",
  "ACCOUNTING_PRODUCT_ISOLATION=UNRESOLVED",
  "launch `NO-GO`",
]) assert.ok(compactProductRollout.includes(boundary), `Rental accounting isolation gate is missing: ${boundary}`);
for (const boundary of [
  "contains no `product_code`",
  "Checkout metadata → PaymentIntent → Charge → Balance Transaction",
  "Refunds, disputes and chargebacks inherit the product only from that original chain",
  "Payouts remain shared Stripe-clearing movements rather than product revenue",
  "ACCOUNTING_PRODUCT_ISOLATION=PASS",
]) assert.ok(compactAccountingRunbook.includes(boundary), `Accounting runbook is missing product isolation: ${boundary}`);
for (const boundary of [
  "An alert is not accounting product-attribution evidence",
  "refund and dispute alerts can omit a product label",
  "Never classify Resume or Rental revenue, refunds, fees, taxes or payouts",
  "docs/pro-product-rollout.md",
]) assert.ok(compactPaymentAlertsRunbook.includes(boundary), `Payment-alert runbook is missing accounting isolation: ${boundary}`);

console.log("Private Stripe accounting-export contract checks passed.");
