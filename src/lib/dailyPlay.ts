import { validPlayWordExplanation, type PlayWordExplanation } from "./playWordExplanation";

export type PlaySource = { title: string; url: string; checkedAt: string };
type ReviewedItem = { id: string; topicKey: string; review: "reviewed" | "draft"; checkedAt: string };
export type DailyPlaySet = {
  id: string; date: string;
  quiz: ReviewedItem & { question: string; choices: string[]; answer: number; explanation: string; source: PlaySource };
  puzzle: ReviewedItem & PlayWordExplanation & { word: string; meaning: string; source: PlaySource };
  choice: ReviewedItem & { question: string; choices: [string, string]; reactions: [string, string]; creative: true };
};
export type DailyPlayResponse = { today: string; date: string; dates: string[]; set: DailyPlaySet | null };
export const dailyPlayStorageKey = "hoju-compass-daily-play-v2";
export type DailyPlayAnswers = { version: 2; date: string; ids: string[]; quiz: number | null; tiles: number[];
  hint: boolean; finish: "solo" | "hint" | "reveal" | null; choice: number | null };

export function validPlayDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function playSydneyDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
}
export function millisecondsToSydneyMidnight(now = new Date()) {
  const start = now.getTime(), today = playSydneyDay(now);
  let low = start, high = start + 27 * 60 * 60 * 1000;
  while (high - low > 1) {
    const mid = Math.floor((low + high) / 2);
    if (playSydneyDay(new Date(mid)) === today) low = mid; else high = mid;
  }
  return high - start;
}

export function validateDailyPlayCatalog(sets: readonly DailyPlaySet[], existingTopics: readonly string[] = []) {
  const dates = new Set<string>(), ids = new Set<string>(), topics = new Set(existingTopics);
  for (const set of sets) {
    if (!validPlayDate(set.date) || dates.has(set.date)) throw Error("Invalid or duplicate play date");
    dates.add(set.date);
    for (const item of [set, set.quiz, set.puzzle, set.choice]) {
      if (!/^[a-z0-9-]+$/.test(item.id) || ids.has(item.id)) throw Error("Invalid or duplicate play ID");
      ids.add(item.id);
    }
    for (const item of [set.quiz, set.puzzle, set.choice]) {
      if (!item.topicKey || topics.has(item.topicKey)) throw Error("Duplicate play topic");
      topics.add(item.topicKey);
      if (!["reviewed", "draft"].includes(item.review) || !validPlayDate(item.checkedAt) || item.checkedAt > set.date) throw Error("Invalid play review");
    }
    for (const item of [set.quiz, set.puzzle]) {
      const source = item.source;
      if (!source.title || !validPlayDate(source.checkedAt) || source.checkedAt !== item.checkedAt
        || !source.url.startsWith("https://") || !item.explanation.trim()) throw Error("Missing fact verification");
    }
    if (!set.quiz.question || set.quiz.choices.length < 2 || new Set(set.quiz.choices).size !== set.quiz.choices.length
      || !Number.isInteger(set.quiz.answer) || !set.quiz.choices[set.quiz.answer]) throw Error("Invalid quiz");
    if (!/^[A-Z]{3,12}$/.test(set.puzzle.word) || set.puzzle.topicKey !== `slang:${set.puzzle.word.toLowerCase()}` || !set.puzzle.meaning) throw Error("Invalid puzzle");
    if (!validPlayWordExplanation(set.puzzle, set.puzzle.word)) throw Error("Missing Korean word explanation or usage example");
    if (set.choice.creative !== true || !set.choice.question || set.choice.choices.length !== 2
      || set.choice.reactions.length !== 2 || set.choice.choices.some(value => !value)
      || set.choice.reactions.some(value => !value) || set.choice.choices[0] === set.choice.choices[1]) throw Error("Invalid creative choice");
  }
}
export function publishedDailyPlay(sets: readonly DailyPlaySet[], now: Date, requested?: string | null): DailyPlayResponse {
  const today = playSydneyDay(now), date = requested ?? today;
  if (!validPlayDate(date)) throw Error("Invalid requested date");
  const released = sets.filter(set => set.date <= today && [set.quiz, set.puzzle, set.choice].every(item => item.review === "reviewed"));
  return { today, date, dates: released.map(set => set.date).sort().reverse(), set: released.find(set => set.date === date) ?? null };
}
export function emptyDailyPlayAnswers(set: DailyPlaySet): DailyPlayAnswers {
  return { version: 2, date: set.date, ids: [set.quiz.id, set.puzzle.id, set.choice.id], quiz: null, tiles: [], hint: false, finish: null, choice: null };
}
export function parseDailyPlayAnswers(raw: string, set: DailyPlaySet): DailyPlayAnswers | null {
  try {
    if (raw.length > 4096) return null;
    const value = JSON.parse(raw);
    if (!value || value.version !== 2 || value.date !== set.date || JSON.stringify(value.ids) !== JSON.stringify([set.quiz.id, set.puzzle.id, set.choice.id])
      || !(value.quiz === null || Number.isInteger(value.quiz) && value.quiz >= 0 && value.quiz < set.quiz.choices.length)
      || !(value.choice === null || value.choice === 0 || value.choice === 1)
      || typeof value.hint !== "boolean" || ![null, "solo", "hint", "reveal"].includes(value.finish)
      || !Array.isArray(value.tiles) || value.tiles.length > set.puzzle.word.length || new Set(value.tiles).size !== value.tiles.length
      || value.tiles.some((id: unknown) => !Number.isInteger(id) || typeof id !== "number" || id < 0 || id >= set.puzzle.word.length)) return null;
    if (value.finish && (value.tiles.map((id: number) => set.puzzle.word[id]).join("") !== set.puzzle.word
      || value.finish === "solo" && value.hint || value.finish === "hint" && !value.hint)) return null;
    return { ...emptyDailyPlayAnswers(set), quiz: value.quiz, choice: value.choice, hint: value.hint, tiles: value.tiles, finish: value.finish };
  } catch { return null; }
}
