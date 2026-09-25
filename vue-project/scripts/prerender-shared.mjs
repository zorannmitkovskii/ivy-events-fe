/**
 * What the build-time prerender scripts share (IVY-704, IVY-907).
 *
 * <p>Extracted at the second use: vendor profiles and blog posts write the same
 * kind of file — the shipped `index.html` with one page's metadata in its head
 * — and a fix to that file belongs in one place.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

export const LANGUAGES = ['mk', 'en', 'sq']

/** Open Graph wants a territory as well as a language. */
const OG_LOCALES = { mk: 'mk_MK', en: 'en_US', sq: 'sq_AL' }

/**
 * The shell's own site-wide tags. Removed before a page's tags go in, or the
 * page ships two descriptions and two og:titles and a crawler picks one.
 */
const SHELL_METADATA = [
  /<title>.*?<\/title>/s,
  /<meta\s+name="(description|robots|twitter:[^"]+)"[^>]*>\s*/g,
  /<meta\s+property="og:[^"]+"[^>]*>\s*/g,
  /<link\s+rel="canonical"[^>]*>\s*/g,
]

/** `[apiBase] [outDir]` from the command line, then the environment, then the local backend. */
export function settings(argv = process.argv, env = process.env) {
  return {
    apiBase: argv[2] || env.PRERENDER_API_BASE || 'http://localhost:8081/v1/api',
    outDir: resolve(argv[3] || env.PRERENDER_OUT || 'dist'),
  }
}

export function readTemplate(outDir) {
  return readFile(join(outDir, 'index.html'), 'utf8')
}

export async function writePage(outDir, segments, html) {
  const path = join(outDir, ...segments, 'index.html')
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, html, 'utf8')
}

/** A warning rather than a failure: a marketing deploy should not be blocked
 *  because the backend was restarting. */
export async function getJson(url) {
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
 * Puts one page's metadata into the shipped shell.
 *
 * @param seo the SEO the API computed for the page — the same object the
 *   running app puts into the head, so the two cannot disagree
 * @param ogType `article` for a post, `business.business` for a vendor
 */
export function renderHtml(template, seo, { ogType }) {
  const tags = [
    `<title>${escape(seo.title)}</title>`,
    `<meta name="description" content="${escape(seo.description)}">`,
    seo.noindex ? '<meta name="robots" content="noindex, follow">' : '',
    `<link rel="canonical" href="${escape(seo.canonicalUrl)}">`,
    ...(seo.alternates || []).map((alternate) =>
      `<link rel="alternate" hreflang="${escape(alternate.locale)}" href="${escape(alternate.url)}">`),
    `<meta property="og:type" content="${ogType}">`,
    `<meta property="og:title" content="${escape(seo.title)}">`,
    `<meta property="og:description" content="${escape(seo.description)}">`,
    `<meta property="og:url" content="${escape(seo.canonicalUrl)}">`,
    OG_LOCALES[seo.locale] ? `<meta property="og:locale" content="${OG_LOCALES[seo.locale]}">` : '',
    seo.imageUrl ? `<meta property="og:image" content="${escape(seo.imageUrl)}">` : '',
    seo.publishedAt ? `<meta property="article:published_time" content="${escape(seo.publishedAt)}">` : '',
    seo.modifiedAt ? `<meta property="article:modified_time" content="${escape(seo.modifiedAt)}">` : '',
    ...(seo.tags || []).map((tag) => `<meta property="article:tag" content="${escape(tag)}">`),
    `<meta name="twitter:card" content="${seo.imageUrl ? 'summary_large_image' : 'summary'}">`,
    seo.structuredData ? `<script type="application/ld+json">${jsonForScript(seo.structuredData)}</script>` : '',
  ].filter(Boolean).join('\n    ')

  const shell = SHELL_METADATA.reduce((html, pattern) => html.replace(pattern, ''), template)
  return shell.replace('</head>', `    ${tags}\n  </head>`)
}

function escape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** JSON inside a script tag: a `</script>` in a title must not end the tag. */
function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
