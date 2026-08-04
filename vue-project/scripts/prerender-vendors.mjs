/**
 * Writes a real HTML file per public vendor page at build time (IVY-704).
 *
 * <p>The app is a Vue SPA, so what a crawler receives from `index.html` is an
 * empty div. Google will run JavaScript eventually, but "eventually" is weeks
 * and the whole point of these pages is that somebody searching for a
 * photographer in Bitola finds one. This writes the title, description,
 * canonical, Open Graph tags and JSON-LD into the shipped HTML, and leaves the
 * SPA to take over on load — so a person sees the app and a crawler sees the
 * content immediately. (Decision 6, 2026-08-01: prerender at build.)
 *
 * <p>Deliberately not a headless browser. Rendering the real component tree
 * would give a fuller page, at the cost of a browser in CI and a build that
 * fails when Chromium does. The metadata is what search engines read, and it
 * comes from one endpoint that the running app reads too — so the two cannot
 * disagree about what a page is called.
 *
 * <p>Skips vendors the server marks `noindex`. A half-filled profile that gets
 * crawled is a thin page on the domain, and thin pages drag down the ones next
 * to them.
 *
 * Usage:  node scripts/prerender-vendors.mjs [apiBase] [outDir]
 * Failure to reach the API is a warning, not a build failure — a marketing
 * deploy should not be blocked by an unreachable backend.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

const API_BASE = process.argv[2] || process.env.PRERENDER_API_BASE || 'http://localhost:8282/v1/api'
const OUT_DIR = resolve(process.argv[3] || process.env.PRERENDER_OUT || 'dist')
const LANGUAGES = ['mk', 'en', 'sq']

/** How many vendors to fetch per directory page while walking the list. */
const PAGE_SIZE = 100

async function main() {
  const template = await readFile(join(OUT_DIR, 'index.html'), 'utf8')
  const vendors = await fetchAllVendors()

  if (!vendors.length) {
    console.warn('[prerender] no approved vendors — nothing to write')
    return
  }

  let written = 0
  let skipped = 0

  for (const vendor of vendors) {
    for (const lang of LANGUAGES) {
      const seo = await fetchSeo(vendor.slug, lang)
      if (!seo) continue

      if (seo.noindex) {
        skipped++
        continue
      }

      const category = (vendor.type || 'OTHER').toLowerCase().replace(/_/g, '-')
      const path = join(OUT_DIR, lang, 'vendors', category, vendor.slug, 'index.html')

      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, renderHtml(template, seo), 'utf8')
      written++
    }
  }

  // Said out loud rather than left to be inferred from a file count: a silent
  // skip reads as "covered everything" when it did not.
  console.log(`[prerender] wrote ${written} vendor page(s), skipped ${skipped} as noindex`)
}

async function fetchAllVendors() {
  const all = []
  let page = 0

  while (true) {
    const body = await getJson(`${API_BASE}/public/vendors?page=${page}&size=${PAGE_SIZE}`)
    const content = body?.data?.content ?? []
    all.push(...content)

    if (content.length < PAGE_SIZE) break
    page++
  }
  return all.filter(vendor => vendor.slug)
}

async function fetchSeo(slug, lang) {
  const body = await getJson(`${API_BASE}/public/vendors/${encodeURIComponent(slug)}/seo?lang=${lang}`)
  return body?.data ?? null
}

async function getJson(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.warn(`[prerender] could not reach ${url}: ${error.message}`)
    return null
  }
}

/**
 * Puts the metadata into the shipped shell.
 *
 * <p>Replaces the existing title rather than appending a second one — two
 * title tags is a page whose title depends on which one the crawler reads
 * first.
 */
function renderHtml(template, seo) {
  const tags = [
    `<title>${escape(seo.title)}</title>`,
    `<meta name="description" content="${escape(seo.description)}">`,
    `<link rel="canonical" href="${escape(seo.canonicalUrl)}">`,
    `<meta property="og:type" content="business.business">`,
    `<meta property="og:title" content="${escape(seo.title)}">`,
    `<meta property="og:description" content="${escape(seo.description)}">`,
    `<meta property="og:url" content="${escape(seo.canonicalUrl)}">`,
    seo.imageUrl ? `<meta property="og:image" content="${escape(seo.imageUrl)}">` : '',
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script type="application/ld+json">${JSON.stringify(seo.structuredData)}</script>`,
  ].filter(Boolean).join('\n    ')

  return template
    .replace(/<title>.*?<\/title>/s, '')
    .replace('</head>', `    ${tags}\n  </head>`)
}

function escape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

main().catch(error => {
  // A warning, not a failure. A marketing deploy should not be blocked because
  // the backend was restarting.
  console.warn(`[prerender] skipped: ${error.message}`)
})
