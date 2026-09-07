export type SavedResume = {
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  location?: string;
  link?: string;
  summary?: string;
  skills?: string;
  licences?: string;
  languages?: string;
  showReferences?: boolean;
  experiences?: Array<{ role?: string; company?: string; period?: string; details?: string }>;
  education?: Array<{ course?: string; school?: string; period?: string }>;
};

const stopWords = new Set([
  "about", "after", "also", "and", "are", "been", "being", "but", "can", "company", "experience", "from", "have", "include", "includes", "into", "job", "more", "must", "our", "position", "preparing", "required", "requirements", "responsibilities", "role", "seeking", "that", "the", "their", "this", "through", "using", "will", "with", "work", "you", "your",
]);

function normaliseWords(value: string) {
  return value.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) ?? [];
}

export function extractKeywords(value: string) {
  const counts = new Map<string, number>();
  normaliseWords(value).forEach((word) => {
    const cleaned = word.replace(/^[.-]+|[.-]+$/g, "");
    if (cleaned.length < 4 || stopWords.has(cleaned)) return;
    counts.set(cleaned, (counts.get(cleaned) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 14).map(([word]) => word);
}

function sentence(value?: string) {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

export function createResumeProCoverLetter(savedResume: SavedResume, draft: { role: string; company: string; hiringManager: string; tone: "clear" | "warm" | "concise" }, missing: string[]) {
  const role = draft.role.trim() || savedResume.title?.trim() || "the advertised role";
  const company = draft.company.trim() || "your team";
  const manager = draft.hiringManager.trim() || "Hiring Manager";
  const name = savedResume.name?.trim() || "Your Name";
  const summary = sentence(savedResume.summary) || `I am applying for the ${role} position with a reliable, practical approach and a strong willingness to contribute.`;
  const firstExperience = savedResume.experiences?.find((item) => item.role || item.details);
  const achievement = sentence(firstExperience?.details?.split("\n").find(Boolean));
  const skills = savedResume.skills?.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3) ?? [];
  const skillLine = skills.length ? `My relevant strengths include ${skills.join(", ")}.` : "I learn new processes quickly and take ownership of the work assigned to me.";
  const missingLine = missing.length ? `I was particularly interested in your focus on ${missing.slice(0, 3).join(", ")}, and I would welcome the opportunity to discuss how my experience can support these priorities.` : `I would welcome the opportunity to discuss how my experience can support ${company}.`;
  const opening = draft.tone === "warm"
    ? `I was pleased to see the ${role} opportunity with ${company}.`
    : draft.tone === "concise"
      ? `I am writing to apply for the ${role} position at ${company}.`
      : `I am interested in the ${role} position at ${company} and believe my experience would allow me to contribute from the outset.`;
  const closing = draft.tone === "warm" ? "Thank you for taking the time to consider my application. I would be delighted to speak with you." : "Thank you for considering my application. I look forward to the opportunity to discuss my suitability for the role.";
  const paragraphs = [
    `Dear ${manager},`,
    `${opening} ${summary}`,
    [achievement, skillLine].filter(Boolean).join(" "),
    missingLine,
    closing,
    `Kind regards,\n${name}`,
  ];
  return paragraphs.join("\n\n");
}
