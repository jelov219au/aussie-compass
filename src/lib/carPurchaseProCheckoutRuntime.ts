import "server-only";
import { handleConfiguredCarPurchaseCheckout } from "./carPurchaseProServerRuntime";

// The configured assembly still hard-codes salesEnabled:false. Environment
// values can prepare dependencies, but cannot open Checkout.
export const handleCarPurchaseCheckout = handleConfiguredCarPurchaseCheckout;
