# Car readiness evidence contract v1 — isolated preparation

`carPurchaseProReadinessEvidence.ts` compares a trusted, reviewed manifest with a
fresh snapshot from an injected read-only query port. It opens no connection,
executes no SQL itself and is not imported by production runtime or assembly.
There is no approved manifest in this repository. Test values (including 1234 and
all hashes/signatures) are synthetic and must never be copied to a release file.

Success means **the supplied evidence matches**, not that the product can launch.
The result always contains `salesAuthorized: false` and deliberately omits the
boolean readiness fields accepted by `createCarPurchaseRuntimeAssembly`. A
separate reviewed collector and adapter remain necessary before any runtime use.

## Authority and schema

Only the server supplies `approvedManifestJson`, `query` and its clock. A browser,
webhook body, feature flag, caller-provided report or self-authored approval ID is
not authority. The string `CAR-PURCHASE-LAUNCH` links the existing decision record;
the evaluator does not authenticate an approver or establish report provenance.

The manifest is bounded JSON (262,144 UTF-16 code units) with exactly:

| Field | Required value |
| --- | --- |
| version | car-readiness-evidence-v1 |
| approvalId | CAR-PURCHASE-LAUNCH, backed by the actual recorded owner decision |
| candidateCommit | Full 40-character lowercase SHA of the reviewed application |
| approvedAt / expiresAt | Positive integer epoch milliseconds; current approval window |
| environment | Exact databaseIdentity, runtimeRole, ownerRole, mode, deployment, origin |
| offer | Existing seven-field approved offer, no extras; positive signed-int price |
| inventory | functions, constraints, triggers, runtimePrivileges, checks |

`databaseIdentity` must identify the actual provider project/branch/database, not
merely a potentially repeated database name. The future connection registry must
bind this identity, the candidate commit and the deployment independently; echoing
the manifest's identity as evidence would not verify a connection. Live requires
production; test requires nonproduction. Origin is an exact HTTPS origin. Runtime
and owner roles must differ.

Every function descriptor has exactly `name`, `signature`, `definitionSha256`,
`owner`, `securityDefiner`, `settings`, `executeAclSha256`, `runtimeExecute`,
`publicExecute`. The minimum 33 names come from the existing car preflight; every
overload and additional dependency/trigger function used by the reviewed migration
must be included explicitly. Full schema-qualified signatures are distinct pins.
Owner must match the reviewed owner, PUBLIC EXECUTE is false, and listed internal
helpers/owner reopening cannot be runtime-callable. Security-definer functions
require one fixed search_path, either `public, pg_temp` or
`pg_catalog, public, pg_temp`; the schema privilege review must establish that
those schemas cannot be written by untrusted roles. Other settings are also pinned.

Constraint descriptors are `{ table, name, definitionSha256, validated: true }`;
all relevant PK/unique/FK/check/exclusion constraints must be reviewed, with at
least one pin for each of the 13 required tables. Trigger descriptors are
`{ table, name, definitionSha256, enabled }`, where enabled is O or A. Required
receipt/tombstone/gate tables must be covered; additional dependencies are allowed
only when pinned in the approved manifest. The minimum table/name coverage is not
a proof that the reviewer has captured every necessary dependency.

Runtime privilege evidence pins the role's full attributes, effective memberships,
schema and table privileges by SHA256, and requires explicit false for superuser,
bypassRls and tableWrites. Hashes must include inherited permissions, grant options
and PUBLIC/default ACL effects. The effective runtime EXECUTE result is pinned for
each function. An all-false EXECUTE inventory can match a deliberately closed
candidate: this evaluator does not independently infer operational readiness.

Eleven exact check IDs pin passing report hashes: access lifecycle, hold admission
and settlement, monotonic reversal, exception atomicity, alert identity/lease, DB
concurrency, webhook signature/routing, Managed Payments, customer journey, alert
sender/retry, and migration/rollback. Their exact IDs are exported in
`carReadinessCheckIds`. Unknown IDs, missing reports, false results or changed report
hashes fail. These must be real reviewed acceptance reports for the exact candidate,
database identity, mode and offer. Mock reports cannot establish DB concurrency,
real sender delivery, browser/PWA behavior, or production prerequisites.

## Snapshot/query port and freshness

The future approved adapter receives only `{ version, challenge, candidateCommit }`.
It must execute bounded metadata reads in **one database-enforced read-only
transaction** using an approved connection. It must not run mutating application
functions, acquire business locks, select customer rows, inspect credentials or
send messages. TypeScript's query-port type and `readOnly: true` do not enforce
transaction behavior. No SQL collector or remote query was implemented here.

Return exactly one row, `{ evidence_json: serializedEnvelope }`, whose envelope has
exactly version, challenge, candidateCommit, observedAt, readOnly, environment,
offer, inventory. The collector echoes the unpredictable per-call challenge and
timestamps capture using the injected server clock after the transaction begins;
it must not refresh an old snapshot by relabelling its timestamp. DB/report caches
require separate reviewed invalidation before use. Query duration must be at most
60 seconds, observation must fall within that call, and the approval must remain
valid through completion. Rollback of the clock, stale/future/cross-request
observations, multiple rows, extra fields, duplicates, unknown or mismatched
metadata all fail closed. Descriptor sets are order-independent; settings retain
their exact approved order. The port should enforce its own timeout: this module
rejects an overlong result once returned but does not cancel a hung query.

Hash convention for the collector: lowercase SHA256 of UTF-8 with CRLF
normalized to LF, no other trimming. Function definition hashes cover the full
`pg_get_functiondef` output, not only `prosrc`; trigger hashes cover full catalog
definitions. Constraint hashes cover the versioned JSONB definition/backing-index/
internal-trigger fingerprint in `car-purchase-readiness-schema-catalog.md`.
ACL/role/report hashes require a reviewed canonical
serialization, including exact identities and sorting rules. The isolated function
collector now defines and mock-tests function EXECUTE ACL serialization in
`car-purchase-readiness-function-catalog.md`. The combined schema collector now
prepares function/constraint/trigger observations in one statement; role/report
serialization and the complete readiness envelope remain unfinished. The older inventory SQL's
normalized `prosrc` MD5 is not interchangeable with these SHA256 pins and cannot
be promoted to readiness. Completeness of dependency closure and provenance of
approval/report files still require review; matching hashes alone do not prove it.

## Validation and next boundary

The local script exercises missing/extra/duplicate/changed definitions, owner/ACL,
unsafe search_path, role privileges, wrong database/mode/offer/candidate, expired
approval, stale observations, malformed rows, query failure, settings snapshots and
two concurrent requests with swapped challenges. It only uses mock query rows.

Next: prepare a catalog-only collector contract and exact canonical descriptor
serialization from the approved preflight scope; fill neither remote hashes nor
price placeholders. Resolve dependency closure, inherited privileges and report
provenance before adapting this result to runtime readiness. Real SQL acceptance,
remote approval, sender and shared-route wiring remain separate gates under the
existing CAR-PURCHASE-LAUNCH item. Production remains closed.

Desktop web, mobile web and installed PWA share this server boundary: compatible.
No client data, route, storage, service worker or UI changed; actual UI/PWA checks
remain NOT_RUN.
