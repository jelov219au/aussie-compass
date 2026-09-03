# Car readiness envelope preparation

This isolated server factory joins the approved manifest evaluator, the single
catalog observation and eleven signed report descriptors. It returns
`salesAuthorized: false` even on success. It is not wired into runtime assembly,
routes, payments or a database driver. No real approval, report or remote hash is
included. Desktop web, mobile web and PWA share this server boundary; actual UI
and PWA verification remains NOT_RUN.

## Inputs and trust boundaries

`createCarReadinessEnvelope` accepts the approved manifest JSON, catalog config
(`databaseName`, `inspectionRole`, exact column and sequence plans), an immutable
map of at most eight trusted Ed25519 public SPKI PEM keys, a report reader, a
bound catalog query and an optional server clock. Configuration is snapshotted.
Missing or invalid dependencies fail closed through the existing evaluator.

The trusted report registry must return only currently approved immutable bytes
for each requested check ID. It must enforce revocation and authorization; this
module does not implement that registry. Recreate the factory when trusted keys
or approval configuration change. There is no report cache in this factory.
Caller-supplied report paths, URLs and webhook data are not accepted as sources.

Each reader result has exactly `reportJson`, `signature` and `issuerKeyId`.
The JSON bytes are limited to 65,536 UTF-8 bytes and SHA256-pinned by the approved
manifest. The signature is canonical base64 encoding of 64 bytes, verified using
Node's native Ed25519 implementation over the UTF-8 domain prefix
`car-readiness-report-v1\n` followed by the exact report bytes. Ed25519 uses a null
algorithm argument ([Node crypto documentation](https://nodejs.org/api/crypto.html#cryptoverifyalgorithm-data-key-signature-callback)).

A report has exactly these fields:

- `version`: `car-readiness-report-v1`
- `id`, `issuerKeyId`, `candidateCommit`, `environment`, `offer`
- `issuedAt`, `expiresAt`: positive integer epoch milliseconds
- `result`: `PASS`; `evidenceClass`: `executed`
- `artifactSha256`: lowercase SHA256 of the reviewed underlying artifact

The check, issuer, candidate, environment and offer must match their approved
identities. Reports must have been issued by approval time and remain valid
through catalog completion. The signature proves the bytes and configured signer;
it does not prove execution occurred. Underlying artifacts are not fetched or
inspected here. Authorized artifact review and trustworthy report issuance remain
required. Test fixtures declaring `executed` are explicitly synthetic.

## One fresh catalog observation

After all reports validate, the privilege collector issues one fixed catalog
query through the injected port. Its existing read-only repeatable-read
transaction options and bounded parameters are preserved. The port also receives
the evaluator's unique request challenge and must return exactly:

`{ binding, rows, challenge, observedAt }`

The binding has exactly `version: car-deployment-binding-v1`, `candidateCommit`,
`environment`, `offer`, `databaseName`, and `inspectionRole`. The approved driver
registry must independently establish deployment/provider/project/branch identity
and produce rows from that same fresh transaction and connection. Echoing the
expected labels or retimestamping cached rows does not establish this trust.
The production adapter and connection registry are not implemented.

The wrapper is detached by a bounded JSON snapshot. Binding must exactly match,
challenge must belong to the current request, and observation time must fall
inside the query interval, which must not exceed 60 seconds. The outer evaluator
also enforces total duration, approval expiry and complete inventory equality.
This validation rejects an overlong result when returned; the future adapter must
enforce driver timeouts/cancellation and transaction rollback itself.

Catalog output supplies the actual observed metadata; the approved report hashes
are included only after signature, identity and expiry checks. No runtime-ready
boolean or sales authorization is inferred from a matching envelope.

## Local validation and remaining work

`scripts/check-car-purchase-readiness-envelope.mjs` passes 78 checks with real
Node Ed25519 operations using ephemeral synthetic keys, 316 mock report reads,
25 mock catalog queries, two interleaved requests and one fixture bootstrap.
Cases include tampering, wrong keys/domains, malformed reports, mismatched
bindings, expired reports, catalog drift and stale/cross-request observations.
Scoped strict ES2017 TypeScript and changed-file lint pass.

SQL parsing/execution, actual provider identity, approved report issuance,
artifact review, remote hash acceptance, real customer journey, message delivery
and UI/PWA checks remain NOT_RUN. The next local boundary is the transaction
adapter's ordering, timeout/cancellation and cleanup contract. Any remote
execution or launch remains under the existing CAR-PURCHASE-LAUNCH approval item.
