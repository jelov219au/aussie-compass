# Isolated catalog transaction orchestration

`createCarCatalogTransaction` prepares the lower query port used by the readiness
envelope. It has no database driver, connection string, credentials, connection
registry or production wiring. Only the exact privilege-catalog SQL and bounded
role/function/table parameters are accepted; arbitrary SQL and altered transaction
options fail before opening a connection.

The injected opener must provide one fresh, idle, exclusive physical connection,
with identity independently established by the approved deployment registry. It
receives an AbortSignal and must support bounded acquisition. The binding is
snapshotted before querying and checked by the outer envelope. This orchestrator
cannot independently prove provider/project/branch identity or exclusive leasing.

## Sequence and cleanup

On a successful call the sequence is:

1. Open the approved lease and snapshot its binding.
2. `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`.
3. Set local statement timeout to 5000ms, lock timeout to 1000ms,
   idle-in-transaction timeout to 5000ms and search path to `pg_catalog, pg_temp`.
4. Execute the single fixed parameterized catalog SELECT. Snapshot bounded rows
   and record observation time using the server clock.
5. `ROLLBACK`, synchronously quarantine the lease, then await its driver's
   asynchronous `close()` acknowledgement before returning the envelope.

PostgreSQL permits isolation and access mode in
[BEGIN](https://www.postgresql.org/docs/current/sql-begin.html). The transaction
scope of [SET LOCAL](https://www.postgresql.org/docs/current/sql-set.html) and
[ROLLBACK](https://www.postgresql.org/docs/current/sql-rollback.html) supports this
prepared sequence. The actual SQL and driver behavior have not been executed.

A single 10-second local deadline covers acquisition, setup, SELECT and cleanup.
It signals abort, quarantines any acquired lease, initiates close and rejects the
result. If a lease arrives later, it is quarantined and closed without SQL. If a query completes late,
it cannot continue the sequence. No rollback is queued behind an unresolved
timed-out statement. On a settled failure after BEGIN, one rollback is attempted
within the remaining deadline, followed by close. An adapter that already
quarantined itself rejects that attempt without sending further SQL. Failed
rollback or close never yields a successful observation. Driver errors are replaced by
a fixed message so connection details do not escape through this port.

The revised lease contract separates `quarantine(): void` from
`close(): Promise<void>`. Quarantine synchronously blocks application reuse and
late results; it does not claim synchronous socket/server termination. Close
confirms the driver's asynchronous shutdown. On timeout, cleanup may continue
after the caller has already received failure, and physical termination remains
unconfirmed until the driver completes. Even a throwing quarantine hook does not
skip the close attempt. A stalled event loop or driver cannot be preempted here.
Remote query cancellation/disconnect rollback still requires actual DB acceptance.

`createCarNeonCatalogQuery` now implements this port using the installed public
Neon `Client` API; see `car-purchase-neon-catalog-adapter.md`. No production route,
approved connection registry or actual remote target has been connected.

## Validation

The targeted script uses deterministic simulated deadlines and mock connections.
It covers exact command order, bound value snapshots, invalid requests before
acquisition, each command failure and hang, cleanup failure, late acquisition and
late SELECT completion, bounded serialization, and concurrent lease isolation.
There are 93 passing checks after the close-contract change; scoped strict ES2017 TypeScript and changed-file lint
also pass. Real SQL calls, database changes and production connections: zero.

This prepares orchestration plus a separately tested public Client adapter. The next release preparation
should consolidate the approved connection/report registry inputs, actual SQL
acceptance matrix and artifact review requirements into the existing launch
decision packet. Do not invent remote hashes, sign synthetic reports as real
evidence, or convert local success into sales authorization. Desktop web, mobile
web and PWA use this same server boundary; actual UI/PWA checks remain NOT_RUN.
