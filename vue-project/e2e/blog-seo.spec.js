import { test, expect } from '@playwright/test'

/**
 * IVY-901, IVY-902, IVY-905 — the public blog.
 *
 * <p>No sign-in: these are the pages an anonymous visitor and a crawler reach,
 * and running them signed in would test a different site.
 *
 * <p>What needs a browser is the head. Canonical tags, robots directives and
 * whether the previous article's metadata is still hanging around are invisible
 * to anyone clicking through, and a search engine is the only thing that reads
 * them — after the damage is done.
 */

const POSTS = [
  {
    slug: 'deset-idei', title: 'Десет идеи за свадба', excerpt: 'Што работи и што не.',
    category: 'WEDDING', heroImageKey: null, locale: 'mk', publishedAt: '2026-05-01T10:00:00Z',
  },
  {
    slug: 'buxhet-roденden', title: 'Буџет за роденден', excerpt: 'Колку навистина чини.',
    category: 'BIRTHDAY', heroImageKey: null, locale: 'mk', publishedAt: '2026-04-01T10:00:00Z',
  },
]

function detail(overrides = {}) {
  return {
    slug: 'deset-idei',
    title: 'Десет идеи за свадба',
    body: 'Прв пасус.\n\nВтор пасус.',
    category: 'WEDDING',
    authorName: 'Ивy редакција',
    heroImageKey: null,
    locale: 'mk',
    otherLocales: ['en'],
    publishedAt: '2026-05-01T10:00:00Z',
    seo: {
      title: 'Десет идеи за свадба | Ivy',
      description: 'Кратко за тоа што работи и што не кога планирате свадба.',
      canonicalUrl: 'https://ivy.mk/mk/blog/deset-idei',
      imageUrl: null,
      noindex: false,
      structuredData: { '@context': 'https://schema.org', '@type': 'Article' },
      warnings: [],
    },
    related: [
      { linkId: 'l-1', targetType: 'VENDOR', targetId: 'v-1', name: 'Фото Студио', path: '/mk/vendors/photography/foto-studio', usable: true },
      { linkId: 'l-2', targetType: 'VENDOR', targetId: 'v-2', name: 'Суспендиран', path: '/mk/vendors/photography/suspendiran', usable: false },
    ],
    ...overrides,
  }
}

let trackedEvents = []

async function stubApi(page, overrides = {}) {
  trackedEvents = []

  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')

    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/public/blog') {
      const category = url.searchParams.get('category')
      const filtered = category ? POSTS.filter((p) => p.category === category) : POSTS
      return wrapped(filtered)
    }

    if (path.startsWith('/public/blog/')) {
      if (overrides.missing) {
        return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
      }
      return wrapped(overrides.detail ?? detail())
    }

    if (path === '/public/content-events') {
      trackedEvents.push(JSON.parse(route.request().postData() || '{}'))
      return wrapped(null)
    }

    return wrapped(null)
  })
}

test('the index lists published posts and filters by category', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog')

  await expect(page.getByRole('heading', { name: 'Десет идеи за свадба' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Буџет за роденден' })).toBeVisible()

  await page.getByRole('button', { name: 'Родендени' }).click()
  await expect(page.getByRole('heading', { name: 'Десет идеи за свадба' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Буџет за роденден' })).toBeVisible()
})

test('an article writes the canonical and social tags the server computed', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog/deset-idei')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Десет идеи за свадба')

  await expect.poll(() => page.locator('link[rel="canonical"]').getAttribute('href'))
    .toBe('https://ivy.mk/mk/blog/deset-idei')
  await expect(page.locator('meta[property="og:title"]'))
    .toHaveAttribute('content', 'Десет идеи за свадба | Ivy')
  await expect(page.locator('meta[name="description"]'))
    .toHaveAttribute('content', /што работи и што не/)

  // Selected by the marker attribute, not by type: the shell ships an
  // organisation block the article's has to sit beside. The route-level
  // breadcrumb is the managed block on other pages; here the server's graph
  // (which carries its own breadcrumb) takes its place, so there is one.
  const jsonLd = page.locator('script[data-ivy-seo]')
  await expect(jsonLd).toHaveCount(1)
  expect(JSON.parse(await jsonLd.textContent())['@type']).toBe('Article')
})

test('an archived article says noindex rather than quietly staying in search', async ({ page }) => {
  await stubApi(page, { detail: detail({ seo: { ...detail().seo, noindex: true } }) })
  await page.goto('/mk/blog/deset-idei')

  await expect.poll(() => page.locator('meta[name="robots"]').getAttribute('content'))
    .toBe('noindex, follow')
})

test('a suspended vendor is not put in front of a reader', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog/deset-idei')

  await expect(page.getByRole('link', { name: 'Фото Студио' })).toBeVisible()
  // Still in the record, deliberately not on the page.
  await expect(page.getByRole('link', { name: 'Суспендиран' })).toHaveCount(0)
})

test('a language nobody translated is a plain answer, not an error page', async ({ page }) => {
  await stubApi(page, { missing: true })
  await page.goto('/mk/blog/nema-go')

  await expect(page.getByText('Текстот не постои на овој јазик.')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('reading is counted, and without consent nothing identifying is sent', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog/deset-idei')

  await expect.poll(() => trackedEvents.length).toBeGreaterThan(0)

  const first = trackedEvents[0]
  expect(first.kind).toBe('CONTENT_VIEW')
  expect(first.consented).toBe(false)
  expect(first.category).toBe('WEDDING')
})
