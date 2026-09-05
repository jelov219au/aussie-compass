import "server-only";
import {
  resumeProProduct, resumeProPurchaseTermsVersion, getPaymentReadiness,
  rentalApplicationProProduct, rentalApplicationProPurchaseTermsVersion, getRentalApplicationPaymentReadiness,
  payEvidenceProProduct, payEvidenceProPurchaseTermsVersion,
  eofyProProduct, eofyProPurchaseTermsVersion,
  leavingAustraliaProProduct, leavingAustraliaProPurchaseTermsVersion,
} from "./commerce";
import { getProCatalogProducts } from "./proCatalogProducts";

// Customer-facing facts use the same offers and readiness as the Pro catalog.
// Listing a product is not authority to create checkout or grant access.
export function getProPurchaseInformation() {
  const catalog = getProCatalogProducts(getPaymentReadiness().ready, getRentalApplicationPaymentReadiness().ready);
  return [
    { product: resumeProProduct, termsVersion: resumeProPurchaseTermsVersion },
    { product: rentalApplicationProProduct, termsVersion: rentalApplicationProPurchaseTermsVersion },
    { product: payEvidenceProProduct, termsVersion: payEvidenceProPurchaseTermsVersion },
    { product: eofyProProduct, termsVersion: eofyProPurchaseTermsVersion },
    { product: leavingAustraliaProProduct, termsVersion: leavingAustraliaProPurchaseTermsVersion },
  ].map(({ product, termsVersion }) => ({
    ...product, termsVersion, href: `/${product.id}`, restoreHref: `/${product.id}/restore`,
    price: `A$${(product.priceCents / 100).toFixed(2)}`,
    ready: catalog.find(item => item.id === product.id)?.live === true,
  }));
}
