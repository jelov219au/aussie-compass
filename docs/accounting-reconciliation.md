# Hoju Compass payment accounting and reconciliation

This workflow keeps accounting records private and separate from public site data. It is an operational record, not tax advice.

## What to record separately

For every reporting period, preserve these as separate amounts rather than recording only the bank deposit:

- gross customer sales
- tax shown on Stripe invoices, credit notes and tax reports
- refunds and disputes
- Stripe fees
- net movement in the Stripe balance
- payouts received in the business bank account
- the remaining Stripe ending balance

The bookkeeping classification of Managed Payments sales and GST must be confirmed with the registered tax agent. Do not infer the BAS treatment from the checkout screen alone.

Use `docs/registered-tax-agent-first-sale-handoff.md` for the pre-sale
consultation. The repository file is a blank field contract only; complete it
and retain all evidence in the approved private accounting location. Until its
private `overall_tax_handoff=PASS` criteria are satisfied, record
`UNRESOLVED`, keep Production payments off and do not invite the first customer.

## Private workbook

The generated workbook starts with the controlled live A$19.90 Resume Pro purchase and full refund recorded on 20 August 2026. Unknown fee and payout values remain blank until reconciled against Stripe reports and the bank statement. Do not add customer names, email addresses, card details, ABNs or secret keys to the workbook.

### Status-only controlled-payment reconciliation gate

After reconciling the 20 August owner-controlled live Resume Pro purchase and
full refund in the approved private workbook, record a separate status-only JSON
and run the local classifier. The JSON must not contain amounts, cash
differences, customer or bank information, full Stripe identifiers, source
document text, URLs, notes or credentials. Those remain only in the private
source reports, workbook and bank evidence.

```powershell
npm.cmd run accounting:controlled-reconciliation -- --template
npm.cmd run accounting:controlled-reconciliation -- --file <private-json-path>
```

The classifier reads one local file only. It does not query Stripe, read
environment variables, write a file, alter the ledger or contact a bank. It
requires the fixed live Resume scope and verifies status for the original
Checkout → PaymentIntent → Charge → Balance Transaction chain, preserved gross
sale, separately recorded Stripe fee, fee-tax boundary, full-refund original
chain, refund Balance movement and any refund-related fee adjustment, ending
balance, payout disposition, live/test isolation, private source retention and
the private workbook's cash-difference result.
Unknown values must remain `MISSING`; the JSON records only whether the private
source proves the difference is within ±A$0.01 and never records the difference
or any component amount.

`payout_state=matched` means an itemised payout was matched to the bank arrival.
`payout_state=source_verified_none` is allowed only when the closed Stripe
source window and bank evidence positively establish that this controlled
sale/refund chain created no payout movement requiring a bank match. The absence
of a downloaded report, a blank workbook cell or an assumed net-zero result does
not count. `pending` and `unresolved` remain `HOLD`.

Only the exact final result beginning
`CONTROLLED_PAYMENT_RECONCILIATION=PASS mode=live` satisfies this one accounting
gate. Any `HOLD`, `STOP`, missing final line, changed schema, non-live packet or
manually typed PASS keeps the first customer at `NO-GO`. The PASS does not
replace `CUSTOMER_DOCUMENT_TRUST_GATE=GO`: that separate classifier establishes
whether customer-facing artifacts show the transaction seller, document issuer
and support route, while this classifier accepts none of those fields and
decides only financial source-chain completeness. Neither classifier supplies a
tax conclusion or replaces the registered-tax-agent handoff.

The completed status file remains private and uncommitted. A PASS does not
authorise a customer payment, refund, payout, bank action, ledger entry, tax
position, customer contact, Production change or sale-gate reopen.

## Stripe source report

Stripe recommends Balance Transactions as the basis of balance reporting. For automatic payouts, use the itemised payout reconciliation report to match transactions and fees to the bank deposit.

