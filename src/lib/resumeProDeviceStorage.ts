export type ResumeProDeviceStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export const resumeStorageKey = "aussie-compass-resume-v1";
export const resumeProDraftStorageKey = "hoju-compass-resume-pro-preview-v1";
export const resumeProApplicationsStorageKey = "hoju-compass-resume-pro-applications-v1";
export const resumeProStarStoriesStorageKey = "hoju-compass-resume-pro-star-stories-v1";

export const resumeProDevicePurgeEventName = "hoju-compass:resume-pro-device-purge";
const purgeRequestKey = "hoju-compass-resume-pro-device-purge-request-v1";
const purgeRequestLifetimeMs = 15_000;
const exactKeys = new Set([
  resumeStorageKey,
  resumeProDraftStorageKey,
  resumeProApplicationsStorageKey,
  resumeProStarStoriesStorageKey,
]);
const privatePrefixes = ["aussie-compass-resume-", "hoju-compass-resume-pro-"];

function isPrivateResumeKey(key: string) {
  return exactKeys.has(key) || privatePrefixes.some((prefix) => key.startsWith(prefix));
}

export function clearResumeProDeviceData(storage: ResumeProDeviceStorage) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => Boolean(key));
  const privateKeys = keys.filter(isPrivateResumeKey);
  privateKeys.forEach((key) => storage.removeItem(key));
  return privateKeys;
}

export function beginResumeProDevicePurge(sessionStorage: ResumeProDeviceStorage, eventTarget: Pick<EventTarget, "dispatchEvent">, requestedAt = Date.now()) {
  eventTarget.dispatchEvent(new Event(resumeProDevicePurgeEventName));
  sessionStorage.setItem(purgeRequestKey, String(requestedAt));
}

export function cancelResumeProDevicePurge(sessionStorage: ResumeProDeviceStorage) {
  sessionStorage.removeItem(purgeRequestKey);
}

export function completeResumeProDevicePurge(
  localStorage: ResumeProDeviceStorage,
  sessionStorage: ResumeProDeviceStorage,
  completedAt = Date.now(),
) {
  const requestedAt = Number(sessionStorage.getItem(purgeRequestKey));
  sessionStorage.removeItem(purgeRequestKey);
  if (!Number.isFinite(requestedAt) || requestedAt <= 0 || completedAt - requestedAt > purgeRequestLifetimeMs) return false;
  clearResumeProDeviceData(localStorage);
  return true;
}
