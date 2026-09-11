export const vehicleComparisonKey = "aussie-compass-vehicle-comparison-v1";
export const vehicleCosts = ["price", "transfer", "inspection", "insurance", "rego", "servicing", "fuel"] as const;
export const vehicleChecks = ["ppsr", "vin", "regoCheck", "mechanic", "history", "testDrive"] as const;
export type Vehicle = { id: string; name: string } & Record<typeof vehicleCosts[number], string> & Record<typeof vehicleChecks[number], boolean>;

export const makeVehicle = (index: number): Vehicle => ({ id: `${Date.now()}-${index}`, name: "", price: "", transfer: "", inspection: "", insurance: "", rego: "", servicing: "", fuel: "", ppsr: false, vin: false, regoCheck: false, mechanic: false, history: false, testDrive: false });

const fields = new Set<string>(["id", "name", ...vehicleCosts, ...vehicleChecks]);
export function validVehicleCost(value: unknown): value is string {
  return typeof value === "string" && (value === "" || (value.trim() !== "" && /^\d*\.?\d+(?:e[+-]?\d+)?$/i.test(value) && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 1e12));
}

// Keep the existing v1 array unchanged, including blank costs. Reject unknown
// shapes instead of silently dropping fields or overwriting an unreadable save.
export function parseVehicles(raw: string): Vehicle[] | null {
  try {
    if (raw.length > 64000) return null;
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value) || value.length < 2 || value.length > 3) return null;
    const ids = new Set<string>();
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item) || Object.keys(item).some(field => !fields.has(field))) return null;
      if (typeof item.id !== "string" || !item.id.trim() || item.id.length > 120 || ids.has(item.id)) return null;
      if (typeof item.name !== "string" || item.name.length > 60) return null;
      if (!vehicleCosts.every(field => validVehicleCost(item[field])) || !vehicleChecks.every(field => typeof item[field] === "boolean")) return null;
      ids.add(item.id);
    }
    return value as Vehicle[];
  } catch { return null; }
}

export function serializeVehicles(vehicles: Vehicle[]): string | null {
  try {
    const raw = JSON.stringify(vehicles);
    return parseVehicles(raw) === null ? null : raw;
  } catch { return null; }
}