The Balance Transaction API proves `amount`, total `fee`, `net` and a fee
breakdown whose `fee_details.type=tax` means tax on a Stripe fee. It does **not**
by itself prove the customer-facing tax that Managed Payments calculated and
withheld. Never relabel fee tax as `withheld_tax`, and never derive
`fee_net_of_withheld_tax` from `fee_details`. Keep those Managed Payments fields
in review until the actual payment detail, receipt/invoice or applicable tax
report supports them.

1. In Stripe, download the Balance or itemised Payout reconciliation CSV for the period.
2. Save the original export in a private accounting folder without editing it.
3. Copy only the required amounts and non-customer transaction references into the workbook.
4. Match each Stripe payout to the bank statement.
5. Investigate any non-zero reconciliation difference before marking the month complete.

Official Stripe references:

- https://docs.stripe.com/plan-integration/get-started/reporting-reconciliation
- https://docs.stripe.com/reports/payout-reconciliation
- https://docs.stripe.com/reports/balance-transaction-types
- https://docs.stripe.com/api/balance_transactions/object
- https://docs.stripe.com/payments/managed-payments/how-it-works

## Read-only export automation

The repository includes a read-only exporter for Stripe Balance Transactions. Use a separate restricted key with only the minimum read permissions needed for Balance Transactions. Never reuse the Checkout key and never put the key in source control.

For recurring exports, use `scripts/setup-accounting-automation.ps1`. It prompts
for the dedicated restricted key with masked input, verifies the permission
before saving it with Windows user-scoped encryption, and runs the idempotent
monthly exporter without placing the key in shell history. The end date passed
to the exporter is exclusive.

Before the first independent export, or after an accounting restricted-key
permission change, run the standalone no-write permission check while payments
remain off:

```powershell
.\scripts\run-accounting-preflight.ps1
```

The preflight requests at most one Balance Transaction only to prove the
dedicated key can read that resource. It accepts only an `rk_live_` restricted
key and has no test-mode override. It prints no transaction, account,
request-log or key identifier and imports no file-writing API. It keeps masked
input out of shell history, clears the process environment and zeroes its
unmanaged plaintext buffer.

Only the final line
`ACCOUNTING_PREFLIGHT=PASS mode=live permission=balance_transactions.read private_file_written=no`
is standalone accounting permission evidence. It is not first-customer launch
evidence and must not become a second launch prerequisite. The integrated
`scripts/run-production-payment-preflight.ps1` wrapper already exercises the
same prompted accounting key after the payment/database strict audit; only its
exact final `FIRST_SALE_PREFLIGHT=PASS` line satisfies the first-customer launch
gate. Use this standalone wrapper only for later independent revalidation after
the accounting key or its permission changes. Any `ACCOUNTING_PREFLIGHT=FAIL`,
missing final PASS, test result from another command, timeout or interrupted run
means the key remains unverified for export. A PASS does not export or alter any
accounting record.

### Integrated first-sale preflight handoff

The first customer's 15-minute, 24-hour and first-payout evidence must preserve
one private reference to the exact integrated `FIRST_SALE_PREFLIGHT=PASS` that
preceded that live Resume payment. The payment operator preserves it at 15
minutes, the operations owner confirms the same reference is unchanged at 24
hours, and the accounting operator carries it into the first-payout
reconciliation. A missing reference, a later configuration change, test/live
mixing or a reference from another approval window is fail-closed.

The standalone `ACCOUNTING_PREFLIGHT=PASS` is later accounting permission
evidence, not separate first-customer launch evidence, and cannot replace the
exact integrated `FIRST_SALE_PREFLIGHT=PASS`. Likewise, the Resume-only packet
cannot be used as Rental product-isolation evidence. Keep Rental off until its
separate live cross-product gate and transaction chain pass.

The exporter writes a new CSV under `private/accounting/` and refuses to overwrite an existing file. That directory is excluded from Git.
If the restricted key lacks Balance Transactions Read permission, the exporter
fails before writing a file and prints only the required permission. Do not copy
the raw Stripe SDK error into chat or an operations record because it can contain
account, restricted-key and request-log identifiers.

