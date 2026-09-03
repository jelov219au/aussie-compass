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
5. `ROLLBACK`, then destroy the exclusive connection before returning the envelope.

PostgreSQL permits isolation and access mode in
[BEGIN](https://www.postgresql.org/docs/current/sql-begin.html). The transaction
scope of [SET LOCAL](https://www.postgresql.org/docs/current/sql-set.html) and
[ROLLBACK](https://www.postgresql.org/docs/current/sql-rollback.html) supports this
prepared sequence. The actual SQL and driver behavior have not been executed.

A single 10-second local deadline covers acquisition, setup, SELECT and cleanup.
It signals abort, destroys any acquired lease and rejects the result. If a lease
arrives later, it is destroyed without executing SQL. If a query completes late,
it cannot continue the sequence. No rollback is queued behind an unresolved
timed-out statement. On a settled failure after BEGIN, one rollback is attempted
within the remaining deadline, followed by destruction. Failed rollback or
destruction never yields a successful observation. Driver errors are replaced by
a fixed message so connection details do not escape through this port.

`destroy()` is a required synchronous quarantine/termination operation on this
exclusive lease. It must never mean reusable pool release or merely enqueue an
unbounded disconnect. Connections are discarded even on success. The injected
driver must throw on command/protocol failures, tolerate an aborted operation and
ensure socket shutdown; JavaScript promise rejection or AbortSignal alone does
not prove a server query stopped. A blocking driver, a stalled event loop or a
destroy implementation that throws cannot be made safe by this wrapper. Those
semantics require actual adapter acceptance before any connection is permitted.

## Validation

The targeted script uses deterministic simulated deadlines and mock connections.
It covers exact command order, bound value snapshots, invalid requests before
acquisition, each command failure and hang, cleanup failure, late acquisition and
late SELECT completion, bounded serialization, and concurrent lease isolation.
There are 86 passing checks; scoped strict ES2017 TypeScript and changed-file lint
also pass. Real SQL calls, database changes and production connections: zero.

This prepares orchestration, not a production driver. The next release preparation
should consolidate the approved connection/report registry inputs, actual SQL
acceptance matrix and artifact review requirements into the existing launch
decision packet. Do not invent remote hashes, sign synthetic reports as real
evidence, or convert local success into sales authorization. Desktop web, mobile
web and PWA use this same server boundary; actual UI/PWA checks remain NOT_RUN.
