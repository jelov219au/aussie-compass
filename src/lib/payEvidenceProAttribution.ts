export type PayEvidenceProEntry = "pay-evidence-pro" | "underpayment-guide" | "pro-hub";

const allowedEntries = new Set<PayEvidenceProEntry>([
  "pay-evidence-pro",
  "underpayment-guide",
  "pro-hub",
]);

export function normalizePayEvidenceProEntry(value: FormDataEntryValue | null): PayEvidenceProEntry {
  const entry = typeof value === "string" ? value.trim().toLowerCase() : "";
  return allowedEntries.has(entry as PayEvidenceProEntry) ? entry as PayEvidenceProEntry : "pay-evidence-pro";
}
