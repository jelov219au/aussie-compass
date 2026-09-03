import { handleCarPurchaseCheckout } from "@/lib/carPurchaseProCheckoutRuntime";
export const runtime = "nodejs";
export async function POST(request: Request) { return handleCarPurchaseCheckout(request); }
