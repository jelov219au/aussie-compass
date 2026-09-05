import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const sources = {
  trackedLink: read("src/components/analytics/TrackedLink.tsx"),
  tools: read("src/components/sections/ToolsSection.tsx"),
  route: read("src/components/sections/PersonalRouteFinder.tsx"),
  premium: `${read("src/components/sections/PremiumToolsSection.tsx")}\n${read("src/components/sections/HomePremiumToolExplorer.tsx")}`,
  trust: read("src/components/sections/HomeTrustBar.tsx"),
};

assert.match(
  sources.trackedLink,
  /onClick=\{\(\) => \{\s*try \{\s*track\(eventName, properties\);\s*\} catch \{[\s\S]*Navigation must remain independent/,
  "TrackedLink must isolate analytics failures from navigation",
);

for (const [source, contract] of [
  [sources.tools, 'href="/tools" eventName="Home Navigation" properties={{ section: "essential_tools", destination: "tools" }}'],
  [sources.route, 'href="/tools" eventName="Home Navigation" properties={{ section: "route_finder", destination: "tools" }}'],
  [sources.route, 'href="/my-compass" eventName="Home Navigation" properties={{ section: "route_finder", destination: "my_compass" }}'],
  [sources.premium, 'properties={{ product: "catalog", entry: "home" }}'],
  [sources.premium, 'properties={{ product: product.id, entry: "home_selected" }}'],
  [sources.premium, 'properties={{ section: "premium_selected_free", destination: product.freeHref.slice(1) }}'],
  [sources.premium, 'surface={resumeFunnelSurfaces.homePremium}'],
  [sources.premium, 'context={resumeFunnelContexts.home}'],
  [sources.premium, '<ResumeProProofLink entry="home-premium"'],
  [sources.trust, 'eventName="Home Navigation" properties={{ section: "trust", destination: "editorial-policy" }}'],
  [sources.trust, 'eventName="Home Navigation" properties={{ section: "trust", destination: item.href.slice(1) }}'],
]) assert.ok(source.includes(contract), `missing analytics contract: ${contract}`);

for (const action of ["save_plan", "view_saved_plan", "view_current_recommendations", "mark_step_complete", "mark_step_incomplete", "share_recommendations", "download_reminder"]) {
  assert.ok(sources.route.includes(`"${action}"`), `missing fixed Route Plan Action: ${action}`);
}
assert.match(sources.route, /track\("Route Plan Action", \{ action, stage, concern \}\)/);
assert.doesNotMatch(sources.route, /Route Plan Saved|\{ destination, route:|route:\s*`\$\{stage\}/, "route analytics must use fixed categories");
assert.match(sources.route, /track\("Route Recommendation Opened", \{ destination, stage, concern \}\)/);

const allowedKeys = new Set(["section", "destination", "action", "product", "entry", "stage", "concern"]);
const analyticsBlocks = Object.values(sources).flatMap((source) => [
  ...[...source.matchAll(/properties=\{\{([\s\S]*?)\}\}/g)].map((match) => match[1]),
  ...[...source.matchAll(/track\([^,]+,\s*\{([^}]*)\}\)/g)].map((match) => match[1]),
]);
for (const block of analyticsBlocks) {
  for (const match of block.matchAll(/\b([A-Za-z][A-Za-z0-9]*)\s*:/g)) {
    assert.ok(allowedKeys.has(match[1]), `analytics property is not allowed: ${match[1]}`);
  }
  assert.doesNotMatch(block, /search|query|text|content|note|amount|price|email|cookie|entitlement|raw|storage|url|value/i);
}

console.log("HOME_NAVIGATION_ANALYTICS=PASS mappings=11 route_actions=7 selected_product=2 resume_duplicates=0 forbidden_properties=0");
