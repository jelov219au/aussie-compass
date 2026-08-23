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

## Private workbook

The generated workbook starts with the controlled live A$19.90 Resume Pro purchase and full refund recorded on 20 August 2026. Unknown fee and payout values remain blank until reconciled against Stripe reports and the bank statement. Do not add customer names, email addresses, card details, ABNs or secret keys to the workbook.

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

Example (the end date is exclusive):

```powershell
$env:STRIPE_ACCOUNTING_KEY = "rk_live_..."
npm run accounting:export -- --from 2026-07-01 --to 2026-08-01
Remove-Item Env:STRIPE_ACCOUNTING_KEY
```

The exporter writes a new CSV under `private/accounting/` and refuses to overwrite an existing file. That directory is excluded from Git.
If the restricted key lacks Balance Transactions Read permission, the exporter
fails before writing a file and prints only the required permission. Do not copy
the raw Stripe SDK error into chat or an operations record because it can contain
account, restricted-key and request-log identifiers.

## Private automatic ledger

The monthly automation keeps a derived spreadsheet-readable file at `private/accounting/hoju-compass-stripe-ledger.csv`. Every row records `environment=live/test`, and the ledger merges Balance Transactions by environment plus their unique Stripe transaction ID. A missed or repeated scheduled run cannot duplicate a transaction, while a test transaction can never replace or be mistaken for a live transaction. Existing source exports without an environment column remain readable because their immutable filename supplies the mode; a new export records the mode in both its filename and rows and fails closed if they disagree. The source exports remain unchanged beside it.

The setup script accepts only a dedicated Stripe restricted key (`rk_live_` or `rk_test_`). Windows encrypts the saved credential for the current Windows user and computer. The task checks the previous completed month each morning at 7:15 and calls Stripe only when that month's immutable source export does not already exist. This daily check allows a missed run to continue after the laptop is next switched on.

Run the one-time setup locally and paste the key only into the protected PowerShell prompt:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-accounting-automation.ps1
```

The live key should have only the read permission required for Balance Transactions. Do not give it write access and do not reuse the Checkout key or the separate `STRIPE_PERFORMANCE_KEY`; the performance report needs different read permissions. The generated CSV intentionally excludes customer names, email addresses, billing details and card information.

The formatted workbook in the private output folder remains the management and reconciliation file. Treat the automatically generated CSV as the read-only Stripe source ledger, and record bank matching, GST/BAS review and accountant notes in the formatted workbook rather than editing the derived CSV.

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
