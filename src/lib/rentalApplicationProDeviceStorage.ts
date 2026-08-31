export type RentalApplicationProDeviceStorage = Pick<Storage, "getItem" | "removeItem">;

export const propertyInspectionStorageKey = "aussie-compass-property-inspection-v1";
export const rentalApplicationProWorkspaceStorageKey = "hoju-compass-rental-application-pro-v1";
export const rentalApplicationProFirstSuccessStorageKey = "hoju-compass-rental-application-pro-first-success-v1";
export const rentalApplicationProHandoffStorageKey = "hoju-compass-rental-ready-now-handoff-v1";

export type RentalWorkspaceSaveResult = "saved" | "failed" | "blocked";

export function writeRentalWorkspace(
  getStorage: () => Pick<Storage, "setItem">,
  workspace: unknown,
  canWrite: boolean,
): RentalWorkspaceSaveResult {
  if (!canWrite) return "blocked";
  try {
    const content = JSON.stringify(workspace);
    if (typeof content !== "string") return "failed";
    getStorage().setItem(rentalApplicationProWorkspaceStorageKey, content);
    return "saved";
  } catch {
    return "failed";
  }
}

export const rentalApplicationProTransferableStorageKeys = [
  propertyInspectionStorageKey,
  rentalApplicationProWorkspaceStorageKey,
] as const;

export const rentalApplicationProDeviceDataStorageKeys = [
  ...rentalApplicationProTransferableStorageKeys,
  rentalApplicationProHandoffStorageKey,
  rentalApplicationProFirstSuccessStorageKey,
] as const;

export function clearRentalApplicationProDeviceData(storage: RentalApplicationProDeviceStorage) {
  const removedKeys: string[] = [];
  const failedKeys: string[] = [];

  rentalApplicationProDeviceDataStorageKeys.forEach((key) => {
    try {
      const existed = storage.getItem(key) !== null;
      storage.removeItem(key);
      if (storage.getItem(key) !== null) {
        failedKeys.push(key);
      } else if (existed) {
        removedKeys.push(key);
      }
    } catch {
      failedKeys.push(key);
    }
  });

  return { removedKeys, failedKeys };
}
