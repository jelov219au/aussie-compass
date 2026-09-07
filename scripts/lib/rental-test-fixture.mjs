import { readFileSync } from "node:fs";
import ts from "typescript";

const cache = new Map();
function load(name) {
  if (cache.has(name)) return cache.get(name);
  if (!name.startsWith("@/")) throw new Error(`Unexpected Rental dependency: ${name}`);
  const source = readFileSync(new URL(`../../src/${name.slice(2)}.ts`, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  cache.set(name, exports);
  new Function("exports", "require", compiled)(exports, load);
  return exports;
}

export const rentalOutput = load("@/lib/rentalApplicationOutput");
export const rentalSample = load("@/lib/rentalApplicationSample").rentalApplicationSample;
export const rentalJurisdictionData = load("@/data/rentalJurisdictions");
