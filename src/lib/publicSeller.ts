import "server-only";

export function getPublicSellerDetails() {
  const name = process.env.BUSINESS_LEGAL_NAME?.trim();
  const abnDigits = process.env.BUSINESS_ABN?.replace(/\D/g, "") ?? "";
  const email = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  return {
    name: name && name.length <= 120 ? name : null,
    abn: /^\d{11}$/.test(abnDigits)
      ? `${abnDigits.slice(0, 2)} ${abnDigits.slice(2, 5)} ${abnDigits.slice(5, 8)} ${abnDigits.slice(8)}`
      : null,
    email: email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null,
  };
}
