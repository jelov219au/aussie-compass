import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isIP } from "node:net";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
export const guideRoutes = [
  "minimum-wage-guide", "award-guide", "casual-loading-guide", "payslip-guide", "underpayment-guide", "leave-guide", "super-guide",
  "tax-return-guide", "arrival-checklist", "moving-checklist", "visa-preparation-guide", "leaving-australia-guide", "help-directory",
  "property-inspection-checklist", "public-transport-guide", "overseas-driver-licence-guide", "used-car-comparison",
];

export function publicUrl(value) {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    if (!url.hostname.includes('.') || url.hostname.endsWith('.local') || isIP(url.hostname.replace(/^\[|\]$/g, ''))) return null;
    if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost')) return null;
    url.hash = "";
    return url.href;
  } catch { return null; }
}

export function inspectSource(source, filename) {
  const ast = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, filename.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const links = [];
  const imports = [];
  let dynamicUrls = 0;
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) imports.push(node.moduleSpecifier.text);
    if (ts.isTemplateExpression(node) && /^https?:\/\//.test(node.head.text)) dynamicUrls++;
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (/^https?:\/\//.test(node.text)) {
        const url = publicUrl(node.text);
        if (url) links.push({ url, file: filename, line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1 });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(ast);
  return { links, imports, dynamicUrls };
}

export async function collectSources() {
  const pending = ["src/data/articles.ts", "src/app/resources/[slug]/page.tsx", ...guideRoutes.map((route) => `src/app/${route}/page.tsx`)];
  const files = new Set();
  const links = new Map();
  let dynamicUrls = 0;
  while (pending.length) {
    const filename = pending.shift();
    if (files.has(filename)) continue;
    files.add(filename);
    const source = await readFile(path.join(root, filename), "utf8");
    const found = inspectSource(source, filename);
    dynamicUrls += found.dynamicUrls;
    for (const link of found.links) {
      if (!links.has(link.url)) links.set(link.url, []);
      links.get(link.url).push({ file: link.file, line: link.line });
    }
    // Follow content/tools only, never import or execute runtime, payment or env code.
    for (const imported of found.imports.filter((name) => /^@\/(components\/tools|data)\//.test(name))) {
      const base = imported.replace('@/', 'src/');
      for (const extension of ['.tsx', '.ts']) {
        try { await readFile(path.join(root, base + extension)); pending.push(base + extension); break; }
        catch (error) { if (error.code !== 'ENOENT') throw error; }
      }
    }
  }
  return { files: [...files].sort(), dynamicUrls, links: [...links].map(([url, references]) => ({ url, references })) };
}

export async function checkSourceLink(url, fetcher = fetch, timeoutMs = 12000) {
  const visited = new Set();
  let current = publicUrl(url);
  const redirects = [];
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    for (let step = 0; step <= 5; step++) {
      if (!current) return { status: 'unsafe-url', finalUrl: current, redirects };
      if (visited.has(current)) return { status: 'redirect-loop', finalUrl: current, redirects };
      visited.add(current);
      const response = await fetcher(current, { redirect: 'manual', signal, headers: { 'User-Agent': 'HojuCompass-SourceAudit/1.0 (+https://hojucompass.com/editorial-policy)', Accept: 'text/html,application/pdf;q=0.9,*/*;q=0.5' } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) return { status: 'invalid-redirect', httpStatus: response.status, finalUrl: current, redirects };
        redirects.push({ from: current, status: response.status, to: new URL(location, current).href });
        current = publicUrl(new URL(location, current).href);
        continue;
      }
      const contentType = response.headers.get('content-type') ?? '';
      let text = '';
      if (/text\/html/i.test(contentType) && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let bytes = 0;
        try {
          while (bytes < 65536) {
            const next = await reader.read();
            if (next.done) break;
            bytes += next.value.byteLength;
            text += decoder.decode(next.value, { stream: true });
          }
        } finally { await reader.cancel(); }
      } else { await response.body?.cancel(); }
      const title = (text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
      const softFailure = /^(?:page not found|404|access denied|just a moment|request rejected|pardon our interruption)/i.test(title);
      const status = [401, 403, 429].includes(response.status) ? 'restricted'
        : response.status >= 400 ? 'http-error'
        : softFailure ? 'review-page'
        : redirects.length ? 'redirected' : 'reachable';
      return { status, httpStatus: response.status, finalUrl: current, title, contentType, redirects };
    }
    return { status: 'redirect-limit', finalUrl: current, redirects };
  } catch (error) {
    return { status: 'network-error', finalUrl: current, redirects, error: error.cause?.code ?? error.name };
  }
}

async function main() {
  const inventory = await collectSources();
  if (!process.argv.includes('--check')) {
    console.log(JSON.stringify({ mode: 'inventory-only', ...inventory }, null, 2));
    return;
  }
  const results = [];
  // One sequential worker per source host, at most four hosts at once.
  const grouped = Map.groupBy(inventory.links, (entry) => new URL(entry.url).hostname);
  const groups = [...grouped.values()];
  await Promise.all(Array.from({ length: Math.min(4, groups.length) }, async () => {
    while (groups.length) {
      for (const entry of groups.shift()) {
        const result = await checkSourceLink(entry.url);
        results.push({ ...entry, ...result });
        if (results.length % 25 === 0) console.error(`Checked ${results.length}/${inventory.links.length}`);
      }
    }
  }));
  results.sort((a, b) => a.url.localeCompare(b.url));
  const counts = {};
  for (const result of results) counts[result.status] = (counts[result.status] ?? 0) + 1;
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), files: inventory.files, dynamicUrls: inventory.dynamicUrls, total: results.length, counts, results }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
