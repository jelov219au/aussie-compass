type CookieValue = { name: string; value: string };
type CookieReader = { getAll(name: string): readonly CookieValue[] };
type ActiveEntitlement = { id: string; productCode: string; status: string };
type AccessService = { getActive(token: string | undefined): Promise<ActiveEntitlement | null> };

export const carPurchaseProAccessCookieName = (environment: "production" | "development") =>
  environment === "production"
    ? "__Host-hoju_car_purchase_pro_access"
    : "hoju_car_purchase_pro_access";

// This guard deliberately re-checks the lifecycle result at the page boundary.
// A valid signed cookie is insufficient unless the backing access session remains active.
export function createCarPurchaseWorkspaceAccess(deps: {
  service: AccessService | null;
  enabled: boolean;
  environment: "production" | "development";
  readCookies: () => Promise<CookieReader>;
}) {
  const cookieName = carPurchaseProAccessCookieName(deps.environment);

  return async function hasCarPurchaseWorkspaceAccess() {
    if (!deps.enabled || !deps.service) return false;
    try {
      const values = (await deps.readCookies()).getAll(cookieName);
      if (values.length !== 1) return false;
      const token = values[0]?.value;
      if (!token || token.length > 4096 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
      const entitlement = await deps.service.getActive(token);
      return !!entitlement
        && /^\d+$/.test(entitlement.id)
        && entitlement.productCode === "car_purchase_pro"
        && entitlement.status === "active";
    } catch {
      return false;
    }
  };
}
