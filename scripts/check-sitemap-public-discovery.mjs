import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
import { loadArticleCatalog } from "./lib/load-article-catalog.mjs";

const projectFile = (path) => new URL(`../${path}`, import.meta.url);
const read = (path) => readFile(projectFile(path), "utf8");
const [sitemapSource, carPage, workspacePage, restorePage, successPage, searchPage, robotsSource] = await Promise.all([
  read("src/app/sitemap.ts"),
  read("src/app/car-purchase-pro/page.tsx"),
  read("src/app/car-purchase-pro/workspace/page.tsx"),
  read("src/app/car-purchase-pro/restore/page.tsx"),
  read("src/app/car-purchase-pro/success/page.tsx"),
  read("src/app/search/page.tsx"),
  read("src/app/robots.ts"),
]);

const sourceFile = ts.createSourceFile("sitemap.ts", sitemapSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const initializerFor = (name) => {
  let initializer;
  const visit = (node) => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === name) initializer = node.initializer;
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  assert.ok(initializer, `missing ${name} declaration`);
  return initializer;
};

const routesInitializer = initializerFor("routes");
assert.ok(ts.isArrayLiteralExpression(routesInitializer), "routes must remain a literal array that can be audited");
const routes = routesInitializer.elements.map((element) => {
  assert.ok(ts.isStringLiteral(element), "every public sitemap route must be a string literal");
  return element.text;
});

const updatesInitializer = initializerFor("acquisitionRouteUpdates");
assert.ok(ts.isObjectLiteralExpression(updatesInitializer), "manual lastmod records must remain a literal object that can be audited");
const manualUpdates = Object.fromEntries(updatesInitializer.properties.map((property) => {
  assert.ok(ts.isPropertyAssignment(property), "manual lastmod entries must remain direct property assignments");
  assert.ok(ts.isStringLiteral(property.name) && ts.isStringLiteral(property.initializer), "manual lastmod keys and values must be string literals");
  return [property.name.text, property.initializer.text];
}));

assert.equal(routes.length, 52, "the public static inventory includes the new play page");
assert.equal(routes.filter((route) => route === "/play").length, 1, "the play page must occur exactly once");
assert.equal(new Set(routes).size, routes.length, "static sitemap routes must be unique");
assert.equal(routes.filter((route) => route === "/car-purchase-pro").length, 1, "Car Pro must occur exactly once");

const excludedRoutes = [
  "/search",
  "/my-compass",
  "/car-purchase-pro/workspace",
  "/car-purchase-pro/restore",
  "/car-purchase-pro/success",
  "/checkout/car-purchase-pro",
  "/api/checkout/car-purchase-pro",
  "/api/car-purchase-pro",
  "/car-purchase-pro/report",
];
for (const route of excludedRoutes) assert.ok(!routes.includes(route), `${route} must stay outside the public sitemap`);
assert.ok(routes.every((route) => !route.startsWith("/api/")), "API routes must stay outside the public sitemap");

const expectedSeptemberUpdates = {
  "": "2026-09-11",
  "/play": "2026-09-11",
  "/tools": "2026-09-05",
  "/pro": "2026-09-07",
  "/privacy": "2026-09-05",
  "/terms": "2026-09-05",
  "/disclaimer": "2026-09-05",
  "/resources": "2026-09-07",
  "/car-purchase-pro": "2026-09-05",
};
for (const [route, date] of Object.entries(expectedSeptemberUpdates)) assert.equal(manualUpdates[route], date, `${route || "/"} needs its verified ${date} lastmod`);
assert.equal(manualUpdates["/used-car-comparison"], "2026-09-08", "the used-car page must carry its verified visitor-flow update date");
assert.equal(manualUpdates["/tax-return-guide"], "2026-09-07", "the tax-return guide must carry its verified due-date and TPB guidance update date");
for (const route of Object.keys(manualUpdates)) assert.ok(routes.includes(route), `manual lastmod key must name a public route: ${route || "/"}`);
for (const lastModified of Object.values(manualUpdates)) assert.match(lastModified, /^\d{4}-\d{2}-\d{2}$/, "manual lastmod values must be ISO dates");

const articles = loadArticleCatalog();
assert.equal(articles.length, 41, "the current article inventory must contain 41 entries");
const articleUrls = articles.map(({ slug }) => `https://hojucompass.com/resources/${slug}`);
assert.equal(new Set(articleUrls).size, articleUrls.length, "article sitemap URLs must be unique");
for (const article of articles) {
  const effectiveDate = article.updatedAt ?? article.publishedAt;
  assert.match(effectiveDate, /^\d{4}-\d{2}-\d{2}$/, `article date must remain an ISO date: ${article.slug}`);
  assert.ok(Number.isFinite(new Date(effectiveDate).valueOf()), `article date must remain valid: ${article.slug}`);
}
const allUrls = routes.map((route) => `https://hojucompass.com${route}`).concat(articleUrls);
assert.equal(allUrls.length, 93, "the generated sitemap inventory must contain the actual 93 URLs");
assert.equal(new Set(allUrls).size, 93, "all generated sitemap URLs must be unique");

assert.match(sitemapSource, /articles\.map\(\(article\) => \(\{[\s\S]*lastModified: new Date\(article\.updatedAt \?\? article\.publishedAt\)/, "article lastmod must keep using updatedAt with publishedAt fallback in catalog order");
assert.match(carPage, /createPageMetadata\(\{[\s\S]*path: "\/car-purchase-pro"/, "Car Pro must expose canonical page metadata for its public URL");
for (const [name, source] of [["workspace", workspacePage], ["restore", restorePage], ["success", successPage]]) {
  assert.match(source, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/, `Car ${name} must remain noindex, nofollow`);
}
assert.match(searchPage, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/, "site search must remain noindex");
assert.match(robotsSource, /disallow:\s*\[[\s\S]*"\/api\/"[\s\S]*"\/search"/, "robots.txt must continue excluding APIs and site search");

console.log(`SITEMAP_PUBLIC_DISCOVERY=PASS static=${routes.length} articles=${articles.length} total=${allUrls.length} unique=${new Set(allUrls).size} car=1 excluded=${excludedRoutes.length} september_lastmod=${Object.keys(expectedSeptemberUpdates).length}`);
