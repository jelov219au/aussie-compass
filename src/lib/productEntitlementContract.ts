import type { EntitlementCommand, ProductCode } from "@/lib/entitlements";

const checkoutProductContracts: Record<ProductCode, { currency: string; amountTotal: number }> = {
  resume_pro: { currency: "aud", amountTotal: 1990 },
  rental_application_pro: { currency: "aud", amountTotal: 1490 },
  pay_evidence_pro: { currency: "aud", amountTotal: 990 },
  eofy_pro: { currency: "aud", amountTotal: 990 },
};

export function matchesCheckoutProductEntitlementContract(command: EntitlementCommand | null) {
  if (!command) return false;
  if (!command.eventType.startsWith("checkout.session.")) return true;
  if (!command.productCode) return false;

  const contract = checkoutProductContracts[command.productCode];
  return command.currency === contract.currency && command.amountTotal === contract.amountTotal;
}
