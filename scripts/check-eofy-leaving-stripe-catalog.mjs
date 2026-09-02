import assert from "node:assert/strict";

import {
  eofyStripeCatalogDefinition,
  runEofyStripeCatalog,
} from "./ensure-eofy-stripe-catalog.mjs";
import {
  leavingAustraliaStripeCatalogDefinition,
  runLeavingAustraliaStripeCatalog,
} from "./ensure-leaving-australia-stripe-catalog.mjs";

const ACCOUNT_ID = "acct_HojuCompassProduction";
const LIVE_KEY = `sk_${"live"}_CatalogContractFixture`;
const RESTRICTED_LIVE_KEY = `rk_${"live"}_CatalogContractFixture`;

const runners = [
  [eofyStripeCatalogDefinition, runEofyStripeCatalog],
  [leavingAustraliaStripeCatalogDefinition, runLeavingAustraliaStripeCatalog],
];

function environmentFor(definition, overrides = {}) {
  return {
    VERCEL_ENV: "production",
    STRIPE_SECRET_KEY: LIVE_KEY,
    PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID: ACCOUNT_ID,
    [definition.checkoutSwitch]: "false",
    [definition.ackEnvironment]: definition.acknowledgement,
    ...overrides,
  };
}

function productFor(definition, overrides = {}) {
  return {
    id: `prod_${definition.productCode}`,
    active: true,
    livemode: true,
    name: definition.name,
    description: definition.description,
    metadata: { ...definition.metadata },
    ...overrides,
  };
}

function priceFor(definition, product, overrides = {}) {
  return {
    id: `price_${definition.productCode}`,
    product: product.id,
    active: true,
    livemode: true,
    type: "one_time",
    recurring: null,
    currency: definition.currency,
    unit_amount: definition.unitAmount,
    tax_behavior: definition.taxBehavior,
    lookup_key: definition.lookupKey,
    metadata: { ...definition.metadata },
    ...overrides,
  };
}

function list(values) {
  return {
    async *[Symbol.asyncIterator]() {
      yield* values;
    },
  };
}

function stripeFixture(definition, {
  accountId = ACCOUNT_ID,
  products,
  lookupPrices,
  productPrices,
} = {}) {
  const calls = [];
  const existingProduct = productFor(definition);
  const resolvedProducts = products ?? [existingProduct];
  const exactPrice = priceFor(definition, existingProduct);
  const resolvedLookupPrices = lookupPrices ?? [exactPrice];
  const resolvedProductPrices = productPrices ?? [exactPrice];

  const stripe = {
    accounts: {
      async retrieveCurrent() {
        calls.push(["account.retrieve"]);
        return { id: accountId };
      },
    },
    products: {
      list(params) {
        calls.push(["products.list", params]);
        return list(resolvedProducts);
      },
      async create(params, options) {
        calls.push(["products.create", params, options]);
        return productFor(definition, { id: `prod_created_${definition.productCode}`, ...params });
      },
    },
    prices: {
      list(params) {
        calls.push(["prices.list", params]);
        return list(params.lookup_keys ? resolvedLookupPrices : resolvedProductPrices);
      },
      async create(params, options) {
        calls.push(["prices.create", params, options]);
        return priceFor(definition, { id: params.product }, {
          id: `price_created_${definition.productCode}`,
          ...params,
        });
      },
    },
  };

  return { calls, createStripe: () => stripe };
}

function mutationCalls(calls) {
  return calls.filter(([name]) => name.endsWith(".create"));
}

