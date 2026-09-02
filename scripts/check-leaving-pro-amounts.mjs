import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";

// Run against the exact preserved parent to demonstrate the original defect.
if (process.env.LEAVING_AMOUNT_BEFORE_SOURCE) {
  const source = await readFile(process.env.LEAVING_AMOUNT_BEFORE_SOURCE, "utf8");
  const legacy = source.match(/function safeAmount\(value: string\) \{[\s\S]*?\n\}/)?.[0];
  assert(legacy, "Exact parent safeAmount implementation must exist");
  const parse = runInNewContext(`(${legacy.replace("value: string", "value")})`);
  const failures = [];
  for (const raw of ["", " ", "bad", "1e", "1.", "-5", "1.005", "90071992547409.90", "90071992547409.91"]) {
    const actual = `A$${parse(raw).toFixed(2)}`;
    const expected = raw.startsWith("90071992547409.") ? `A$${raw}` : "NOT INCLUDED";
    if (actual !== expected) failures.push({ raw, actual, expected });
  }
  console.log(JSON.stringify(failures, null, 2));
  assert.equal(failures.length, 0, "Parent misrepresents empty/invalid/unfinished/precision-boundary amounts");
} else {
  const amounts = await import("../src/lib/leavingAustraliaProAmounts.ts");
  const { parseLeavingAmount, formatLeavingCents, summarizeLeavingAmounts, describeLeavingAmount } = amounts;
  const valid = new Map([
    ["0", "0.00"], ["0.00", "0.00"], ["00", "0.00"], ["-0", "0.00"], [".5", "0.50"],
    ["1.2", "1.20"], ["1.23", "1.23"], [" 001.20 ", "1.20"], ["+1.20", "1.20"],
    ["1.2300", "1.23"], ["1e3", "1000.00"], ["1E+2", "100.00"], ["1e-2", "0.01"],
    ["1230e-3", "1.23"], ["1.234e1", "12.34"], ["0e99999", "0.00"],
    ["90071992547409.90", "90071992547409.90"], ["90071992547409.91", "90071992547409.91"], ["9007199254740991e-2", "90071992547409.91"],
    ["90071992547409.92", "90071992547409.92"], ["9007199254740993.01", "9007199254740993.01"],
    ["1e308", `1${"0".repeat(308)}.00`],
  ]);
  for (const [raw, formatted] of valid) {
    const parsed = parseLeavingAmount(raw);
    assert.equal(parsed.kind, "valid", raw);
    assert.equal(parsed.raw, raw);
    assert.equal(formatLeavingCents(parsed.cents), `A$${formatted}`, raw);
    assert(describeLeavingAmount(raw).includes(`A$${formatted}`));
  }
  for (const raw of ["", " ", "\t\n"]) assert.equal(parseLeavingAmount(raw).kind, "blank");
  for (const raw of [".", "+", "-", "1.", "+.\t", "1e", "1e+", "1E-"]) assert.equal(parseLeavingAmount(raw).kind, "incomplete", raw);
  const invalid = new Map([
    ["bad", "format"], ["NaN", "format"], ["Infinity", "format"], ["0x10", "format"],
    ["1,234.56", "format"], ["1,23", "format"], ["$1", "format"], ["1 2", "format"],
    ["1\n2", "format"], ["-0.01", "negative"], ["-12", "negative"],
    ["1.005", "precision"], ["0.001", "precision"], ["1e-99999", "precision"],
    ["1e309", "range"],
    ["1e99999999999999999999999", "range"], ["9".repeat(10000), "range"],
  ]);
  for (const [raw, reason] of invalid) {
    const parsed = parseLeavingAmount(raw);
    assert.equal(parsed.kind, "invalid", raw);
    assert.equal(parsed.reason, reason, raw);
    assert.equal(parsed.raw, raw);
    assert(!("cents" in parsed));
    assert(describeLeavingAmount(raw).includes("합계 미포함"));
    assert(describeLeavingAmount(raw).includes(JSON.stringify(raw)));
  }
  const item = (amount, status = "expected") => ({ amount, status });
  const mixed = [item("0.10"), item("0.20", "followup"), item("0"), item(""), item("bad"), item("1."), item("50", "received")];
  const prior = JSON.stringify(mixed);
  const total = summarizeLeavingAmounts(mixed);
  assert.equal(formatLeavingCents(total.cents), "A$0.30");
  assert.deepEqual({ valid: total.valid, blank: total.blank, incomplete: total.incomplete, invalid: total.invalid, received: total.received, pending: total.pending }, { valid: 3, blank: 1, incomplete: 1, invalid: 1, received: 1, pending: 6 });
  assert.equal(JSON.stringify(mixed), prior, "Never normalize stored raw amounts");
  const safeIntegerEdge = "90071992547409.91";
  assert.equal(formatLeavingCents(summarizeLeavingAmounts([item(safeIntegerEdge), item(safeIntegerEdge), item("0.01")]).cents), "A$180143985094819.83", "Sum may exceed Number's safe integer boundary without rounding");
  assert.equal(formatLeavingCents(summarizeLeavingAmounts([item("1e308"), item("1e308")]).cents), `A$2${"0".repeat(308)}.00`, "Sum may exceed the finite Number range without overflow");
  assert.equal(summarizeLeavingAmounts([item(""), item("bad")]).valid, 0);
  assert.equal(summarizeLeavingAmounts([item("0")]).valid, 1);
  assert.equal(summarizeLeavingAmounts([item("bad", "received")]).received, 1);
  assert.equal(summarizeLeavingAmounts([]).pending, 0);
  // Exact accumulation across cent values, independent integer oracle.
  const rows = Array.from({ length: 1000 }, (_, index) => item(`${Math.floor(index / 100)}.${String(index % 100).padStart(2, "0")}`));
  assert.equal(summarizeLeavingAmounts(rows).cents, BigInt(999 * 1000 / 2));
  console.log("Leaving amount parsing, original text, zero/empty distinction, exact cents, legacy exponent input and precision boundaries PASS.");
}
