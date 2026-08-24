# Registered tax agent first-sale handoff

This is a blank, privacy-safe consultation template. It is not tax or legal
advice and it records no conclusion about Hoju Compass, its ABN, GST status or
Managed Payments treatment.

Do not complete this template in the repository, chat, a ticket or a deployment
artifact. Make the working copy in the approved private accounting location.
Keep customer PII, the full ABN, bank details, full Stripe identifiers, keys,
transaction exports and source documents only in their original system or that
private location. The repository copy must remain blank.

## Purpose and decision boundary

The registered tax agent must resolve the entity, GST and bookkeeping treatment
before the first customer payment. The owner must not infer an answer from the
website, Checkout wording, a Balance Transaction, a payout or this template.
The handoff result is exactly one of:

- `PASS`: every mandatory fact and question below has a dated conclusion from a
  registered tax agent, the source evidence used is identified privately, no
  mandatory item remains open or contradictory, and the private advice record
  is retained.
- `UNRESOLVED`: the default. Use it if any fact, evidence, answer, registration
  check or conclusion is missing, verbal-only without a retained consultation
  record, contradictory, awaiting another adviser or Stripe, or conditional
  without a closed evidence rule and review trigger.

`PASS` means only that the tax-agent handoff is complete. It does not authorise
payments, a BAS lodgment, a refund, customer contact or a production change.
`UNRESOLVED` keeps Production payments off and the first customer at `NO-GO`.

## Private consultation record

Complete these fields only in the private working copy:

| Field | Required private entry |
| --- | --- |
| `handoff_version` | Repository commit or immutable document version used |
| `consultation_date` | Date and timezone |
| `registered_tax_agent` | Name, practice and privately verified registration reference |
| `advice_record_ref` | Private reference to dated written advice or retained consultation record |
| `evidence_index_ref` | Private reference to the evidence index; never a repository path |
| `prepared_by` / `reviewed_by` | Accounting operator and business owner |

If the adviser is not confirmed as a currently registered tax agent, record
`UNRESOLVED`; do not silently substitute software support, a bookkeeper, Stripe
support or this repository.

## Facts the owner must supply for confirmation

The owner supplies facts and evidence; the template does not pre-fill or assume
them. Each fact needs `CONFIRMED` or `UNRESOLVED`, an evidence reference and the
agent's dated note.

| Fact ID | Fact to confirm privately | Minimum source evidence |
| --- | --- | --- |
| `F1` | Exact legal entity carrying on the activity and its relationship to the registered business name | Current ASIC/business-name record and entity record |
| `F2` | Exact ABN status, entity type and effective dates relevant to the activity | Current ABN Lookup/ATO evidence; full ABN stays private |
| `F3` | Exact GST registration status, effective date, reporting frequency and accounting basis | Current ATO/accounting records, not a website footer or Checkout |
| `F4` | Resume Pro supply description, intended customer jurisdictions and the rule for collecting any customer-location evidence the agent requires | Product terms plus intended supply scope; no actual customer is assumed before sale |
| `F5` | Contractual Managed Payments role, customer-visible transaction seller and tax-document issuer | Applicable Stripe agreement/product documentation and privately retained live document evidence |
| `F6` | Actual money flow and available source fields for sale, customer tax, withheld amounts, Stripe fees, refunds, disputes, balance and payout | Private source-document index, Balance/transaction report and itemised payout evidence |

For `F5` and `F6`, preserve the original privately. A redacted consultation copy
may be used only if it still shows every fact the agent needs. Never use a
Balance Transaction's `fee_details.type=tax` as proof of customer-facing GST or
rename it `withheld_tax`.

## Questions requiring the agent's conclusion

The private answer to every question must include the treatment, timing, source
evidence relied on, and any condition or exception. A condition is closed only
when the agent defines the evidence, action, owner and review trigger. “See
Stripe”, “TBC” and a blank field are `UNRESOLVED`.

| Question ID | Required question | Required conclusion fields |
| --- | --- | --- |
| `Q1` | Which entity recognises the Resume Pro activity, and does the confirmed ABN/GST status apply to it on the relevant date? | `entity`, `ABN/GST status`, `effective date`, `basis/evidence` |
| `Q2` | For the evidenced Managed Payments arrangement, who is principal/agent or transaction seller, who issues the customer tax document, and whose revenue is recorded? | `role`, `seller`, `issuer`, `revenue owner`, `basis/evidence` |
| `Q3` | What amount and date are recognised as gross sales, and which source document controls? | `gross basis`, `recognition timing`, `account mapping`, `source` |
| `Q4` | How is customer-facing GST or other tax recorded and reported, including any amount Stripe calculates or withholds? | `tax treatment`, `BAS treatment/label if applicable`, `timing`, `source` |
| `Q5` | How are Stripe fees and tax on Stripe fees recorded without confusing them with customer-facing tax? | `fee expense`, `input-tax treatment if applicable`, `account mapping`, `source` |
| `Q6` | How are refunds, partial refunds, credit documents, disputes and chargebacks linked to the original sale and tax period? | `adjustment treatment`, `timing`, `account mapping`, `required document` |
| `Q7` | How are Stripe balance movements, payouts and the bank deposit reconciled without recording a payout as new revenue? | `Stripe clearing accounts`, `payout entry`, `ending-balance treatment`, `source` |
| `Q8` | What GST/BAS and income-tax reporting basis, period and review trigger apply before and after the first sale? | `basis`, `period/frequency`, `report fields`, `review trigger` |
| `Q9` | Which records must be retained, for how long, and where should the private advice and transaction evidence be kept? | `record classes`, `retention period`, `exceptions`, `private location` |

## Required bookkeeping mapping

The registered tax agent must complete or explicitly mark not applicable for
every row in the private copy. A guessed value or a zero substituted for an
unknown amount is `UNRESOLVED`.

| Source component | Account/classification | Debit/credit rule | GST/BAS treatment | Recognition date | Controlling source document |
| --- | --- | --- | --- | --- | --- |
| Gross customer consideration |  |  |  |  |  |
| Customer-facing tax shown |  |  |  |  |  |
| Managed Payments calculated/withheld amount |  |  |  |  |  |
| Stripe fee |  |  |  |  |  |
| Tax on Stripe fee |  |  |  |  |  |
| Refund or credit adjustment |  |  |  |  |  |
| Dispute/chargeback |  |  |  |  |  |
| Stripe clearing balance |  |  |  |  |  |
| Bank payout |  |  |  |  |  |

## Final private decision record

Complete every field; do not copy the completed record back into the repository.

| Field | Required value |
| --- | --- |
| `facts_complete` | `PASS` only when `F1`–`F6` are confirmed; otherwise `UNRESOLVED` |
| `questions_complete` | `PASS` only when `Q1`–`Q9` have conclusions; otherwise `UNRESOLVED` |
| `mapping_complete` | `PASS` only when every mapping row is answered or explicitly not applicable with a reason |
| `contradictions` | `NONE`, or a private list that forces `UNRESOLVED` |
| `follow_up_owner` / `due_at` | Required for every unresolved item |
| `registered_tax_agent_confirmation_ref` | Private dated advice/consultation reference |
| `overall_tax_handoff` | Exactly `PASS` or `UNRESOLVED` |
| `owner_reviewed_at` | Dated owner acknowledgement; not payment approval |

The overall result can be `PASS` only when `facts_complete`,
`questions_complete` and `mapping_complete` are all `PASS`, contradictions are
`NONE`, the agent confirmation reference exists privately, and there are no
open follow-ups. Otherwise record `overall_tax_handoff=UNRESOLVED`.
