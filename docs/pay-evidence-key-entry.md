# Pay Evidence Pack Pro key-entry packet

This packet prepares the protected operator inputs for Pay Evidence Pack Pro without downloading Vercel Sensitive values, writing a dotenv file, deploying, enabling Checkout or creating a transaction.

## Already present in Vercel Production

The following names were confirmed through a read-only Vercel environment listing on 30 August 2026. Their values remained hidden:

- `STRIPE_PAY_EVIDENCE_PRO_PRICE_ID`
- `PAY_EVIDENCE_PRO_PAYMENTS_ENABLED`

The recorded installation state says the Pay Evidence switch is `false`. Do not replace either value merely to run the operator-key check.

## Three masked inputs

Prepare these existing values in separate password-manager entries or provider tabs:

1. A live Stripe restricted key with Account Read permission only. It must start with `rk_live_` and must not be the Production Checkout runtime key.
2. A different live Stripe restricted key with Balance Transactions Read permission. It must start with `rk_live_` and must not be the Account audit or Production runtime key.
3. The one-off `hoju_payment_auditor` Neon connection URL for database `neondb` on Primary endpoint `ep-curly-wave-a78bktnq`. Do not use the application runtime or database-owner URL.

The Vercel session uses OAuth and does not require a pasted token. Do not use `vercel env pull`, `--token`, a hand-written dotenv file or chat input for any secret.

## Permission-only preparation check

Run the launcher from the preserved source checkout. It always opens a separate, visible Windows PowerShell window for secret input; never enter these values in the Codex bottom terminal or chat:

```powershell
.\scripts\start-pay-evidence-operator-key-preflight.ps1 `
  -ExpectedNeonEndpointId ep-curly-wave-a78bktnq
```

Before opening the external window, the launcher proves that the pinned Stripe and Neon modules load in the actual operator runtime. The child repeats that check before requesting any secret, so a missing dependency cannot consume the three inputs. The prompts are masked in that external window. Values exist only in the child process, are removed after both read-only checks, and are not written to disk. The window pauses after printing the fixed result so it can be reviewed before pressing Enter to close it. The usable result is:

```text
PAY_EVIDENCE_OPERATOR_KEYS=PASS mode=live account_read=verified balance_transactions_read=verified database=audit-role-pass endpoint=exact persisted=no runtime_distinctness=pending-deployment-hmac secrets_printed=no
```

`runtime_distinctness=pending-deployment-hmac` is deliberate. Vercel Sensitive runtime keys cannot be read locally. Their separation must be proven later by a challenge HMAC against an exact deployed SHA.

## Deployment boundary

The historical integrated preflight requires the shared `PAYMENTS_ENABLED=false` first-launch state. Resume Pro and Rental Pack Pro are already operating, so do not reuse that command for Pay Evidence by temporarily closing their shared gate. First reconcile the Pay Evidence branch with current `main`, implement or approve a product-scoped runtime preflight that requires only `PAY_EVIDENCE_PRO_PAYMENTS_ENABLED=false`, deploy the exact approved SHA, and then complete the HMAC distinctness and runtime checks. This packet alone never authorises a deployment, Pay Evidence switch-on, Checkout Session or transaction.

## 30 August 2026 operator result

The first external-window attempt stopped at `operator_audit_failed` before a permission check because its temporary dependency junction target had been removed by another completed task. All three entered values were cleared and not persisted. The launcher and child now both import the pinned Stripe and Neon modules before any prompt opens.

The corrected external PowerShell run passed in one uninterrupted session:

```text
PAY_EVIDENCE_EXTERNAL_KEY_WINDOW=PASS input=external-powershell child=pass secrets_printed=no
```

This proves the existing Account Read key, Balance Transactions Read key and least-privilege `hoju_payment_auditor` URL are ready for the later Pay Evidence runtime preflight. It does not yet prove separation from the non-readable Vercel runtime key; that remains gated on the exact deployed SHA and challenge HMAC.
