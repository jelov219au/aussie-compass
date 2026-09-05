import assert from "node:assert/strict";
import fs from "node:fs";

const header = fs.readFileSync("src/components/layout/Header.tsx", "utf8");
assert.equal((header.match(/href="\/search"/g) ?? []).length, 2, "Header must have one desktop and one direct mobile search link");
assert.equal((header.match(/aria-label="통합 검색"/g) ?? []).length, 2, "each rendered breakpoint must expose the same search name");
assert.ok(header.includes('className="hidden items-center gap-7 md:flex"'), "desktop navigation must remain present");
const mobileStart = header.indexOf('<div className="flex shrink-0 items-center gap-2 md:hidden">');
const mobileSearch = header.slice(mobileStart, header.indexOf("<button", mobileStart));
assert.ok(mobileSearch.includes("min-w-11"), "mobile search must always have a 44px minimum width");
assert.ok(mobileSearch.includes("min-h-11"));
assert.ok(mobileSearch.includes("min-[420px]:hidden"), "the icon must give way to text at 420px");
assert.ok(mobileSearch.includes("min-[420px]:inline"), "the text label must appear at 420px");
assert.ok(!mobileSearch.includes('className="hidden min-h-11'), "mobile search must not disappear below 420px");

const mobileMenu = header.slice(header.indexOf('id="mobile-menu"'));
assert.ok(!mobileMenu.includes('href="/search"'), "the open mobile menu must not add a duplicate search tab stop");
for (const marker of [
  'aria-expanded={menuOpen}',
  'aria-controls="mobile-menu"',
  'event.key === "Escape"',
  'menuButtonRef.current?.focus()',
  'max-h-[calc(100dvh-4.5rem)]',
  'overflow-y-auto',
  'onClick={() => setMenuOpen(false)}',
]) assert.ok(header.includes(marker), `mobile menu behavior marker missing: ${marker}`);

const navLabels = ["/tools", "/resources", "/my-compass", "/pro"];
for (const href of navLabels) assert.ok(header.includes(`href: "${href}"`), `desktop/mobile nav destination missing: ${href}`);

const homeSearch = fs.readFileSync("src/components/sections/HomeSearch.tsx", "utf8");
assert.ok(homeSearch.includes("/search"));
assert.ok(homeSearch.includes("sessionStorage"));
assert.ok(!header.includes("URLSearchParams"), "header search must not put query data in the URL");

console.log("WEB53 direct mobile header search contract passed");
