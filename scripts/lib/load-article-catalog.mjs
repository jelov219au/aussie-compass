import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url), ts = require("typescript");

// Execute the same local data-module graph used by the app. Text splitting loses
// imported articles and quoted/minified section keys, so it cannot audit depth.
export function loadArticleCatalog() {
  const cache = new Map();
  function load(url) {
    if (cache.has(url.href)) return cache.get(url.href).exports;
    const record = { exports: {} }; cache.set(url.href, record);
    const source = ts.transpileModule(readFileSync(url, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    runInNewContext(source, { module: record, exports: record.exports, require(name) {
      if (!name.startsWith("./")) throw new Error(`Unexpected article dependency: ${name}`);
      return load(new URL(`${name}.ts`, url));
    } }, { filename: fileURLToPath(url) });
    return record.exports;
  }
  return JSON.parse(JSON.stringify(load(new URL("../../src/data/articles.ts", import.meta.url)).articles));
}
