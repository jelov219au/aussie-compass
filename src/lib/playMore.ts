import { balanceRounds } from "@/data/playMore";

export type LetterTile = { id: number; letter: string };
export function puzzleTiles(word: string): LetterTile[] {
  const tiles = Array.from(word, (letter, id) => ({ id, letter }));
  // Stable server/client order; repeated letters remain separate, selectable tiles.
  let seed = Array.from(word).reduce((value, letter) => (Math.imul(value, 31) + letter.charCodeAt(0)) >>> 0, 17);
  for (let i = tiles.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  if (tiles.map(tile => tile.letter).join("") === word && new Set(word).size > 1) {
    do { tiles.push(tiles.shift()!); } while (tiles.map(tile => tile.letter).join("") === word);
  }
  return tiles;
}
export function puzzleAnswer(word: string, ids: readonly number[]): "incomplete" | "correct" | "incorrect" {
  if (ids.length !== word.length) return "incomplete";
  if (new Set(ids).size !== ids.length || Array.from(ids).some(id => !Number.isInteger(id) || id < 0 || id >= word.length)) return "incorrect";
  return ids.map(id => word[id]).join("") === word ? "correct" : "incorrect";
}
export function balanceShareText(answers: readonly number[]): string | null {
  if (answers.length !== balanceRounds.length || Array.from(answers).some(answer => answer !== 0 && answer !== 1)) return null;
  const lines = answers.map((answer, i) => {
    const choice = balanceRounds[i].choices[answer];
    return `${i + 1}. ${choice.emoji} ${choice.title}`;
  });
  return `나의 호주 생활 밸런스 게임\n${lines.join("\n")}\n너와는 몇 개나 같을까?\nhttps://hojucompass.com/play#balance-game\n정답 없는 상상 게임 · Hoju Compass`;
}
