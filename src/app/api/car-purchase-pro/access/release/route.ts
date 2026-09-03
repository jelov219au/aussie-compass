import { handleCarPurchaseAccess } from "@/lib/carPurchaseProRuntime";
export const runtime = "nodejs";
export async function POST(request: Request) { return handleCarPurchaseAccess("release", request); }
