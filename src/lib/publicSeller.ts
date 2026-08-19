import "server-only";

import { siteName } from "@/lib/site";

export function getPublicSellerDetails() {
  const tradingName = process.env.BUSINESS_TRADING_NAME?.trim() || siteName;
  const legalName = process.env.BUSINESS_LEGAL_NAME?.trim();
  const abnDigits = process.env.BUSINESS_ABN?.replace(/\D/g, "") ?? "";
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return {
    tradingName: tradingName && tradingName.length <= 120 ? tradingName : null,
    legalName: legalName && legalName.length <= 120 ? legalName : null,
    abn: /^\d{11}$/.test(abnDigits)
      ? `${abnDigits.slice(0, 2)} ${abnDigits.slice(2, 5)} ${abnDigits.slice(5, 8)} ${abnDigits.slice(8)}`
      : null,
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
  };
}
