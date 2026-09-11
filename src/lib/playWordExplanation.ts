export type PlayWordExplanation = {
  explanation: string;
  usage: string;
  example: { en: string; ko: string };
};

export function validPlayWordExplanation(value: PlayWordExplanation, word: string) {
  const korean = (text: unknown) => typeof text === "string" && /[가-힣]/.test(text) && text.trim().length >= 8;
  return korean(value.explanation) && korean(value.usage) && korean(value.example?.ko)
    && typeof value.example?.en === "string" && value.example.en.trim().length >= 8
    && new RegExp(`\\b${word}\\b`, "i").test(value.example.en);
}
