export const resumeProStripeProductDefinition = {
  currency: "aud",
  priceCents: 1990,
  taxBehavior: "inclusive",
} as const;

type StripeTaxCodeLike = { id: string };

type StripeProductLike = {
  id: string;
  active: boolean;
  livemode: boolean;
  tax_code?: string | StripeTaxCodeLike | null;
};

type StripeDeletedProductLike = { id: string; deleted: true };

export type StripePriceWithProduct = {
  id: string;
  active: boolean;
  currency: string;
  livemode: boolean;
  product: string | StripeProductLike | StripeDeletedProductLike;
  tax_behavior: "exclusive" | "inclusive" | "unspecified" | null;
  type: "one_time" | "recurring";
  unit_amount: number | null;
};

export type ResumeProStripeProductConfig = {
  priceId: string;
  productId: string;
  taxCode: string;
};

function requireStripeId(value: string | undefined, prefix: string, variableName: string) {
  const candidate = value?.trim() ?? "";

  if (!candidate.startsWith(prefix) || candidate.length <= prefix.length) {
    throw new Error(`${variableName} is missing or invalid.`);
  }

  return candidate;
}

export function getResumeProStripeProductConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ResumeProStripeProductConfig {
  return {
    priceId: requireStripeId(environment.STRIPE_RESUME_PRO_PRICE_ID, "price_", "STRIPE_RESUME_PRO_PRICE_ID"),
    productId: requireStripeId(environment.STRIPE_RESUME_PRO_PRODUCT_ID, "prod_", "STRIPE_RESUME_PRO_PRODUCT_ID"),
    taxCode: requireStripeId(environment.STRIPE_RESUME_PRO_TAX_CODE, "txcd_", "STRIPE_RESUME_PRO_TAX_CODE"),
  };
}

export function hasResumeProStripeProductConfig(
  environment: NodeJS.ProcessEnv = process.env,
) {
  try {
    getResumeProStripeProductConfig(environment);
    return true;
  } catch {
    return false;
  }
}

function getExpandedProduct(price: StripePriceWithProduct) {
  if (typeof price.product === "string" || "deleted" in price.product) {
    throw new Error("Resume Pro Stripe Product was not returned as an active expanded Product.");
  }

  return price.product;
}

function getTaxCodeId(product: StripeProductLike) {
  if (typeof product.tax_code === "string") return product.tax_code;
  return product.tax_code?.id ?? null;
}

export function assertResumeProStripeProduct(
  price: StripePriceWithProduct,
  config: ResumeProStripeProductConfig,
  expectedLivemode: boolean,
) {
  const product = getExpandedProduct(price);
  const validPrice = price.id === config.priceId
    && price.active
    && price.type === "one_time"
    && price.currency === resumeProStripeProductDefinition.currency
    && price.unit_amount === resumeProStripeProductDefinition.priceCents
    && price.tax_behavior === resumeProStripeProductDefinition.taxBehavior
    && price.livemode === expectedLivemode;

  if (!validPrice) {
    throw new Error("Resume Pro Price does not match the server product and tax definition.");
  }

  const validProduct = product.id === config.productId
    && product.active
    && product.livemode === expectedLivemode;

  if (!validProduct) {
    throw new Error("Resume Pro Price is attached to an unexpected or inactive Stripe Product.");
  }

  if (getTaxCodeId(product) !== config.taxCode) {
    throw new Error("Resume Pro Stripe Product tax code is missing or does not match the approved code.");
  }
}
