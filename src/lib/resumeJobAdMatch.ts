export type ResumeJobAdTerm = {
  term: string;
  jobAdOccurrences: number;
  resumeOccurrences: number;
  matched: boolean;
};

const knownPhrases = [
  "customer service", "problem solving", "time management", "attention to detail",
  "written communication", "verbal communication", "communication skills", "stakeholder management",
  "project management", "inventory management", "data entry", "administrative support",
  "microsoft excel", "cash handling", "point of sale", "food safety", "work health and safety",
  "responsible service of alcohol", "working with children check", "national police check",
  "drivers licence", "first aid", "teamwork", "scheduling", "reporting", "inventory",
  "warehouse", "forklift", "barista", "hospitality", "retail", "roster", "availability",
] as const;

const stopWords = new Set([
  "about", "after", "again", "against", "also", "although", "among", "and", "application",
  "apply", "applying", "are", "around", "australia", "australian", "available", "been", "before",
  "being", "between", "both", "business", "candidate", "company", "could", "description", "duties",
  "each", "employer", "employment", "essential", "from", "full", "have", "having", "including",
  "into", "looking", "more", "must", "need", "offering", "opportunity", "other", "our", "position",
  "preferred", "provide", "required", "requirement", "requirements", "responsibilities", "responsibility",
  "role", "should", "skills", "successful", "team", "than", "that", "their", "them", "there", "these",
  "they", "this", "through", "using", "what", "when", "where", "which", "while", "will", "with",
  "within", "work", "working", "would", "years", "your", "youre",
]);

function normalize(value: string) {
  return value
    .toLocaleLowerCase("en-AU")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((token) => token.startsWith(".") && token.length > 1
      ? `.${token.slice(1).replace(/\.+$/, "")}`
      : token.replace(/\.+$/, ""))
    .filter(Boolean)
    .join(" ");
}

function countOccurrences(text: string, term: string) {
  if (!term) return 0;
  let count = 0;
  let position = 0;
  while ((position = text.indexOf(term, position)) !== -1) {
    const before = position === 0 ? " " : text[position - 1];
    const after = position + term.length >= text.length ? " " : text[position + term.length];
    if (!/[a-z0-9+#]/.test(before) && !/[a-z0-9+#]/.test(after)) count += 1;
    position += term.length;
  }
  return count;
}

export function analyseResumeJobAd(resumeText: string, jobAdText: string) {
  const resume = normalize(resumeText);
  const jobAd = normalize(jobAdText);
  const jobTokens = jobAd.split(" ").filter((token) => (
    /^(?:\.[a-z][a-z0-9+#.]*|[a-z][a-z0-9+#.]*)$/.test(token)
    && (token.length >= 3 || /^[a-z][+#]+$/.test(token))
  ));
  const positions = new Map<string, number>();
  const frequencies = new Map<string, number>();

  jobTokens.forEach((token, index) => {
    if (stopWords.has(token) || /^\d+$/.test(token)) return;
    if (!positions.has(token)) positions.set(token, index);
    frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
  });

  const phrases = knownPhrases
    .filter((term) => countOccurrences(jobAd, term) > 0)
    .map((term) => ({ term, occurrences: countOccurrences(jobAd, term), position: jobAd.indexOf(term), known: true }));
  const phraseWords = new Set(phrases.flatMap(({ term }) => term.split(" ")));

  const repeatedTokens = [...frequencies.entries()]
    .filter(([term, count]) => count >= 2 && !phraseWords.has(term))
    .map(([term, occurrences]) => ({ term, occurrences, position: positions.get(term) ?? 0, known: false }));

  const distinctiveTokens = [...frequencies.entries()]
    .filter(([term, count]) => count === 1 && term.length >= 7 && !phraseWords.has(term))
    .map(([term, occurrences]) => ({ term, occurrences, position: positions.get(term) ?? 0, known: false }));

  const candidates = [...phrases, ...repeatedTokens]
    .sort((left, right) => Number(right.known) - Number(left.known) || right.occurrences - left.occurrences || left.position - right.position);
  for (const token of distinctiveTokens.sort((left, right) => left.position - right.position)) {
    if (candidates.length >= 12) break;
    candidates.push(token);
  }

  const terms: ResumeJobAdTerm[] = candidates.slice(0, 12).map(({ term, occurrences }) => {
    const resumeOccurrences = countOccurrences(resume, term);
    return { term, jobAdOccurrences: occurrences, resumeOccurrences, matched: resumeOccurrences > 0 };
  });

  return {
    terms,
    matchedCount: terms.filter((term) => term.matched).length,
    missingCount: terms.filter((term) => !term.matched).length,
  };
}
