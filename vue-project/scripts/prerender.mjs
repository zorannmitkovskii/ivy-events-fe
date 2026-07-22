#!/usr/bin/env node
/**
 * Post-build prerender.
 *
 * For each (route × language) pair in scripts/seo-routes.mjs, writes a static
 * HTML file to dist/{lang}/{path}/index.html with:
 *   - <html lang="{lang}"> matching the URL
 *   - per-route <title>, meta description, og:*, twitter:*, canonical
 *   - <link rel="alternate" hreflang> for all locales + x-default
 *   - JSON-LD (Organization + WebSite on landing; Service on category; etc.)
 *   - Pre-hydration content inside #app (H1 + subtitle + nav placeholder)
 *     so LLM crawlers, Bing, Yandex, and social bots see real content before
 *     Vue takes over on real user visits.
 *
 * Nginx serves dist/{lang}/{path}/index.html via `try_files`, falling back to
 * the original SPA shell for any unknown path.
 *
 * Run automatically by `npm run build` (see package.json's build script), or
 * on its own with `node scripts/prerender.mjs`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROUTES, LANGUAGES, DEFAULT_LANG, BASE_URL } from './seo-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = join(ROOT, 'dist');

const SITE_NAME = 'Ivy Events';
const DEFAULT_OG_IMAGE = `${BASE_URL}/logo.svg`;

/* ------------------------------------------------------------------ */
/*  Load locales                                                      */
/* ------------------------------------------------------------------ */

const locales = {};
for (const lang of LANGUAGES) {
  const path = join(ROOT, 'src', 'i18n', 'locales', `${lang}.json`);
  locales[lang] = JSON.parse(readFileSync(path, 'utf8'));
}

function t(lang, key, fallbackKey) {
  const parts = key.split('.');
  let cur = locales[lang];
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
    else { cur = undefined; break; }
  }
  if (typeof cur === 'string') return cur;
  if (fallbackKey && fallbackKey !== key) return t(lang, fallbackKey);
  // Fall back to default language, then to the key itself.
  if (lang !== DEFAULT_LANG) return t(DEFAULT_LANG, key);
  return key;
}

/* ------------------------------------------------------------------ */
/*  HTML escaping                                                     */
/* ------------------------------------------------------------------ */

function escapeAttr(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}
function escapeJson(s) {
  return String(s ?? '').replaceAll('</', '<\\/');
}

/* ------------------------------------------------------------------ */
/*  Meta helpers                                                      */
/* ------------------------------------------------------------------ */

