import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// Execute the actual source without a build/server. Next's server-only marker is
// stubbed only in this server-side harness; production boundary checks need Next.
function load(path, dependencies = {}) {
  const compiled = ts.transpileModule(read(path), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX,
  } }).outputText;
  const compiledModule = { exports: {} };
  runInNewContext(compiled, { module: compiledModule, exports: compiledModule.exports, require: (name) => {
    if (name === "server-only") return {};
    if (name in dependencies) return dependencies[name];
    if (name === "react" || name === "react/jsx-runtime") return require(name);
    assert.fail(`Unexpected runtime import: ${name}`);
  } });
  return compiledModule.exports;
}

const registry = load("src/data/videos.ts");
const player = load("src/components/media/YouTubePlayer.tsx");
const { RelatedVideos } = load("src/components/media/RelatedVideos.tsx", {
  "@/data/videos": registry, "./YouTubePlayer": player,
});
const article = { kind: "article", slug: "used-car-ppsr-purchase-day-checklist", slot: "after-summary" };
const buying = { kind: "page", path: "/used-car-comparison", slot: "buying-order" };
const insurance = { ...buying, slot: "after-comparison" };
const select = registry.getPublicVideosForPlacement;
const card = (context) => renderToStaticMarkup(React.createElement(RelatedVideos, {
  context, heading: "관련 영상", id: "test-video",
}));

assert.equal(select(article).map((v) => v.id).join(","), "1y7CM94zoUk");
assert.equal(select(buying).map((v) => v.id).join(","), "1y7CM94zoUk");
assert.equal(select(insurance)[0].id, "Hjcn45t0wZo");
assert.equal(select({ ...insurance, path: "/pay-calculator" }).length, 0);
assert.equal(select({ ...article, slug: "used-car-inspection-report-next-steps" }).length, 0);
assert.equal(select({ ...article, slug: `${article.slug}-other` }).length, 0);

const seed = registry.videos[1];
for (const status of ["draft", "scheduled", "private", "unavailable"]) {
  assert.equal(select(insurance, [{ ...seed, status, scheduledFor: "2000-01-01T00:00:00Z" }]).length, 0, status);
}
for (const id of ["", "short", "Hjcn45t0wZo/attack", "<script>123", "Hjcn45t0wZö"]) {
  assert.equal(select(insurance, [{ ...seed, id }]).length, 0, `Invalid id: ${id}`);
}
const make = (id, order) => ({ ...seed, id, placements: [{ ...insurance, order }] });
assert.equal(select(insurance, [make("BBBBBBBBBBB", 2), make("AAAAAAAAAAA", 1), make("AAAAAAAAAAA", 3)]).map((v) => v.id).join(","), "AAAAAAAAAAA,BBBBBBBBBBB");
assert.equal(select(insurance, [make("BBBBBBBBBBB", 1), make("AAAAAAAAAAA", 1)]).map((v) => v.id).join(","), "AAAAAAAAAAA,BBBBBBBBBBB");
assert.equal(Object.keys(select(insurance)[0]).sort().join(","), "description,id,title");

const markup = card(insurance);
for (const context of [article, buying]) {
  const ppsrMarkup = card(context);
  assert(ppsrMarkup.includes("watch?v=1y7CM94zoUk"));
  assert(!ppsrMarkup.includes("Hjcn45t0wZo"));
  assert(!/<(?:iframe|script|img|link)\b/.test(ppsrMarkup));
  assert(!ppsrMarkup.includes("scheduledFor") && !ppsrMarkup.includes("verifiedAt"));
}
assert.equal(card({ ...insurance, path: "/" }), "");
assert(markup.includes("https://www.youtube.com/watch?v=Hjcn45t0wZo"));
assert(markup.includes(registry.videoChannel.href));
assert(markup.includes("noopener noreferrer"));
assert(markup.includes("<noscript>"));
assert(!/<(?:iframe|script|img|link)\b/.test(markup), "No initial player, image, script or preconnect");
assert(!markup.includes("1y7CM94zoUk"));
assert(!markup.includes(registry.videos[0].title));
assert(!markup.includes("scheduledFor") && !markup.includes("verifiedAt"));

