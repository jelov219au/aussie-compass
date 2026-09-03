import "server-only";
import { cookies } from "next/headers";
import { createCarPurchaseAccessHttp } from "./carPurchaseProAccessHttp";
import { createCarPurchaseWorkspaceAccess } from "./carPurchaseProWorkspaceAccess";
import { siteUrl } from "./site";

// Closed until the reviewed DB adapter and server-verified checkout are connected.
// No environment flag alone can turn on this incomplete integration.
export const handleCarPurchaseAccess = createCarPurchaseAccessHttp({
  service: null,
  enabled: false,
  expectedOrigin: new URL(siteUrl).origin,
  environment: process.env.NODE_ENV === "development" ? "development" : "production",
});

// The shared web/PWA workspace now has its final server-side gate. It remains
// closed until the same reviewed lifecycle is connected to both HTTP and page access.
export const hasCarPurchaseWorkspaceAccess = createCarPurchaseWorkspaceAccess({
  service: null,
  enabled: false,
  environment: process.env.NODE_ENV === "development" ? "development" : "production",
  readCookies: cookies,
});
