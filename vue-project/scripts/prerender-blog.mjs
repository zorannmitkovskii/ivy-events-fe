/**
 * Writes a real HTML file per published blog post, per language, at build time
 * (IVY-907).
 *
 * <p>The same reason as vendor profiles: the app is a SPA, and a shared link is
 * previewed by crawlers that never run JavaScript — Facebook, LinkedIn, Viber,
 * often Bing. Without this file a post shared anywhere shows the site's generic
 * title and logo instead of its own title, description and cover.
 *
 * <p>Only published languages: the API lists a post per language, and a
 * language that is not published is not listed. Posts the server marks
 * `noindex` are skipped — a thin page is not one to hand crawlers.
 *
 * Usage:  node scripts/prerender-blog.mjs [apiBase] [outDir]
 */
import { LANGUAGES, getJson, readTemplate, renderHtml, settings, writePage } from './prerender-shared.mjs'

const { apiBase, outDir } = settings()

async function main() {
  const template = await readTemplate(outDir)

  let written = 0
  let skipped = 0

  for (const lang of LANGUAGES) {
    const posts = (await getJson(`${apiBase}/public/blog?locale=${lang}`))?.data ?? []

    for (const post of posts) {
      const detail = (await getJson(`${apiBase}/public/blog/${encodeURIComponent(post.slug)}?locale=${lang}`))?.data
      if (!detail?.seo) continue

      if (detail.seo.noindex) {
        skipped++
        continue
      }

      await writePage(outDir, [lang, 'blog', detail.slug], renderHtml(template, detail.seo, { ogType: 'article' }))
      written++
    }
  }

  console.log(`[prerender] wrote ${written} blog page(s), skipped ${skipped} as noindex`)
}

main().catch(error => {
  // A warning, not a failure. A marketing deploy should not be blocked because
  // the backend was restarting.
  console.warn(`[prerender] skipped: ${error.message}`)
})
