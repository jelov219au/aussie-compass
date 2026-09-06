import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../" + path, import.meta.url), "utf8").replaceAll("\r\n", "\n");
const component = read("src/components/sections/HomeSocialChannels.tsx");
const home = read("src/app/page.tsx");

const instagram = "https://www.instagram.com/hojucompass/";
const youtube = "https://www.youtube.com/channel/UChn-PJcHHVz2XPVhHUkbFkQ";
for (const href of [instagram, youtube]) {
  assert.equal(component.split(href).length - 1, 1, "official URL must occur exactly once");
}
for (const copy of [
  "Hoju Compass 소식 이어보기",
  "핵심 내용을 카드로 빠르게 확인하세요.",
  "실제 상황을 따라 확인 순서와 판단 기준을 살펴보세요.",
  "공식 채널 열기 (새 창)",
]) assert.ok(component.includes(copy), "missing social copy: " + copy);

assert.equal(component.split('target="_blank"').length - 1, 1, "mapped links share one target declaration");
assert.equal(component.split('rel="noopener noreferrer"').length - 1, 1, "mapped links share one safe rel declaration");
assert.match(component, /sm:grid-cols-2/);
assert.match(component, /min-h-11/);
assert.doesNotMatch(component, /["']use client["']/);
assert.doesNotMatch(component, /TrackedLink|<iframe|<script|pixel|followers|게시물\s*\d/i);
assert.equal(component.split("<a\n").length - 1, 1, "one mapped external anchor template");

const articles = home.indexOf("<ArticlesSection");
const social = home.indexOf("<HomeSocialChannels");
const trust = home.indexOf("<HomeTrustBar");
assert.ok(articles >= 0 && social > articles && trust > social, "home order must be Articles → Social → Trust");
assert.equal(home.split("<HomeSocialChannels").length - 1, 1);
assert.match(home, /import \{ HomeSocialChannels \} from "@\/components\/sections\/HomeSocialChannels";/);

console.log(JSON.stringify({
  status: "PASS",
  links: 2,
  order: "ArticlesSection>HomeSocialChannels>HomeTrustBar",
  clientBoundary: false,
  externalEmbeds: 0,
}));