## Private automatic ledger

The automatic ledger keeps a derived spreadsheet-readable file at `private/accounting/hoju-compass-stripe-ledger.csv`. Every row records `environment=live/test`, and the ledger merges Balance Transactions by environment plus their unique Stripe transaction ID. A missed or repeated scheduled run cannot duplicate a transaction, while a test transaction can never replace or be mistaken for a live transaction. Existing source exports without an environment column remain readable because their immutable filename supplies the mode; a new export records the mode in both its filename and rows and fails closed if they disagree. The source exports remain unchanged beside it.

The setup script accepts only a dedicated Stripe restricted key (`rk_live_` or `rk_test_`) and runs the same no-write permission preflight before saving it. A failed or unavailable check does not save or replace the submitted credential and creates no scheduled task. After PASS, Windows encrypts the saved credential for the current Windows user and computer. Each morning at 7:15 the task checks both the completed UTC month-to-date window and the previous completed UTC month, and calls Stripe only when that immutable source window does not already exist. This puts a first payment into the private source ledger on the next available run after its UTC day closes instead of waiting for month end. The rolling month-to-date window also catches days missed while the laptop was off and refreshes a transaction whose Stripe balance status later changed from pending to available. The completed-month export remains the close-period source. When windows overlap, the merge prefers the source with the later end date and then the wider completed window, so a newer month-to-date snapshot or month-close record supersedes an earlier snapshot. A missed run continues after the laptop is next switched on.

