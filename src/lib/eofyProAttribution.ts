export type EofyProEntry = "eofy-pro" | "tax-return-guide" | "pro-hub";

const allowedEntries = new Set<EofyProEntry>([
  "eofy-pro",
  "tax-return-guide",
  "pro-hub",
]);

export function normalizeEofyProEntry(value: FormDataEntryValue | null): EofyProEntry {
  const entry = typeof value === "string" ? value.trim().toLowerCase() : "";
  return allowedEntries.has(entry as EofyProEntry) ? entry as EofyProEntry : "eofy-pro";
}
