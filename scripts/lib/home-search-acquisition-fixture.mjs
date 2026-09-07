import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Execute existing React handlers, query transfer, live index and result rendering.
// This isolated contract is not a browser/accessibility acceptance test.
export function verifyHomeSearchAcquisition(queries, articlePath) {
  const root = fileURLToPath(new URL("../../", import.meta.url));
  const cache = new Map(), navigation = [], events = [];
  let hooks;
  const browser = { location: { href: "https://hojucompass.com/search", origin: "https://hojucompass.com" }, history: { state: null, replaceState(_state, _title, path) { assert.equal(path, "/search"); } } };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const mocks = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "fragment" },
    react: {
      useState(initial) {
        const owner = hooks, index = owner.cursor++;
        if (!(index in owner.values)) owner.values[index] = typeof initial === "function" ? initial() : initial;
        return [owner.values[index], (next) => { owner.values[index] = typeof next === "function" ? next(owner.values[index]) : next; }];
      },
      useRef(initial) {
        const owner = hooks, index = owner.cursor++;
        if (!(index in owner.values)) owner.values[index] = { current: initial };
        return owner.values[index];
      },
      useEffect(effect) { if (hooks.first) hooks.effects.push(effect); },
      useMemo: (factory) => factory(),
    },
    "next/link": { default: "a" },
    "next/navigation": { useRouter: () => ({ push: (path) => navigation.push(path) }) },
    "@vercel/analytics": { track: (name, data) => events.push({ name, data }) },
    "@/components/layout/Header": { Header: "header-fixture" },
    "@/components/layout/Footer": { Footer: "footer-fixture" },
    "@/components/ui/Container": { Container: "container-fixture" },
    "@/components/seo/JsonLd": { BreadcrumbJsonLd: "jsonld-fixture" },
    "@/components/search/SiteSearch": { SiteSearch: "search-fixture" },
    "@/components/analytics/TrackedLink": { TrackedLink: "a" },
    "@/components/analytics/ResumeFunnelAnalytics": { ResumeProCtaLink: "a" },
    "@/lib/site": { createPageMetadata: () => ({}) },
  };
  function load(name, parent = resolve(root, "entry.ts")) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    let file = name.startsWith("@/") ? resolve(root, "src", name.slice(2)) : resolve(dirname(parent), name);
    if (!extname(file)) file += existsSync(`${file}.ts`) ? ".ts" : ".tsx";
    if (cache.has(file)) return cache.get(file);
    const exports = {}; cache.set(file, exports);
    const compiled = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    new Function("exports", "require", "window", compiled)(exports, dependency => load(dependency, file), browser);
    return exports;
  }
  function nodes(tree, expand = false) {
    if (Array.isArray(tree)) return tree.flatMap(child => nodes(child, expand));
    if (!tree || typeof tree !== "object") return [];
    if (expand && typeof tree.type === "function") return nodes(tree.type(tree.props), true);
    return [tree, ...nodes(tree.props.children, expand)];
  }
  const text = tree => Array.isArray(tree) ? tree.map(text).join("") : tree && typeof tree === "object" ? text(tree.props.children) : String(tree ?? "");
  function mount(component, props) {
    const state = { values: [], cursor: 0, effects: [], first: true };
    const render = () => { hooks = state; state.cursor = 0; return component(props); };
    render(); state.first = false;
    // Replay mount effects as Strict Mode does; consuming a private hand-off twice
    // must not replace the destination query with the now-empty memory slot.
    for (let replay = 0; replay < 2; replay++) for (const effect of state.effects) effect();
    return { render };
  }
  const HomeSearch = load("./src/components/sections/HomeSearch.tsx").HomeSearch;
  const SearchPage = load("./src/app/search/page.tsx").default;
  const SiteSearch = load("./src/components/search/SiteSearch.tsx").SiteSearch;
  const transfer = load("@/lib/searchTransfer");
  const liveItems = nodes(SearchPage()).find(node => node.type === "search-fixture")?.props.items;
  assert.ok(liveItems?.some(item => item.href === articlePath), "the actual search page must include the requested article");
  const discoveredArticles = new Map();
  for (const queryCase of queries) {
    const query = typeof queryCase === "string" ? queryCase : queryCase.query;
    const expectedArticle = typeof queryCase === "string" ? articlePath : queryCase.articlePath;
    transfer.takePendingSearch(); navigation.length = 0; events.length = 0;
    const home = mount(HomeSearch);
    let tree = home.render();
    assert.equal(nodes(tree).filter(node => node.type === "a").length, 6, "preserve the approved six home situations");
    nodes(tree).find(node => node.type === "input" && node.props.type === "search").props.onChange({ target: { value: query } });
    tree = home.render();
    let prevented = false;
    nodes(tree).find(node => node.type === "form").props.onSubmit({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.deepEqual(navigation, ["/search"], "the home must navigate without a query in the URL");
    assert.deepEqual(events, [{ name: "Home Search", data: { topic: "jobs", entry: "free_text" } }], query);
    const search = mount(SiteSearch, { items: liveItems });
    const results = nodes(search.render(), true);
    assert.ok(results.some(node => node.type === "input" && node.props.value === query), "the destination must consume the real transferred query");
    assert.equal(transfer.takePendingSearch(), "", "the query transfer must be consumed once");
    const links = results.filter(node => node.type === "a").map(node => node.props.href);
    assert.ok(links.includes(expectedArticle), `${query}: the matching article must be discoverable`);
    discoveredArticles.set(expectedArticle, typeof queryCase === "string" ? "/resume-job-ad-checker" : queryCase.freeHref ?? "/resume-job-ad-checker");
    // The article's actual free-comparison link is checked below; it need not be
    // a direct result for every query that discovers that article.
    const field = name => {
      const row = results.find(node => node.type === "div" && Array.isArray(node.props.children) && node.props.children.some(child => child?.type === "dt" && text(child) === name));
      return text(row?.props.children.find(child => child?.type === "dd"));
    };
    assert.equal(field("boundary"), "free_first");
    assert.equal(field("next_action"), "open_free_route");
    assert.ok(links.includes(field("primary_route")) && !field("primary_route").includes("-pro"));
  }
  const articles = load("@/data/articles").articles;
  const { ArticleNextStep } = load("./src/components/resources/ArticleNextStep.tsx");
  for (const [path, freeHref] of discoveredArticles) {
    const article = articles.find(item => `/resources/${item.slug}` === path);
    const nextLinks = nodes(ArticleNextStep({ slug: article.slug, toolHref: article.toolHref, toolLabel: article.toolLabel }), true);
    assert.ok(nextLinks.some(node => node.type === "a" && node.props.href === freeHref), `${path}: the discovered article must retain its intended free next step`);
  }
  console.log(`PASS: ${queries.length} actual home submissions → live search index → article/free next step, six situations preserved`);
}
