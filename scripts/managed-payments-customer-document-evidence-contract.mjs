export const customerDocumentArtifacts = ["checkout", "receipt", "invoice"];

export const customerDocumentItems = [
  "transaction_seller",
  "document_issuer",
  "transaction_support_route",
];

export const customerDocumentRowKeys = customerDocumentArtifacts.flatMap((artifact) =>
  customerDocumentItems.map((item) => `${artifact}.${item}`),
);

const rootKeys = [
  "schema_version",
  "environment",
  "observation_scope",
  "observed_at",
  "issued_document_set_verified",
  "rows",
];
const rowStatuses = new Set(["PRESENT", "ABSENT", "UNVERIFIED", "NOT_ISSUED"]);
const verificationStatuses = new Set(["PASS", "MISSING", "FAIL"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isPlainObject(value)
    && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

function isCanonicalUtc(value) {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

function missingRows() {
  return Object.fromEntries(customerDocumentRowKeys.map((key) => [key, "UNVERIFIED"]));
}

export function createCustomerDocumentEvidenceTemplate() {
  return {
    schema_version: 1,
    environment: "live",
    observation_scope: "owner_controlled_2026_08_20",
    observed_at: null,
    issued_document_set_verified: "MISSING",
    rows: missingRows(),
  };
}

export function containsSensitiveCustomerDocumentEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:cs_(?:test|live)|pi_|ch_|evt_|re_|cus_|in_|sub_|po_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
    /https?:\/\/[^\s"']+/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (packet.environment !== "live") errors.push("environment");
  if (packet.observation_scope !== "owner_controlled_2026_08_20") errors.push("observation_scope");
  if (packet.observed_at !== null && !isCanonicalUtc(packet.observed_at)) errors.push("observed_at");
  if (!verificationStatuses.has(packet.issued_document_set_verified)) {
    errors.push("issued_document_set_verified");
  }
  if (!hasExactKeys(packet.rows, customerDocumentRowKeys)) {
    errors.push("rows_shape");
  } else {
    for (const key of customerDocumentRowKeys) {
      if (!rowStatuses.has(packet.rows[key])) errors.push("row_status");
    }
    for (const key of customerDocumentItems.map((item) => `checkout.${item}`)) {
      if (packet.rows[key] === "NOT_ISSUED") errors.push("checkout_not_issued");
    }
  }
  return [...new Set(errors)];
}

function artifactStatuses(packet, artifact) {
  return customerDocumentItems.map((item) => packet.rows[`${artifact}.${item}`]);
}

function groupState(statuses) {
  if (statuses.every((status) => status === "PRESENT")) return "PRESENT";
  if (statuses.every((status) => status === "NOT_ISSUED")) return "NOT_ISSUED";
  return "UNRESOLVED";
}

export function evaluateCustomerDocumentEvidence(packet) {
  const errors = structuralErrors(packet);
  if (errors.length > 0) {
    return { passed: false, decision: "STOP", errors, rows: [], artifactStates: null };
  }

  const rows = customerDocumentRowKeys.map((check) => ({ check, status: packet.rows[check] }));
  const checkout = groupState(artifactStatuses(packet, "checkout"));
  const receipt = groupState(artifactStatuses(packet, "receipt"));
  const invoice = groupState(artifactStatuses(packet, "invoice"));
  const issuedPaymentDocumentInspected = receipt === "PRESENT" || invoice === "PRESENT";
  const artifactStates = { checkout, receipt, invoice };
  const passed = packet.issued_document_set_verified === "PASS"
    && isCanonicalUtc(packet.observed_at)
    && checkout === "PRESENT"
    && [receipt, invoice].every((state) => state === "PRESENT" || state === "NOT_ISSUED")
    && issuedPaymentDocumentInspected;

  return {
    passed,
    decision: passed ? "GO" : "NO-GO",
    errors: [],
    rows,
    artifactStates,
  };
}
