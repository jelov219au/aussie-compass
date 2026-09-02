import type { SettlementStatus } from "./leavingAustraliaProStorage";

type AmountIssue = "format" | "negative" | "precision" | "range";
export type LeavingAmount = { kind: "valid"; raw: string; cents: bigint }
  | { kind: "blank"; raw: string }
  | { kind: "incomplete"; raw: string }
  | { kind: "invalid"; raw: string; reason: AmountIssue };

const zero = BigInt(0);
const issues: Record<AmountIssue, string> = {
  format: "숫자 형식 확인 필요 · 쉼표·통화기호 없이 입력",
  negative: "받을 돈의 예상액에는 음수를 합산하지 않습니다",
  precision: "센트 미만 금액 확인 필요 · 반올림하지 않음",
  range: "기존 유한 숫자 입력 범위 초과 · 금액 확인 필요",
};

export function parseLeavingAmount(raw: string): LeavingAmount {
  const value = raw.trim();
  if (!value) return { kind: "blank", raw };
  if (/^[+-]?(?:\d*\.|\d+(?:\.\d+)?[eE][+-]?|\.\d+[eE][+-]?)?$/.test(value)) return { kind: "incomplete", raw };
  const match = /^([+-]?)(?:(\d+)(?:\.(\d+))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(value);
  if (!match) return { kind: "invalid", raw, reason: "format" };
  const fraction = match[3] ?? match[4] ?? "";
  const coefficient = `${match[2] ?? ""}${fraction}`.replace(/^0+/, "");
  if (!coefficient) return { kind: "valid", raw, cents: zero };
  if (match[1] === "-") return { kind: "invalid", raw, reason: "negative" };
  // Keep the former finite-input range, not an invented payment cap. This Number
  // is ONLY a range check: its rounded value is never used for cents or display.
  if (!Number.isFinite(Number(value))) return { kind: "invalid", raw, reason: "range" };
  // Preserve complete scientific notation accepted by the former number input.
  // Decimal-point placement uses the exponent; monetary digits stay strings.
  const exponent = Number(match[5] ?? "0");
  const digits = coefficient.replace(/0+$/, "");
  const scale = exponent - fraction.length + 2 + coefficient.length - digits.length;
  if (scale < 0) return { kind: "invalid", raw, reason: "precision" };
  // Finite legacy input needs at most 309 dollar digits (311 cent digits).
  // Bound expansion before allocating zeros or constructing a bigint.
  if (!Number.isSafeInteger(scale) || digits.length + scale > 311) return { kind: "invalid", raw, reason: "range" };
  const cents = BigInt(digits + "0".repeat(scale));
  return { kind: "valid", raw, cents };
}

export function formatLeavingCents(cents: bigint): string {
  const digits = cents.toString().padStart(3, "0");
  return `A$${digits.slice(0, -2)}.${digits.slice(-2)}`;
}

export function describeLeavingAmount(raw: string): string {
  const amount = parseLeavingAmount(raw);
  if (amount.kind === "valid") return `${formatLeavingCents(amount.cents)} · 입력값, 검증 안 됨`;
  const reason = amount.kind === "blank" ? "미입력" : amount.kind === "incomplete" ? "입력 중 · 확인 필요" : issues[amount.reason];
  // JSON quoting keeps whitespace/newlines and ambiguous invalid text identifiable in TXT too.
  return `${reason} · 합계 미포함 · 원문 ${JSON.stringify(raw)}`;
}

export function summarizeLeavingAmounts(items: ReadonlyArray<{ amount: string; status: SettlementStatus }>) {
  const result = { cents: zero, valid: 0, blank: 0, incomplete: 0, invalid: 0, received: 0, pending: 0 };
  for (const item of items) {
    if (item.status === "received") { result.received++; continue; }
    result.pending++;
    const amount = parseLeavingAmount(item.amount);
    result[amount.kind]++;
    if (amount.kind === "valid") result.cents += amount.cents;
  }
  return result;
}
