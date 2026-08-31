export type LeavingAustraliaProEntry = "leaving-australia-pro" | "leaving-australia-guide" | "pro-hub";

const allowedEntries = new Set<LeavingAustraliaProEntry>([
  "leaving-australia-pro",
  "leaving-australia-guide",
  "pro-hub",
]);

export function normalizeLeavingAustraliaProEntry(value: FormDataEntryValue | null): LeavingAustraliaProEntry {
  const entry = typeof value === "string" ? value.trim().toLowerCase() : "";
  return allowedEntries.has(entry as LeavingAustraliaProEntry) ? entry as LeavingAustraliaProEntry : "leaving-australia-pro";
}
