import assert from "node:assert/strict";

const ACCOUNT_ID_PATTERN = /^acct_[A-Za-z0-9]+$/;

function normalizedMetadata(metadata) {
  return Object.fromEntries(Object.entries(metadata ?? {}).sort(([left], [right]) => left.localeCompare(right)));
}

function assertExactProduct(product, definition) {
  assert.equal(product.active, true, `${definition.label} Product must be active.`);
  assert.equal(product.livemode, true, `${definition.label} Product must be live-mode.`);
  assert.equal(product.name, definition.name, `${definition.label} Product name does not match the release contract.`);
  assert.equal(product.description, definition.description, `${definition.label} Product description does not match the release contract.`);
  assert.deepEqual(
    normalizedMetadata(product.metadata),
    normalizedMetadata(definition.metadata),
    `${definition.label} Product metadata does not match the release contract.`,
  );
}

function priceProductId(price) {
  return typeof price.product === "string" ? price.product : price.product?.id;
}

function assertExactPrice(price, productId, definition) {
  assert.equal(priceProductId(price), productId, `${definition.label} Price belongs to a different Product.`);
  assert.equal(price.active, true, `${definition.label} Price must be active.`);
  assert.equal(price.livemode, true, `${definition.label} Price must be live-mode.`);
  assert.equal(price.type, "one_time", `${definition.label} Price must be one-time.`);
  assert.equal(price.recurring ?? null, null, `${definition.label} Price must not have a recurring contract.`);
  assert.equal(price.currency, definition.currency, `${definition.label} Price currency does not match.`);
  assert.equal(price.unit_amount, definition.unitAmount, `${definition.label} Price amount does not match.`);
  assert.equal(price.tax_behavior, definition.taxBehavior, `${definition.label} Price tax behavior does not match.`);
  assert.equal(price.lookup_key, definition.lookupKey, `${definition.label} Price lookup key does not match.`);
  assert.deepEqual(
    normalizedMetadata(price.metadata),
    normalizedMetadata(definition.metadata),
    `${definition.label} Price metadata does not match the release contract.`,
  );
}

async function collect(iterable) {
  const values = [];
  for await (const value of iterable) values.push(value);
  return values;
}

export async function ensureStripeLiveCatalog({
  apply,
  createStripe,
  definition,
  environment = process.env,
}) {
  assert.equal(environment.VERCEL_ENV, "production", "The catalog command requires the pinned Production environment.");
  assert.notEqual(environment[definition.checkoutSwitch], "true", `${definition.label} Checkout must remain off during catalog setup.`);

  const secretKey = environment.STRIPE_SECRET_KEY?.trim();
  assert.match(
    secretKey ?? "",
    /^(?:rk|sk)_live_/,
    "A dedicated live restricted key or live secret key is required.",
  );

  const expectedAccountId = environment.PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID?.trim();
  assert.match(expectedAccountId ?? "", ACCOUNT_ID_PATTERN, "PAYMENTS_EXPECTED_STRIPE_ACCOUNT_ID must pin the exact live Stripe Account.");

  if (apply) {
    assert.equal(
      environment[definition.ackEnvironment],
      definition.acknowledgement,
      `The explicit ${definition.label} catalog acknowledgement is missing.`,
    );
  }

  const stripe = createStripe(secretKey);
  const account = await stripe.accounts.retrieveCurrent();
  assert.equal(account.id, expectedAccountId, "The live key belongs to a different Stripe Account; refusing catalog access.");

  const products = await collect(stripe.products.list({ limit: 100 }));
  const productCandidates = products.filter((candidate) => (
    candidate.name === definition.name
    || candidate.metadata?.product_code === definition.productCode
  ));
  assert.ok(productCandidates.length <= 1, `Multiple ${definition.label} Product identities require manual review.`);

  let product = productCandidates[0];
  if (product) assertExactProduct(product, definition);

  const lookupPrices = await collect(stripe.prices.list({ lookup_keys: [definition.lookupKey], limit: 100 }));
  assert.ok(lookupPrices.length <= 1, `Multiple ${definition.label} Prices use the release lookup key.`);
  const lookupPrice = lookupPrices[0];

  let price;
  if (product) {
    const productPrices = await collect(stripe.prices.list({ product: product.id, limit: 100 }));
    assert.ok(productPrices.length <= 1, `Multiple ${definition.label} Prices require manual review.`);
    price = productPrices[0];
    if (lookupPrice || price) {
      assert.ok(lookupPrice && price && lookupPrice.id === price.id, `${definition.label} Price identity is ambiguous.`);
      assertExactPrice(price, product.id, definition);
    }
  } else {
    assert.equal(lookupPrice, undefined, `${definition.label} lookup key already belongs to another Product.`);
  }

  if (!apply && (!product || !price)) {
    return {
      status: "pending",
      product,
      price,
      productMissing: !product,
      priceMissing: !price,
      productCreated: false,
      priceCreated: false,
    };
  }

  let productCreated = false;
  if (!product) {
    product = await stripe.products.create({
      name: definition.name,
      description: definition.description,
      metadata: definition.metadata,
    }, { idempotencyKey: definition.productIdempotencyKey });
    productCreated = true;
    assertExactProduct(product, definition);
  }

  let priceCreated = false;
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      currency: definition.currency,
      unit_amount: definition.unitAmount,
      tax_behavior: definition.taxBehavior,
      lookup_key: definition.lookupKey,
      metadata: definition.metadata,
    }, { idempotencyKey: definition.priceIdempotencyKey });
    priceCreated = true;
    assertExactPrice(price, product.id, definition);
  }

  return { status: "pass", product, price, productCreated, priceCreated };
}
