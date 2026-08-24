# Managed Payments customer-document evidence

This runbook closes one narrow launch question: do the real customer-facing
Managed Payments Checkout and every customer payment document actually issued
for it explicitly identify the transaction seller, document issuer and
transaction support route?

It is a read-only observation procedure. It does not decide legal, tax or
accounting treatment, and it does not authorise any Stripe setting, payment,
refund, document or customer-data change.

## Scope and prerequisites

- Use the signed-in Stripe live Dashboard session and the owner-controlled
  purchase/full-refund transaction from 20 August 2026.
- Open only the already existing Checkout result and every receipt or invoice
  actually issued for that controlled transaction. Do not require an invoice
  when Stripe did not issue one, but do not silently omit an issued artifact.
- Do not create, resend, regenerate, edit, download or share a document. Do not
  change a customer, payment, refund, tax, support or business-profile setting.
- Perform the observation in the approved browser session. If the session,
  transaction or an artifact is unavailable, record `UNVERIFIED`; do not switch
  to an inferred Dashboard field or another transaction.
- Keep the completed observation note ephemeral or in the approved private
  operations location. Never commit a completed live evidence table to the
  repository.

## Evidence statuses

- `PRESENT`: the artifact itself shows an explicit customer-visible label and a
  populated value or an unambiguous sentence for the requested item.
- `ABSENT`: the artifact was fully opened and inspected, including its visible
  header, summary, footer and available non-mutating disclosure sections, but
  the requested item was not stated.
- `UNVERIFIED`: the artifact could not be opened, the relevant area was not
  inspectable, the wording was ambiguous, or the result would require an
  inference from Dashboard metadata, configuration or another artifact. Also
  use it when the operator cannot establish which customer payment documents
  were actually issued.
- `NOT_ISSUED`: the set of customer payment documents was positively verified
  and Stripe did not issue this artifact. Use it only for all three rows of the
  fixed Receipt or Invoice group; never use it when issuance is unknown or an
  issued artifact cannot be opened.

Dashboard account details, application `BUSINESS_*` values, Product settings,
tax-liability fields and another artifact's wording cannot upgrade an item to
`PRESENT`.

## What counts for each item

| Item | Minimum customer-visible evidence | Does not count |
| --- | --- | --- |
| Transaction seller | A seller, merchant of record or equivalent transaction-party label with a populated business value in that artifact | Product name alone, statement descriptor, Dashboard business profile or an operator assumption |
| Document issuer | An `Issued by`, issuer or equivalent document-origin label with a populated business value in that artifact | File branding, payment processor logo or seller inferred from another artifact |
| Transaction support route | A visible, actionable transaction-support route such as a support link, help route or support address, with enough context to show it handles the transaction | Generic product support, a privacy-policy link, Dashboard-only contact details or a non-actionable company name |

This procedure records whether the field exists, not a legal conclusion about
the named party's obligations.

## Allowed minimal evidence

For every row, record only:

- one status: `PRESENT`, `ABSENT`, `UNVERIFIED` or `NOT_ISSUED`;
  `NOT_ISSUED` is allowed only for all three rows of a positively verified
  unissued Receipt or Invoice group;
- artifact type: Checkout, receipt or invoice;
- visible wording location, for example `payment summary > seller line`,
  `document header > issued by`, or `footer > transaction help link`;
- observation time with timezone, preferably `YYYY-MM-DD HH:MM Australia/Sydney`;
- a short reason when the result is `ABSENT` or `UNVERIFIED`, without copying
  customer or payment data.

The evidence note may say that a labelled business value or actionable route
was visible, but it does not need to reproduce that value. No screenshot or
download is required for this gate.

## Prohibited evidence and handling

Do not record, print, paste into chat, commit or transmit:

- customer name, email address or postal/billing address;
- full Stripe object IDs or any customer, Checkout, PaymentIntent, Charge,
  invoice or refund identifier;
- card brand, last four digits, expiry, fingerprint or any other payment-method
  detail;
- receipt URL, invoice URL, hosted-document URL, access token or query string;
- screenshot, PDF, receipt or invoice file in the repository;
- API keys, webhook secrets, database values, browser storage, cookies or
  session details.

Do not copy the amount, tax breakdown or customer message into this evidence
note. Those belong to separate approved accounting or support procedures.

## Observation sequence

1. Confirm live mode and locate the existing 20 August 2026 owner-controlled
   purchase/full-refund record without copying its ID or customer details.
2. Open the existing customer-facing Checkout result. Inspect the visible
   summary, disclosures and footer without changing anything. Complete its
   three rows below.
3. Establish whether a receipt, invoice or both were actually issued without
   creating, resending or regenerating a document. If this cannot be established
   or neither existing payment document can be inspected, stop with `UNVERIFIED`.
