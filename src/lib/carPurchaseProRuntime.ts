import "server-only";
import {
  handleConfiguredCarPurchaseAccess,
  hasConfiguredCarPurchaseWorkspaceAccess,
} from "./carPurchaseProServerRuntime";

export const handleCarPurchaseAccess = handleConfiguredCarPurchaseAccess;
export const hasCarPurchaseWorkspaceAccess = hasConfiguredCarPurchaseWorkspaceAccess;
