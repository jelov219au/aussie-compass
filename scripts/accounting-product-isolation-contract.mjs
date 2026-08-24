export const accountingProductCodes = ["resume_pro", "rental_application_pro"];

export const productIsolationChecks = [
  "catalog_product_identity_verified",
  "catalog_price_identity_verified",
  "catalog_price_amount_currency_verified",
  "checkout_metadata_product_code_verified",
  "checkout_price_verified",
  "checkout_payment_intent_link_verified",
  "payment_intent_charge_link_verified",
  "charge_balance_transaction_link_verified",
  "refund_dispute_original_chain_verified",
  "support_entitlement_original_chain_verified",
];

export const crossProductIsolationChecks = [
  "checkout_metadata_product_codes_distinct",
  "stripe_products_distinct",
  "stripe_prices_distinct",
  "payment_intents_distinct",
  "charges_distinct",
  "balance_transactions_distinct",
  "no_cross_product_refund_dispute_support_links",
  "shared_ledger_reconciled",
];

const rootKeys = [
  "schema_version",
  "environment",
  "currency",
  "window_start",
  "window_end",
  "products",
  "cross_product_checks",
];
const allowedStatuses = new Set(["PASS", "MISSING", "FAIL"]);

function missingChecks(names) {
  return Object.fromEntries(names.map((name) => [name, "MISSING"]));
}

export function createAccountingProductIsolationTemplate() {
  return {
    schema_version: 1,
    environment: "live",
    currency: "aud",
    window_start: "REPLACE_WITH_UTC_TIMESTAMP",
    window_end: "REPLACE_WITH_LATER_UTC_TIMESTAMP",
    products: Object.fromEntries(
      accountingProductCodes.map((productCode) => [productCode, missingChecks(productIsolationChecks)]),
    ),
    cross_product_checks: missingChecks(crossProductIsolationChecks),
  };
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasExactKeys(value, keys) {
  return isPlainObject(value)
    && Object.keys(value).sort().join("\n") === [...keys].sort().join("\n");
}

function hasExactStatuses(value, names) {
  return hasExactKeys(value, names) && names.every((name) => allowedStatuses.has(value[name]));
}

function isCanonicalUtc(value) {
  if (typeof value !== "string") return false;
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString() === value;
}

export function containsSensitiveProductIsolationEvidence(raw) {
  if (typeof raw !== "string") return true;
  return [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /\b(?:prod_|price_|cs_|pi_|ch_|txn_|re_|dp_)[A-Za-z0-9_]{8,}\b/,
    /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/,
    /\bwhsec_[A-Za-z0-9_]+\b/,
    /postgres(?:ql)?:\/\/[^\s"']+/i,
  ].some((pattern) => pattern.test(raw));
}

function structuralErrors(packet) {
  const errors = [];
  if (!hasExactKeys(packet, rootKeys)) errors.push("packet_shape");
  if (!isPlainObject(packet)) return errors;
  if (packet.schema_version !== 1) errors.push("schema_version");
  if (!new Set(["test", "live"]).has(packet.environment)) errors.push("environment");
  if (packet.currency !== "aud") errors.push("currency");
  if (!isCanonicalUtc(packet.window_start)) errors.push("window_start");
  if (!isCanonicalUtc(packet.window_end)) errors.push("window_end");
  if (
    isCanonicalUtc(packet.window_start)
    && isCanonicalUtc(packet.window_end)
    && Date.parse(packet.window_end) <= Date.parse(packet.window_start)
  ) errors.push("window_order");
  if (!hasExactKeys(packet.products, accountingProductCodes)) {
    errors.push("products_shape");
  } else {
    for (const productCode of accountingProductCodes) {
      if (!hasExactStatuses(packet.products[productCode], productIsolationChecks)) {
        errors.push(`${productCode}_shape`);
      }
    }
  }
  if (!hasExactStatuses(packet.cross_product_checks, crossProductIsolationChecks)) {
    errors.push("cross_product_checks_shape");
  }
  return [...new Set(errors)];
}

export function evaluateAccountingProductIsolation(packet) {
  const errors = structuralErrors(packet);
  if (errors.length > 0) return { passed: false, decision: "STOP", errors, rows: [] };

  const rows = [];
  for (const productCode of accountingProductCodes) {
    for (const check of productIsolationChecks) {
      rows.push({ check: `${productCode}.${check}`, status: packet.products[productCode][check] });
    }
  }
  for (const check of crossProductIsolationChecks) {
    rows.push({ check: `cross_product.${check}`, status: packet.cross_product_checks[check] });
  }
  const unresolved = rows.filter((row) => row.status !== "PASS").length;
  return {
    passed: unresolved === 0,
    decision: unresolved === 0 ? "PASS" : "UNRESOLVED",
    errors: [],
    rows,
    unresolved,
  };
}
