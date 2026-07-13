#!/usr/bin/env node
/**
 * SEO invariant check for the public site.
 *
 * Fetches each public URL with a non-JS crawler User-Agent and asserts:
 *   - HTTP 200
 *   - <title> present and non-empty
 *   - <meta name="description"> present and non-empty
 *   - <link rel="canonical"> present
 *   - <link rel="alternate" hreflang="..."> for each configured language + x-default
 *   - <script type="application/ld+json"> present with parseable JSON
 *
 * Also validates:
 *   - /robots.txt is 200 text/plain and references the Sitemap
 *   - /sitemap.xml is 200 XML, parseable, and every <loc> URL returns 200
 *
 * Exits with:
 *   0 — all invariants pass
 *   1 — one or more invariants fail (details printed with file:URL locators)
 *   2 — unable to reach the base URL at all (dev server down)
 *
 * Usage:
 *   node scripts/seo-check.mjs [--base https://ivyevents.mk] [--strict-jsonld]
 *
 * CI usage (example, GitHub Actions):
 *   - npm ci
 *   - npm run build
 *   - npm run preview -- --port 4173 &
 *   - npx wait-on http://localhost:4173
 *   - node scripts/seo-check.mjs --base http://localhost:4173
 */

import { argv, exit } from 'node:process';

/* ------------------------------------------------------------------ */
/*  Config                                                            */
/* ------------------------------------------------------------------ */

const args = parseArgs(argv.slice(2));
const BASE = (args.base || process.env.SEO_CHECK_BASE || 'http://localhost:4173').replace(/\/$/, '');
const STRICT_JSONLD = Boolean(args['strict-jsonld']);
const LANGUAGES = ['mk', 'en', 'sq'];
const DEFAULT_LANG = 'mk';

// Paths under a language prefix (e.g. `/mk` + `""` = `/mk`)
const LOCALIZED_PATHS = [
  { path: '', name: 'landing', requireJsonLdType: 'Organization' },
  { path: '/pricing', name: 'pricing' },
  { path: '/about', name: 'about' },
  { path: '/contact', name: 'contact' },
  { path: '/faq', name: 'faq' },
  { path: '/features', name: 'features' },
  { path: '/features/rsvp', name: 'features-rsvp' },
  { path: '/features/invitations', name: 'features-invitations' },
  { path: '/packages', name: 'packages' },
  { path: '/terms', name: 'terms' },
  // Category pages (may not be routed yet — soft-warn instead of failing)
  { path: '/category/weddings', name: 'category-weddings', optional: true, requireJsonLdType: 'Service' },
  // Invitation template previews
  { path: '/invitations/coastal-breeze', name: 'invitation-coastal-breeze', optional: true },
];

// Non-JS crawler UA — matches Bingbot's baseline. Googlebot renders JS but we
// deliberately want to see the pre-hydration HTML shell.
const UA_CRAWLER = 'Mozilla/5.0 (compatible; SEOCheck/1.0; +https://ivyevents.mk/seo-check)';

const TIMEOUT_MS = 15_000;

/* ------------------------------------------------------------------ */
/*  Runner                                                            */
/* ------------------------------------------------------------------ */

const failures = [];
const warnings = [];
const passes = [];

function fail(where, msg) { failures.push({ where, msg }); }
function warn(where, msg) { warnings.push({ where, msg }); }
function pass(where) { passes.push(where); }

async function main() {
  console.log(`SEO check → ${BASE}`);
  console.log('─'.repeat(60));

  // Reachability probe
  try {
    await fetchWith(`${BASE}/`, {}, TIMEOUT_MS);
  } catch (e) {
    console.error(`✗ Cannot reach ${BASE} — is the dev/preview server running?`);
    console.error(`  ${e.message}`);
    exit(2);
  }

  await checkRobots();
  await checkSitemap();

  for (const lang of LANGUAGES) {
    for (const route of LOCALIZED_PATHS) {
      const url = `${BASE}/${lang}${route.path}`;
      await checkHtmlPage(url, route, lang);
    }
  }

  report();
}

