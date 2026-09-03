import "server-only";
import { createCarPurchaseAccessHttp } from "./carPurchaseProAccessHttp";
import { siteUrl } from "./site";

// Closed until the reviewed DB adapter and server-verified checkout are connected.
// No environment flag alone can turn on this incomplete integration.
export const handleCarPurchaseAccess = createCarPurchaseAccessHttp({
  service: null,
  enabled: false,
  expectedOrigin: new URL(siteUrl).origin,
  environment: process.env.NODE_ENV === "development" ? "development" : "production",
});
