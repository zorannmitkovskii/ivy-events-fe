import { Buffer } from 'node:buffer'
import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-906, IVY-907 — the blog CMS, from an empty list to a tagged article on
 * the site, and the SEO findings that stand in the way.
 *
 * <p>The editor is TipTap in a real browser, which jsdom cannot stand in for:
 * a heading made with the toolbar has to survive saving and come out as a
 * heading on the public page. The API is an in-memory stand-in that keeps what
 * it is sent, so the round trip is the page's, not a canned answer.
 *
 * <p>The stand-in reports two SEO errors the way the server does — a thin text
 * and a missing cover — with a much lower word limit than the server's. What is
 * tested here is how the editor handles a finding, not where the line is; the
 * line is the backend's and its tests pin it.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'
const TAG = 'venues'
const PARAGRAPH = 'A wedding venue decides the guest list, the date and the budget before anything else does. '
const STAND_IN_MIN_WORDS = 40
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64',
)
const TINY_PNG_URL = `data:image/png;base64,${TINY_PNG.toString('base64')}`

function words(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter((token) => /\p{L}/u.test(token)).length
}

function blogBackend() {
  const state = { post: null, variants: {}, published: [] }

  const issuesFor = (variant) => {
    const issues = []
    const count = words(variant.body)
    if (count < STAND_IN_MIN_WORDS) {
      issues.push({ code: 'CONTENT_TOO_THIN', severity: 'ERROR', field: 'body', params: { words: count, min: 300 }, message: 'thin' })
    }
    if (!state.post.heroImageKey) {
      issues.push({ code: 'COVER_MISSING', severity: 'ERROR', field: 'cover', params: {}, message: 'no cover' })
    }
    return issues
  }

  const editorView = () => ({
    post: state.post,
    variants: Object.values(state.variants).map((variant) => ({
      variant,
      seo: { title: variant.title, description: variant.excerpt || '', canonicalUrl: `https://ivyevents.mk/en/blog/${state.post.slug}` },
      issues: issuesFor(variant),
    })),
  })

  const listRow = () => {
    const issues = Object.values(state.variants).flatMap(issuesFor)
    return {
      id: state.post.id,
      slug: state.post.slug,
      title: state.variants.en?.title || null,
      category: state.post.category,
      tags: state.post.tags,
      authorName: 'Ivy',
      archived: false,
      updatedAt: new Date().toISOString(),
      statuses: Object.fromEntries(Object.values(state.variants).map((variant) => [variant.locale, variant.status])),
      seoErrors: issues.filter((issue) => issue.severity === 'ERROR').length,
      seoWarnings: 0,
    }
  }

  const published = () => state.post && state.variants.en?.status === 'PUBLISHED'

  const summary = () => ({
    slug: state.post.slug,
    title: state.variants.en.title,
    excerpt: state.variants.en.excerpt,
    category: state.post.category,
    tags: state.post.tags.map((slug) => ({ slug, name: slug })),
    coverImage: state.post.coverImage,
    locale: 'en',
    publishedAt: state.variants.en.publishedAt,
  })

  const handler = async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/v1/api', '')
    const method = request.method()
    const body = () => JSON.parse(request.postData() || '{}')
    const ok = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/content/posts' && method === 'GET') {
      const rows = state.post ? [listRow()] : []
      return ok({ content: rows, totalElements: rows.length })
    }
    if (path === '/content/posts' && method === 'POST') {
      const created = body()
      state.post = {
        id: 'p-1', slug: 'choosing-a-venue', category: created.category, tags: created.tags || [],
        heroImageKey: null, coverImage: null, firstPublishedAt: null, archivedAt: null,
      }
      return ok(state.post)
    }
    if (path === '/content/posts/p-1' && method === 'PUT') {
      const changes = body()
      Object.assign(state.post, changes, { coverImage: changes.heroImageKey ? TINY_PNG_URL : null })
      return ok(state.post)
    }
    if (path === '/content/posts/p-1' && method === 'GET') return ok(editorView())
    if (path === '/content/posts/p-1/links') return ok([])
    if (path.startsWith('/content/posts/p-1/variants/') && method === 'PUT') {
      const locale = path.split('/').pop()
      state.variants[locale] = { id: `v-${locale}`, locale, status: state.variants[locale]?.status || 'DRAFT', ...body() }
      return ok(state.variants[locale])
    }
    if (path.startsWith('/content/variants/') && method === 'POST') {
      const { status } = body()
      const variant = Object.values(state.variants).find((candidate) => path.includes(candidate.id))
      if (issuesFor(variant).some((issue) => issue.severity === 'ERROR')) {
        return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'SEO errors' }) })
      }
      variant.status = status
      if (status === 'PUBLISHED') {
        variant.publishedAt = new Date().toISOString()
        state.post.firstPublishedAt = variant.publishedAt
        state.published.push(variant.locale)
      }
      return ok(variant)
    }
    if (path === '/content/images') return ok({ key: 'uploads/blog/cover.png', url: TINY_PNG_URL })
    if (path === '/public/blog') {
      const tag = url.searchParams.get('tag')
      const matches = published() && (!tag || state.post.tags.includes(tag))
      return ok(matches ? [summary()] : [])
    }
    if (path === '/public/blog/choosing-a-venue') {
      if (!published()) return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      return ok({ ...summary(), body: state.variants.en.body, authorName: 'Ivy', otherLocales: [], related: [], seo: null })
    }
    if (path.startsWith('/admin/users') || path.startsWith('/events')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    return ok(null)
  }

  return { handler, state }
}

