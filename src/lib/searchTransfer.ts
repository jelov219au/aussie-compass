export const SEARCH_TRANSFER_STORAGE_KEY = "hojucompass:search-transfer:v1";

export const SEARCH_TRANSFER_MAX_LENGTH = 120;

export function sanitizeTransferredSearch(value: string) {
  return value.trim().slice(0, SEARCH_TRANSFER_MAX_LENGTH);
}
