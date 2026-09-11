import "server-only";
import {
  handleConfiguredCarPurchaseAccess,
  hasConfiguredCarPurchaseWorkspaceAccess,
  isConfiguredCarPurchaseAccessAvailable,
} from "./carPurchaseProServerRuntime";

export const handleCarPurchaseAccess = handleConfiguredCarPurchaseAccess;
export const hasCarPurchaseWorkspaceAccess = hasConfiguredCarPurchaseWorkspaceAccess;
export const isCarPurchaseAccessAvailable = isConfiguredCarPurchaseAccessAvailable;
