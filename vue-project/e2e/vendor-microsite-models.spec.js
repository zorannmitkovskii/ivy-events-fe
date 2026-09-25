import { test, expect } from '@playwright/test'

/**
 * The four microsite models as a visitor sees them (2026 four-model design).
 *
 * <p>The API is stubbed with one content object; each model must draw its own
 * signature section from it, and none may scroll sideways on a phone.
 */

const PHOTO = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='

const VIEW = (theme) => ({
  profile: { name: 'Studio Lumière', type: 'PHOTOGRAPHY', city: 'Скопје', slug: 'studio-lumiere' },
  theme,
  canonicalUrl: '/vendors/photography/studio-lumiere',
  media: [1, 2, 3, 4].map((n) => ({ id: `m-${n}`, kind: 'IMAGE', url: PHOTO, title: `Photo ${n}` })),
  packages: [],
  sections: { gallery: true, services: true, faq: true },
  slug: 'studio-lumiere',
  details: { tagline: 'Stories told with light.' },
  content: {
    hero: { title: 'Moments that', titleAccent: 'last.', text: 'Documentary photography.', mediaId: 'm-1' },
    eventTypes: ['Weddings', 'Private events'],
    services: [{ label: 'Personal', name: 'Weddings', description: 'The whole day.' }, { name: 'Corporate' }],
    gallery: [{ mediaId: 'm-2', caption: 'Party' }, { mediaId: 'm-3', caption: 'Details' }, { mediaId: 'm-4' }],
    quote: { text: 'Good photos carry the atmosphere.' },
    approach: { title: 'Every event has a plan.' },
    chapters: [{ title: 'Everyone who makes the day.', mediaId: 'm-2' }],
    faq: [{ question: 'Do you travel?', answer: 'Yes.' }],
  },
})

async function stubMicrosite(page, theme) {
  await page.route('**/v1/api/**', (route) => {
    const path = new URL(route.request().url()).pathname.replace('/v1/api', '')
    const data = path === '/public/microsite' ? VIEW(theme) : null
    return route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, message: null, data }),
    })
  })
}

const SIGNATURE = {
  CLASSIC: '.statement',
  GALLERY: '.mosaic',
  STAGE: '.chapter',
  EDITORIAL: 'details',
}

for (const [theme, signature] of Object.entries(SIGNATURE)) {
  test(`the ${theme} model draws its own layout and the inquiry form`, async ({ page }) => {
    await stubMicrosite(page, theme)
    await page.goto('/en/s/studio-lumiere')

    await expect(page.locator(signature).first()).toBeVisible()
    await expect(page.locator('#ms-contact form')).toBeVisible()
  })

  test(`the ${theme} model does not scroll sideways on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await stubMicrosite(page, theme)
    await page.goto('/en/s/studio-lumiere')
    await expect(page.locator('.vms')).toBeVisible()

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('a gallery picture opens in the lightbox', async ({ page }) => {
  await stubMicrosite(page, 'GALLERY')
  await page.goto('/en/s/studio-lumiere')

  await page.getByRole('button', { name: /Enlarge: Details · 02/ }).click()

  await expect(page.locator('dialog.lightbox')).toBeVisible()
  await expect(page.locator('dialog.lightbox p')).toHaveText('Details · 02')
})
