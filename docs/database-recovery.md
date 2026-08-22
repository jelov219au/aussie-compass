# Entitlement database backup and recovery

This runbook covers the minimum paid-access data in PostgreSQL. It does not authorise a production restore, deletion, or migration. Run schema changes before application code that depends on them, and take a recoverable backup first.

## Targets

- Recovery point objective: at most 24 hours of entitlement data, supplemented by replayable Stripe events.
- Recovery time objective: four hours to restore into an isolated database, verify it, and obtain approval for any production cutover.
- Retention: seven daily backups and four weekly backups in encrypted storage outside the repository. Do not include raw webhook payloads or customer exports.

## Backup

Use a read-only or backup-specific database credential. Never put the connection string in shell history, logs, source control, or a command committed to this repository.

1. Confirm the target database hostname and environment label.
2. Record the current migration versions with `select version, applied_at from schema_migrations order by applied_at;`.
3. Create a PostgreSQL custom-format backup with `pg_dump --format=custom --no-owner --no-privileges --file=<approved-backup-path> <connection-string-from-secure-environment>`.
4. Encrypt and store the backup outside the repository, then record its timestamp, byte size, and SHA-256 digest without recording the connection string.

## Isolated restore drill

Never test a restore over Production. Create a new empty database whose resolved hostname and database name visibly identify it as a recovery drill.

1. Verify the target is empty and is not referenced by any deployed environment variable.
2. Restore with `pg_restore --exit-on-error --no-owner --no-privileges --dbname=<isolated-recovery-connection> <approved-backup-path>`.
3. Confirm the latest `schema_migrations` version is present.
4. Compare row counts for `payment_webhook_events`, `purchase_entitlements`, `purchase_restore_tokens`, `purchase_checkout_activations`, and `payment_operator_alert_outbox` with the backup source snapshot. Report only counts and pending/sent totals; never select full Stripe IDs, claim hashes or payload data.
5. Verify every entitlement references a webhook event, restore-token and activation keys are unique, duplicate Stripe event IDs are impossible, and every pending/sent alert row satisfies its fixed kind/type contract. Never delete an activation receipt to repair browser access; use the restore-token path.
6. Run read-only checks for one known active and one revoked test entitlement. Do not use real recovery codes.
7. Delete the isolated drill database only through the approved provider workflow after evidence has been reviewed.

## Production recovery gate

A production restore or cutover requires explicit owner approval. Before approval, provide the backup timestamp, expected data-loss window, isolated-restore evidence, affected payment interval, and a plan to replay signed Stripe events idempotently. Keep checkout disabled during an actual recovery until grant, revoke, and one-time restore behavior are verified.
