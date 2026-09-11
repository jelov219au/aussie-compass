import { validVehicleCost, vehicleCosts, type Vehicle } from "./vehicleComparisonStorage";

const upfrontFields = ["price", "transfer", "inspection"] as const;
const dollars = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
export const formatVehicleCost = (value: number | null) => value === null ? "—" : dollars.format(value);

export function vehicleCostSummary(vehicle: Vehicle) {
  const invalid = vehicleCosts.filter(field => !validVehicleCost(vehicle[field]));
  const provided = vehicleCosts.filter(field => vehicle[field] !== "" && validVehicleCost(vehicle[field]));
  const upfrontProvided = upfrontFields.filter(field => provided.includes(field)).length;
  const amount = (field: typeof vehicleCosts[number]) => Number(vehicle[field]);
  const upfront = upfrontFields.reduce((sum, field) => sum + amount(field), 0);
  const firstYear = upfront + amount("insurance") + amount("rego") + amount("servicing") + amount("fuel") * 12;
  return {
    invalid, provided: provided.length, total: vehicleCosts.length,
    upfrontComplete: upfrontProvided === upfrontFields.length,
    complete: invalid.length === 0 && provided.length === vehicleCosts.length,
    upfront: invalid.length || !upfrontProvided ? null : upfront,
    firstYear: invalid.length || !provided.length ? null : firstYear,
  };
}
