import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const qaDirectory = process.env.EOFY_UI_DIR;
assert.ok(qaDirectory, "EOFY_UI_DIR must identify the isolated review directory");
mkdirSync(qaDirectory, { recursive: true });
const archive = JSON.parse(readFileSync(new URL("../public/downloads/eofy-pro-example-archive.json", import.meta.url), "utf8"));
const summary = readFileSync(new URL("../public/downloads/eofy-pro-example-summary.txt", import.meta.url), "utf8");
writeFileSync(resolve(qaDirectory, "eofy-fixture.json"), JSON.stringify({ draft: archive.draft, archive, summary }, null, 2));
console.log("EOFY UI fixture prepared from the public fictional TXT/JSON examples; no customer data or credentials.");
