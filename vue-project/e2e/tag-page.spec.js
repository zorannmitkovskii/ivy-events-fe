import { test, expect } from '@playwright/test'

/**
 * The shared tags, as a visitor meets them: a tag's page lists the articles
 * and vendors filed under it and each leads on, and a tag nobody created is
 * said to be missing rather than drawn as an empty page.
 *
 * <p>No sign-in — this is a public page, and a crawler reaches it the same way.
 */

const HUB = {
  slug: 'сала',
  name: 'сала',
  posts: [
    { slug: 'deset-idei', title: 'Десет идеи за сала', excerpt: 'Што да прашате пред да потпишете.', coverImage: null, category: 'VENUE', publishedAt: '2026-05-01T10:00:00Z' },
  ],
  vendors: [
    { id: 'v-1', slug: 'hotel-bristol', name: 'Хотел Бристол', type: 'VENUE', city: 'Скопје', description: null, logoKey: null, rating: null },
  ],
  agencies: [],
}

function publicBackend() {
  return async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace('/v1/api', '')
    const ok = (data) => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === `/public/tags/${encodeURIComponent('сала')}` || path === '/public/tags/сала') return ok(HUB)
    if (path.startsWith('/public/tags/')) {
      return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ success: false }) })
    }
    if (path === '/public/tags') return ok([{ slug: 'сала', name: 'сала', postCount: 1, vendorCount: 1 }])
    return ok(null)
  }
}

test('a tag page lists what is filed under it and names itself after the tag', async ({ page }) => {
  await page.route('**/v1/api/**', publicBackend())

  await page.goto(`/mk/tags/${encodeURIComponent('сала')}`)

  await expect(page.locator('h1')).toHaveText('#сала')
  await expect(page.getByTestId('tag-posts')).toContainText('Десет идеи за сала')
  await expect(page.getByTestId('tag-vendors')).toContainText('Хотел Бристол')
  await expect(page).toHaveTitle('#сала | Ivy Events')
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0)

  await page.getByTestId('tag-vendors').getByRole('link', { name: /Хотел Бристол/ }).click()
  await expect(page).toHaveURL(/\/mk\/vendors\/venue\/hotel-bristol$/)
})

test('a tag that does not exist says so', async ({ page }) => {
  await page.route('**/v1/api/**', publicBackend())

  await page.goto('/mk/tags/nema-go')

  await expect(page.getByText('Овој таг не постои.')).toBeVisible()
})
