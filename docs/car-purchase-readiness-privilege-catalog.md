# Runtime privileges and column metadata — isolated preparation

`createCarPrivilegeCatalogCollector` composes the existing schema/function decoders
with one fixed metadata statement. Its injected transaction port remains unbound;
no SQL has been parsed or executed. It returns the existing observations plus a
four-hash `runtimePrivileges` record and always retains `readiness: false`.

This added SQL contract supports PostgreSQL **16–18 only** because it reads current
role-membership options. The older function/schema-only collector's 14–18 range
does not extend to this combined query. A driver or server-version failure remains
closed; these version branches are not a tested PostgreSQL compatibility matrix.

## Scope and authority

The approved plan supplies exact function signatures, constraints, triggers, column
names and dependent sequence names. Column/table/sequence sets must match exactly;
each selected table needs column coverage. The query binds the same three values
as the schema collector and returns all sections from one statement. It never
reads customer rows, sequence current values or role password data.

One reviewed public schema and ordinary nonpartitioned tables remain the supported
object scope. Built-in column types/collations are required; user-defined types and
collations require a separate dependency-aware extension. Owned sequences and
sequences referenced by catalog-tracked column defaults are discovered. Functions
and dynamic SQL can have additional dependencies that still need manual review.

There are also **boolean-only, database-wide catalog permission checks** for writes
outside the selected object set, schema creation and unreviewed security-definer
entry points. They return no other object names or rows. Their scope must be part
of the future approved preflight execution; this work has not run them. Catalog
inspection is necessary to avoid reporting “no write rights” while overlooking an
unselected object. The transaction keeps the existing read-only, repeatable-read,
5-second statement and 1-second lock timeout contract.

## Role closure and denials

The SQL follows all memberships reachable from the runtime role, deliberately
including edges with INHERIT or SET disabled. This over-approximation may hold an
otherwise restricted configuration for review; it must not silently miss a role
that could be assumed. The full closure, grantor and option flags are pinned.
PostgreSQL documents these flags in
[pg_auth_members](https://www.postgresql.org/docs/current/catalog-pg-auth-members.html).

The decoder rejects any reachable role with superuser, role/database creation,
replication or RLS-bypass attributes, and any membership with ADMIN OPTION. It
rejects public schema creation/grant rights, current-database ownership/creation,
outside-schema ownership/creation, persistent table or column mutation/ownership,
sequence USAGE/UPDATE/ownership, and grant options on selected objects. It also
rejects user-function ownership/EXECUTE grant options, authority to change
session_replication_role, or a callable security-definer outside the reviewed
function inventory. Other legitimate products' callable definers must therefore
be included in the reviewed shared-function scope; do not hide them from the query.

Effective checks use the PostgreSQL
[privilege inquiry APIs](https://www.postgresql.org/docs/current/functions-info.html)
for each role in the closure. A SELECT grant is recorded but not rejected. Database
TEMP permission is likewise recorded rather than interpreted as persistent-table
write authority; fixed security-definer search paths and the complete reviewed
function bodies remain necessary. The decoder does not claim that a safe privilege
snapshot proves application behavior or authenticates its own query provider.

## Structural metadata and fingerprints

Column metadata hashes include ordinal position, formatted type/typmod, NOT NULL,
identity/generated mode, dimensions, collation, missing-value metadata and full
default/generated expression. Only a hash leaves SQL. The
[column catalog](https://www.postgresql.org/docs/current/catalog-pg-attribute.html)
defines those fields. This covers column nullability on versions where it is not
a pg_constraint row. The schema collector still checks actual constraint validation.

Sequence definition hashes include type, start/increment/min/max/cache/cycle,
excluding changing last/current values. Table rows include RLS/forced-RLS flags and
a policy hash covering policy name, command, permissiveness, sorted role names,
USING and WITH CHECK expressions. Current/global DB and role configuration is
hashed without returning setting values. No password, connection string, function
body or expression text is emitted by the collector.

SQL structural hashes use version-tagged JSONB objects from the fixed query,
serialized by PostgreSQL and encoded as UTF-8 SHA256. Definition/expression CRLF is
normalized before JSONB serialization; configuration setting strings are preserved.
Sort names using C collation and never substitute OIDs as portable identities.
Role setting rows are restricted to global/current database and global/that role.
Do not emulate PostgreSQL JSONB hashes with JS object order. An actual server-version
change needs reviewed recapture.

The four aggregate hashes use a separate, exact JS canonical protocol:

1. Validate every group's strict scalar field schema first.
2. Sort each record's field names with JS lexicographic comparison and encode it
   as `[[fieldName, scalarValue], ...]`.
3. Sort records by the JSON encoding of those arrays; sort group names.
4. Encode `[version, [[groupName, [records...]], ...]]` as compact JSON, no BOM or
   trailing newline; SHA256 its UTF-8 bytes, lowercase hex.

| Manifest hash | Version / groups |
| --- | --- |
| roleAttributesSha256 | car-role-attributes-v1 / roles, guards |
| membershipsSha256 | car-role-memberships-v1 / memberships |
| schemaPrivilegesSha256 | car-schema-privileges-v1 / schemas |
| tablePrivilegesSha256 | car-table-column-sequence-v1 / tables, columns, sequences |

The last hash intentionally includes structural metadata alongside privileges, so
changing nullability/defaults/identity, RLS policy or sequence definition changes
the existing manifest pin. No real approved manifest or remote pin was generated.

Bounds: 64 roles, 128 membership entries, 64 tables, 512 columns and 128 sequences.
The query uses one extra row as an overflow sentinel. Duplicate, malformed, missing,
extra, disconnected-role or unsupported observations fail. Result order is not
significant. Copies are local to each call, preventing concurrent snapshot mixing.

## Validation and next work

Mock cases cover role escalation, inheritance/membership structure, schema/table/
column/sequence grants, off-scope writes, unreviewed definers, RLS/column/sequence
hash changes, bad versions, extra/missing data and interleaved requests. These tests
do not verify SQL parsing, actual privilege semantics, catalog hashes, DB atomicity
or runtime confinement. The initial TypeScript check exposed one unknown-name
narrowing omission; it was corrected before final validation.
Final validation: 155 checks / 133 mocked single-statement calls plus two interleaved
calls PASS; impacted schema collector 98 checks PASS; strict ES2017 scoped TypeScript
with `--types node`, changed-file lint and staged diff-check PASS. All tests used a
256MB heap; actual SQL calls and verified remote hashes remain zero.

Next is the full evidence-envelope boundary: independently bind the provider
project/branch/candidate, validate real acceptance-report provenance/expiry and
approved offer, and combine all sections with the outer challenge/timestamp in one
approved transaction. No feature flag or self-supplied `passed: true` substitutes
for those checks. Real DB/Stripe/sender/UI evidence and CAR-PURCHASE-LAUNCH approval
remain outstanding. Desktop/mobile/PWA share this server contract; UI/PWA NOT_RUN.
