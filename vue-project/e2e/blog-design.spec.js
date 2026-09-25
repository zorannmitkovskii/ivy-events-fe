import { test, expect } from '@playwright/test'

/**
 * The 2026 blog design: from the listing to an article, anonymously.
 *
 * What needs a browser: the search waits for the reader to pause, the table of
 * contents jumps to a section by its anchor, and a checklist item can be ticked
 * — none of which a unit test with a stubbed router proves end to end.
 */

const POSTS = [
  {
    slug: 'jasen-plan', title: 'Како да направиш јасен план', excerpt: 'Од датум и буџет до задачи.',
    category: 'PLANNING', tags: [], coverImage: null, locale: 'mk', publishedAt: '2026-09-20T10:00:00Z',
    layout: 'GUIDE', featured: true, readingMinutes: 4,
  },
  {
    slug: 'rsvp', title: 'RSVP: од покана до одговор', excerpt: 'Како го следиш одговорот на гостите.',
    category: 'PLANNING', tags: [], coverImage: null, locale: 'mk', publishedAt: '2026-09-10T10:00:00Z',
    layout: 'PRODUCT', featured: false, readingMinutes: 3,
  },
  {
    slug: 'prostor', title: 'Просторот како дел од искуството', excerpt: 'Распоредот го менува текот.',
    category: 'VENUE', tags: [], coverImage: null, locale: 'mk', publishedAt: '2026-09-01T10:00:00Z',
    layout: 'INSPIRATION', featured: false, readingMinutes: 5,
  },
]

const ARTICLES = {
  'jasen-plan': {
    ...POSTS[0],
    heroCaption: 'Добро подготвен простор.',
    body: '<h2>Почни со целта</h2><p>Запиши што треба да се случи.</p>'
      + '<aside class="callout"><p><strong>Практичен совет</strong></p><p>Оддели одлуки од прашања.</p></aside>'
      + '<h2>Провери пред да потврдиш</h2><ul class="checklist"><li><p>Целта е запишана.</p></li></ul>',
    authorName: 'Уредништво', otherLocales: [], seo: null, related: [],
    relatedPosts: [{ slug: 'rsvp', title: POSTS[1].title, excerpt: POSTS[1].excerpt, category: 'PLANNING' }],
    relatedVendors: [],
    tags: [{ slug: 'планирање', name: 'планирање' }],
  },
  rsvp: {
    ...POSTS[1],
    heroCaption: null,
    body: '<h2>Почни со точни статуси</h2><p>Потврден, одбиен, без одговор.</p>',
    authorName: 'Уредништво', otherLocales: [], seo: null, related: [], relatedPosts: [], relatedVendors: [],
  },
}

let searches = []

async function stubApi(page) {
  searches = []
  await page.route('**/v1/api/**', async (route) => {
    const url = new URL(route.request().url())
    const path = url.pathname.replace('/v1/api', '')
    const wrapped = (data) => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })

    if (path === '/public/blog') {
      const q = (url.searchParams.get('q') || '').toLowerCase()
      const category = url.searchParams.get('category')
      if (q) searches.push(q)
      return wrapped(POSTS.filter((post) => (!q || post.title.toLowerCase().includes(q))
        && (!category || post.category === category)))
    }
    if (path.startsWith('/public/blog/')) {
      const slug = decodeURIComponent(path.split('/').pop())
      return ARTICLES[slug]
        ? wrapped(ARTICLES[slug])
        : route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
    }
    return wrapped(null)
  })
}

test('the listing opens with the featured post and searches once the reader pauses', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog')

  await expect(page.locator('.bl-featured h1')).toHaveText('Како да направиш јасен план')
  await expect(page.locator('.bl-card')).toHaveCount(2)

  await page.locator('.bl-search').pressSequentially('rsvp', { delay: 30 })
  await expect(page.locator('.bl-card')).toHaveCount(1)
  await expect(page.locator('.bl-card h3')).toHaveText('RSVP: од покана до одговор')
  await expect(page.locator('.bl-featured')).toHaveCount(0)
  expect(searches).toEqual(['rsvp'])
  await expect(page).toHaveURL(/q=rsvp/)
})

test('a guide has numbered contents, a caption, a tickable checklist and related reading', async ({ page }) => {
  await stubApi(page)
  await page.goto('/mk/blog')
  await page.locator('.bl-featured .bl-read').click()

  await expect(page.locator('.bl-article.bl-guide h1')).toHaveText('Како да направиш јасен план')
  await expect(page.locator('.bl-caption')).toHaveText('Добро подготвен простор.')
  await expect(page.locator('.bl-toc a')).toHaveText(['1. Почни со целта', '2. Провери пред да потврдиш'])

  await page.locator('.bl-toc a').nth(1).click()
  await expect(page).toHaveURL(/#провери-пред-да-потврдиш|#%D0/)

  const item = page.locator('.bl-prose ul.checklist li')
  await item.click()
  await expect(item).toHaveAttribute('aria-checked', 'true')

  await expect(page.locator('.bl-tags a')).toHaveAttribute('href', /\/mk\/tags\//)
  await page.locator('.bl-related-card', { hasText: 'RSVP' }).click()
  await expect(page.locator('.bl-article.bl-product .bl-mock')).toBeVisible()
})
