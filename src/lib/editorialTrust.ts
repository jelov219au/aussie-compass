export type ContentScope = "policy" | "article" | "tool" | "marketing";
export type RelianceState = "current" | "review_due" | "unknown" | "stale" | "broken_source" | "correction_open" | "corrected";
export type SourceAuthority = "primary_law_or_regulator" | "official_service" | "official_dataset" | "expert_secondary" | "lived_experience" | "commercial" | "unknown";
export type TrustNextAction = "open_primary_source" | "continue_with_context" | "do_not_rely" | "verify_jurisdiction_date_eligibility" | "report_correction" | "view_correction_log" | "stop_and_get_official_help";
export type CorrectionState = "none" | "open" | "reviewing" | "corrected" | "declined" | "superseded";
export type HumanOwnership = { author: string; reviewer: string; accountable_owner: string };
export type JurisdictionDateEligibility = { jurisdiction: string; claim_date_basis: string; eligibility: string };
export type CheckedEffectiveVersion = { checked_on: string; effective_from: string; effective_to: string; version: string; review_due: string };
export type EditorialTrustNextAction = {
  content_scope: ContentScope;
  reliance_state: RelianceState;
  source_authority: SourceAuthority;
  jurisdiction_date_eligibility: JurisdictionDateEligibility;
  checked_on_effective_version: CheckedEffectiveVersion;
  correction_state: CorrectionState;
  human_ownership: HumanOwnership;
  disclosure_state: string[] | "unknown";
  next_action: TrustNextAction;
};

export type EditorialTrustInput = {
  contentScope: ContentScope;
  sourceAuthority?: SourceAuthority;
  jurisdiction?: string;
  claimDateBasis?: string;
  eligibility?: string;
  checkedOn?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  version?: string;
  reviewDue?: string;
  correctionState?: CorrectionState;
  author?: string;
  reviewer?: string;
  accountableOwner?: string;
  disclosures?: string[];
  sourceBroken?: boolean;
  jurisdictionConflict?: boolean;
  dateConflict?: boolean;
  eligibilityConflict?: boolean;
  urgentSafety?: boolean;
  correctionStarted?: boolean;
  nextAction?: TrustNextAction;
};

const value = (input?: string) => input?.trim() || "unknown";

export function deriveEditorialTrust(input: EditorialTrustInput, today = "2026-09-07"): EditorialTrustNextAction {
  const correction = input.correctionState ?? "none";
  const authority = input.sourceAuthority ?? "unknown";
  const ownership = { author: value(input.author), reviewer: value(input.reviewer), accountable_owner: value(input.accountableOwner) };
  const metadata = {
    checked_on: value(input.checkedOn), effective_from: value(input.effectiveFrom), effective_to: value(input.effectiveTo),
    version: value(input.version), review_due: value(input.reviewDue),
  };
  const boundary = { jurisdiction: value(input.jurisdiction), claim_date_basis: value(input.claimDateBasis), eligibility: value(input.eligibility) };
  const disclosures = input.disclosures?.length ? [...input.disclosures] : "unknown" as const;
  const ownerMissing = Object.values(ownership).includes("unknown");
  const coreMissing = authority === "unknown" || metadata.checked_on === "unknown" || metadata.version === "unknown" || metadata.review_due === "unknown" || ownerMissing || disclosures === "unknown";

  let reliance: RelianceState = "current";
  let action: TrustNextAction = input.nextAction ?? (authority === "primary_law_or_regulator" || authority === "official_service" || authority === "official_dataset" ? "open_primary_source" : "continue_with_context");
  if (input.urgentSafety && !coreMissing && !input.sourceBroken) action = "stop_and_get_official_help";
  else if (input.sourceBroken) { reliance = "broken_source"; action = "do_not_rely"; }
  else if (metadata.review_due !== "unknown" && metadata.review_due < today) { reliance = "stale"; action = "do_not_rely"; }
  else if (input.dateConflict) { reliance = "correction_open"; action = "report_correction"; }
  else if (input.jurisdictionConflict || input.eligibilityConflict) { reliance = input.eligibilityConflict ? "correction_open" : "unknown"; action = "verify_jurisdiction_date_eligibility"; }
  else if ((correction === "open" || correction === "reviewing") && disclosures === "unknown") { reliance = "unknown"; action = "do_not_rely"; }
  else if (correction === "open" || correction === "reviewing") { reliance = "correction_open"; action = "view_correction_log"; }
  else if (correction === "corrected") { reliance = "corrected"; action = "continue_with_context"; }
  else if (correction === "declined") action = "view_correction_log";
  else if (correction === "superseded") { reliance = "corrected"; action = "view_correction_log"; }
  else if (input.contentScope === "policy" && input.correctionStarted) action = "report_correction";
  else if (coreMissing) { reliance = "unknown"; action = "do_not_rely"; }

  return {
    content_scope: input.contentScope,
    reliance_state: reliance,
    source_authority: authority,
    jurisdiction_date_eligibility: boundary,
    checked_on_effective_version: metadata,
    correction_state: correction,
    human_ownership: ownership,
    disclosure_state: disclosures,
    next_action: action,
  };
}

export const unknownArticleTrust = () => deriveEditorialTrust({ contentScope: "article" });
