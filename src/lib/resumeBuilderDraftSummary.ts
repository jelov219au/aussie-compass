export type ResumeBuilderDraftSummary = {
  essentialCount: number;
  experienceCount: number;
  skillCount: number;
};

const essentialTotal = 7;
const experienceLimit = 30;
const skillLimit = 50;

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function summarizeResumeBuilderDraft(raw: string | null): ResumeBuilderDraftSummary | null {
  if (!raw) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const experiences = Array.isArray(parsed.experiences) ? parsed.experiences : [];
  const experienceCount = Math.min(
    experiences.filter((experience) => isRecord(experience)
      && (hasText(experience.role) || hasText(experience.company) || hasText(experience.details))).length,
    experienceLimit,
  );
  const hasExperienceRole = experiences.some((experience) => isRecord(experience) && hasText(experience.role));
  const skillCount = Math.min(
    typeof parsed.skills === "string"
      ? parsed.skills.split(/,|\n/).filter((skill) => skill.trim().length > 0).length
      : 0,
    skillLimit,
  );
  const essentialCount = [
    parsed.name,
    parsed.title,
    parsed.phone,
    parsed.email,
    parsed.summary,
  ].filter(hasText).length + Number(hasExperienceRole) + Number(skillCount > 0);

  if (essentialCount === 0 && experienceCount === 0 && skillCount === 0) return null;
  return {
    essentialCount: Math.min(essentialCount, essentialTotal),
    experienceCount,
    skillCount,
  };
}
