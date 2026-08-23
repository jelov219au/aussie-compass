export const rentalApplicationProEntries = [
  "direct",
  "property-inspection-checklist",
  "pro-hub",
  "rental-application-pro",
] as const;

export type RentalApplicationProEntry = (typeof rentalApplicationProEntries)[number];

export function normalizeRentalApplicationProEntry(value: FormDataEntryValue | string[] | null | undefined): RentalApplicationProEntry {
  const candidate = typeof value === "string" ? value.trim() : "";
  return rentalApplicationProEntries.includes(candidate as RentalApplicationProEntry)
    ? candidate as RentalApplicationProEntry
    : "direct";
}