// Public->private hides the entire card, including its outbound links.
seed.status = "private";
assert.equal(card(insurance), "");
seed.status = "public";
const ppsr = registry.videos[0];
for (const status of ["draft", "scheduled", "private", "unavailable"]) {
  ppsr.status = status;
  for (const context of [article, buying]) {
    assert.equal(select(context).length, 0, status);
    assert.equal(card(context), "", `${status} hides PPSR title, ID and links`);
  }
}
ppsr.status = "public";
assert(card(article).includes("watch?v=1y7CM94zoUk"));
assert(card(buying).includes("watch?v=1y7CM94zoUk"));
assert(!card(insurance).includes("1y7CM94zoUk"));

// Exercise the click transition using hooks, without claiming browser playback.
let requested = false;
let pendingEffect;
const frame = { current: null };
const focusCalls = [];
const hooks = {
  useState: () => [requested, (value) => { requested = value; }],
  useRef: () => frame,
  useId: () => "test-notice",
  useEffect: (effect) => { pendingEffect = effect; },
};
const interactive = load("src/components/media/YouTubePlayer.tsx", { react: hooks });
function nodes(tree) {
  const found = [];
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) return node.forEach(visit);
    found.push(node);
    visit(node.props?.children);
  }
  visit(tree);
  return found;
}
const render = () => nodes(interactive.YouTubePlayer({ videoId: seed.id, title: seed.title }));
const initial = render();
assert.equal(initial.filter((node) => node.type === "iframe").length, 0);
initial.find((node) => node.type === "button").props.onClick();
const active = render();
const iframe = active.find((node) => node.type === "iframe");
assert.equal(active.filter((node) => node.type === "iframe").length, 1);
assert.equal(active.filter((node) => node.type === "button").length, 0);
const embed = new URL(iframe.props.src);
assert.equal(embed.origin, "https://www.youtube-nocookie.com");
assert.equal(embed.pathname, `/embed/${seed.id}`);
assert.equal(embed.searchParams.get("autoplay"), "0");
assert.equal(embed.searchParams.get("playsinline"), "1");
assert.equal(iframe.props.referrerPolicy, "strict-origin-when-cross-origin");
assert.equal(iframe.props.allowFullScreen, true);
assert(iframe.props.title.includes(seed.title));
frame.current = { focus: (options) => focusCalls.push(options) };
pendingEffect();
assert.equal(focusCalls[0].preventScroll, true);
for (const tree of [initial, active]) {
  const box = tree.find((node) => node.props?.style?.aspectRatio);
  assert.equal(box.props.style.aspectRatio, "16 / 9");
  assert.equal(box.props.style.minHeight, 200);
}

// Only React is reachable from the sole client entry; registry and selector stay
// on the server. This is a source-graph guard, not a production bundle audit.
const clientSource = read("src/components/media/YouTubePlayer.tsx");
const clientAst = ts.createSourceFile("YouTubePlayer.tsx", clientSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
for (const statement of clientAst.statements) {
  if (ts.isImportDeclaration(statement)) assert.equal(statement.moduleSpecifier.text, "react");
}
for (const path of ["src/data/videos.ts", "src/components/media/RelatedVideos.tsx"]) {
  assert(read(path).startsWith('import "server-only";'));
}
const config = read("next.config.ts");
assert(config.includes('"frame-src \'self\' https://www.youtube-nocookie.com"'));
assert(config.includes('"connect-src \'self\'"'));
assert(config.includes('"frame-ancestors \'none\'"'));

const page = read("src/app/used-car-comparison/page.tsx");
assert(page.indexOf('slot: "buying-order"') > page.indexOf("공식 PPSR Car Check"));
assert(page.indexOf('slot: "buying-order"') < page.indexOf('aria-labelledby="inspection-choice-heading"'));
assert(page.indexOf('slot: "after-comparison"') > page.indexOf("<VehicleComparison />"));
assert(page.indexOf('slot: "after-comparison"') < page.indexOf(">중요 안내<"));
const articlePage = read("src/app/resources/[slug]/page.tsx");
assert(articlePage.indexOf('slot: "after-summary"') > articlePage.indexOf("article.quickSummary.map"));
assert(articlePage.indexOf('slot: "after-summary"') < articlePage.indexOf("<ArticleReadingNav"));

console.log("PASS: related video visibility, exact placement, private-data projection/SSR, click transition, iframe contract, server boundary and page integration.");
console.log("Not covered: Next build/RSC payload, CSS layout, network requests, real playback/captions or installed PWA.");
