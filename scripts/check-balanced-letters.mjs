import assert from "node:assert/strict";
import { localTypeScriptLoader } from "./lib/load-local-typescript.mjs";
const { letterRowSizes, letterTileWidth, letterTileGap } = localTypeScriptLoader()("src/lib/balancedLetters.ts");
const rows = (count, width) => Array.from(letterRowSizes(count, width));
assert.deepEqual(rows(6, 300), [3, 3]);
assert.deepEqual(rows(7, 300), [4, 3]);
assert.deepEqual(rows(8, 300), [4, 4]);
assert.deepEqual(rows(11, 300), [4, 4, 3]);
assert.deepEqual(rows(6, 316), [6]);
assert.deepEqual(rows(6, 315.9), [3, 3]);
assert(letterTileWidth >= 44);
let checks = 0;
for (let count = 3; count <= 12; count++) {
  for (let width = 154; width <= 1200; width++) {
    const sizes = rows(count, width);
    assert.equal(sizes.reduce((a, b) => a + b, 0), count);
    assert(Math.max(...sizes) - Math.min(...sizes) <= 1);
    assert(sizes.at(-1) >= 2, "no isolated last tile at supported card widths");
    assert(sizes.every(n => n * letterTileWidth + (n - 1) * letterTileGap <= width));
    if (count * letterTileWidth + (count - 1) * letterTileGap <= width) assert.equal(sizes.length, 1);
    checks++;
  }
}
console.log(`PASS balanced letters: ${checks} width/length cases, 3–12 letters, exact single-row boundary, centered-row sizing and 44px touch minimum.`);
