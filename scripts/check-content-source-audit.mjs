import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkSourceLink, collectSources, inspectSource, publicUrl } from "./audit-content-source-links.mjs";

for (const value of ['file:///private', 'javascript:alert(1)', 'http://localhost/a', 'http://127.0.0.1/', 'https://[::1]/', 'https://user:secret@example.com/', 'https://service.local/']) assert.equal(publicUrl(value), null);
assert.equal(publicUrl('https://example.gov.au/page#section'), 'https://example.gov.au/page');
const parsed = inspectSource('import { Picker } from "@/components/tools/Picker";\n// https://ignored.example.com\nconst href = "https://agency.gov.au/guide#step"; const dynamic = `https://maps.example.com/${query}`;', 'fixture.tsx');
assert.equal(parsed.links.length, 1);
assert.equal(parsed.links[0].line, 3);
assert.equal(parsed.dynamicUrls, 1);
assert.equal(parsed.imports[0], '@/components/tools/Picker');

const html = (title, status = 200) => new Response(`<html><title>${title}</title><body>Guide</body></html>`, { status, headers: { 'content-type': 'text/html' } });
assert.equal((await checkSourceLink('https://agency.gov.au/guide', async () => html('Official guide'))).status, 'reachable');
assert.equal((await checkSourceLink('https://agency.gov.au/guide', async () => html('Page not found', 404))).status, 'http-error');
assert.equal((await checkSourceLink('https://agency.gov.au/guide', async () => html('Access denied', 403))).status, 'restricted');
assert.equal((await checkSourceLink('https://agency.gov.au/guide', async () => html('Just a moment...'))).status, 'review-page');
const redirected = await checkSourceLink('https://agency.gov.au/old', async (url, options) => {
  assert.equal(options.redirect, 'manual');
  assert.equal(options.headers.Authorization, undefined);
  assert.equal(options.headers.Cookie, undefined);
  return url.endsWith('/old') ? new Response(null, { status: 301, headers: { location: '/new' } }) : html('New guide');
});
assert.equal(redirected.status, 'redirected');
assert.equal(redirected.finalUrl, 'https://agency.gov.au/new');
assert.equal(redirected.redirects.length, 1);
assert.equal((await checkSourceLink('https://agency.gov.au/loop', async () => new Response(null, { status: 302, headers: { location: '/loop' } }))).status, 'redirect-loop');
assert.equal((await checkSourceLink('https://agency.gov.au/old', async () => new Response(null, { status: 301, headers: { location: 'http://127.0.0.1/' } }))).status, 'unsafe-url');
assert.equal((await checkSourceLink('https://agency.gov.au/guide', async () => { throw new TypeError('network unavailable'); })).status, 'network-error');
const inventory = await collectSources();
assert.ok(inventory.links.length >= 300, 'audit must cover the full declared content scope');
assert.equal(new Set(inventory.links.map((entry) => entry.url)).size, inventory.links.length);
assert.ok(inventory.files.includes('src/components/tools/VehicleInspectionProviderPicker.tsx'));
assert.ok(inventory.files.includes('src/components/tools/WorkersCompJurisdictionPicker.tsx'));
assert.ok(!inventory.files.some((filename) => /commerce|\/api\/|\.env|payments/i.test(filename)), 'audit must not traverse payment/env implementation');
const repairs = JSON.parse(await readFile(new URL('../docs/audits/content-source-repairs-2026-08-31.json', import.meta.url), 'utf8'));
for (const repair of repairs) {
  assert.ok(!inventory.links.some(({ url }) => url === repair.old), `stale source must not return: ${repair.old}`);
  assert.ok(inventory.links.some(({ url, references }) => url === repair.url && references.some(({ file }) => file === repair.file)), `replacement must remain connected: ${repair.url}`);
}
console.log(`CONTENT_SOURCE_AUDIT=PASS files=${inventory.files.length} unique-urls=${inventory.links.length} fixtures=10 no-network=true`);
