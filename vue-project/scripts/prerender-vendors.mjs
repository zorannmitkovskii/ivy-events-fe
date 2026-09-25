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
 */
import { LANGUAGES, getJson, readTemplate, renderHtml, settings, writePage } from './prerender-shared.mjs'

/** How many vendors to fetch per directory page while walking the list. */
const PAGE_SIZE = 100

const { apiBase, outDir } = settings()

async function main() {
  const template = await readTemplate(outDir)
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
      await writePage(outDir, [lang, 'vendors', category, vendor.slug],
        renderHtml(template, seo, { ogType: 'business.business' }))
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
    const body = await getJson(`${apiBase}/public/vendors?page=${page}&size=${PAGE_SIZE}`)
    const content = body?.data?.content ?? []
    all.push(...content)

    if (content.length < PAGE_SIZE) break
    page++
  }
  return all.filter(vendor => vendor.slug)
}

async function fetchSeo(slug, lang) {
  const body = await getJson(`${apiBase}/public/vendors/${encodeURIComponent(slug)}/seo?lang=${lang}`)
  return body?.data ?? null
}

main().catch(error => {
  // A warning, not a failure. A marketing deploy should not be blocked because
  // the backend was restarting.
  console.warn(`[prerender] skipped: ${error.message}`)
})