4. Open every issued customer payment document without downloading, resending
   or regenerating it. Complete the fixed Receipt and Invoice groups separately.
   If one type was positively not issued, mark all three rows for only that
   group `NOT_ISSUED`. Never collapse both types into one `Receipt or Invoice`
   group.
5. Stop if any requested view requires a mutation, a new document, a copied
   signed URL or exposure of prohibited data. Mark the affected rows
   `UNVERIFIED`.
6. Apply the conclusion rule. Do not infer a missing item from another row.

## Blank evidence template

Copy this blank table to the approved private operations note for the live
observation. Keep the nine row keys unchanged and do not commit the completed
copy.

| Evidence key | Artifact | Item | Status | Visible location | Observed at | ABSENT/UNVERIFIED reason |
| --- | --- | --- | --- | --- | --- | --- |
| `checkout.transaction_seller` | Checkout | Transaction seller | UNVERIFIED | — | — | Not yet observed |
| `checkout.document_issuer` | Checkout | Document issuer | UNVERIFIED | — | — | Not yet observed |
| `checkout.transaction_support_route` | Checkout | Transaction support route | UNVERIFIED | — | — | Not yet observed |
| `receipt.transaction_seller` | Receipt | Transaction seller | UNVERIFIED | — | — | Not yet observed |
| `receipt.document_issuer` | Receipt | Document issuer | UNVERIFIED | — | — | Not yet observed |
| `receipt.transaction_support_route` | Receipt | Transaction support route | UNVERIFIED | — | — | Not yet observed |
| `invoice.transaction_seller` | Invoice | Transaction seller | UNVERIFIED | — | — | Not yet observed |
| `invoice.document_issuer` | Invoice | Document issuer | UNVERIFIED | — | — | Not yet observed |
| `invoice.transaction_support_route` | Invoice | Transaction support route | UNVERIFIED | — | — | Not yet observed |

Audit context: `live / owner-controlled 20 August 2026 purchase and full refund`

Observer record: use an internal role or approval reference only; do not use a
person's name or email.

## Read-only status classifier

After completing the private nine-row observation from the original
customer-facing artifacts, create a separate status-only JSON in the approved
private operations location. Do not put the visible wording, business value,
customer data, Stripe identifiers, document URLs, screenshots or reasons in
this JSON, and never commit the completed file. The detailed observation note
remains the source evidence; the JSON only prevents a mixed or incomplete table
from being manually promoted to `GO`.

Print a fresh blank schema to the terminal, then classify a completed private
copy:

```powershell
npm.cmd run managed-payments:documents -- --template
npm.cmd run managed-payments:documents -- --file <private-json-path>
```

The classifier reads one local file and does not query Stripe, open a browser,
write a file, create or resend a document, or inspect environment variables. It
accepts only `environment=live`, the fixed owner-controlled observation scope,
one canonical UTC observation time, `PASS/MISSING/FAIL` for verification of the
issued-document set, and the exact nine row keys with fixed
`PRESENT/ABSENT/UNVERIFIED/NOT_ISSUED` values. Any extra field, changed key,
non-live environment, URL, email, full Stripe identifier, credential or
connection string stops before a trust decision.

The only passing final line starts with:

`CUSTOMER_DOCUMENT_TRUST_GATE=GO mode=live`

It requires the three Checkout rows to be `PRESENT`, the issued-document set to
be verified, every issued Receipt or Invoice group to be entirely `PRESENT`,
every positively unissued group to be entirely `NOT_ISSUED`, at least one
existing Receipt or Invoice to have been inspected, and a canonical observation
time. `CUSTOMER_DOCUMENT_TRUST_GATE=NO-GO` or `STOP`, missing final output, a
manually written `GO`, and a result from another environment or observation do
not satisfy the launch gate. The classifier cannot replace the underlying
artifact observation or authorise a payment, refund, customer contact, document
action, accounting entry or tax conclusion.

## Conclusion rule

The customer-document trust gate is `GO` only when the three Checkout rows are
`PRESENT`, the set of actually issued customer payment documents is verified,
at least one existing receipt or invoice was inspected, all three fixed rows for
every issued document are `PRESENT`, and all three rows for each positively
unissued document type are `NOT_ISSUED`. A mixed status inside an unissued
group, any `ABSENT` or `UNVERIFIED` row, an uninspected issued artifact or an
unknown artifact set makes the result `NO-GO`.

Record only one final line in the private observation note:

`CUSTOMER_DOCUMENT_TRUST_GATE=GO|NO-GO`

`NO-GO` means no further sale may be approved from this evidence. It does not
authorise a Stripe setting change or state what the missing wording should be.
Escalate the observation to the owner for a separate product, compliance and
commercial decision.
