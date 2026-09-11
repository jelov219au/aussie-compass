import { characterQuestions, characters, dailyQuizzes, type CharacterId } from "@/data/playground";

export const dailyQuizKey = "hoju-compass-daily-quiz-v1";
export type DailyAnswer = { version: 1; day: string; questionId: string; choice: number };

export function sydneyDay(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)!.value).join("-");
}
export function dailyQuizIndex(day: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Invalid quiz date");
  const date = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) throw new Error("Invalid quiz date");
  const number = Math.floor(date.getTime() / 86400000);
  return ((number % dailyQuizzes.length) + dailyQuizzes.length) % dailyQuizzes.length;
}
export function parseDailyAnswer(raw: string): DailyAnswer | null {
  try {
    if (raw.length > 1024) return null;
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || Object.keys(value).sort().join() !== "choice,day,questionId,version" || value.version !== 1 || typeof value.day !== "string") return null;
    const question = dailyQuizzes[dailyQuizIndex(value.day)];
    if (value.questionId !== question.id || !Number.isInteger(value.choice) || value.choice < 0 || value.choice >= question.choices.length) return null;
    return value;
  } catch { return null; }
}
export function characterResult(answers: readonly number[]): CharacterId | null {
  if (answers.length !== characterQuestions.length || Array.from(answers).some((answer, i) => !Number.isInteger(answer) || !characterQuestions[i].options[answer])) return null;
  const choices = answers.map((answer, i) => characterQuestions[i].options[answer].character);
  const scores = Object.fromEntries(Object.keys(characters).map(id => [id, choices.filter(choice => choice === id).length]));
  const best = Math.max(...Object.values(scores));
  // A tied result follows the most recent choice among the tied characters.
  return [...choices].reverse().find(id => scores[id] === best)!;
}
export function characterShareText(id: CharacterId): string {
  const character = characters[id];
  return `나의 호주 생활 캐릭터는 ${character.emoji} ${character.name}!\n${character.title}\n너는 어떤 캐릭터일까?\nhttps://hojucompass.com/play#character-test\n재미로 보는 5문항 테스트 · Hoju Compass`;
}