for (const [definition, run] of runners) {
  {
    const fixture = stripeFixture(definition);
    const result = await run({ environment: environmentFor(definition), createStripe: fixture.createStripe });
    assert.equal(result.status, "pass", `${definition.label} must reuse one exact Product and Price in dry-run mode.`);
    assert.equal(result.productCreated, false);
    assert.equal(result.priceCreated, false);
    assert.deepEqual(mutationCalls(fixture.calls), []);
    assert.equal(fixture.calls[0][0], "account.retrieve", "The exact Stripe Account must be verified before catalog reads.");
  }

  {
    const fixture = stripeFixture(definition);
    const result = await run({
      environment: environmentFor(definition, { STRIPE_SECRET_KEY: RESTRICTED_LIVE_KEY }),
      createStripe: fixture.createStripe,
    });
    assert.equal(result.status, "pass", `${definition.label} must accept a least-privilege live restricted catalog key.`);
    assert.deepEqual(mutationCalls(fixture.calls), []);
  }

  {
    const fixture = stripeFixture(definition, { products: [], lookupPrices: [], productPrices: [] });
    const result = await run({
      environment: environmentFor(definition, { [definition.ackEnvironment]: undefined }),
      createStripe: fixture.createStripe,
    });
    assert.deepEqual(
      { status: result.status, productMissing: result.productMissing, priceMissing: result.priceMissing },
      { status: "pending", productMissing: true, priceMissing: true },
      `${definition.label} default invocation must report missing catalog state without requiring an apply ACK.`,
    );
    assert.deepEqual(mutationCalls(fixture.calls), [], "Dry-run must never create a Product or Price.");
  }

  {
    const fixture = stripeFixture(definition, { products: [], lookupPrices: [], productPrices: [] });
    const result = await run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe });
    assert.equal(result.status, "pass");
    assert.equal(result.productCreated, true);
    assert.equal(result.priceCreated, true);
    const mutations = mutationCalls(fixture.calls);
    assert.deepEqual(mutations.map(([name]) => name), ["products.create", "prices.create"]);
    assert.deepEqual(mutations[0][1], {
      name: definition.name,
      description: definition.description,
      metadata: definition.metadata,
    });
    assert.deepEqual(mutations[1][1], {
      product: `prod_created_${definition.productCode}`,
      currency: definition.currency,
      unit_amount: definition.unitAmount,
      tax_behavior: definition.taxBehavior,
      lookup_key: definition.lookupKey,
      metadata: definition.metadata,
    });
  }

  for (const [label, productOverride] of [
    ["inactive Product", { active: false }],
    ["test-mode Product", { livemode: false }],
    ["wrong Product name", { name: `${definition.name} copy` }],
    ["wrong Product description", { description: `${definition.description} changed` }],
    ["wrong Product metadata", { metadata: { product_code: definition.productCode, billing_model: "subscription" } }],
    ["extra Product metadata", { metadata: { ...definition.metadata, unapproved: "value" } }],
  ]) {
    const product = productFor(definition, productOverride);
    const fixture = stripeFixture(definition, { products: [product], lookupPrices: [], productPrices: [] });
    await assert.rejects(
      run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }),
      undefined,
      `${definition.label} ${label} must fail closed.`,
    );
    assert.deepEqual(mutationCalls(fixture.calls), [], `${label} must be rejected before mutation.`);
  }

  {
    const product = productFor(definition);
    const fixture = stripeFixture(definition, { products: [product, { ...product, id: `${product.id}_duplicate` }] });
    await assert.rejects(run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }));
    assert.deepEqual(mutationCalls(fixture.calls), [], "Duplicate Product identities must be rejected before mutation.");
  }

  {
    const product = productFor(definition);
    const price = priceFor(definition, product);
    const fixture = stripeFixture(definition, {
      products: [product],
      lookupPrices: [price],
      productPrices: [price, { ...price, id: `${price.id}_duplicate` }],
    });
    await assert.rejects(run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }));
    assert.deepEqual(mutationCalls(fixture.calls), [], "Duplicate Prices must be rejected before mutation.");
  }

  {
    const product = productFor(definition);
    const lookupPrice = priceFor(definition, product);
    const productPrice = { ...lookupPrice, id: `${lookupPrice.id}_other` };
    const fixture = stripeFixture(definition, {
      products: [product],
      lookupPrices: [lookupPrice],
      productPrices: [productPrice],
    });
    await assert.rejects(run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }));
    assert.deepEqual(mutationCalls(fixture.calls), [], "Conflicting lookup and Product Price identities must be rejected before mutation.");
  }

  for (const [label, priceOverride] of [
    ["inactive Price", { active: false }],
    ["test-mode Price", { livemode: false }],
    ["recurring Price", { type: "recurring", recurring: { interval: "month" } }],
    ["wrong currency", { currency: "usd" }],
    ["wrong amount", { unit_amount: definition.unitAmount + 1 }],
    ["wrong tax behavior", { tax_behavior: "exclusive" }],
    ["wrong lookup key", { lookup_key: `${definition.lookupKey}_copy` }],
    ["wrong Price metadata", { metadata: { product_code: definition.productCode, billing_model: "subscription" } }],
    ["extra Price metadata", { metadata: { ...definition.metadata, unapproved: "value" } }],
  ]) {
    const product = productFor(definition);
    const price = priceFor(definition, product, priceOverride);
    const fixture = stripeFixture(definition, {
      products: [product],
      lookupPrices: [price],
      productPrices: [price],
    });
    await assert.rejects(
      run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }),
      undefined,
      `${definition.label} ${label} must fail closed.`,
    );
    assert.deepEqual(mutationCalls(fixture.calls), [], `${label} must be rejected before mutation.`);
  }

  {
    const fixture = stripeFixture(definition, { accountId: "acct_DifferentProductionAccount", products: [], lookupPrices: [] });
    await assert.rejects(run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }));
    assert.deepEqual(fixture.calls, [["account.retrieve"]], "A different account must be rejected before reads or mutations.");
  }

  {
    const otherProduct = { id: "prod_other" };
    const foreignLookupPrice = priceFor(definition, otherProduct);
    const fixture = stripeFixture(definition, { products: [], lookupPrices: [foreignLookupPrice], productPrices: [] });
    await assert.rejects(run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe }));
    assert.deepEqual(mutationCalls(fixture.calls), [], "A lookup key on another Product must block Product creation.");
  }

  {
    const product = productFor(definition);
    const fixture = stripeFixture(definition, { products: [product], lookupPrices: [], productPrices: [] });
    const result = await run({ apply: true, environment: environmentFor(definition), createStripe: fixture.createStripe });
    assert.equal(result.productCreated, false);
    assert.equal(result.priceCreated, true);
    assert.deepEqual(mutationCalls(fixture.calls).map(([name]) => name), ["prices.create"]);
  }

  for (const overrides of [
    { PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID: undefined },
    { [definition.checkoutSwitch]: "true" },
    { [definition.ackEnvironment]: "WRONG_ACK" },
  ]) {
    let clientCreated = false;
    await assert.rejects(run({
      apply: true,
      environment: environmentFor(definition, overrides),
      createStripe: () => {
        clientCreated = true;
        throw new Error("Stripe client must not be created for invalid local input.");
      },
    }));
    assert.equal(clientCreated, false, "Invalid account, switch, or ACK input must fail before any Stripe access.");
  }


  for (const invalidKey of [
    `rk_${"test"}_CatalogContractFixture`,
    `sk_${"test"}_CatalogContractFixture`,
    "invalid_catalog_key",
  ]) {
    let clientCreated = false;
    await assert.rejects(run({
      environment: environmentFor(definition, { STRIPE_SECRET_KEY: invalidKey }),
      createStripe: () => {
        clientCreated = true;
        throw new Error("Stripe client must not be created for a non-live key.");
      },
    }));
    assert.equal(clientCreated, false, "Test-mode and invalid keys must fail before Stripe access.");
  }
}

console.log("EOFY and Leaving Stripe catalog account, identity, dry-run, and mutation-boundary checks passed.");