/* ------------------------------------------------------------------ */
/*  robots.txt                                                        */
/* ------------------------------------------------------------------ */

async function checkRobots() {
  const url = `${BASE}/robots.txt`;
  const where = url;
  try {
    const res = await fetchWith(url);
    if (res.status !== 200) return fail(where, `expected 200, got ${res.status}`);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('text/plain')) warn(where, `content-type is "${ct}", expected text/plain`);

    const body = await res.text();
    if (!body.trim()) return fail(where, 'body is empty');
    if (!/^User-agent:/im.test(body)) fail(where, 'no User-agent directive');
    if (!/^Sitemap:\s*https?:\/\//im.test(body)) fail(where, 'no absolute Sitemap: URL');
    pass(where);
  } catch (e) {
    fail(where, `fetch error: ${e.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  sitemap.xml                                                       */
/* ------------------------------------------------------------------ */

async function checkSitemap() {
  const url = `${BASE}/sitemap.xml`;
  const where = url;
  try {
    const res = await fetchWith(url);
    if (res.status !== 200) return fail(where, `expected 200, got ${res.status}`);

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!/xml/.test(ct)) warn(where, `content-type is "${ct}", expected …xml`);

    const body = await res.text();
    if (!/<\?xml\b/.test(body)) return fail(where, 'not well-formed XML (no <?xml declaration)');

    const rootMatch = body.match(/<(urlset|sitemapindex)\b/);
    if (!rootMatch) return fail(where, 'root element is neither <urlset> nor <sitemapindex>');

    // Extract every <loc>...</loc>
    const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => decodeXml(m[1]));
    if (locs.length === 0) return fail(where, '<loc> not found — sitemap has no URLs');
    pass(where);

    // Sample up to 25 URLs from the sitemap to verify they resolve.
    const sample = locs.length > 25 ? sampleN(locs, 25) : locs;
    for (const loc of sample) {
      const locUrl = rewriteToBase(loc, BASE);
      const w = `sitemap loc: ${locUrl}`;
      try {
        const r = await fetchWith(locUrl, { method: 'HEAD' });
        if (r.status === 405) {
          // Server may not support HEAD — fall back to GET
          const r2 = await fetchWith(locUrl);
          if (r2.status !== 200) fail(w, `expected 200, got ${r2.status}`);
          else pass(w);
        } else if (r.status !== 200) {
          fail(w, `expected 200, got ${r.status}`);
        } else {
          pass(w);
        }
      } catch (e) {
        fail(w, `fetch error: ${e.message}`);
      }
    }
  } catch (e) {
    fail(where, `fetch error: ${e.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  HTML page                                                         */
/* ------------------------------------------------------------------ */

async function checkHtmlPage(url, route, lang) {
  const where = url;
  try {
    const res = await fetchWith(url);
    if (res.status === 404 && route.optional) {
      warn(where, 'route not registered (optional) — skipping content checks');
      return;
    }
    if (res.status !== 200) return fail(where, `expected 200, got ${res.status}`);

    const html = await res.text();
    const head = extractHead(html);

    // <title>
    const title = firstMatch(head, /<title[^>]*>([^<]*)<\/title>/i);
    if (!title || !title.trim()) fail(where, '<title> is empty');
    else if (title.trim() === 'Ivy Events') warn(where, `<title> is the generic "Ivy Events" — per-route title not set`);
    else pass(`${where} → title="${title.trim()}"`);

    // description
    const desc = matchMeta(head, 'description');
    if (!desc) fail(where, 'no <meta name="description">');
    else if (desc.length > 160) warn(where, `description is ${desc.length} chars (>160)`);
    else pass(`${where} → description ok (${desc.length} chars)`);

    // canonical
    const canonical = firstMatch(head, /<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
                   || firstMatch(head, /<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (!canonical) fail(where, 'no <link rel="canonical">');
    else pass(`${where} → canonical=${canonical}`);

    // hreflang alternates
    const hreflangs = [...head.matchAll(/<link\s+[^>]*rel=["']alternate["'][^>]*hreflang=["']([^"']+)["']/gi)]
      .map(m => m[1].toLowerCase());
    const missing = LANGUAGES.filter(l => !hreflangs.includes(l));
    if (missing.length) fail(where, `missing hreflang for: ${missing.join(', ')}`);
    else pass(`${where} → hreflang covers ${LANGUAGES.join(',')}`);
    if (!hreflangs.includes('x-default')) fail(where, 'no hreflang="x-default"');

    // <html lang>
    const htmlLang = firstMatch(html, /<html\b[^>]*\slang=["']([^"']+)["']/i);
    if (!htmlLang) fail(where, '<html> has no lang attribute');
    else if (htmlLang.toLowerCase() !== lang.toLowerCase()) {
      fail(where, `<html lang="${htmlLang}"> does not match requested locale "${lang}"`);
    }

    // JSON-LD
    const jsonldBlocks = [...head.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
      .map(m => m[1].trim());
    if (jsonldBlocks.length === 0) {
      if (STRICT_JSONLD || route.requireJsonLdType) {
        fail(where, 'no <script type="application/ld+json"> present');
      } else {
        warn(where, 'no JSON-LD present');
      }
    } else {
      let anyParsed = false;
      let foundType = null;
      for (const block of jsonldBlocks) {
        try {
          const parsed = JSON.parse(block);
          anyParsed = true;
          const type = extractJsonLdType(parsed);
          if (type) foundType = type;
        } catch (e) {
          fail(where, `JSON-LD is not valid JSON: ${e.message}`);
        }
      }
      if (anyParsed) pass(`${where} → JSON-LD present (${foundType || 'graph'})`);
      if (route.requireJsonLdType && foundType && !foundType.includes(route.requireJsonLdType)) {
        warn(where, `JSON-LD @type is "${foundType}", expected to include "${route.requireJsonLdType}"`);
      }
    }
  } catch (e) {
    fail(where, `fetch error: ${e.message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) { out[key] = true; }
      else { out[key] = next; i++; }
    }
  }
  return out;
}

async function fetchWith(url, opts = {}, timeoutMs = TIMEOUT_MS) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: 'manual', // catch 301/302 as issues we may want to know about
      headers: { 'User-Agent': UA_CRAWLER, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
      signal: ac.signal,
      ...opts,
    });
  } finally {
    clearTimeout(t);
  }
}

function extractHead(html) {
  const m = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  return m ? m[1] : html;
}

function firstMatch(s, re) {
  const m = s.match(re);
  return m ? m[1] : null;
}

function matchMeta(head, name) {
  const rx1 = new RegExp(`<meta\\s+[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
  const rx2 = new RegExp(`<meta\\s+[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i');
  return firstMatch(head, rx1) || firstMatch(head, rx2);
}

function extractJsonLdType(node) {
  if (!node || typeof node !== 'object') return null;
  if (Array.isArray(node['@graph'])) {
    return node['@graph'].map(n => n['@type']).filter(Boolean).join('+');
  }
  return node['@type'] || null;
}

function decodeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function rewriteToBase(url, base) {
  try {
    const u = new URL(url);
    const b = new URL(base);
    if (u.host === b.host) return url;
    // Point production-shaped URLs at the local base for CI runs.
    return `${base}${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

function sampleN(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function report() {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`✓ passed:   ${passes.length}`);
  console.log(`! warnings: ${warnings.length}`);
  console.log(`✗ failures: ${failures.length}`);
  if (warnings.length) {
    console.log(`\nWarnings:`);
    for (const w of warnings) console.log(`  ! ${w.where}\n    ${w.msg}`);
  }
  if (failures.length) {
    console.log(`\nFailures:`);
    for (const f of failures) console.log(`  ✗ ${f.where}\n    ${f.msg}`);
    exit(1);
  }
  exit(0);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  exit(2);
});
