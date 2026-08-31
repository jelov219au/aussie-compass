import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const aliasesSource = await read("src/lib/articleAliases.mjs");
const historySource = await read("src/lib/articleProgress.ts");
const articlesSource = await read("src/data/articles.ts");
const storage = new Map();
let writes = 0;
const localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => { writes++; storage.set(key, value); },
};
const load = (source, dependencies = {}) => {
  const exports = {};
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, {
    exports, process, localStorage, Event,
    window: { dispatchEvent() {} },
    require(id) { assert.ok(id in dependencies, `unexpected import: ${id}`); return dependencies[id]; },
  });
  return exports;
};

const aliases = load(aliasesSource);
const config = load(await read("next.config.ts"), { "./src/lib/articleAliases.mjs": aliases }).default;
const { articles } = load(articlesSource);
const legacySlug = "australia-public-holiday-pay-guide";
const canonicalSlug = "australia-public-holiday-work-pay-guide";
const legacyHref = `/resources/${legacySlug}`;
const canonicalHref = `/resources/${canonicalSlug}`;
const canonical = articles.find((article) => article.slug === canonicalSlug);
assert.ok(canonical);
assert.equal(articles.filter((article) => article.slug.includes("public-holiday")).length, 1);
assert.ok(!articles.some((article) => article.slug === legacySlug));
assert.equal(canonical.updatedAt, "2026-08-31");
assert.equal(canonical.sections.length, 9);
for (const phrase of ["근무 기반", "부분 공휴일", "RDO", "실제 업무·책임·필요 자격", "Enterprise agreement", "PDF", "돌봄 책임", "대체 근무·시간 조정", "Overtime", "Gross pay", "유급 annual leave·sick leave", "법률 자문", "Payroll에 글로 물어볼 핵심 문장"]) {
  assert.ok(JSON.stringify(canonical).includes(phrase), `merged information missing: ${phrase}`);
}
const questions = canonical.sections.at(-1).paragraphs;
assert.equal(questions.length, 6);
for (let index = 1; index < questions.length; index += 2) assert.match(questions[index], /^\(.+\)$/);

const redirects = await config.redirects();
for (const suffix of ["", "/opengraph-image"]) {
  const redirect = redirects.find((entry) => entry.source === legacyHref + suffix);
  assert.equal(redirect?.destination, canonicalHref + suffix);
  assert.equal(redirect?.permanent, true);
  assert.ok(!redirects.some((entry) => entry.source === redirect.destination), "redirect must not chain or loop");
}
assert.equal(aliases.canonicalArticleHref("/resources/unrelated"), "/resources/unrelated");

const history = load(historySource, { "./articleAliases.mjs": aliases });
const records = [
  { href: legacyHref, title: "이전 제목", completedAt: "2026-08-31T03:00:00Z" },
  { href: canonicalHref, title: canonical.title, completedAt: "2026-08-30T03:00:00Z" },
  { href: "/resources/unrelated", title: "다른 글", completedAt: "2026-08-29T03:00:00Z" },
];
const original = JSON.stringify(records);
storage.set(history.ARTICLE_READ_HISTORY_KEY, original);
const normalized = history.readArticleHistory();
assert.equal(normalized.length, 2, "legacy and canonical completion count once");
assert.equal(normalized[0].href, canonicalHref);
assert.equal(normalized[0].completedAt, records[0].completedAt);
assert.equal(normalized[1].href, records[2].href);
assert.equal(storage.get(history.ARTICLE_READ_HISTORY_KEY), original, "reading must not rewrite stored records");
history.markArticleAsRead({ href: canonicalHref, title: canonical.title });
history.markArticleAsRead({ href: legacyHref, title: "이전 제목" });
assert.equal(writes, 0, "already-completed aliases must not create a new completion");
storage.clear();
history.markArticleAsRead({ href: legacyHref, title: "이전 제목" });
assert.equal(history.readArticleHistory()[0].href, canonicalHref);
assert.equal(writes, 1);
storage.set(history.ARTICLE_READ_HISTORY_KEY, "invalid json");
assert.equal(history.readArticleHistory().length, 0);
storage.set(history.ARTICLE_READ_HISTORY_KEY, JSON.stringify([null, {}, { href: 1 }]));
assert.equal(history.readArticleHistory().length, 0);

for (const path of ["src/app/sitemap.ts", "src/app/feed.xml/route.ts", "src/app/search/page.tsx", "src/app/resources/page.tsx"]) {
  const source = await read(path);
  assert.match(source, /import \{ articles \} from "@\/data\/articles"/);
  assert.ok(!source.includes(legacySlug), `${path} must derive its list from canonical articles`);
}
assert.ok((await read("src/app/resources/[slug]/page.tsx")).includes('path: `/resources/${article.slug}`'));
console.log("PUBLIC_HOLIDAY_CANONICAL=PASS redirects=2 legacy-reading-preserved=true sections=9");