function truncate(s, max) {
  if (!s || s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function titleFor(lang, route) {
  const raw = t(lang, route.titleKey);
  const cleaned = truncate(raw, 48);
  return raw === SITE_NAME || cleaned === '' ? SITE_NAME : `${cleaned} | ${SITE_NAME}`;
}
function descFor(lang, route) {
  const raw = t(lang, route.descKey);
  return truncate(raw || t(lang, 'seo.default.description'), 155);
}
function canonicalFor(lang, route) {
  return `${BASE_URL}/${lang}${route.path}`;
}

function hreflangLinks(route) {
  const links = LANGUAGES.map(l => ({
    hreflang: l,
    href: `${BASE_URL}/${l}${route.path}`,
  }));
  links.push({ hreflang: 'x-default', href: `${BASE_URL}/${DEFAULT_LANG}${route.path}` });
  return links.map(
    l => `<link rel="alternate" hreflang="${escapeAttr(l.hreflang)}" href="${escapeAttr(l.href)}">`
  ).join('\n    ');
}

/* ------------------------------------------------------------------ */
/*  JSON-LD builders                                                  */
/* ------------------------------------------------------------------ */

function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.svg`,
    description: 'Digital event invitations, RSVP management, and event planning platform.',
    sameAs: [],
  };
}
function webSiteSchema(lang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    inLanguage: lang,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/${lang}/event-invitations?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
function serviceSchema(lang, route) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: t(lang, route.titleKey),
    description: t(lang, route.descKey),
    provider: { '@type': 'Organization', name: SITE_NAME, url: BASE_URL },
    url: canonicalFor(lang, route),
    areaServed: 'North Macedonia',
  };
}
function faqPageSchema(lang) {
  // Pull from the existing homepageFaqs / faqPageFaqs arrays in locales.
  const faqs = locales[lang]?.faqPageFaqs || locales[lang]?.homepageFaqs || [];
  if (!Array.isArray(faqs) || !faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.slice(0, 10).map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}
function jsonLdBlocks(lang, route) {
  // Organization is present on every public page — helps LLM entity recognition
  // and gives Google a stable brand signal regardless of which URL is crawled.
  const types = new Set(['Organization', ...(route.jsonLdTypes || [])]);
  if (route.path === '') types.add('WebSite');

  const blocks = [];
  for (const type of types) {
    if (type === 'Organization') blocks.push(organizationSchema());
    else if (type === 'WebSite') blocks.push(webSiteSchema(lang));
    else if (type === 'Service') blocks.push(serviceSchema(lang, route));
    else if (type === 'FAQPage') {
      const f = faqPageSchema(lang);
      if (f) blocks.push(f);
    }
  }
  return blocks
    .map(b => `<script type="application/ld+json">${escapeJson(JSON.stringify(b))}</script>`)
    .join('\n    ');
}

/* ------------------------------------------------------------------ */
/*  Body content (pre-hydration, for LLM/Bing crawlers)               */
/* ------------------------------------------------------------------ */

function heroContent(lang, route) {
  const h1 = t(lang, route.hero?.h1Key || route.titleKey);
  const sub = t(lang, route.hero?.subKey || route.descKey);
  return `
    <header class="prerender-nav">
      <a href="/${lang}" class="prerender-brand">${escapeHtml(SITE_NAME)}</a>
      <nav class="prerender-links">
        <a href="/${lang}/features">${escapeHtml(t(lang, 'sidebar.features') || 'Features')}</a>
        <a href="/${lang}/pricing">${escapeHtml(t(lang, 'sidebar.pricing') || 'Pricing')}</a>
        <a href="/${lang}/faq">${escapeHtml(t(lang, 'sidebar.faq') || 'FAQ')}</a>
        <a href="/${lang}/about">${escapeHtml(t(lang, 'sidebar.about') || 'About')}</a>
        <a href="/${lang}/contact">${escapeHtml(t(lang, 'sidebar.contact') || 'Contact')}</a>
      </nav>
    </header>
    <main class="prerender-main">
      <h1>${escapeHtml(h1)}</h1>
      <p class="prerender-sub">${escapeHtml(sub)}</p>
    </main>
    <footer class="prerender-footer">
      <p>© ${new Date().getFullYear()} ${escapeHtml(SITE_NAME)}</p>
    </footer>
  `.trim();
}

/* Minimal critical CSS — enough that the pre-hydration content isn't ugly,
   but small enough it inlines without hurting Speed Index. Vue replaces this
   on hydrate. */
const CRITICAL_CSS = `
  <style>
    body { margin: 0; font-family: 'Instrument Sans', system-ui, sans-serif; background: #F7F5F0; color: #2F3E36; }
    .prerender-nav { display:flex; align-items:center; justify-content:space-between; padding: 20px 32px; }
    .prerender-brand { font-family: 'Fraunces', 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; text-decoration: none; color: #2F3E36; }
    .prerender-links { display:flex; gap: 22px; }
    .prerender-links a { color: #5D6A57; text-decoration: none; font-size: 14px; }
    .prerender-main { max-width: 780px; margin: 60px auto; padding: 0 24px; text-align: center; }
    .prerender-main h1 { font-family: 'Fraunces', 'Cormorant Garamond', serif; font-size: clamp(32px, 5vw, 52px); font-weight: 500; line-height: 1.1; margin: 0 0 18px; color: #2F3E36; }
    .prerender-sub { font-size: 17px; line-height: 1.6; color: #5D6A57; margin: 0; }
    .prerender-footer { text-align: center; padding: 32px; color: #79817C; font-size: 13px; }
  </style>
`.trim();

/* ------------------------------------------------------------------ */
/*  Head builder                                                      */
/* ------------------------------------------------------------------ */

function buildHead(lang, route, shellHead) {
  const title = titleFor(lang, route);
  const desc = descFor(lang, route);
  const canonical = canonicalFor(lang, route);

  // Strip generic tags from the shell head that we override.
  let head = shellHead
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']robots["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:title["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:description["'][^>]*>/gi, '')
    .replace(/<meta\s+property=["']og:url["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:title["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']twitter:description["'][^>]*>/gi, '')
    .replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/gi, '');

  const injected = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeAttr(desc)}">
    <meta name="robots" content="${route.noindex ? 'noindex, nofollow' : 'index, follow'}">
    <link rel="canonical" href="${escapeAttr(canonical)}">
    ${hreflangLinks(route)}
    <meta property="og:title" content="${escapeAttr(title)}">
    <meta property="og:description" content="${escapeAttr(desc)}">
    <meta property="og:url" content="${escapeAttr(canonical)}">
    <meta property="og:image" content="${escapeAttr(DEFAULT_OG_IMAGE)}">
    <meta property="og:locale" content="${escapeAttr(lang)}">
    <meta name="twitter:title" content="${escapeAttr(title)}">
    <meta name="twitter:description" content="${escapeAttr(desc)}">
    ${jsonLdBlocks(lang, route)}
    ${CRITICAL_CSS}
  `.trim();

  return head + '\n    ' + injected;
}

/* ------------------------------------------------------------------ */
/*  Build a single page                                               */
/* ------------------------------------------------------------------ */

function buildPage(lang, route, shellHtml) {
  const headMatch = shellHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = shellHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!headMatch || !bodyMatch) throw new Error('shell missing <head> or <body>');

  const newHead = buildHead(lang, route, headMatch[1]);
  const body = bodyMatch[1].replace(
    /<div id="app"><\/div>/,
    `<div id="app">${heroContent(lang, route)}</div>`
  );

  return `<!DOCTYPE html>
<html lang="${escapeAttr(lang)}">
<head>
    ${newHead}
</head>
<body>
${body}
</body>
</html>
`;
}

/* ------------------------------------------------------------------ */
/*  Main                                                              */
/* ------------------------------------------------------------------ */

function main() {
  const shellPath = join(DIST, 'index.html');
  if (!existsSync(shellPath)) {
    console.error(`✗ dist/index.html not found — run \`npm run build\` first.`);
    process.exit(1);
  }
  const shellHtml = readFileSync(shellPath, 'utf8');

  let count = 0;
  for (const route of ROUTES) {
    for (const lang of LANGUAGES) {
      const outDir = join(DIST, lang, route.path);
      mkdirSync(outDir, { recursive: true });
      const outPath = join(outDir, 'index.html');
      writeFileSync(outPath, buildPage(lang, route, shellHtml));
      count++;
    }
  }

  console.log(`✓ prerendered ${count} static HTML files (${ROUTES.length} routes × ${LANGUAGES.length} langs) into dist/`);
}

main();
