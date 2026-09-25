import { test, expect } from '@playwright/test'
import { signIn } from './support/session.js'

/**
 * IVY-909 — the Tags page, in a browser: reached from the Content tab, a name
 * written per language and saved as one object, deleted after saying how many
 * posts lose it.
 */

const ADMIN = '11111111-1111-1111-1111-111111111111'

function tagsBackend() {
  const state = {
    tags: [
      { id: 't-1', slug: 'сала', names: { mk: 'сала' }, postCount: 2, missingLocales: ['en', 'sq'] },
      { id: 't-2', slug: 'бенд', names: { mk: 'бенд', en: 'band', sq: 'grup' }, postCount: 0, missingLocales: [] },
    ],
    renamed: null,
  }

  const handler = async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const method = request.method()
    const ok = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/content/tags' && method === 'GET') return ok(state.tags)
    if (path.startsWith('/content/tags/') && method === 'PUT') {
      const id = path.split('/').pop()
      const { names } = JSON.parse(request.postData() || '{}')
      const kept = Object.fromEntries(Object.entries(names).filter(([, name]) => name.trim()))
      state.renamed = names
      state.tags = state.tags.map((tag) => (tag.id === id
        ? { ...tag, names: kept, missingLocales: ['mk', 'en', 'sq'].filter((code) => !kept[code]) }
        : tag))
      return ok(state.tags.find((tag) => tag.id === id))
    }
    if (path.startsWith('/content/tags/') && method === 'DELETE') {
      const id = path.split('/').pop()
      state.tags = state.tags.filter((tag) => tag.id !== id)
      return ok(null)
    }
    if (path === '/analytics/admin') return ok(null)
    if (path.startsWith('/admin/users') || path.startsWith('/events')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }
    return ok(null)
  }

  return { handler, state }
}

async function openTags(page, backend) {
  await page.route('**/v1/api/**', backend.handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })
  await page.goto('/en/admin/tags')
}

test('the Content tab leads to the tags', async ({ page }) => {
  await page.route('**/v1/api/**', tagsBackend().handler)
  await signIn(page, { userId: ADMIN, eventId: 'none', lang: 'en', roles: ['ADMIN'] })

  await page.goto('/en/admin/blog')
  await page.locator('nav.snav a').filter({ hasText: 'Tags' }).click()

  await expect(page).toHaveURL(/\/en\/admin\/tags$/)
  await expect(page.locator('tbody tr')).toHaveCount(2)
})

test('an editor translates a tag and it is saved as one object of names', async ({ page }) => {
  const backend = tagsBackend()
  await openTags(page, backend)

  const row = page.locator('tr[data-slug="сала"]')
  await row.locator('input[type="text"]').nth(1).fill('venue')
  await row.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('status')).toHaveText('Saved “сала”.')
  expect(backend.state.renamed).toEqual({ mk: 'сала', en: 'venue', sq: '' })

  await page.getByLabel('Missing a translation').check()
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody tr')).toHaveAttribute('data-slug', 'сала')
})

test('deleting a tag says how many posts lose it before it goes', async ({ page }) => {
  const backend = tagsBackend()
  await openTags(page, backend)

  const row = page.locator('tr[data-slug="сала"]')
  await row.getByRole('button', { name: 'Delete' }).click()
  await row.getByRole('button', { name: 'Delete from 2 posts' }).click()

  await expect(page.getByRole('status')).toHaveText('Deleted “сала”.')
  await expect(page.locator('tr[data-slug="сала"]')).toHaveCount(0)
  expect(backend.state.tags.map((tag) => tag.slug)).toEqual(['бенд'])
})