Run the one-time setup locally and paste the key only into the protected PowerShell prompt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-accounting-automation.ps1
```

The live key should have only the read permission required for Balance Transactions. Do not give it write access and do not reuse the Checkout key or the separate `STRIPE_PERFORMANCE_KEY`; the performance report needs different read permissions. The generated CSV intentionally excludes customer names, email addresses, billing details and card information.

The formatted workbook in the private output folder remains the management and reconciliation file. Treat the automatically generated CSV as the read-only Stripe source ledger, and record bank matching, GST/BAS review and accountant notes in the formatted workbook rather than editing the derived CSV.

### First-payment support handoff link

For the first customer's 24-hour close, the private management workbook must
link one FP incident to the same live Checkout → PaymentIntent → Charge →
Balance Transaction source chain and its single ledger row. Record the
refund/dispute state as `NONE_CONFIRMED` at a dated source observation or link
each actual refund/dispute back to that original Charge, its separate balance
movement, support incident and entitlement outcome. Do not join records by
amount, timestamp, receipt wording or alert suffix.

The corresponding first-sale evidence check is
`support_ledger_original_transaction_chain_preserved`. It remains `MISSING`
until the private chain is complete; duplicate ledger posting, a different
original transaction, an uninspected source or an unlinked support/entitlement
result is `FAIL`. Either result keeps the 24-hour close at `HOLD` even if gross,
fee, refund and support checks separately appear complete.

### Refund/dispute outcome isolation

For the same dated source observation, partial refund, full refund and dispute
movements are not interchangeable. Preserve the original gross sale and post
only the actual source movement as a separate adjustment. A partial refund uses
a partial-refund adjustment and leaves entitlement in review; a succeeded full
refund uses a full-refund adjustment and revoked entitlement. An open dispute,
reinstated funds and a lost dispute use their respective dispute movements and
entitlement outcomes. Do not duplicate a refund adjustment for a dispute
movement or infer a tax/credit classification before its source document is
inspected.

The 24-hour evidence classifier computes
`refund_dispute_outcome_matrix_consistent` from the financial event,
entitlement, accounting and support outcomes. Pending, failed, mixed,
out-of-order or uninspected source states remain `unresolved` and keep the
24-hour close at `HOLD`; a manual check or owner approval cannot make an
inconsistent combination pass. The support outcome is an internal evidence
classification only and does not authorise customer contact, a refund, a
ledger entry or an entitlement change.

## Product-specific attribution

The automatic Stripe ledger is intentionally account-level and contains no
`product_code`. Once another paid product is introduced, do not treat every row
as Resume Pro and do not derive a product from price, description, an operator
alert or payout membership. Preserve the shared source unchanged and maintain a
separate private attribution index that traces each product row through the
native Checkout metadata → PaymentIntent → Charge → Balance Transaction
relationship. Refunds, disputes and chargebacks inherit the product only from
that original chain.

An unrelated active Stripe Product is not a Resume launch blocker. The
integrated first-sale preflight proves only the configured Resume Price and its
expanded exact Product; it must not list, mutate or disable an unrelated Product
just because it is active. Resume attribution requires the private native chain
exact Resume Product → Price → signed `metadata.product_code=resume_pro` →
Checkout → PaymentIntent → Charge → Balance Transaction. Product name, active
status, amount, currency, description, timing, alert text or payout membership
cannot replace any link.

The immutable account-level export remains unchanged. A row whose complete app
chain is absent, conflicting or belongs to a non-app Product stays
`UNALLOCATED` in the private attribution view; never force it into Resume or
Rental to make a subledger balance. If a native source chain positively proves
an unrelated non-app transaction, it may be reported in a separate
`OTHER_NON_APP` private view, but its mere catalogue existence is not a sale and
must not create a launch blocker. Unexpected live money movement still requires
accounting review and shared-ledger reconciliation, without changing or
disabling the Product.

Fees and taxes without a proven source relationship remain `UNALLOCATED` or
`UNRESOLVED`; they must not be spread between products just to make a product
report balance. Payouts remain shared Stripe-clearing movements rather than
product revenue. For each environment, currency and UTC window, Resume, Rental,
other-product and `UNALLOCATED` private views must sum exactly to the immutable
shared ledger's gross, fee and net columns. Follow the Rental launch gate in
`docs/pro-product-rollout.md`; its product switch remains off unless the exact
redacted `ACCOUNTING_PRODUCT_ISOLATION=PASS` result exists.

### Executable cross-product attribution gate

Use `npm.cmd run accounting:product-isolation -- --template` for a fresh
non-sensitive input contract, then classify the completed private copy with
`--file`. It requires both products' checkout metadata → Price → PaymentIntent →
Charge → Balance Transaction chains, distinct Product/Price and transaction
identities, original-chain refund, dispute, support and entitlement links, and
one shared-ledger reconciliation for the same mode, currency and UTC window.
Full identifiers and source documents stay in the approved private accounting
location; the classifier receives only fixed `PASS/MISSING/FAIL` outcomes.

The Resume-only first-sale packet cannot prove Rental isolation. Do not change
its `product_code`, copy its PASS values into Rental, or treat a `mode=test`
product-isolation result as live evidence. Any missing, mixed or structurally
invalid evidence is `UNRESOLVED`; keep the Rental switch off and do not classify
by price, amount, alert suffix or support wording.

## Retention and review

ATO guidance says business and GST records generally need to be retained for five years, with longer periods applying in some circumstances. Preserve the original Stripe invoice, refund or credit document, Stripe report, bank statement and the reconciliation workbook. Confirm the period that applies to the business with the registered tax agent.

Official ATO references:

- https://www.ato.gov.au/api/public/content/0-53cc7a8e-0668-4c9d-95d7-eb841eb09c04
- https://www.ato.gov.au/api/public/content/0-9354073c-055a-4d41-bd51-b7d9e6b4e834

## Monthly close checklist

- [ ] Export Stripe Balance and itemised payout reconciliation reports.
- [ ] Filter the derived ledger to `environment=live` and keep all test-mode rows outside first-customer evidence.
- [ ] Record gross sales, refunds, fees and net activity separately.
- [ ] Match automatic payouts to bank deposits.
- [ ] Confirm the Stripe ending balance agrees with the report.
- [ ] Save invoices, refund/credit documents and reports in the same period folder.
- [ ] Review GST and income classifications with the tax agent when the treatment changes or a new product launches.
