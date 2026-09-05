export type Experience = { id: string; role: string; company: string; period: string; details: string };
export type Education = { id: string; course: string; school: string; period: string };
export type Accent = "navy" | "forest" | "burgundy" | "charcoal";
export type ResumeData = {
  name: string; title: string; phone: string; email: string; location: string; link: string;
  summary: string; skills: string; licences: string; languages: string;
  showReferences: boolean; accent: Accent; layoutStyle: "classic" | "compact";
  experiences: Experience[]; education: Education[];
};

export const emptyResume: ResumeData = {
  name: "", title: "", phone: "", email: "", location: "", link: "", summary: "", skills: "",
  licences: "", languages: "", showReferences: false, accent: "navy", layoutStyle: "classic",
  experiences: [{ id: "experience-1", role: "", company: "", period: "", details: "" }],
  education: [{ id: "education-1", course: "", school: "", period: "" }],
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Raw Builder v1 only. Device-transfer envelopes must be restored on /data-transfer. */
export function parseResumeBuilderDraft(raw: string): ResumeData {
  const value: unknown = JSON.parse(raw);
  if (!record(value)) throw new Error("invalid resume");
  const required = ["name", "title", "phone", "email", "location", "summary", "skills"] as const;
  const optional = ["link", "licences", "languages"] as const;
  for (const key of required) if (typeof value[key] !== "string") throw new Error(`invalid ${key}`);
  for (const key of optional) if (key in value && typeof value[key] !== "string") throw new Error(`invalid ${key}`);
  if ("showReferences" in value && typeof value.showReferences !== "boolean") throw new Error("invalid references");
  if ("accent" in value && !["navy", "forest", "burgundy", "charcoal"].includes(value.accent as string)) throw new Error("invalid accent");
  if ("layoutStyle" in value && !["classic", "compact"].includes(value.layoutStyle as string)) throw new Error("invalid layout");
  for (const [key, fields] of [["experiences", ["id", "role", "company", "period", "details"]], ["education", ["id", "course", "school", "period"]]] as const) {
    const entries = value[key];
    if (!Array.isArray(entries)) throw new Error(`invalid ${key}`);
    const ids = new Set<string>();
    for (const entry of entries) {
      if (!record(entry) || fields.some((field) => typeof entry[field] !== "string")) throw new Error(`invalid ${key} entry`);
      const id = entry.id as string;
      if (!id.trim() || ids.has(id)) throw new Error(`invalid ${key} id`);
      ids.add(id);
    }
  }
  // Only known fields, without trimming, truncating or limiting valid user data.
  return {
    ...Object.fromEntries(required.map((key) => [key, value[key]])),
    ...Object.fromEntries(optional.map((key) => [key, value[key] ?? ""])),
    showReferences: value.showReferences ?? false,
    accent: value.accent ?? "navy", layoutStyle: value.layoutStyle ?? "classic",
    experiences: (value.experiences as Experience[]).map(({ id, role, company, period, details }) => ({ id, role, company, period, details })),
    education: (value.education as Education[]).map(({ id, course, school, period }) => ({ id, course, school, period })),
  } as ResumeData;
}

export const splitResumeSkills = (value: string) => value.split(/,|\n/).map((item) => item.trim()).filter(Boolean);
export const hasExperience = (item: Experience) => [item.role, item.company, item.period, item.details].some((value) => value.trim());
export const hasEducation = (item: Education) => [item.course, item.school, item.period].some((value) => value.trim());

export function resumeEssentialCount(resume: ResumeData) {
  return [resume.name, resume.title, resume.phone, resume.email, resume.summary].filter((value) => value.trim()).length
    + Number(resume.experiences.some((item) => item.role.trim())) + Number(splitResumeSkills(resume.skills).length > 0);
}

export function resumePlainText(resume: ResumeData) {
  const lines = [resume.name.trim(), resume.title.trim(), [resume.phone, resume.email, resume.location, resume.link].map((v) => v.trim()).filter(Boolean).join(" | ")];
  const section = (heading: string, content: string[]) => { if (content.length) lines.push("", heading, ...content); };
  section("PROFESSIONAL SUMMARY", resume.summary.trim() ? [resume.summary.trim()] : []);
  section("EXPERIENCE", resume.experiences.filter(hasExperience).flatMap((item) => [
    [item.role, item.company].map((v) => v.trim()).filter(Boolean).join(" — "), item.period.trim(),
    ...item.details.split("\n").map((v) => v.trim()).filter(Boolean).map((v) => `• ${v}`),
  ].filter(Boolean)));
  section("EDUCATION & TRAINING", resume.education.filter(hasEducation).flatMap((item) => [
    [item.course, item.school].map((v) => v.trim()).filter(Boolean).join(" — "), item.period.trim(),
  ].filter(Boolean)));
  const skills = splitResumeSkills(resume.skills);
  section("SKILLS", skills.length ? [skills.join(", ")] : []);
  section("LICENCES & CERTIFICATIONS", resume.licences.split("\n").map((v) => v.trim()).filter(Boolean));
  const languages = splitResumeSkills(resume.languages);
  section("LANGUAGES", languages.length ? [languages.join(", ")] : []);
  // References alone do not turn an empty form into a printable resume.
  if (lines.some((line) => line.trim()) && resume.showReferences) section("REFERENCES", ["Available upon request"]);
  return lines.filter((line, index) => line || lines[index - 1]).join("\n").trim();
}

export function hasWritingPlaceholder(text: string) {
  return /\[[^\]]*\]|\{[^}]*\}|<[^>]*>|\b(?:TODO|TBD|XXX|your name|target role|insert here)\b/i.test(text);
}

/** Korean notes are deliberately not an input: no inference, translation, or invented qualities. */
export function createFactBasedEnglishDraft(targetRole: string, experience: "none" | "confirmed", confirmedWork: string) {
  const role = targetRole.trim();
  const work = confirmedWork.trim();
  if (!role || hasWritingPlaceholder(role)) throw new Error("목표 직무를 영문으로 입력하고 대괄호 안내를 바꿔 주세요.");
  if (experience === "confirmed" && (!work || hasWritingPlaceholder(work))) throw new Error("직접 수행한 업무·결과를 영문으로 입력하고 안내 문구를 바꿔 주세요.");
  return `Seeking a role in ${role}.${experience === "confirmed" ? `\n${work}` : ""}`;
}