async function openNewPost(page, backend) {
  await page.route('**/v1/api/**', backend.handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/blog/new')
  await page.getByRole('tab', { name: /English/ }).click()
}

async function uploadCover(page) {
  await page.locator('.cover-field input[type="file"]').setInputFiles({ name: 'cover.png', mimeType: 'image/png', buffer: TINY_PNG })
  await expect(page.locator('.cover-preview')).toBeVisible()
}

test('the old editor address lands on the blog list', async ({ page }) => {
  await page.route('**/v1/api/**', blogBackend().handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })

  await page.goto('/en/admin/content')

  await expect(page).toHaveURL(/\/en\/admin\/blog$/)
  await expect(page.getByText('No posts yet. Start with New post.')).toBeVisible()
})

test('an editor writes, tags, illustrates and publishes a post that readers can find by its tag', async ({ page }) => {
  await page.route('**/v1/api/**', blogBackend().handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })

  await page.goto('/en/admin/blog')
  await page.getByRole('link', { name: 'New post' }).click()
  await expect(page).toHaveURL(/\/en\/admin\/blog\/new$/)

  // English, because the reader below reads in English.
  await page.getByRole('tab', { name: /English/ }).click()
  await page.getByLabel('Title', { exact: true }).fill('Choosing a venue')

  await page.locator('.ProseMirror').click()
  await page.getByRole('button', { name: 'Heading', exact: true }).click()
  await page.keyboard.type('Capacity first')
  await page.keyboard.press('Enter')
  await page.keyboard.type(PARAGRAPH.repeat(3))

  await page.locator('#blog-post-tags').fill('Venues')
  await page.locator('#blog-post-tags').press('Enter')
  await expect(page.locator('.tag-input .chip')).toHaveText(/venues/)

  await uploadCover(page)

  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/admin\/blog\/p-1$/)

  await page.getByRole('tab', { name: /English/ }).click()
  await page.getByRole('button', { name: 'Publish', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('Published.')

  await page.goto('/en/admin/blog')
  await expect(page.locator('tbody')).toContainText('Choosing a venue')
  await expect(page.locator('tbody')).toContainText('EN · Published')

  await page.goto(`/en/blog?tag=${TAG}`)
  // The redesigned list names the tag it is narrowed to; its cards carry no tags.
  await expect(page.locator('.bl-active-tag .tag')).toHaveText('#venues')
  await expect(page.locator('.bl-card')).toContainText('Choosing a venue')
  await page.getByRole('link', { name: /Choosing a venue/ }).first().click()

  await expect(page.locator('.prose h2')).toHaveText('Capacity first')
  // A tag on an article opens the shared tag page: its posts, vendors and agencies.
  await expect(page.locator('.bl-tags a')).toHaveAttribute('href', `/en/tags/${TAG}`)
})

test('SEO errors stop publishing, say what to fix, and publishing works once they are fixed', async ({ page }) => {
  const backend = blogBackend()
  await openNewPost(page, backend)

  await page.getByLabel('Title', { exact: true }).fill('Choosing a venue')
  await page.locator('.ProseMirror').click()
  await page.keyboard.type('Too short to publish.')
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page).toHaveURL(/\/en\/admin\/blog\/p-1$/)
  await page.getByRole('tab', { name: /English/ }).click()

  // The saved language has two errors: the button says so instead of failing.
  await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeDisabled()
  await expect(page.locator('.blocker')).toContainText('Fix the SEO errors (2)')
  await expect(page.locator('.editor-main')).toContainText('The text has 4 words')
  await expect(page.locator('.editor-side')).toContainText('There is no cover image')

  await uploadCover(page)
  await page.locator('.ProseMirror').click()
  await page.keyboard.press('End')
  await page.keyboard.type(` ${PARAGRAPH.repeat(3)}`)
  await page.getByRole('button', { name: 'Publish', exact: true }).click()

  await expect(page.getByRole('status')).toHaveText('Published.')
  expect(backend.state.published).toEqual(['en'])
})
