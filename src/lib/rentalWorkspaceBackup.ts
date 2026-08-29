const documentStatuses = new Set(["todo", "review", "ready"]);
const applicationStages = new Set(["shortlist", "inspected", "preparing", "submitted", "follow_up", "approved", "declined", "withdrawn"]);
const jurisdictions = new Set(["", "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);
const followUpChannels = new Set(["email", "phone", "portal", "inspection"]);
const followUpDirections = new Set(["sent", "received"]);
const stringApplicationFields = ["propertyLabel", "suburb", "weeklyRent", "agentName", "moveDate", "leaseTerm", "applicationDate", "nextActionDate", "notes"] as const;
const profileFields = ["householdSize", "employmentSummary", "rentalSummary", "petSummary", "strengths"] as const;
const messageTypes = ["application", "inspection", "followUp"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyValues(value: unknown, predicate: (item: unknown) => boolean) {
  return isRecord(value) && Object.values(value).every(predicate);
}

function isProfile(value: unknown) {
  return isRecord(value) && profileFields.every((field) => value[field] === undefined || typeof value[field] === "string");
}

function isMessages(value: unknown) {
  return isRecord(value) && Object.values(value).every((message) => typeof message === "string")
    && messageTypes.every((messageType) => typeof value[messageType] === "string");
}

function isInspectionReceipt(value: unknown) {
  return value === null || isRecord(value)
    && (value.mode === "share" || value.mode === "rent")
    && typeof value.reviewedCount === "number" && Number.isFinite(value.reviewedCount)
    && typeof value.concernCount === "number" && Number.isFinite(value.concernCount)
    && (value.sourceCreatedAt === undefined || typeof value.sourceCreatedAt === "number" && Number.isSafeInteger(value.sourceCreatedAt));
}

function isApplication(value: unknown, version: 2 | 3) {
  if (!isRecord(value) || typeof value.id !== "string" || value.id.trim() === "") return false;
  if (!stringApplicationFields.every((field) => value[field] === undefined || typeof value[field] === "string")) return false;
  if (version === 3 && !stringApplicationFields.every((field) => typeof value[field] === "string")) return false;
  if (value.jurisdiction !== undefined && !jurisdictions.has(String(value.jurisdiction))) return false;
  if (value.stage !== undefined && !applicationStages.has(String(value.stage))) return false;
  if (value.statuses !== undefined && !hasOnlyValues(value.statuses, (status) => typeof status === "string" && documentStatuses.has(status))) return false;
  if (value.privacyChecks !== undefined && !hasOnlyValues(value.privacyChecks, (checked) => typeof checked === "boolean")) return false;
  if (value.messages !== undefined && !isMessages(value.messages)) return false;
  if (value.inspectionReceipt !== undefined && !isInspectionReceipt(value.inspectionReceipt)) return false;
  if (value.followUps !== undefined && (!Array.isArray(value.followUps) || !value.followUps.every((entry) => isRecord(entry)
    && typeof entry.id === "string" && entry.id.trim() !== ""
    && typeof entry.date === "string"
    && typeof entry.summary === "string"
    && typeof entry.channel === "string" && followUpChannels.has(entry.channel)
    && typeof entry.direction === "string" && followUpDirections.has(entry.direction)))) return false;
  if (version === 3 && (value.statuses === undefined || value.privacyChecks === undefined || value.messages === undefined || value.followUps === undefined
    || value.inspectionReceipt === undefined
    || typeof value.jurisdiction !== "string" || typeof value.stage !== "string")) return false;
  return true;
}

export function isRentalWorkspaceBackup(value: unknown, maximumApplications = 20) {
  if (!isRecord(value) || (value.version !== 2 && value.version !== 3)) return false;
  if (!Array.isArray(value.applications) || value.applications.length === 0 || value.applications.length > maximumApplications) return false;
  if (!value.applications.every((application) => isApplication(application, value.version as 2 | 3))) return false;
  if (value.activeId !== undefined && typeof value.activeId !== "string") return false;
  if (value.profile !== undefined && !isProfile(value.profile)) return false;
  if (value.evidenceLibrary !== undefined && (!isRecord(value.evidenceLibrary) || !Object.values(value.evidenceLibrary).every((entry) => isRecord(entry)
    && (entry.status === undefined || typeof entry.status === "string" && documentStatuses.has(entry.status))
    && (entry.checkedOn === undefined || typeof entry.checkedOn === "string")))) return false;
  if (value.version === 3 && (typeof value.activeId !== "string" || !value.applications.some((application) => isRecord(application) && application.id === value.activeId)
    || !isProfile(value.profile) || !isRecord(value.evidenceLibrary))) return false;
  return true;
}
