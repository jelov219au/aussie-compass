# Function catalog collector — isolated preparation

The new `createCarFunctionCatalogCollector` prepares the function portion of the
readiness inventory. The connection/transaction executor is injected and absent
in production. No SQL has been parsed or executed; mock results do not verify
PostgreSQL behavior. Success returns function observations and `readiness: false`.
It does not produce a complete readiness envelope or approve any observation.

## Query and transaction boundary

The fixed SQL in `carPurchaseProReadinessFunctionCatalog.ts` reads only catalog
function/namespace/role/ACL metadata for supplied reviewed names in `public`.
The runtime role and name array are bound as two values; no identifier or SQL
fragment is interpolated. All overloads of those names are observed. The collector
requires the exact reviewed signature set, so missing functions, duplicates and
unapproved overloads fail. An aggregate/procedure/window function is not accepted
as an ordinary function. 257 selected functions and 129 ACL rows are overflow
sentinels above the accepted limits of 256 and 128.

The future driver adapter must start one transaction with readOnly:true,
repeatable-read isolation, `search_path=pg_catalog, pg_temp`, 5-second statement
timeout and 1-second lock timeout before running the SQL. It must close/roll back
the transaction on failure and discard an unusable connection. The collector
checks returned database name, inspection role, PostgreSQL version, read-only
mode, isolation and search_path. It recognizes server version numbers 14–18;
this is a declared support range, not a tested compatibility matrix.

PostgreSQL's repeatable-read mode uses one transaction snapshot; read-only mode
rejects ordinary persistent-table changes and DDL, but it is not a universal
side-effect sandbox. The fixed query therefore avoids application functions,
customer tables and business/advisory locks. See the official
[transaction documentation](https://www.postgresql.org/docs/current/sql-set-transaction.html).

`databaseName` is not proof of the provider project/branch identity. The future
approved connection registry must bind that identity independently. The driver
adapter must also enforce deadlines/cancellation; supplying the transaction
options object does not itself execute them. No driver, `.env`, connection,
schema, migration, grant, remote service or automation was changed here.

## Function and ACL serialization

Function signatures use a schema-qualified name plus `oidvectortypes(proargtypes)`
under the fixed catalog search_path. Overloads remain distinct. Raw definition
text never leaves the query: hash UTF-8 bytes of `pg_get_functiondef(oid)` after
CRLF→LF only, using SHA256 and lowercase hex. Do not strip whitespace, hash only
`prosrc`, reuse the earlier MD5, or infer a hash from a local draft. PostgreSQL
reconstructs the complete creation statement through
[pg_get_functiondef](https://www.postgresql.org/docs/current/functions-info.html);
its [binary-string functions](https://www.postgresql.org/docs/current/functions-binarystring.html)
provide SHA256/encoding. Hashes can change with the server's reconstruction format,
so server-version changes require a reviewed recapture.

The snapshot contains owner, security-definer flag, exact settings and effective
runtime EXECUTE. ACL entries expand a NULL ACL using `acldefault('f', owner)` before
`aclexplode`; PUBLIC has a null grantee, while roles use names rather than OIDs.
The official [ACL and privilege APIs](https://www.postgresql.org/docs/current/functions-info.html)
define those catalog operations. Default PUBLIC grants must not disappear merely
because `proacl` was NULL.

`executeAclSha256` uses this exact canonical format:

1. Each validated entry becomes `[grantor, granteeOrNull, "EXECUTE", grantable]`.
2. Reject repeated `(grantor, grantee, privilege)` identities, even if the grant
   option differs. Accept an empty explicit ACL as an observation.
3. Sort the JSON encoding of tuples by JS UTF-16 lexicographic comparison, not
   locale sorting; emit compact JSON with insertion order `version`, then `grants`:
   `{"version":"car-function-execute-acl-v1","grants":[...]}`.
4. SHA256 the UTF-8 bytes, lowercase hex. Version/tuple/key order and grant option
   are part of the hash. No newline or BOM is added.

Role/function names currently accept only lowercase ASCII identifiers up to 63
characters; unexpected quoted/Unicode names fail for review rather than being
renamed. PUBLIC execute and other unsafe-but-valid metadata are reported faithfully;
the existing manifest evaluator is responsible for rejecting them. The collector
does not rewrite an observed unsafe ACL to match an approved expectation.

## Completeness and remaining work

The collector intentionally handles a reviewed subset of functions; the readiness
evaluator separately requires its 33 roots and approved dependency pins. It does
not infer dependency closure from `pg_depend`. PostgreSQL does not record every
dependency found only within a string function body, as described in
[dependency tracking](https://www.postgresql.org/docs/current/ddl-depend.html).
Review trigger targets, nested helpers and dynamic SQL against the exact definitions
before approving a complete scope. Do not label a name-only inventory complete.

The combined collector in `car-purchase-readiness-schema-catalog.md` now prepares
constraint/trigger descriptors and target-function coverage in the same statement.
The privilege collector also prepares role membership and schema/table/column/
sequence evidence in that statement; actual SQL and privileges are still unverified.
Still required: semantic acceptance report provenance for the exact DB/candidate/
offer, one approved complete snapshot and approved
adapter to readiness. A separately collected function snapshot must not be spliced
into a newer snapshot with a fresh timestamp. No real approval manifest or price
was created. All release decisions remain in CAR-PURCHASE-LAUNCH.

Local evidence: `check-car-purchase-readiness-function-catalog.mjs` covers canonical
ACL ordering, PUBLIC/null/default-shaped rows, changed grant option, malformed or
duplicate grants, unexpected overloads, wrong transaction/database/role/version,
missing functions, query failure, and detached snapshots. 88 checks and 56 mocked
transaction calls passed, with scoped strict ES2017 TypeScript and changed-file
lint. SQL parsing/execution, actual catalog definition hashes and DB atomicity are
NOT_RUN. Desktop/mobile/PWA use the same future server boundary; UI/PWA NOT_RUN.
