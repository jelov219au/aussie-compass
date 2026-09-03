# Combined function, constraint and trigger catalog — preparation only

`createCarSchemaCatalogCollector` expands the existing function collector into one
fixed catalog SELECT. It binds runtime role, reviewed function names and reviewed
table names. The same statement returns functions, constraints, user triggers and
table context; the existing function decoder validates the function portion without
issuing a second database query. Per-call snapshot copies prevent response mixing.
No connection or real SQL execution exists in this preparation.

Success still returns `readiness: false`. This is partial metadata, not a complete
readiness envelope, approved manifest, live migration, or sales permission.

## Coverage and fail-closed behavior

The reviewed plans name exact `(table, constraint)` and `(table, trigger)` sets.
Every constraint and non-internal trigger on the selected public tables is returned,
so missing, duplicate, extra or renamed objects fail. Each trigger's full function
signature must also occur in the same validated function snapshot. A trigger that
points at a new/unreviewed helper cannot pass by retaining its old trigger name.

Only ordinary, nonpartitioned tables without inheritance are supported. Views,
foreign tables, partitions or inheritance require a separately reviewed collector
extension rather than silent exclusion. Missing tables and unhealthy internal
triggers fail. The query uses 65 tables, 257 constraints, 257 user triggers and 129
internal triggers per constraint as overflow sentinels; accepted limits are 64,
256, 256 and 128. The function collector retains its own 256-function/128-ACL limits.

The existing read-only/repeatable-read/search_path/timeout context applies. This
collector additionally requires `session_replication_role=origin`. User triggers
must be enabled O or A; disabled and replica-only triggers fail. PostgreSQL defines
the enabled modes and trigger-to-function/constraint links in
[pg_trigger](https://www.postgresql.org/docs/current/catalog-pg-trigger.html).

Constraints must be validated and enforced, their backing indexes valid/ready/live,
and associated internal triggers enabled for origin and bound to catalog functions.
PostgreSQL exposes constraint enforcement, validation and backing index references
in [pg_constraint](https://www.postgresql.org/docs/current/catalog-pg-constraint.html).
For versions without `conenforced`, the query reads the catalog row as JSON and
uses true when that field is absent; this compatibility branch is NOT SQL-tested.
Internal triggers on a selected table must have a live constraint reference and a
catalog function even when their owning constraint is outside the selected scope.

## Exact definition hashing

Functions keep their existing full-definition SHA256 and canonical EXECUTE ACL
format. User triggers hash UTF-8 `pg_get_triggerdef(oid, false)` after CRLF→LF, and
their enabled mode is pinned separately. The trigger's called function body must
also be pinned by the function inventory.

A constraint now needs more than its deparsed clause: its `definitionSha256` is
the lowercase SHA256 of the PostgreSQL JSONB text representation of this object:

```json
{
  "version": "car-constraint-definition-v1",
  "definition": "full pg_get_constraintdef(oid, false) text",
  "backingIndex": "full pg_get_indexdef(conindid) text or null",
  "internalTriggers": [
    {
      "table": "schema-qualified table name",
      "name": "actual internal trigger name",
      "definition": "full pg_get_triggerdef(oid, false) text",
      "enabled": "actual catalog mode",
      "function": "schema-qualified function signature"
    }
  ]
}
```

Normalize CRLF in each definition string **before** JSONB serialization. Sort
internal trigger entries by schema, table and trigger name under C collation.
Encode the JSONB text as UTF-8, with no extra newline/BOM. Do not reproduce the
hash using JS object key order; PostgreSQL JSONB formatting is the protocol here.
The server version must therefore be reviewed on recapture. Generated trigger
names are retained, not renamed or stripped. Their removal or change changes the
fingerprint even if the constraint clause stays the same. Empty internal-trigger
lists are legitimate observations for constraints that do not use them; approval
must pin the actual complete result.

This extends the earlier draft's clause-only description before any real manifest
has been approved. Old hypothetical clause-only hashes cannot be reused. Health
booleans are also validated independently, so a disabled/unenforced/unvalidated
constraint cannot pass by providing a well-formed hash.

## Validation and remaining gates

98 local checks/77 mocked single-statement calls plus two interleaved calls verify
strict set coverage, table support, enabled/enforced/index/internal-trigger states,
unreviewed trigger targets, malformed rows, transaction context, failure privacy
and detached request plans. The shared function-CTE extraction also passed the
existing 88 function-collector checks. These are JS/mock checks, **not SQL parsing,
PostgreSQL catalog hash correctness, transactional consistency or DB concurrency**.
Strict scoped ES2017 TypeScript with `--types node` and changed-file lint passed.
An initial check with automatic ambient-type discovery stalled without diagnostics
and was cancelled; no failure was attributed to SQL or product behavior.

Still needed: actual SQL parse/execution on a separately approved isolated target,
an independently bound provider project/branch identity, complete dependency review,
effective runtime role/membership/schema/table/column/sequence permissions and real
acceptance report provenance. Ordinary CHECK clauses can call functions indirectly;
trigger target coverage does not prove closure of all body/expression dependencies.
Column nullability (not represented as pg_constraint entries on older versions),
types/defaults/generated expressions and unrelated indexes are not collected here.
All final inventory sections must be captured in one approved transaction before
the outer readiness evaluator receives a fresh challenge/timestamp envelope.

No remote hash, offer, approval manifest, service connection, webhook mount, sender,
flag, deployment or publication was added. Desktop/mobile/PWA share this server
contract; actual UI/PWA verification remains NOT_RUN.
